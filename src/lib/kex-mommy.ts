// Mommy's Special Course ❤️ — a 30-day progressive regimen with rest every 3rd day.
// Uses no Kex-specific exercises; light dumbbell work (5 lb & 8 lb) is included.
// Progress is stored per-device in localStorage. Streak break => restart from day 1.

export type MommyExercise = {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  unit: "reps" | "sec" | "min";
  how: string[];
  note: string;
  usesWeights?: 5 | 8;
};

export type MommyDay =
  | { day: number; kind: "rest"; note: string }
  | { day: number; kind: "workout"; title: string; flavor: string; exercises: MommyExercise[] };

const H = (h: string[]) => h;

/** A pool of exercises, mildly ordered by intensity. Level index modulates numbers. */
function ex(base: Omit<MommyExercise, "amount"> & { base: number }): (mult: number) => MommyExercise {
  const { base: b, ...rest } = base;
  return (mult) => ({ ...rest, amount: Math.max(1, Math.round(b * mult)) });
}

const POOL = {
  // Warmup & light
  marchInPlace: ex({ id: "m.march", name: "March in Place", emoji: "🚶‍♀️", base: 60, unit: "sec",
    how: H(["Stand tall.", "Lift knees to hip height, alternating.", "Swing your arms naturally."]),
    note: "Wake up those hips!" }),
  wallPushup: ex({ id: "m.wallPushup", name: "Wall Push-Ups", emoji: "🧱", base: 10, unit: "reps",
    how: H(["Stand arm's length from a wall.", "Place hands on wall shoulder-width apart.", "Bend elbows to bring your chest to the wall, then push back."]),
    note: "Chest & arms, wall-assisted." }),
  gluteBridge: ex({ id: "m.bridge", name: "Glute Bridges", emoji: "🌉", base: 12, unit: "reps",
    how: H(["Lie on your back, knees bent, feet flat.", "Squeeze glutes and lift hips.", "Lower with control."]),
    note: "Booty pop." }),
  bodySquat: ex({ id: "m.squat", name: "Chair Squats", emoji: "🪑", base: 12, unit: "reps",
    how: H(["Stand in front of a chair, feet shoulder-width.", "Sit back until your bottom taps the chair.", "Stand back up."]),
    note: "Use the chair to guide depth." }),
  standingCrunch: ex({ id: "m.standingCrunch", name: "Standing Crunches", emoji: "🧍‍♀️", base: 15, unit: "reps",
    how: H(["Stand tall, hands behind your head.", "Lift a knee and bring the opposite elbow to meet it.", "Alternate sides."]),
    note: "Abs, no floor required." }),
  calfRaise: ex({ id: "m.calf", name: "Calf Raises", emoji: "🐮", base: 20, unit: "reps",
    how: H(["Stand tall.", "Rise up onto the balls of your feet.", "Lower slowly."]),
    note: "Hold a wall for balance if you'd like." }),
  seatedRow5: ex({ id: "m.seatedRow5", name: "Seated Rows (5 lb)", emoji: "🚣‍♀️", base: 12, unit: "reps",
    how: H(["Sit tall with a 5 lb weight in each hand.", "Extend arms in front.", "Pull elbows back, squeezing shoulder blades.", "Return with control."]),
    note: "Back day, but nice.", usesWeights: 5 }),
  bicepCurl5: ex({ id: "m.curl5", name: "Bicep Curls (5 lb)", emoji: "💪", base: 12, unit: "reps",
    how: H(["Stand with a 5 lb weight in each hand.", "Curl the weights up.", "Lower with control."]),
    note: "Beach arms.", usesWeights: 5 }),
  bicepCurl8: ex({ id: "m.curl8", name: "Bicep Curls (8 lb)", emoji: "💪", base: 10, unit: "reps",
    how: H(["Stand with an 8 lb weight in each hand.", "Curl the weights up.", "Lower with control."]),
    note: "Level up.", usesWeights: 8 }),
  shoulderPress5: ex({ id: "m.press5", name: "Shoulder Press (5 lb)", emoji: "🙆‍♀️", base: 10, unit: "reps",
    how: H(["Hold 5 lb weights at shoulder height.", "Press straight overhead.", "Lower with control."]),
    note: "Posture booster.", usesWeights: 5 }),
  shoulderPress8: ex({ id: "m.press8", name: "Shoulder Press (8 lb)", emoji: "🙆‍♀️", base: 8, unit: "reps",
    how: H(["Hold 8 lb weights at shoulder height.", "Press straight overhead.", "Lower with control."]),
    note: "Big shoulders unlocked.", usesWeights: 8 }),
  weightedSquat8: ex({ id: "m.wSquat8", name: "Weighted Squats (8 lb)", emoji: "🏋️‍♀️", base: 10, unit: "reps",
    how: H(["Hold an 8 lb weight at your chest with both hands.", "Squat down keeping chest tall.", "Push up through your heels."]),
    note: "Legs deserve love.", usesWeights: 8 }),
  weightedLunge5: ex({ id: "m.wLunge5", name: "Weighted Lunges (5 lb)", emoji: "🚶", base: 10, unit: "reps",
    how: H(["Hold a 5 lb weight in each hand.", "Step forward and lower your back knee toward the floor.", "Push back and switch sides."]),
    note: "Alternate legs.", usesWeights: 5 }),
  plank: ex({ id: "m.plank", name: "Plank", emoji: "🪵", base: 20, unit: "sec",
    how: H(["Forearms on the floor, body in a straight line.", "Squeeze belly and glutes.", "Breathe."]),
    note: "You've got this." }),
  sidePlank: ex({ id: "m.sidePlank", name: "Side Plank (each side)", emoji: "↔️", base: 15, unit: "sec",
    how: H(["Prop up on one forearm, feet stacked.", "Lift hips so your body is a straight line.", "Hold. Switch sides."]),
    note: "Waist sculpter." }),
  gluteKickback: ex({ id: "m.kickback", name: "Glute Kickbacks", emoji: "🦵", base: 12, unit: "reps",
    how: H(["On all fours.", "Extend one leg back and up, squeezing your glute.", "Lower. Switch legs."]),
    note: "10 per side." }),
  deadbug: ex({ id: "m.deadbug", name: "Dead Bugs", emoji: "🐞", base: 10, unit: "reps",
    how: H(["Lie on your back, arms up, knees bent 90°.", "Lower opposite arm & leg toward the floor.", "Return and switch."]),
    note: "Core control." }),
  clamshell: ex({ id: "m.clam", name: "Clamshells", emoji: "🐚", base: 12, unit: "reps",
    how: H(["Lie on your side, knees bent.", "Keep feet together and open your top knee.", "Slowly close. Switch sides."]),
    note: "Feel the outer glute." }),
  cooldown: ex({ id: "m.cooldown", name: "Deep Breathing", emoji: "🌸", base: 60, unit: "sec",
    how: H(["Sit comfortably.", "Inhale for 4 counts, hold 4, exhale 6.", "Repeat."]),
    note: "You showed up. That's everything." }),
};

