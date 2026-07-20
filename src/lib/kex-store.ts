import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ALL_EXERCISES,
  DIFFICULTIES,
  TOURNAMENTS,
  computeStreak,
  currentTournamentIndex,
  cyclesSinceAnchor,
  tournamentIndexForCycle,
  tournamentWindow,
  tournamentWindowForCycle,
  type DifficultyId,
  type Exercise,
} from "./kex-data";

export type Profile = { id: string; username: string };

export function useSession() {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { ready, userId };
}

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    if (!userId) { setProfile(null); return; }
    supabase.from("profiles").select("id, username").eq("id", userId).maybeSingle().then(({ data }) => {
      if (data) setProfile({ id: data.id, username: data.username });
    });
  }, [userId]);
  return profile;
}

export type WorkoutLogRow = {
  id: string;
  user_id: string;
  category: string;
  difficulty: number;
  routine_name: string;
  is_custom: boolean;
  plank_seconds: number;
  pullup_reps: number;
  exercises: { id: string; amount: number; unit: string }[];
  completed_at: string;
};

export function useMyLogs(userId: string | null, refreshKey = 0) {
  const [logs, setLogs] = useState<WorkoutLogRow[]>([]);
  useEffect(() => {
    if (!userId) { setLogs([]); return; }
    supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(2000)
      .then(({ data }) => {
        if (data) setLogs(data as unknown as WorkoutLogRow[]);
      });
  }, [userId, refreshKey]);
  return logs;
}

export function useMyPreferences(userId: string | null) {
  const [excluded, setExcluded] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!userId) { setExcluded([]); setLoaded(false); return; }
    supabase.from("user_preferences").select("excluded_exercises").eq("user_id", userId).maybeSingle().then(({ data }) => {
      setExcluded(data?.excluded_exercises ?? []);
      setLoaded(true);
    });
  }, [userId]);
  const save = useCallback(async (next: string[]) => {
    if (!userId) return;
    setExcluded(next);
    await supabase.from("user_preferences").upsert({ user_id: userId, excluded_exercises: next, updated_at: new Date().toISOString() });
  }, [userId]);
  return { excluded, save, loaded };
}

