import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DIFFICULTIES, DIFFICULTY_MILESTONES, STREAK_MILESTONES, TOURNAMENTS, WORKOUT_MILESTONES,
  cyclesSinceAnchor, tournamentIndexForCycle,
} from "./kex-data";
import { fetchLeaderboard, type WorkoutLogRow } from "./kex-store";

export type ShieldKind = "freeze" | "rest";
export type ShieldRow = { id: string; user_id: string; shield_date: string; kind: ShieldKind; cost: number };

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysBetween(a: Date, b: Date) {
  const x = new Date(a); x.setHours(0, 0, 0, 0);
  const y = new Date(b); y.setHours(0, 0, 0, 0);
  return Math.round((y.getTime() - x.getTime()) / 86400000);
}

/* ---------------- EARNING ---------------- */

/** Coins earned from a single logged workout. Harder = more coins. */
export function coinsForLog(log: { category: string; difficulty: number }): number {
  if (log.category === "mercy") return 0;
  if (log.category === "mommy") return 25;
  return 10 + (log.difficulty ?? 0) * 6;
}

/** Prestige value of a trophy id. The rarer the trophy, the fatter the payout. */
export function coinsForTrophy(id: string): number {
  if (id.startsWith("tournament-")) return 250;
  if (id.startsWith("streak-")) return Number(id.split("-")[1]) * 5;
  if (id.startsWith("workouts-")) return 20;
  if (id.startsWith("diff-")) {
    const level = Number(id.split("-")[1]);
    return (level + 1) * 10;
  }
  return 10;
}

/** Coins for a finishing position in an ended tournament. */
export function coinsForPlacement(place: number, scored: boolean): number {
  if (!scored) return 0;
  if (place === 1) return 400;
  if (place === 2) return 250;
  if (place === 3) return 150;
  if (place <= 10) return 60;
  return 20;
}

/** Ongoing streak bonus: the longer you hold it, the more it pays. */
export function coinsForStreak(streak: number): number {
  return streak * 3;
}

export function unlockedTrophyIds(opts: {
  bestStreak: number; totalWorkouts: number; perDifficulty: Record<number, number>; tournamentWins: Set<string>;
}): Set<string> {
  const s = new Set<string>();
  for (const n of STREAK_MILESTONES) if (opts.bestStreak >= n) s.add(`streak-${n}`);
  for (const n of WORKOUT_MILESTONES) if (opts.totalWorkouts >= n) s.add(`workouts-${n}`);
  for (const d of DIFFICULTIES) for (const n of DIFFICULTY_MILESTONES) {
    if ((opts.perDifficulty[d.id] ?? 0) >= n) s.add(`diff-${d.id}-${n}`);
  }
  for (const id of opts.tournamentWins) s.add(`tournament-${id}`);
  return s;
}

/* ---------------- SPENDING ---------------- */

export const MAX_DISCOUNT_DAYS = 14;

/**
 * Price of a shield.
 * - Streak Freezes cost more the longer your streak is (more to lose = more to pay).
 * - Rest Days are 45% cheaper than a Freeze.
 * - Buying ahead is cheaper: 3% off per day, capped at 14 days out.
 */
export function shieldCost(kind: ShieldKind, streak: number, daysAhead: number): number {
  const base = 45 + streak * 6;
  const kindMult = kind === "rest" ? 0.55 : 1;
  const ahead = Math.max(0, Math.min(daysAhead, MAX_DISCOUNT_DAYS));
  const aheadMult = 1 - 0.03 * ahead;
  return Math.max(10, Math.round(base * kindMult * aheadMult));
}

/** Dates you're allowed to shield: yesterday (24h window), today, and up to 60 days ahead. */
export function shieldableDates(today = new Date()): { date: string; daysAhead: number; label: string }[] {
  const out: { date: string; daysAhead: number; label: string }[] = [];
  for (let i = -1; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    out.push({
      date: isoDate(d),
      daysAhead: Math.max(0, i),
      label: i === -1 ? "Yesterday (24h window)" : i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    });
  }
  return out;
}

/* ---------------- HOOKS ---------------- */

export function useMyShields(userId: string | null, refreshKey = 0) {
  const [shields, setShields] = useState<ShieldRow[]>([]);
  useEffect(() => {
    if (!userId) { setShields([]); return; }
    supabase.from("streak_shields").select("*").eq("user_id", userId).then(({ data }) => {
      if (data) setShields(data as unknown as ShieldRow[]);
    });
  }, [userId, refreshKey]);
  return shields;
}

export type KoinBreakdown = {
  workouts: number;
  trophies: number;
  tournaments: number;
  streak: number;
  spent: number;
  balance: number;
};

export function useKoins(opts: {
  userId: string | null;
  logs: WorkoutLogRow[];
  streak: number;
  bestStreak: number;
  totalWorkouts: number;
  perDifficulty: Record<number, number>;
  shields: ShieldRow[];
  refreshKey?: number;
}): { koins: KoinBreakdown; tournamentWins: Set<string> } {
  const { userId, logs, streak, bestStreak, totalWorkouts, perDifficulty, shields } = opts;
  const [placementCoins, setPlacementCoins] = useState(0);
  const [tournamentWins, setTournamentWins] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) { setPlacementCoins(0); setTournamentWins(new Set()); return; }
    let cancelled = false;
    (async () => {
      const currentCycle = cyclesSinceAnchor();
      const cycles = Array.from({ length: Math.max(0, currentCycle) }, (_, c) => c);
      const results = await Promise.all(cycles.map((c) => fetchLeaderboard(c)));
      if (cancelled) return;
      let coins = 0;
      const wins = new Set<string>();
      results.forEach((rows, c) => {
        const idx = rows.findIndex((r) => r.user_id === userId);
        if (idx === -1) return;
        const row = rows[idx];
        coins += coinsForPlacement(idx + 1, row.score > 0);
        if (idx === 0 && row.score > 0) wins.add(TOURNAMENTS[tournamentIndexForCycle(c)].id);
      });
      setPlacementCoins(coins);
      setTournamentWins(wins);
    })();
    return () => { cancelled = true; };
  }, [userId, opts.refreshKey]);

  const koins = useMemo<KoinBreakdown>(() => {
    const workouts = logs.reduce((sum, l) => sum + coinsForLog(l), 0);
    const trophyIds = unlockedTrophyIds({ bestStreak, totalWorkouts, perDifficulty, tournamentWins });
    let trophies = 0;
    for (const id of trophyIds) trophies += coinsForTrophy(id);
    const streakCoins = coinsForStreak(streak);
    const spent = shields.reduce((s, x) => s + (x.cost ?? 0), 0);
    const balance = workouts + trophies + placementCoins + streakCoins - spent;
    return { workouts, trophies, tournaments: placementCoins, streak: streakCoins, spent, balance };
  }, [logs, bestStreak, totalWorkouts, perDifficulty, tournamentWins, streak, shields, placementCoins]);

  return { koins, tournamentWins };
}

export async function buyShield(userId: string, date: string, kind: ShieldKind, cost: number) {
  const { error } = await supabase.from("streak_shields").insert({
    user_id: userId, shield_date: date, kind, cost,
  } as never);
  if (error) throw new Error(error.message.includes("duplicate") ? "That day is already covered!" : error.message);
}

export function useShieldBuyer(userId: string | null, onDone: () => void) {
  return useCallback(async (date: string, kind: ShieldKind, cost: number) => {
    if (!userId) return;
    await buyShield(userId, date, kind, cost);
    onDone();
  }, [userId, onDone]);
}