/** Restting exercises drawn from the whole pool. Order chosen for variety. */
const SEQUENCE: Array<(m: number) => MommyExercise> = [
  POOL.marchInPlace,
  POOL.wallPushup, POOL.bodySquat, POOL.gluteBridge,
  POOL.standingCrunch, POOL.calfRaise,
  POOL.seatedRow5, POOL.bicepCurl5, POOL.shoulderPress5,
  POOL.weightedLunge5, POOL.weightedSquat8,
  POOL.bicepCurl8, POOL.shoulderPress8,
  POOL.plank, POOL.sidePlank,
  POOL.gluteKickback, POOL.clamshell, POOL.deadbug,
  POOL.cooldown,
];

/**
 * Build a full 30-day plan. Level offset shifts the multiplier for all workouts
 * (from "Too easy?" and "Too hard?" buttons). Progression: gently increases each
 * workout day; every 3rd day is a rest day.
 */
export function buildMommyPlan(levelOffset: number): MommyDay[] {
  const days: MommyDay[] = [];
  let workoutIndex = 0;
  for (let d = 1; d <= 30; d++) {
    if (d % 3 === 0) {
      days.push({ day: d, kind: "rest", note: "Rest day, mama. Your muscles are getting stronger while you nap." });
      continue;
    }
    // Mommy is stronger than we thought — double the default and progression.
    // Base multiplier grows from ~1.1 to ~3.1 across ~20 workout days; offset moves it.
    const progress = workoutIndex / 20;
    const mult = Math.max(0.7, 1.1 + progress * 2.0 + levelOffset * 0.3);

    // Pick a subset of the sequence depending on progression.
    // Early days: 5 exercises. Mid: 7. Later: 9.
    const count = d < 6 ? 5 : d < 15 ? 7 : 9;
    // Skip weighted moves in the very early days.
    const includeWeights = d >= 4;
    const pool = SEQUENCE.filter((f) => includeWeights ? true : !f(1).usesWeights);
    const start = workoutIndex % Math.max(1, pool.length - count);
    const selected = pool.slice(start, start + count).map((f) => f(mult));
    if (selected[selected.length - 1]?.id !== "m.cooldown") selected.push(POOL.cooldown(1));

    days.push({
      day: d,
      kind: "workout",
      title: `DAY ${d} — ${d < 6 ? "GENTLE START" : d < 15 ? "BUILDING STRENGTH" : d < 25 ? "STRONG MAMA" : "TOTAL POWERHOUSE"}`,
      flavor: d < 6 ? "Easy on, easy off. You're just warming up." : d < 15 ? "You're getting stronger every day." : d < 25 ? "Look at you go. Kids can barely keep up." : "This is elite mama territory.",
      exercises: selected,
    });
    workoutIndex++;
  }
  return days;
}