export function useStats(logs: WorkoutLogRow[]) {
  return useMemo(() => {
    const totalWorkouts = logs.length;
    const perDifficulty: Record<number, number> = {};
    let plankSec = 0;
    let pullupReps = 0;
    const dateSet = new Set<string>();
    for (const log of logs) {
      perDifficulty[log.difficulty] = (perDifficulty[log.difficulty] || 0) + 1;
      plankSec += log.plank_seconds || 0;
      pullupReps += log.pullup_reps || 0;
      const d = new Date(log.completed_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dateSet.add(key);
    }
    const streak = computeStreak(dateSet);
    return { totalWorkouts, perDifficulty, plankSec, pullupReps, streak, dateSet };
  }, [logs]);
}

/** Compute the workout metadata that gets logged when a session finishes. */
export function summarizeWorkout(exercises: { id: string; amount: number; unit: string }[]) {
  let plankSeconds = 0;
  let pullupReps = 0;
  for (const item of exercises) {
    const meta: Exercise | undefined = ALL_EXERCISES[item.id.split(".")[1]];
    if (!meta) continue;
    if (meta.isPlank && item.unit === "sec") plankSeconds += item.amount;
    if (meta.isPlank && item.unit === "min") plankSeconds += item.amount * 60;
    if (meta.isPullup && item.unit === "reps") pullupReps += item.amount;
  }
  return { plankSeconds, pullupReps };
}

export function scaleAmount(base: number, mult: number) {
  return Math.max(1, Math.round(base * mult));
}

export function difficultyFromId(id: DifficultyId) {
  return DIFFICULTIES[id];
}

/* ------- Leaderboards computed from all users' logs ------- */
export type LeaderRow = { user_id: string; username: string; score: number; tieBreak: number };

/**
 * Fetch a leaderboard for a given tournament CYCLE (0-based since the anchor).
 * Cycle N maps to tournament def index `N % TOURNAMENTS.length`.
 */
export async function fetchLeaderboard(cycle: number): Promise<LeaderRow[]> {
  const tIdx = tournamentIndexForCycle(cycle);
  const t = TOURNAMENTS[tIdx];
  const { start, end } = tournamentWindowForCycle(cycle);
  const { data: profiles } = await supabase.from("profiles").select("id, username");
  const profMap = new Map<string, string>((profiles ?? []).map((p) => [p.id, p.username]));

  const { data: logs } = await supabase
    .from("workout_logs")
    .select("user_id, category, difficulty, plank_seconds, pullup_reps, completed_at, exercises")
    .gte("completed_at", start.toISOString())
    .lt("completed_at", end.toISOString())
    .limit(50000);

  const perUser = new Map<string, { score: number; maxDiff: number }>();
  const bump = (uid: string, s: number, diff: number) => {
    const e = perUser.get(uid) ?? { score: 0, maxDiff: 0 };
    e.score += s;
    e.maxDiff = Math.max(e.maxDiff, diff);
    perUser.set(uid, e);
  };

  const rows = (logs ?? []) as unknown as WorkoutLogRow[];

  const isFullWorkout = (l: WorkoutLogRow) => !l.is_custom; // pre-picked routines only for tournament-eligibility scoring
  void isFullWorkout;

  switch (t.scoring) {
    case "pullup_reps":
      for (const l of rows) bump(l.user_id, l.pullup_reps || 0, l.difficulty);
      break;
    case "plank_seconds":
      for (const l of rows) bump(l.user_id, l.plank_seconds || 0, l.difficulty);
      break;
    case "leg_workouts":
      for (const l of rows) if (l.category === "legs") bump(l.user_id, 1, l.difficulty);
      break;
    case "core_workouts":
      for (const l of rows) if (l.category === "core") bump(l.user_id, 1, l.difficulty);
      break;
    case "upper_workouts":
      for (const l of rows) if (l.category === "upper") bump(l.user_id, 1, l.difficulty);
      break;
    case "soccer_workouts":
      for (const l of rows) if (l.category === "soccer") bump(l.user_id, 1, l.difficulty);
      break;
    case "total_workouts":
      for (const l of rows) bump(l.user_id, 1, l.difficulty);
      break;
    case "cardio_minutes": {
      for (const l of rows) {
        let mins = 0;
        for (const item of l.exercises || []) {
          if (!item.id.startsWith("cardio.")) continue;
          if (item.unit === "min") mins += item.amount;
          else if (item.unit === "sec") mins += item.amount / 60;
        }
        if (mins > 0) bump(l.user_id, Math.round(mins), l.difficulty);
      }
      break;
    }
    case "workouts_in_a_day": {
      const perUserDay = new Map<string, Map<string, { count: number; maxDiff: number }>>();
      for (const l of rows) {
        const d = new Date(l.completed_at);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        let byDay = perUserDay.get(l.user_id);
        if (!byDay) { byDay = new Map(); perUserDay.set(l.user_id, byDay); }
        const cur = byDay.get(key) ?? { count: 0, maxDiff: 0 };
        cur.count += 1; cur.maxDiff = Math.max(cur.maxDiff, l.difficulty);
        byDay.set(key, cur);
      }
      for (const [uid, byDay] of perUserDay) {
        let best = { count: 0, maxDiff: 0 };
        for (const v of byDay.values()) if (v.count > best.count || (v.count === best.count && v.maxDiff > best.maxDiff)) best = v;
        perUser.set(uid, { score: best.count, maxDiff: best.maxDiff });
      }
      break;
    }
    case "longest_streak": {
      const perUserDates = new Map<string, Set<string>>();
      const perUserMaxDiff = new Map<string, number>();
      for (const l of rows) {
        const d = new Date(l.completed_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        let s = perUserDates.get(l.user_id);
        if (!s) { s = new Set(); perUserDates.set(l.user_id, s); }
        s.add(key);
        perUserMaxDiff.set(l.user_id, Math.max(perUserMaxDiff.get(l.user_id) ?? 0, l.difficulty));
      }
      for (const [uid, dates] of perUserDates) {
        const streak = computeStreak(dates, new Date(Math.min(Date.now(), end.getTime() - 1)));
        perUser.set(uid, { score: streak, maxDiff: perUserMaxDiff.get(uid) ?? 0 });
      }
      break;
    }
  }

  // Every user who has ever signed up appears — score defaults to 0.
  for (const [uid] of profMap) if (!perUser.has(uid)) perUser.set(uid, { score: 0, maxDiff: 0 });

  return Array.from(perUser.entries())
    .map(([uid, v]) => ({ user_id: uid, username: profMap.get(uid) ?? "unknown", score: v.score, tieBreak: v.maxDiff }))
    .sort((a, b) => b.score - a.score || b.tieBreak - a.tieBreak || a.username.localeCompare(b.username));
}

export function useLeaderboard(cycle: number, refreshKey = 0) {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setRows(null);
    fetchLeaderboard(cycle).then((r) => { if (!cancelled) setRows(r); });
    return () => { cancelled = true; };
  }, [cycle, refreshKey]);
  return rows;
}


/** Trophy unlock computation. */
export function computeUnlocked(opts: {
  totalWorkouts: number;
  perDifficulty: Record<number, number>;
  streak: number;
  wonTournamentIds: Set<string>;
}): Set<string> {
  const unlocked = new Set<string>();
  const { totalWorkouts, perDifficulty, streak, wonTournamentIds } = opts;
  for (const t of TOURNAMENTS) if (wonTournamentIds.has(t.id)) unlocked.add(`tournament-${t.id}`);
  return unlocked;
  // NOTE: streak/workouts/difficulty checks are done at call site because they use the milestone constants.
  void totalWorkouts; void perDifficulty; void streak;
}

export { currentTournamentIndex };
