// Kex Koin economy — every koin reward and price lives here, editable by the EDITOR.
// Stored as a single JSON row in `app_copy` under ECONOMY_KEY so all devices share it.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { kexSaveCopy, kexResetCopy } from "./kex-copy.functions";

export const ECONOMY_KEY = "config:koin-economy";

export type KoinEconomy = {
  /** Scales every single earning at once. */
  globalMult: number;
  /** Coins for finishing a Kex workout, per difficulty level (index = level id). */
  workout: number[];
  /** Coins for a Mommy's Course day. */
  mommy: number;
  /** Coins for a mercy plea. */
  mercy: number;
  /** Coins added per day of ongoing streak. */
  streakPerDay: number;
  /** Trophy payouts. */
  trophyStreakFactor: number;   // streak-N trophy pays N * this
  trophyWorkouts: number;       // workout-count trophy flat pay
  trophyDiffFactor: number;     // difficulty trophy pays (level+1) * this
  trophyTournament: number;     // tournament win trophy
  /** Tournament placement payouts. */
  place1: number;
  place2: number;
  place3: number;
  placeTop10: number;
  placeRest: number;
  /** Shield prices. */
  freezeBase: number;
  freezePerStreakDay: number;
  restMultiplier: number;       // rest day price = freeze price * this
  aheadDiscountPct: number;     // % off per day bought ahead
  /** Jackpot for finishing a whole AI regimen (scaled by length & difficulty). */
  regimenJackpot: number;
};

export const DEFAULT_ECONOMY: KoinEconomy = {
  globalMult: 1,
  workout: [10, 16, 22, 28, 34, 40],
  mommy: 25,
  mercy: 0,
  streakPerDay: 3,
  trophyStreakFactor: 5,
  trophyWorkouts: 20,
  trophyDiffFactor: 10,
  trophyTournament: 250,
  place1: 400,
  place2: 250,
  place3: 150,
  placeTop10: 60,
  placeRest: 20,
  freezeBase: 45,
  freezePerStreakDay: 6,
  restMultiplier: 0.55,
  aheadDiscountPct: 3,
  regimenJackpot: 600,
};

export function normalizeEconomy(raw: unknown): KoinEconomy {
  if (!raw || typeof raw !== "object") return DEFAULT_ECONOMY;
  const r = raw as Partial<KoinEconomy>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  return {
    globalMult: num(r.globalMult, DEFAULT_ECONOMY.globalMult),
    workout: Array.isArray(r.workout) && r.workout.length === DEFAULT_ECONOMY.workout.length
      ? r.workout.map((v, i) => num(v, DEFAULT_ECONOMY.workout[i]))
      : DEFAULT_ECONOMY.workout,
    mommy: num(r.mommy, DEFAULT_ECONOMY.mommy),
    mercy: num(r.mercy, DEFAULT_ECONOMY.mercy),
    streakPerDay: num(r.streakPerDay, DEFAULT_ECONOMY.streakPerDay),
    trophyStreakFactor: num(r.trophyStreakFactor, DEFAULT_ECONOMY.trophyStreakFactor),
    trophyWorkouts: num(r.trophyWorkouts, DEFAULT_ECONOMY.trophyWorkouts),
    trophyDiffFactor: num(r.trophyDiffFactor, DEFAULT_ECONOMY.trophyDiffFactor),
    trophyTournament: num(r.trophyTournament, DEFAULT_ECONOMY.trophyTournament),
    place1: num(r.place1, DEFAULT_ECONOMY.place1),
    place2: num(r.place2, DEFAULT_ECONOMY.place2),
    place3: num(r.place3, DEFAULT_ECONOMY.place3),
    placeTop10: num(r.placeTop10, DEFAULT_ECONOMY.placeTop10),
    placeRest: num(r.placeRest, DEFAULT_ECONOMY.placeRest),
    freezeBase: num(r.freezeBase, DEFAULT_ECONOMY.freezeBase),
    freezePerStreakDay: num(r.freezePerStreakDay, DEFAULT_ECONOMY.freezePerStreakDay),
    restMultiplier: num(r.restMultiplier, DEFAULT_ECONOMY.restMultiplier),
    aheadDiscountPct: num(r.aheadDiscountPct, DEFAULT_ECONOMY.aheadDiscountPct),
    regimenJackpot: num(r.regimenJackpot, DEFAULT_ECONOMY.regimenJackpot),
  };
}

/** Reads the shared economy config; falls back to defaults when unset or offline. */
export function useKoinEconomy(token: string | null) {
  const [econ, setEcon] = useState<KoinEconomy>(DEFAULT_ECONOMY);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("app_copy").select("value").eq("key", ECONOMY_KEY).maybeSingle();
    if (data?.value) {
      try { setEcon(normalizeEconomy(JSON.parse(data.value))); } catch { setEcon(DEFAULT_ECONOMY); }
    }
    setLoaded(true);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (next: KoinEconomy) => {
    setEcon(next);
    if (!token) return;
    await kexSaveCopy({ data: { token, key: ECONOMY_KEY, value: JSON.stringify(next), style: {} } });
  }, [token]);

  const resetAll = useCallback(async () => {
    setEcon(DEFAULT_ECONOMY);
    if (!token) return;
    await kexResetCopy({ data: { token, key: ECONOMY_KEY } });
  }, [token]);

  return { econ, loaded, save, resetAll };
}