/* ---------------- Progress persistence (localStorage) ---------------- */
export type MommyProgress = {
  startDate: string; // ISO date (yyyy-mm-dd)
  currentDay: number; // 1..30
  levelOffset: number; // integer, shifted by too easy / too hard
  lastCompletedDate: string | null;
  history: string[]; // ISO dates of days completed
};

const KEY = "kex-mommy-progress";

export function loadMommyProgress(userId: string | null): MommyProgress | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(`${KEY}-${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveMommyProgress(userId: string, p: MommyProgress) {
  try { localStorage.setItem(`${KEY}-${userId}`, JSON.stringify(p)); } catch {}
}

export function resetMommyProgress(userId: string) {
  try { localStorage.removeItem(`${KEY}-${userId}`); } catch {}
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T00:00:00");
  const b = new Date(toISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** After each day of the plan is completed, advance progress. */
export function completeMommyDay(userId: string, prog: MommyProgress): MommyProgress {
  const today = todayISO();
  const next: MommyProgress = {
    ...prog,
    currentDay: Math.min(30, prog.currentDay + 1),
    lastCompletedDate: today,
    history: prog.history.includes(today) ? prog.history : [...prog.history, today],
  };
  saveMommyProgress(userId, next);
  return next;
}

/**
 * If the last completed day was more than 1 day ago (accounting for the fact
 * that today can be missed once — one skipped calendar day breaks the streak),
 * reset progress to day 1.
 */
export function checkMommyStreak(userId: string, prog: MommyProgress): MommyProgress {
  if (!prog.lastCompletedDate) return prog;
  const gap = daysBetween(prog.lastCompletedDate, todayISO());
  if (gap > 1) {
    const fresh: MommyProgress = {
      startDate: todayISO(),
      currentDay: 1,
      levelOffset: prog.levelOffset,
      lastCompletedDate: null,
      history: [],
    };
    saveMommyProgress(userId, fresh);
    return fresh;
  }
  return prog;
}

export function newMommyProgress(): MommyProgress {
  return { startDate: todayISO(), currentDay: 1, levelOffset: 0, lastCompletedDate: null, history: [] };
}
