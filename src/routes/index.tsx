import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import trainer1 from "@/assets/VideoCapture_20260717-074024.jpg.asset.json";
import trainer2 from "@/assets/VideoCapture_20260717-074031.jpg.asset.json";
import trainer3 from "@/assets/VideoCapture_20260717-074038.jpg.asset.json";
import trainer4 from "@/assets/VideoCapture_20260717-074041.jpg.asset.json";
import trainer5 from "@/assets/VideoCapture_20260717-074044.jpg.asset.json";
import legsTrainer from "@/assets/legs-trainer.jpg.asset.json";
import cardioTrainer from "@/assets/cardio-trainer.jpg.asset.json";
import soccerTrainer from "@/assets/soccer-trainer.jpg.asset.json";
import mommyTrainer from "@/assets/mommy-trainer.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { kexSignup, kexSignin } from "@/lib/kex-auth.functions";
import {
  ALL_EXERCISES, ALL_TROPHIES, CARDIO, CORE, DIFFICULTIES, DIFFICULTY_MILESTONES, LEGS,
  SOCCER, STREAK_MILESTONES, STRETCHES, TOURNAMENTS, UPPER, WORKOUT_MILESTONES, WORKOUTS,
  cyclesSinceAnchor, currentTournamentIndex, stretchesForExercises, tournamentIndexForCycle,
  tournamentWindowForCycle,
  type Category, type DifficultyId, type Exercise,
} from "@/lib/kex-data";
import {
  exerciseMultiplier, fetchLeaderboard, scaleAmount, summarizeWorkout, useLeaderboard,
  useMyLogs, useMyPreferences, useProfile, useSession, useStats,
  type ExerciseDifficultyMap,
} from "@/lib/kex-store";
import {
  askForPermission, canNotify, loadPrefs as loadNotifPrefs, savePrefs as saveNotifPrefs,
  notifyReward, notifyTournament, scheduleStreakReminders,
} from "@/lib/kex-notifications";
import {
  buildMommyPlan, checkMommyStreak, completeMommyDay, loadMommyProgress,
  newMommyProgress, resetMommyProgress, saveMommyProgress,
  type MommyDay, type MommyProgress,
} from "@/lib/kex-mommy";

export const Route = createFileRoute("/")({
  component: App,
  head: () => ({
    meta: [
      { title: "GET RIPPED WITH KEX — Beast Mode Ab Trainer" },
      { property: "og:image", content: trainer1.url },
      { name: "twitter:image", content: trainer1.url },
    ],
  }),
});

type Screen = "auth" | "intro" | "tour" | "home" | "workout" | "custom" | "tournaments" | "trophies" | "prefs" | "mommy" | "mommy-workout";
type WorkoutItem = { id: string; amount: number; unit: "reps" | "sec" | "min"; meta: Exercise };
type Session = {
  category: Category | "custom";
  difficulty: DifficultyId;
  routineName: string;
  flavor: string;
  isCustom: boolean;
  items: WorkoutItem[];
};

const CATEGORY_IMG: Record<Category, string> = {
  core: trainer1.url,
  upper: trainer2.url,
  legs: legsTrainer.url,
  cardio: cardioTrainer.url,
  soccer: soccerTrainer.url,
};

const ONBOARD_KEY = "kex-onboarded";
const TOUR_KEY = "kex-toured";
const LAST_TOURNAMENT_KEY = "kex-last-tournament-idx";

function markOnboarded() { try { localStorage.setItem(ONBOARD_KEY, "1"); } catch {} }
function hasOnboarded() { try { return localStorage.getItem(ONBOARD_KEY) === "1"; } catch { return false; } }
function markToured() { try { localStorage.setItem(TOUR_KEY, "1"); } catch {} }
function hasToured() { try { return localStorage.getItem(TOUR_KEY) === "1"; } catch { return false; } }

function mercyKey(userId: string) { return `kex-mercy-month-${userId}`; }
function monthKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function getLastMercyMonth(userId: string): string | null {
  try { return localStorage.getItem(mercyKey(userId)); } catch { return null; }
}

/* =========================================================
   ROOT
   ========================================================= */
function App() {
  const { ready, userId } = useSession();
  const profile = useProfile(userId);
  const [screen, setScreen] = useState<Screen>("auth");
  const [session, setSession] = useState<Session | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const logs = useMyLogs(userId, refreshKey);
  const stats = useStats(logs);
  const { excluded, exerciseDifficulty, save: savePrefs, saveExerciseDifficulty } = useMyPreferences(userId);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const loggingRef = useRef(false);

  // PWA + notification setup once at boot.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Register service worker in production-ish contexts only.
    const host = window.location.hostname;
    const isPreview = host.startsWith("id-preview--") || host.startsWith("preview--") || host.endsWith(".lovableproject.com") || host.endsWith(".lovableproject-dev.com");
    if ("serviceWorker" in navigator && !isPreview && window.self === window.top) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Auto-route based on auth state.
  useEffect(() => {
    if (!ready) return;
    if (userId) {
      // Signed in: if we just signed up, show intro + tour. Otherwise straight home.
      setScreen((s) => {
        if (s === "auth") {
          if (justSignedUp || !hasOnboarded()) return "intro";
          return "home";
        }
        return s;
      });
    } else {
      setScreen("auth");
    }
  }, [ready, userId, justSignedUp]);

  // Fire tournament boundary + streak reminders when we know the user.
  const workedOutToday = useMemo(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return stats.dateSet.has(key);
  }, [stats.dateSet]);

  useEffect(() => {
    if (!userId) return;
    if (canNotify()) scheduleStreakReminders({ workedOutToday });
    // Tournament boundary check
    try {
      const cur = currentTournamentIndex();
      const stored = Number(localStorage.getItem(LAST_TOURNAMENT_KEY) ?? "-1");
      if (stored >= 0 && stored !== cur) {
        notifyTournament("NEW TOURNAMENT LIVE!", `Check if you won the last one and see this week's challenge.`);
      }
      localStorage.setItem(LAST_TOURNAMENT_KEY, String(cur));
    } catch {}
  }, [userId, workedOutToday]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center font-display text-3xl text-primary">LOADING KEX…</div>;
  }

  const buildItems = (ids: string[], difficulty: DifficultyId): WorkoutItem[] => {
    const items = ids.map((id) => {
      const meta = findExerciseById(id)!;
      const perExMult = exerciseMultiplier(id, exerciseDifficulty);
      return { id, meta, unit: meta.unit, amount: scaleAmount(meta.base * perExMult, DIFFICULTIES[difficulty].mult) };
    });
    // Append 3–5 muscle-appropriate stretches (unscaled — stretches are stretches).
    const stretches = stretchesForExercises(ids).map((s) => ({
      id: s.id, meta: s, unit: s.unit, amount: s.base,
    }));
    return [...items, ...stretches];
  };

  const startBuiltWorkout = (category: Category, difficulty: DifficultyId) => {
    const w = WORKOUTS[category];
    const usable = w.routines.map((r) => ({
      r, ids: r.exerciseIds.filter((id) => !excluded.includes(id)),
    })).filter((x) => x.ids.length >= 3);
    const pick = usable.length ? usable[Math.floor(Math.random() * usable.length)] : {
      r: w.routines[0], ids: w.routines[0].exerciseIds,
    };
    setSession({
      category, difficulty, routineName: pick.r.name, flavor: pick.r.flavor,
      isCustom: false, items: buildItems(pick.ids, difficulty),
    });
    setScreen("workout");
  };

  const startCustomWorkout = (difficulty: DifficultyId, ids: string[]) => {
    setSession({
      category: "custom", difficulty, routineName: "CUSTOM CHAOS",
      flavor: "You picked this. Kex is amused.", isCustom: true,
      items: buildItems(ids, difficulty),
    });
    setScreen("workout");
  };

  const completeWorkout = async () => {
    if (!session || !userId) { setScreen("home"); return; }
    if (loggingRef.current) return;
    loggingRef.current = true;
    try {
      // Exclude stretches from logged exercises so summaries stay meaningful.
      const logged = session.items.filter((i) => !i.id.startsWith("stretch."));
      const exercisesJson = logged.map((i) => ({ id: i.id, amount: i.amount, unit: i.unit }));
      const { plankSeconds, pullupReps } = summarizeWorkout(exercisesJson);
      const prevStreak = stats.streak;
      const prevWorkouts = stats.totalWorkouts;
      await supabase.from("workout_logs").insert({
        user_id: userId,
        category: session.category === "custom" ? "custom" : session.category,
        difficulty: session.difficulty,
        routine_name: session.routineName,
        is_custom: session.isCustom,
        exercises: exercisesJson,
        plank_seconds: plankSeconds,
        pullup_reps: pullupReps,
      });
      setRefreshKey((k) => k + 1);
      const newWorkouts = prevWorkouts + 1;
      const workoutMilestone = WORKOUT_MILESTONES.find((n) => newWorkouts === n);
      if (workoutMilestone) notifyReward("🎖️ TROPHY UNLOCKED", `${workoutMilestone} workout${workoutMilestone === 1 ? "" : "s"} completed!`);
      if (prevStreak === 0 && !workedOutToday) notifyReward("🔥 STREAK STARTED!", "One down. Kex is watching.");
    } finally {
      loggingRef.current = false;
    }
  };

  const logMommyDay = async (day: number) => {
    if (!userId) return;
    if (loggingRef.current) return;
    loggingRef.current = true;
    try {
      await supabase.from("workout_logs").insert({
        user_id: userId,
        category: "mommy",
        difficulty: 0,
        routine_name: `Mommy Day ${day}`,
        is_custom: false,
        exercises: [],
        plank_seconds: 0,
        pullup_reps: 0,
      });
      setRefreshKey((k) => k + 1);
    } finally {
      loggingRef.current = false;
    }
  };

  const pleadForMercy = async (reason: string) => {
    if (!userId) return;
    await supabase.from("workout_logs").insert({
      user_id: userId,
      category: "mercy",
      difficulty: 0,
      routine_name: "Pleaded for mercy",
      is_custom: false,
      exercises: [{ id: "mercy.excuse", amount: 1, unit: "reps", note: reason } as unknown as { id: string; amount: number; unit: string }],
      plank_seconds: 0,
      pullup_reps: 0,
    });
    try { localStorage.setItem(mercyKey(userId), monthKey()); } catch {}
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {screen === "auth" && (
        <Auth
          onDone={(mode) => { if (mode === "signup") setJustSignedUp(true); }}
        />
      )}
      {screen === "intro" && (
        <Intro onDone={() => { markOnboarded(); setScreen(hasToured() ? "home" : "tour"); }} />
      )}
      {screen === "tour" && profile && (
        <FeatureTour onDone={() => { markToured(); setScreen("home"); setJustSignedUp(false); }} />
      )}
      {screen === "home" && profile && userId && (
        <Home
          profile={profile}
          userId={userId}
          stats={stats}
          onStart={startBuiltWorkout}
          onCustom={() => setScreen("custom")}
          onTournaments={() => setScreen("tournaments")}
          onTrophies={() => setScreen("trophies")}
          onPrefs={() => setScreen("prefs")}
          onMommy={() => setScreen("mommy")}
          onSignOut={async () => { await supabase.auth.signOut(); setScreen("auth"); }}
          onPlead={pleadForMercy}
        />
      )}
      {screen === "workout" && session && (
        <Workout
          session={session}
          onExit={() => setScreen("home")}
          onFinish={async () => { await completeWorkout(); setScreen("home"); }}
        />
      )}
      {screen === "custom" && (
        <CustomBuilder excluded={excluded} onStart={startCustomWorkout} onBack={() => setScreen("home")} />
      )}
      {screen === "tournaments" && userId && <Tournaments myUserId={userId} onBack={() => setScreen("home")} />}
      {screen === "trophies" && <Trophies stats={stats} myUserId={userId!} onBack={() => setScreen("home")} />}
      {screen === "prefs" && <Preferences excluded={excluded} exerciseDifficulty={exerciseDifficulty} onSave={savePrefs} onSaveExerciseDifficulty={saveExerciseDifficulty} onBack={() => setScreen("home")} />}
      {screen === "mommy" && userId && (
        <MommyHome userId={userId} onBack={() => setScreen("home")} onStartDay={() => setScreen("mommy-workout")} onLogDay={logMommyDay} />
      )}
      {screen === "mommy-workout" && userId && (
        <MommyWorkout userId={userId} onExit={() => setScreen("mommy")} onDone={() => setScreen("mommy")} onLogDay={logMommyDay} />
      )}
    </div>
  );
}

function findExerciseById(id: string): Exercise | undefined {
  const parts = id.split(".");
  return ALL_EXERCISES[parts[1]] ?? Object.values(ALL_EXERCISES).find((e) => e.id === id);
}

/* =========================================================
   AUTH  (username-only) — now the FIRST screen
   ========================================================= */
function Auth({ onDone }: { onDone: (mode: "signup" | "signin") => void }) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null); setLoading(true);
    try {
      const creds = mode === "signup"
        ? await kexSignup({ data: { username } })
        : await kexSignin({ data: { username } });
      const { error } = await supabase.auth.signInWithPassword({ email: creds.email, password: creds.password });
      if (error) throw new Error(error.message);
      onDone(mode);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something exploded.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen px-5 py-10">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
        <div className="h-[200vmax] w-[200vmax] bg-zoom-lines" />
      </div>
      <div className="relative mx-auto max-w-md">
        <h1 className="display text-center text-[14vw] md:text-[96px] leading-[0.85] text-primary text-stroke-thick">
          GET RIPPED<br />
          <span className="inline-block rotate-[-3deg] text-secondary">WITH KEX</span>
        </h1>
        <div className="mt-8 rounded-2xl border-4 border-primary bg-card p-6 shadow-comic-lg">
          <h2 className="font-display text-4xl text-primary text-stroke-black">
            {mode === "signup" ? "JOIN THE GAINS" : "WELCOME BACK"}
          </h2>
          <p className="mt-2 text-foreground/80">
            {mode === "signup"
              ? "Just pick a username. That's it. No email. No password. Kex hates typing."
              : "Type your username and Kex will let you in. He remembers you."}
          </p>
          <label className="mt-6 block">
            <div className="font-condensed text-xs font-black uppercase tracking-widest text-secondary">Username</div>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. kex_the_second"
              className="mt-2 w-full rounded-xl border-2 border-border bg-background px-4 py-3 font-display text-2xl text-foreground focus:border-primary focus:outline-none"
              disabled={loading}
              maxLength={24}
            />
          </label>
          {err && <div className="mt-3 rounded-lg border-2 border-danger bg-danger/10 p-3 text-sm text-danger">{err}</div>}
          <button
            disabled={loading || !username.trim()}
            onClick={submit}
            className="mt-5 w-full rounded-xl bg-primary py-4 font-display text-3xl text-primary-foreground shadow-comic-lg disabled:opacity-50"
          >
            {loading ? "…" : mode === "signup" ? "CREATE ME" : "LET ME IN"}
          </button>
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-4 w-full font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary"
          >
            {mode === "signup" ? "Already have a username? Sign in →" : "New here? Sign up →"}
          </button>
        </div>
        <p className="mt-6 text-center font-condensed text-xs uppercase tracking-widest text-muted-foreground">
          Add me to your home screen and I'll stay signed in!
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   INTRO  — only shown to first-time signups
   ========================================================= */
function Intro({ onDone }: { onDone: () => void }) {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[200vmax] w-[200vmax] bg-zoom-lines" />
      </div>
      <div className="relative mx-auto max-w-5xl px-5 py-10 md:py-16">
        <div className="text-center">
          <h1 className="display mt-4 text-[15vw] md:text-[128px] leading-[0.85] text-primary text-stroke-thick">
            GET RIPPED<br />
            <span className="inline-block rotate-[-3deg] text-secondary">WITH KEX</span>
          </h1>
        </div>
        <div className="relative mx-auto mt-8 w-full max-w-md">
          <div className="animate-pulse-glow rounded-2xl border-4 border-primary bg-card p-2 shadow-comic-lg">
            <img src={trainer1.url} alt="Kex, your 7-year-old AI trainer, flexing" className="w-full rounded-xl" />
          </div>
          <div className="absolute -top-6 -right-4 rotate-[8deg] rounded-lg bg-primary px-3 py-2 font-display text-2xl text-primary-foreground shadow-comic">50 LBS OF FURY</div>
          <div className="absolute -bottom-4 -left-4 rotate-[-6deg] rounded-lg bg-accent px-3 py-2 font-display text-xl text-accent-foreground shadow-comic">AGE: 7</div>
        </div>
        <div className="mx-auto mt-12 max-w-2xl space-y-6 text-lg">
          <p className="rounded-xl border-2 border-primary bg-card p-5 shadow-comic">
            <span className="font-display text-3xl text-primary">HEY YOU.</span>{" "}
            I'm Kex. I'm 7 years old, I weigh less than a sack of potatoes, and I have abs you could grate cheese on. This app is going to make YOU look like ME. Except taller. Probably.
          </p>
          <FeatureRow n="1" title="Five courses + Mommy's special">
            The main event is my <b>Beast Six Pack Core Program</b>. Side quests for upper body, legs, cardio, and soccer. Plus, <b>MOMMY'S SPECIAL COURSE ❤️</b> — a whole different vibe for Kex's mom.
          </FeatureRow>
          <FeatureRow n="2" title="Six difficulty levels">
            From <b>ZERO MUSCLES KEX</b> (you were born yesterday) all the way up to <b>BOOMBAKRAXIN KEX</b> (do not attempt without a signed waiver).
          </FeatureRow>
          <FeatureRow n="3" title="A whole vault of workouts">
            Every time you press START, I roll the dice and hand you a fresh routine. You never memorize your way out of leg day.
          </FeatureRow>
          <FeatureRow n="4" title="Tournaments, trophies, streaks">
            I track everything — your workout streak, all your trophies, and every 2 weeks I run a new tournament where everyone competes.
          </FeatureRow>
          <FeatureRow n="5" title="How ripped, how fast?">
            Follow my program 5 days a week. In <b>6 weeks</b> "friends notice." In <b>12 weeks</b> "abs at the beach." In <b>26 weeks</b> "small children fear you at the grocery store."
          </FeatureRow>
        </div>
        <div className="mt-12 flex justify-center">
          <button onClick={onDone} className="group relative rotate-[-1deg] rounded-2xl bg-primary px-10 py-5 font-display text-4xl md:text-6xl text-primary-foreground shadow-comic-lg transition-transform hover:rotate-0 hover:scale-105 active:translate-x-1 active:translate-y-1">
            LET'S GET RIPPED
            <span className="absolute -right-3 -top-3 rotate-12 rounded-full bg-secondary px-3 py-1 font-condensed text-sm text-secondary-foreground shadow-comic">GO!</span>
          </button>
        </div>
        <p className="mt-6 text-center font-condensed text-sm uppercase tracking-widest text-muted-foreground">
          Disclaimer: Kex is not a licensed personal trainer. He just thinks he is.
        </p>
      </div>
    </div>
  );
}

function FeatureRow({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-xl border-2 border-border bg-card p-5 shadow-comic">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-3xl text-secondary-foreground shadow-comic">{n}</div>
      <div>
        <div className="font-display text-2xl text-primary">{title}</div>
        <div className="text-foreground/90">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================
   FEATURE TOUR — walkthrough for first-time users
   ========================================================= */
function FeatureTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | "unknown">(
    typeof Notification !== "undefined" ? Notification.permission : "unknown",
  );
  const steps: { title: string; body: React.ReactNode; extra?: React.ReactNode }[] = [
    {
      title: "👋 WELCOME TO THE GYM (SORT OF)",
      body: <>This is the tour. Kex will show you where everything is. Don't worry — I'll stop talking eventually.</>,
    },
    {
      title: "🎯 PICK A COURSE",
      body: <>The home screen has 5 courses — Core, Upper Body, Legs, Cardio, and Soccer. Tap a card to select. Kex will judge your choice silently.</>,
    },
    {
      title: "💪 PICK YOUR DIFFICULTY",
      body: <>6 levels, from ZERO MUSCLES KEX to BOOMBAKRAXIN KEX. Every rep and second scales with your pick.</>,
    },
    {
      title: "🎲 SMASH START WORKOUT",
      body: <>Every time you start, Kex rolls the dice and hands you a fresh routine. You never memorize your way out of leg day.</>,
    },
    {
      title: "🏆 TOURNAMENTS",
      body: <>Every 2 weeks, everyone who has ever signed up competes in a new challenge. Peek at past winners in the trophy shelf and check who's crushing the leaderboard live.</>,
    },
    {
      title: "🏅 TROPHIES",
      body: <>Streak trophies, workout milestones, difficulty grinds, and tournament wins. All hoarded here.</>,
    },
    {
      title: "🛠️ CUSTOM WORKOUTS",
      body: <>Pick any exercises you want, in any order, at any difficulty. Kex scales the numbers. Chaos.</>,
    },
    {
      title: "⚙️ PREFERENCES",
      body: <>Some exercises just aren't for you? Exclude them here — Kex will never sneak them in again.</>,
    },
    {
      title: "❤️ MOMMY'S SPECIAL COURSE",
      body: <>Not for Kex — for Kex's mom. A 30-day progressive plan with dumbbells and rest days built in.</>,
    },
    {
      title: "🔔 NOTIFICATIONS",
      body: <>Want streak reminders, tournament pings, and reward alerts? Kex needs your permission first.</>,
      extra: (
        <div className="mt-4">
          {notifStatus === "granted" ? (
            <div className="rounded-lg border-2 border-primary bg-primary/10 p-3 font-condensed text-sm font-black uppercase text-primary">✅ Notifications enabled</div>
          ) : notifStatus === "denied" ? (
            <div className="rounded-lg border-2 border-danger bg-danger/10 p-3 font-condensed text-sm text-danger">Notifications blocked — enable in browser settings later.</div>
          ) : (
            <button
              onClick={async () => {
                const p = await askForPermission();
                const prefs = loadNotifPrefs();
                saveNotifPrefs({ ...prefs, asked: true });
                setNotifStatus(p);
              }}
              className="w-full rounded-xl bg-secondary py-3 font-display text-2xl text-secondary-foreground shadow-comic"
            >
              ENABLE NOTIFICATIONS
            </button>
          )}
        </div>
      ),
    },
    {
      title: "🚀 GO GET RIPPED",
      body: <>That's it! Kex will meet you at the home page. Try not to embarrass him.</>,
    },
  ];

  const last = step === steps.length - 1;
  const cur = steps[step];

  return (
    <div className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-condensed text-xs font-black uppercase tracking-widest text-muted-foreground">
            Tour · Step {step + 1} / {steps.length}
          </div>
          <button onClick={onDone} className="font-condensed text-xs font-bold uppercase text-muted-foreground hover:text-primary">Skip</button>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="mt-6 rounded-2xl border-4 border-primary bg-card p-6 shadow-comic-lg">
          <h2 className="font-display text-4xl text-primary text-stroke-black">{cur.title}</h2>
          <p className="mt-3 text-lg text-foreground/90">{cur.body}</p>
          {cur.extra}
        </div>
        <div className="mt-6 flex justify-between gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-xl border-2 border-border bg-card px-5 py-3 font-display text-2xl text-foreground disabled:opacity-40"
          >
            ← BACK
          </button>
          <button
            onClick={() => (last ? onDone() : setStep((s) => s + 1))}
            className="flex-1 rounded-xl bg-primary py-3 font-display text-2xl text-primary-foreground shadow-comic-lg"
          >
            {last ? "TO THE GYM →" : "NEXT →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HOME
   ========================================================= */
function Home({
  profile, userId, stats, onStart, onCustom, onTournaments, onTrophies, onPrefs, onMommy, onSignOut, onPlead,
}: {
  profile: { username: string };
  userId: string;
  stats: ReturnType<typeof useStats>;
  onStart: (c: Category, d: DifficultyId) => void;
  onCustom: () => void;
  onTournaments: () => void;
  onTrophies: () => void;
  onPrefs: () => void;
  onMommy: () => void;
  onSignOut: () => void;
  onPlead: (reason: string) => Promise<void>;
}) {
  const [category, setCategory] = useState<Category>("core");
  const [difficulty, setDifficulty] = useState<DifficultyId>(3);
  const [mercyOpen, setMercyOpen] = useState(false);
  const [mercyUsedMonth, setMercyUsedMonth] = useState<string | null>(() => getLastMercyMonth(userId));
  const mercyAvailable = mercyUsedMonth !== monthKey();
  return (
    <div className="relative min-h-screen px-5 py-6">
      <div className="mx-auto max-w-5xl">
        <TopBar profile={profile} onSignOut={onSignOut} />

        <div className="mt-3">
          <button
            onClick={() => setMercyOpen(true)}
            disabled={!mercyAvailable}
            className={`w-full rounded-xl border-2 px-4 py-3 text-left font-condensed text-sm font-black uppercase shadow-comic transition ${mercyAvailable ? "border-danger bg-danger/10 text-danger hover:bg-danger/20" : "border-border bg-card text-muted-foreground opacity-60"}`}
          >
            🙏 PLEAD FOR MERCY FROM KEX {mercyAvailable ? "· save your streak (1/month)" : "· already used this month"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <NavBtn label="TOURNAMENTS" emoji="🏆" onClick={onTournaments} />
          <NavBtn label="TROPHIES" emoji="🏅" onClick={onTrophies} />
          <NavBtn label="CUSTOM" emoji="🛠️" onClick={onCustom} />
          <NavBtn label="PREFERENCES" emoji="⚙️" onClick={onPrefs} />
          <NavBtn label="MOMMY ❤️" emoji="💗" onClick={onMommy} />
        </div>

        {mercyOpen && (
          <MercyModal
            onClose={() => setMercyOpen(false)}
            onSubmit={async (reason) => {
              await onPlead(reason);
              setMercyUsedMonth(monthKey());
              setMercyOpen(false);
            }}
          />
        )}


        <StatsStrip stats={stats} />

        <h2 className="mt-8 font-display text-5xl md:text-6xl text-foreground">
          Pick your <span className="text-secondary">poison</span>.
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <CategoryCard title="CORE" subtitle="The main event" emoji="🔥" img={CATEGORY_IMG.core} selected={category === "core"} onSelect={() => setCategory("core")} badge="★ MAIN" />
          <CategoryCard title="UPPER" subtitle="Side quest" emoji="💪" img={CATEGORY_IMG.upper} selected={category === "upper"} onSelect={() => setCategory("upper")} />
          <CategoryCard title="LEGS" subtitle="Do not skip" emoji="🦵" img={CATEGORY_IMG.legs} selected={category === "legs"} onSelect={() => setCategory("legs")} />
          <CategoryCard title="CARDIO" subtitle="Treadmill terror" emoji="🏃" img={CATEGORY_IMG.cardio} selected={category === "cardio"} onSelect={() => setCategory("cardio")} />
          <CategoryCard title="SOCCER" subtitle="Garage drills" emoji="⚽" img={CATEGORY_IMG.soccer} selected={category === "soccer"} onSelect={() => setCategory("soccer")} />
        </div>

        <h3 className="mt-10 font-display text-4xl text-foreground">
          How much <span className="text-primary">Kex</span> can you handle?
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`relative overflow-hidden rounded-xl border-2 p-4 text-left transition-transform hover:scale-[1.02] ${difficulty === d.id ? "border-primary shadow-comic-pink" : "border-border bg-card"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`inline-block rounded px-2 py-0.5 font-condensed text-xs font-black uppercase ${d.color}`}>Level {d.id}</div>
                  <div className="mt-1 font-display text-2xl leading-none text-foreground">{d.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{d.tag}</div>
                </div>
                <div className="font-display text-3xl text-primary">{"★".repeat(d.id + 1)}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center pb-16">
          <button onClick={() => onStart(category, difficulty)} className="rotate-[-1deg] rounded-2xl bg-primary px-10 py-5 font-display text-4xl text-primary-foreground shadow-comic-lg transition-transform hover:rotate-0 hover:scale-105 active:translate-x-1 active:translate-y-1">
            START WORKOUT
          </button>
        </div>
      </div>
    </div>
  );
}

function TopBar({ profile, onSignOut }: { profile: { username: string }; onSignOut: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="font-display text-2xl text-primary">GET RIPPED WITH KEX</div>
      <div className="flex items-center gap-3">
        <div className="font-condensed text-sm font-black uppercase text-foreground">@{profile.username}</div>
        <button onClick={onSignOut} className="rounded-lg border-2 border-border bg-card px-3 py-1 font-condensed text-xs font-bold uppercase text-foreground hover:border-primary">Sign out</button>
      </div>
    </div>
  );
}

function NavBtn({ label, emoji, onClick }: { label: string; emoji: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-xl border-2 border-border bg-card px-3 py-3 text-center font-condensed text-sm font-black uppercase text-foreground shadow-comic transition-transform hover:scale-[1.03] hover:border-primary">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1">{label}</div>
    </button>
  );
}

function StatsStrip({ stats }: { stats: ReturnType<typeof useStats> }) {
  return (
    <div className="mt-5 grid grid-cols-3 gap-3">
      <StatChip label="Streak" value={`${stats.streak}d`} accent />
      <StatChip label="Workouts" value={`${stats.totalWorkouts}`} />
      <StatChip label="Plank sec" value={`${stats.plankSec}`} />
    </div>
  );
}
function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border-2 p-3 text-center ${accent ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
      <div className="font-display text-3xl text-foreground">{value}</div>
      <div className="font-condensed text-xs font-black uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
function CategoryCard({ title, subtitle, emoji, img, selected, onSelect, badge }: {
  title: string; subtitle: string; emoji: string; img: string; selected: boolean; onSelect: () => void; badge?: string;
}) {
  return (
    <button onClick={onSelect} className={`relative overflow-hidden rounded-2xl border-4 text-left transition-transform hover:scale-[1.03] ${selected ? "border-primary shadow-comic-lg" : "border-border bg-card shadow-comic"}`}>
      <div className="relative aspect-[4/5] w-full">
        <img src={img} alt={title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        {badge && <div className="absolute right-2 top-2 rotate-[6deg] rounded bg-secondary px-2 py-1 font-condensed text-xs font-black uppercase text-secondary-foreground shadow-comic">{badge}</div>}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="font-display text-2xl md:text-3xl text-primary text-stroke-black">{emoji} {title}</div>
          <div className="font-condensed text-xs font-bold uppercase text-foreground/90">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   WORKOUT — with 3-2-1 countdown before timed exercises
   ========================================================= */
type TimerPhase = "idle" | "ready" | "running";

function Workout({ session, onExit, onFinish }: { session: Session; onExit: () => void; onFinish: () => void }) {
  const [idx, setIdx] = useState(0);
  const trainerImgs = [trainer1.url, trainer2.url, trainer3.url, trainer4.url, trainer5.url];
  const done = idx >= session.items.length;
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [countdown, setCountdown] = useState(3); // 3, 2, 1
  const [remaining, setRemaining] = useState<number | null>(null); // seconds during running
  const diff = DIFFICULTIES[session.difficulty];

  // Reset timer state when moving to a new exercise.
  useEffect(() => {
    setPhase("idle");
    setCountdown(3);
    setRemaining(null);
  }, [idx]);

  // Countdown for ready phase.
  useEffect(() => {
    if (phase !== "ready") return;
    if (countdown <= 0) {
      // Move to running.
      const item = session.items[idx];
      const total = item.unit === "min" ? item.amount * 60 : item.amount;
      setRemaining(total);
      setPhase("running");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown]);

  // Countdown for running phase.
  useEffect(() => {
    if (phase !== "running" || remaining == null) return;
    if (remaining <= 0) {
      setPhase("idle");
      setRemaining(null);
      setIdx((i) => i + 1);
      return;
    }
    const t = setTimeout(() => setRemaining((r) => (r == null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [phase, remaining]);

  useEffect(() => {
    if (done) onFinish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done) {
    return (
      <div className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-condensed text-sm font-black uppercase tracking-widest text-secondary">Workout complete — logging…</div>
          <h1 className="mt-2 font-display text-6xl text-primary text-stroke-thick">YOU DID IT!</h1>
          <img src={trainer5.url} alt="Kex approves" className="mx-auto mt-6 w-full max-w-xs rounded-2xl border-4 border-primary shadow-comic-lg" />
          <button onClick={onExit} className="mt-8 rounded-2xl bg-primary px-8 py-4 font-display text-3xl text-primary-foreground shadow-comic-lg">BACK TO HOME</button>
        </div>
      </div>
    );
  }

  const item = session.items[idx];
  const ex = item.meta;
  const isStretch = item.id.startsWith("stretch.");
  const unitLabel = item.unit === "reps" ? "REPS" : item.unit === "sec" ? "SECONDS" : "MINUTES";
  const trainerImg = trainerImgs[idx % trainerImgs.length];
  const isTimed = item.unit === "sec" || item.unit === "min";
  const totalSec = item.unit === "min" ? item.amount * 60 : item.amount;

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary">← Quit</button>
          <div className="text-center">
            <div className="font-display text-xl text-primary leading-none">{session.routineName}</div>
            <div className="font-condensed text-xs uppercase text-muted-foreground">
              {session.category === "custom" ? "CUSTOM" : WORKOUTS[session.category as Category]?.title ?? session.category} · {diff.name}
            </div>
          </div>
          <div className="font-condensed text-sm font-black text-foreground">{idx + 1} / {session.items.length}</div>
        </div>

        <div className="mt-2 text-center font-condensed text-xs italic text-secondary">"{session.flavor}"</div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${(idx / session.items.length) * 100}%` }} />
        </div>

        {isStretch && (
          <div className="mt-4 rounded-xl border-2 border-accent bg-accent/10 p-3 text-center font-condensed text-sm font-black uppercase text-accent">
            🌸 COOL-DOWN STRETCH
          </div>
        )}

        {/* Ready-set-go overlay */}
        {phase === "ready" && (
          <div className="mt-6 flex items-center justify-center rounded-2xl border-4 border-primary bg-black/60 p-10 text-center">
            <div>
              <div className="font-condensed text-lg font-black uppercase tracking-widest text-secondary">GET READY!</div>
              <div className="mt-2 font-display text-[24vw] leading-none text-primary text-stroke-thick md:text-[180px]">
                {countdown > 0 ? countdown : "GO!"}
              </div>
            </div>
          </div>
        )}

        <div className={`mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.2fr] ${phase === "ready" ? "opacity-40" : ""}`}>
          <div className="relative">
            <img src={trainerImg} alt="Kex demonstrating" className="w-full rounded-2xl border-4 border-primary shadow-comic-lg" />
            <div className="absolute -bottom-4 -right-4 rotate-[-4deg] rounded-lg bg-secondary px-4 py-3 font-display text-xl text-secondary-foreground shadow-comic">WATCH & LEARN</div>
            {ex.needsPullupBar && (
              <div className="absolute -top-3 -left-3 rotate-[-6deg] rounded-lg bg-accent px-3 py-2 font-condensed text-xs font-black uppercase text-accent-foreground shadow-comic">🪝 Pull-up bar</div>
            )}
            {ex.outdoorOnly && (
              <div className="absolute -top-3 -left-3 rotate-[-6deg] rounded-lg bg-danger px-3 py-2 font-condensed text-xs font-black uppercase text-white shadow-comic">☀️ OUTDOOR</div>
            )}
          </div>

          <div>
            <div className="font-condensed text-sm font-black uppercase tracking-widest text-secondary">Exercise {idx + 1}</div>
            <h1 className="font-display text-5xl md:text-6xl leading-[0.9] text-primary text-stroke-black">{ex.emoji} {ex.name}</h1>

            <div className="mt-4 inline-block rounded-xl border-2 border-primary bg-card px-6 py-3 shadow-comic">
              <div className="font-display text-6xl leading-none text-primary">
                {isTimed && phase === "running" && remaining != null
                  ? formatTime(remaining)
                  : isTimed ? formatTime(totalSec) : item.amount}
              </div>
              <div className="font-condensed text-sm font-black uppercase tracking-widest text-muted-foreground">
                {isTimed && phase === "running" ? "TIME LEFT" : unitLabel}
              </div>
            </div>

            <div className="mt-6 rounded-xl border-2 border-border bg-card p-5 shadow-comic">
              <div className="font-display text-2xl text-foreground">HOW TO DO IT</div>
              <ol className="mt-3 space-y-2">
                {ex.how.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg text-primary-foreground">{i + 1}</span>
                    <span className="pt-0.5 text-foreground/90">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 rounded-xl border-2 border-secondary bg-secondary/10 p-4">
              <div className="font-condensed text-xs font-black uppercase tracking-widest text-secondary">
                {isStretch ? "Cool-down tip" : "Kex says"}
              </div>
              <p className="mt-1 italic text-foreground/90">"{ex.kexNote}"</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 pb-16">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0 || phase !== "idle"} className="rounded-xl border-2 border-border bg-card px-5 py-3 font-display text-2xl text-foreground disabled:opacity-40">← BACK</button>
          {isTimed ? (
            phase === "running" ? (
              <button onClick={() => { setPhase("idle"); setRemaining(null); }} className="flex-1 rounded-xl bg-danger px-5 py-4 font-display text-3xl text-white shadow-comic-lg">STOP TIMER</button>
            ) : phase === "ready" ? (
              <button onClick={() => { setPhase("idle"); setCountdown(3); }} className="flex-1 rounded-xl bg-danger px-5 py-4 font-display text-2xl text-white shadow-comic-lg">CANCEL</button>
            ) : (
              <button onClick={() => { setCountdown(3); setPhase("ready"); }} className="flex-1 rounded-xl bg-primary px-5 py-4 font-display text-3xl text-primary-foreground shadow-comic-lg">START EXERCISE ⏱️</button>
            )
          ) : (
            <button onClick={() => setIdx((i) => i + 1)} className="flex-1 rounded-xl bg-primary px-5 py-4 font-display text-3xl text-primary-foreground shadow-comic-lg">
              {idx === session.items.length - 1 ? "FINISH 🏆" : "DONE — NEXT →"}
            </button>
          )}
          {isTimed && phase !== "ready" && (
            <button onClick={() => { setPhase("idle"); setRemaining(null); setIdx((i) => i + 1); }} className="rounded-xl border-2 border-border bg-card px-4 py-3 font-condensed text-xs font-black uppercase text-foreground">SKIP</button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : String(s);
}

/* =========================================================
   CUSTOM BUILDER
   ========================================================= */
function CustomBuilder({ excluded, onStart, onBack }: {
  excluded: string[];
  onStart: (d: DifficultyId, ids: string[]) => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<"all" | Category | "pullup">("all");
  const [picked, setPicked] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyId>(3);

  const pool = useMemo(() => {
    // Only regular exercises (no stretches — those are auto-appended).
    const all = Object.values(ALL_EXERCISES).filter((e) => !e.id.startsWith("stretch."));
    let filtered = all;
    if (filter === "core") filtered = Object.values(CORE);
    else if (filter === "upper") filtered = Object.values(UPPER);
    else if (filter === "legs") filtered = Object.values(LEGS);
    else if (filter === "cardio") filtered = Object.values(CARDIO);
    else if (filter === "soccer") filtered = Object.values(SOCCER);
    else if (filter === "pullup") filtered = all.filter((e) => e.needsPullupBar);
    return filtered.filter((e) => !excluded.includes(e.id));
  }, [filter, excluded]);

  const toggle = (id: string) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const move = (i: number, dir: -1 | 1) => setPicked((p) => {
    const next = [...p]; const j = i + dir; if (j < 0 || j >= next.length) return p;
    [next[i], next[j]] = [next[j], next[i]]; return next;
  });

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-4xl">
        <button onClick={onBack} className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary">← Home</button>
        <h1 className="mt-2 font-display text-5xl text-primary text-stroke-black">BUILD YOUR OWN PAIN</h1>
        <p className="mt-1 text-foreground/80">Pick exercises. Pick a difficulty. Kex will scale the numbers and add stretches at the end.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["all", "core", "upper", "legs", "cardio", "soccer", "pullup"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg border-2 px-3 py-1 font-condensed text-xs font-black uppercase ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
              {f === "all" ? "ALL" : f === "pullup" ? "🪝 PULL-UP BAR" : f.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="font-display text-2xl text-foreground">ADD EXERCISES</div>
            <div className="mt-2 max-h-[60vh] space-y-2 overflow-y-auto rounded-xl border-2 border-border bg-card p-2">
              {pool.map((e) => {
                const sel = picked.includes(e.id);
                return (
                  <button key={e.id} onClick={() => toggle(e.id)} className={`flex w-full items-center gap-3 rounded-lg border-2 p-2 text-left ${sel ? "border-primary bg-primary/10" : "border-border"}`}>
                    <span className="text-2xl">{e.emoji}</span>
                    <span className="flex-1">
                      <div className="font-display text-lg text-foreground leading-none">{e.name}</div>
                      <div className="font-condensed text-xs uppercase text-muted-foreground">{e.base} {e.unit}{e.needsPullupBar ? " · pull-up bar" : ""}{e.outdoorOnly ? " · outdoor" : ""}</div>
                    </span>
                    <span className={`font-display text-2xl ${sel ? "text-primary" : "text-muted-foreground"}`}>{sel ? "−" : "+"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="font-display text-2xl text-foreground">YOUR WORKOUT ({picked.length})</div>
            <div className="mt-2 max-h-[60vh] space-y-2 overflow-y-auto rounded-xl border-2 border-dashed border-primary bg-card p-2">
              {picked.length === 0 && <div className="p-3 text-sm italic text-muted-foreground">Pick some exercises. Any exercises. Kex is waiting.</div>}
              {picked.map((id, i) => {
                const e = findExerciseById(id)!;
                return (
                  <div key={id + i} className="flex items-center gap-2 rounded-lg border-2 border-border p-2">
                    <span className="text-xl">{e.emoji}</span>
                    <span className="flex-1 font-display text-base text-foreground">{i + 1}. {e.name}</span>
                    <button onClick={() => move(i, -1)} className="rounded border border-border px-2 py-0.5 text-xs">▲</button>
                    <button onClick={() => move(i, 1)} className="rounded border border-border px-2 py-0.5 text-xs">▼</button>
                    <button onClick={() => toggle(id)} className="rounded border border-danger px-2 py-0.5 text-xs text-danger">×</button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <div className="font-condensed text-xs font-black uppercase text-secondary">Difficulty</div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value) as DifficultyId)}
                className="mt-1 w-full rounded-lg border-2 border-border bg-background p-2 font-display text-lg text-foreground"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.id} value={d.id}>Level {d.id}: {d.name}</option>
                ))}
              </select>
            </div>

            <button
              disabled={picked.length < 2}
              onClick={() => onStart(difficulty, picked)}
              className="mt-4 w-full rounded-xl bg-primary py-4 font-display text-3xl text-primary-foreground shadow-comic-lg disabled:opacity-40"
            >
              START CUSTOM WORKOUT
            </button>
            <p className="mt-2 text-center font-condensed text-xs uppercase text-muted-foreground">Stretches auto-appended for the muscles you used.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TOURNAMENTS — cycle-based, hides future entries
   ========================================================= */
function Tournaments({ myUserId, onBack }: { myUserId: string; onBack: () => void }) {
  const currentCycle = cyclesSinceAnchor();
  const [selectedCycle, setSelectedCycle] = useState<number>(currentCycle);
  const rows = useLeaderboard(selectedCycle);
  const tIdx = tournamentIndexForCycle(selectedCycle);
  const t = TOURNAMENTS[tIdx];
  const win = tournamentWindowForCycle(selectedCycle);
  const isCurrent = selectedCycle === currentCycle;

  // Cycles the user is allowed to see: 0..currentCycle. Show most recent first.
  const visibleCycles = useMemo(() => {
    const out: number[] = [];
    for (let c = currentCycle; c >= 0; c--) out.push(c);
    return out;
  }, [currentCycle]);

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <button onClick={onBack} className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary">← Home</button>
        <h1 className="mt-2 font-display text-5xl text-primary text-stroke-black">🏆 TOURNAMENTS</h1>
        <p className="mt-1 text-foreground/80">A new challenge every 2 weeks. Only current & past tournaments are visible — future ones are a surprise!</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {visibleCycles.map((c) => {
            const idx = tournamentIndexForCycle(c);
            const w = tournamentWindowForCycle(c);
            const label = `${w.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
            return (
              <button key={c} onClick={() => setSelectedCycle(c)} className={`rounded-lg border-2 px-3 py-1 font-condensed text-xs font-black uppercase ${selectedCycle === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                {label}{c === currentCycle ? " · LIVE" : ""}{c !== currentCycle ? "" : ""}
                <span className="ml-1 opacity-70">#{idx + 1}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border-2 border-primary bg-card p-5 shadow-comic-lg">
          <div className="font-condensed text-xs font-black uppercase tracking-widest text-secondary">
            {isCurrent ? "LIVE — ENDS " + win.end.toLocaleDateString() : "ENDED " + win.end.toLocaleDateString()}
          </div>
          <h2 className="mt-1 font-display text-3xl text-primary">{t.name}</h2>
          <p className="mt-2 text-foreground/90">{t.description}</p>
          <div className="mt-2 font-condensed text-xs italic text-muted-foreground">Ties broken by highest difficulty completed. Only your activity within this tournament counts.</div>
        </div>

        <div className="mt-5 rounded-xl border-2 border-border bg-card">
          <div className="border-b-2 border-border p-3 font-display text-2xl text-foreground">LEADERBOARD</div>
          {rows == null ? (
            <div className="p-4 text-center text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Nobody's signed up yet. Be the first!</div>
          ) : (
            <div>
              {rows.map((r, i) => (
                <div key={r.user_id} className={`flex items-center justify-between border-b border-border p-3 ${r.user_id === myUserId ? "bg-primary/10" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-lg ${i === 0 ? "bg-primary text-primary-foreground" : i < 3 ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground"}`}>{i + 1}</span>
                    <span className="font-display text-lg text-foreground">@{r.username}{r.user_id === myUserId ? " (you)" : ""}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl text-primary">{r.score}</div>
                    <div className="font-condensed text-[10px] uppercase text-muted-foreground">{t.scoreLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TROPHIES
   ========================================================= */
function Trophies({ stats, myUserId, onBack }: { stats: ReturnType<typeof useStats>; myUserId: string; onBack: () => void }) {
  const [tournamentWins, setTournamentWins] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const currentCycle = cyclesSinceAnchor();
      const cycles = Array.from({ length: currentCycle }, (_, c) => c);
      const results = await Promise.all(cycles.map((c) => fetchLeaderboard(c)));
      const wins = new Set<string>();
      results.forEach((rows, c) => {
        if (rows.length && rows[0].user_id === myUserId && rows[0].score > 0) {
          wins.add(TOURNAMENTS[tournamentIndexForCycle(c)].id);
        }
      });
      setTournamentWins(wins);
    })();
  }, [myUserId]);

  const unlockedIds = useMemo(() => {
    const s = new Set<string>();
    for (const n of STREAK_MILESTONES) if (stats.streak >= n) s.add(`streak-${n}`);
    for (const n of WORKOUT_MILESTONES) if (stats.totalWorkouts >= n) s.add(`workouts-${n}`);
    for (const d of DIFFICULTIES) for (const n of DIFFICULTY_MILESTONES) {
      if ((stats.perDifficulty[d.id] ?? 0) >= n) s.add(`diff-${d.id}-${n}`);
    }
    for (const id of tournamentWins) s.add(`tournament-${id}`);
    return s;
  }, [stats, tournamentWins]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof ALL_TROPHIES> = { streak: [], workouts: [], difficulty: [], tournament: [] };
    for (const t of ALL_TROPHIES) g[t.category].push(t);
    return g;
  }, []);

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-4xl">
        <button onClick={onBack} className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary">← Home</button>
        <h1 className="mt-2 font-display text-5xl text-primary text-stroke-black">🏅 TROPHY CASE</h1>
        <p className="mt-1 text-foreground/80">Unlocked: <b>{unlockedIds.size}</b> / {ALL_TROPHIES.length}</p>

        {(["streak", "workouts", "difficulty", "tournament"] as const).map((cat) => (
          <div key={cat} className="mt-6">
            <h2 className="font-display text-3xl text-foreground">
              {cat === "streak" ? "🔥 STREAK" : cat === "workouts" ? "🎖️ WORKOUTS COMPLETED" : cat === "difficulty" ? "💪 DIFFICULTY" : "🏆 TOURNAMENT"}
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {grouped[cat].map((t) => {
                const on = unlockedIds.has(t.id);
                return (
                  <div key={t.id} className={`rounded-xl border-2 p-3 text-center transition-transform ${on ? "border-primary bg-primary/10 shadow-comic" : "border-border bg-card opacity-50 grayscale"}`}>
                    <div className="text-4xl">{t.emoji}</div>
                    <div className="mt-1 font-display text-sm leading-tight text-foreground">{t.name}</div>
                    <div className="mt-1 font-condensed text-[10px] uppercase text-muted-foreground">{on ? "UNLOCKED" : "LOCKED"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   PREFERENCES
   ========================================================= */
function Preferences({ excluded, exerciseDifficulty, onSave, onSaveExerciseDifficulty, onBack }: {
  excluded: string[];
  exerciseDifficulty: ExerciseDifficultyMap;
  onSave: (next: string[]) => void;
  onSaveExerciseDifficulty: (next: ExerciseDifficultyMap) => void;
  onBack: () => void;
}) {
  const [local, setLocal] = useState<string[]>(excluded);
  const [localDiff, setLocalDiff] = useState<ExerciseDifficultyMap>(exerciseDifficulty);
  const [notifPrefs, setNotifPrefs] = useState(() => (typeof window !== "undefined" ? loadNotifPrefs() : { streak: true, tournaments: true, rewards: true, asked: false }));
  useEffect(() => setLocal(excluded), [excluded]);
  useEffect(() => setLocalDiff(exerciseDifficulty), [exerciseDifficulty]);
  const toggle = (id: string) => setLocal((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const setDiff = (id: string, v: number) => setLocalDiff((m) => {
    const next = { ...m };
    if (v === 0) delete next[id]; else next[id] = v;
    return next;
  });
  const all = Object.values(ALL_EXERCISES).filter((e) => !e.id.startsWith("stretch."));

  const permission = typeof Notification !== "undefined" ? Notification.permission : "denied";

  const DIFF_OPTS: { v: number; label: string; short: string }[] = [
    { v: -2, label: "REALLY EASY", short: "R.EASY" },
    { v: -1, label: "EASY", short: "EASY" },
    { v: 0, label: "NORMAL", short: "NORMAL" },
    { v: 1, label: "HARD", short: "HARD" },
    { v: 2, label: "REALLY HARD", short: "R.HARD" },
  ];

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <button onClick={onBack} className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary">← Home</button>
        <h1 className="mt-2 font-display text-5xl text-primary text-stroke-black">⚙️ PREFERENCES</h1>

        <div className="mt-4 rounded-xl border-2 border-secondary bg-secondary/5 p-4">
          <h2 className="font-display text-2xl text-secondary">🔔 NOTIFICATIONS</h2>
          <div className="mt-2 font-condensed text-xs uppercase text-muted-foreground">
            Browser permission: <b>{permission}</b>
          </div>
          {permission !== "granted" && (
            <button
              onClick={async () => { await askForPermission(); const p = loadNotifPrefs(); saveNotifPrefs({ ...p, asked: true }); setNotifPrefs({ ...p, asked: true }); }}
              className="mt-2 rounded-lg bg-secondary px-3 py-2 font-condensed text-sm font-black uppercase text-secondary-foreground"
            >
              ENABLE NOTIFICATIONS
            </button>
          )}
          <div className="mt-3 space-y-2">
            {(["streak", "tournaments", "rewards"] as const).map((k) => (
              <label key={k} className="flex items-center gap-2 font-condensed text-sm">
                <input
                  type="checkbox"
                  checked={notifPrefs[k]}
                  onChange={(e) => {
                    const next = { ...notifPrefs, [k]: e.target.checked };
                    setNotifPrefs(next); saveNotifPrefs(next);
                  }}
                />
                <span className="font-black uppercase">
                  {k === "streak" ? "Streak reminders (7am, 10am, 12pm, 3pm, 5pm)" : k === "tournaments" ? "Tournament updates" : "Reward unlocks"}
                </span>
              </label>
            ))}
          </div>
        </div>

        <h2 className="mt-6 font-display text-2xl text-foreground">EXERCISE TUNING</h2>
        <p className="mt-1 text-foreground/80">
          Some exercises are easier or harder for you than others. Tap "REALLY EASY" to make an exercise <b>harder</b> for your body, or "REALLY HARD" to make it <b>easier</b>. Or tap the name to exclude it entirely.
        </p>

        <div className="mt-3 rounded-xl border-2 border-border bg-card p-3">
          {all.map((e) => {
            const off = local.includes(e.id);
            const cat = e.id.split(".")[0];
            const cur = localDiff[e.id] ?? 0;
            return (
              <div key={e.id} className={`mb-3 rounded-lg border-2 p-2 ${off ? "border-danger bg-danger/10" : "border-border"}`}>
                <button onClick={() => toggle(e.id)} className="flex w-full items-center gap-3 text-left">
                  <span className="text-2xl">{e.emoji}</span>
                  <span className="flex-1">
                    <div className={`font-display text-lg leading-none ${off ? "text-danger line-through" : "text-foreground"}`}>{e.name}</div>
                    <div className="font-condensed text-xs uppercase text-muted-foreground">
                      {cat}{e.needsPullupBar ? " · pull-up bar" : ""}
                    </div>
                  </span>
                  <span className={`font-condensed text-xs font-black uppercase ${off ? "text-danger" : "text-muted-foreground"}`}>{off ? "EXCLUDED" : "ACTIVE"}</span>
                </button>
                {!off && (
                  <div className="mt-2 grid grid-cols-5 gap-1">
                    {DIFF_OPTS.map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setDiff(e.id, o.v)}
                        className={`rounded border-2 px-1 py-1 font-condensed text-[10px] font-black uppercase leading-tight ${cur === o.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}
                        title={o.label}
                      >
                        {o.short}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-3 pb-16">
          <button onClick={() => { onSave(local); onSaveExerciseDifficulty(localDiff); onBack(); }} className="flex-1 rounded-xl bg-primary py-4 font-display text-2xl text-primary-foreground shadow-comic-lg">SAVE</button>
          <button onClick={onBack} className="rounded-xl border-2 border-border bg-card px-6 font-display text-xl text-foreground">CANCEL</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MOMMY'S SPECIAL COURSE ❤️  — 30-day progressive regimen (light green theme)
   ========================================================= */
function useMommyState(userId: string) {
  const [progress, setProgress] = useState<MommyProgress | null>(() => loadMommyProgress(userId));
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    const existing = loadMommyProgress(userId);
    if (!existing) return;
    // If more than 1 day has passed since last completion, reset.
    const checked = checkMommyStreak(userId, existing);
    if (checked !== existing) setBroken(true);
    setProgress(checked);
  }, [userId]);
  const begin = () => { const p = newMommyProgress(); saveMommyProgress(userId, p); setProgress(p); setBroken(false); };
  const nudge = (delta: number) => {
    setProgress((p) => {
      if (!p) return p;
      const next = { ...p, levelOffset: Math.max(-3, Math.min(3, p.levelOffset + delta)) };
      saveMommyProgress(userId, next);
      return next;
    });
  };
  const complete = () => {
    setProgress((p) => (p ? completeMommyDay(userId, p) : p));
  };
  const restart = () => { resetMommyProgress(userId); begin(); };
  return { progress, broken, begin, nudge, complete, restart };
}

function MommyHome({ userId, onBack, onStartDay }: { userId: string; onBack: () => void; onStartDay: () => void }) {
  const { progress, broken, begin, restart, complete } = useMommyState(userId);
  return (
    <div className="mommy-theme min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <button onClick={onBack} className="font-condensed text-sm font-bold uppercase text-mommy-muted hover:text-mommy-primary">← Back to Kex world</button>
        <div className="mt-4 rounded-3xl border-4 border-mommy-primary bg-mommy-card p-4 shadow-mommy">
          <img src={mommyTrainer.url} alt="Mommy's Special Course" className="w-full rounded-2xl" />
        </div>
        <h1 className="mt-6 font-display text-5xl text-mommy-primary">
          MOMMY'S SPECIAL COURSE <span>❤️</span>
        </h1>
        <p className="mt-2 text-mommy-fg/90">
          A gentle, 30-day progressive plan just for you. Every 3rd day is a rest day. Bring your 5&nbsp;lb and 8&nbsp;lb weights.
        </p>
        <div className="mt-3 rounded-2xl border-2 border-mommy-primary bg-mommy-primary/10 p-3 text-sm text-mommy-fg">
          <b>Streak matters:</b> if you miss more than one day, the plan restarts from Day 1. Kex is watching. Politely.
        </div>

        {broken && (
          <div className="mt-4 rounded-2xl border-2 border-mommy-danger bg-mommy-danger/10 p-4 text-mommy-fg">
            <div className="font-display text-2xl text-mommy-danger">Streak broken 💔</div>
            <p className="mt-1 text-sm">More than a day slipped by, so your plan restarted at Day 1. Fresh start!</p>
          </div>
        )}

        {!progress ? (
          <button
            onClick={begin}
            className="mt-8 w-full rounded-2xl bg-mommy-primary py-5 font-display text-3xl text-white shadow-mommy"
          >
            BEGIN THE 30-DAY JOURNEY
          </button>
        ) : (
          <MommyPlanView progress={progress} onStartDay={onStartDay} onRestart={restart} onCompleteRest={complete} />
        )}
      </div>
    </div>
  );
}

function MommyPlanView({ progress, onStartDay, onRestart, onCompleteRest }: { progress: MommyProgress; onStartDay: () => void; onRestart: () => void; onCompleteRest: () => void }) {
  const plan = useMemo(() => buildMommyPlan(progress.levelOffset), [progress.levelOffset]);
  const today = plan[Math.min(progress.currentDay, plan.length) - 1];
  return (
    <>
      <div className="mt-6 rounded-2xl border-2 border-mommy-primary bg-mommy-card p-4">
        <div className="font-condensed text-xs font-black uppercase tracking-widest text-mommy-primary">
          Day {progress.currentDay} of 30 · Level offset {progress.levelOffset >= 0 ? "+" : ""}{progress.levelOffset}
        </div>
        {today.kind === "rest" ? (
          <>
            <h2 className="mt-1 font-display text-3xl text-mommy-primary">REST DAY 🌷</h2>
            <p className="mt-1 text-mommy-fg/90">{today.note}</p>
            <p className="mt-2 text-sm text-mommy-muted">Tap "mark rest day complete" to keep your streak alive.</p>
            <button
              onClick={onCompleteRest}
              className="mt-4 w-full rounded-2xl bg-mommy-primary py-4 font-display text-2xl text-white shadow-mommy"
            >
              MARK REST DAY COMPLETE ✓
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-1 font-display text-3xl text-mommy-primary">{today.title}</h2>
            <p className="mt-1 text-mommy-fg/90 italic">"{today.flavor}"</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {today.exercises.map((ex) => (
                <div key={ex.id} className="rounded-xl border-2 border-mommy-border bg-white/60 p-2 text-sm text-mommy-fg">
                  <span className="mr-1">{ex.emoji}</span>
                  <b>{ex.name}</b>
                  <div className="text-xs text-mommy-muted">{ex.amount} {ex.unit}</div>
                </div>
              ))}
            </div>
            <button
              onClick={onStartDay}
              className="mt-4 w-full rounded-2xl bg-mommy-primary py-4 font-display text-2xl text-white shadow-mommy"
            >
              START DAY {progress.currentDay} ▶
            </button>
          </>
        )}
      </div>


      <div className="mt-4 flex justify-end pb-16">
        <button onClick={onRestart} className="rounded-lg border-2 border-mommy-border bg-mommy-card px-3 py-2 font-condensed text-xs font-black uppercase text-mommy-muted">
          Restart plan
        </button>
      </div>
    </>
  );
}

function MommyWorkout({ userId, onExit, onDone }: { userId: string; onExit: () => void; onDone: () => void }) {
  const { progress, complete, nudge } = useMommyState(userId);
  const plan = useMemo(() => (progress ? buildMommyPlan(progress.levelOffset) : []), [progress]);
  const day: MommyDay | undefined = progress ? plan[Math.min(progress.currentDay, plan.length) - 1] : undefined;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => { setPhase("idle"); setCountdown(3); setRemaining(null); }, [idx]);
  useEffect(() => {
    if (phase !== "ready") return;
    if (countdown <= 0) {
      if (day?.kind === "workout") {
        const it = day.exercises[idx];
        const total = it.unit === "min" ? it.amount * 60 : it.amount;
        setRemaining(total); setPhase("running"); return;
      }
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown]);
  useEffect(() => {
    if (phase !== "running" || remaining == null) return;
    if (remaining <= 0) { setPhase("idle"); setRemaining(null); setIdx((i) => i + 1); return; }
    const t = setTimeout(() => setRemaining((r) => (r == null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [phase, remaining]);

  if (!progress || !day) {
    return <div className="mommy-theme min-h-screen p-6 text-mommy-fg">Loading…</div>;
  }

  if (day.kind === "rest") {
    // Rest days are completed from MommyHome directly; if we somehow land here, just bounce back.
    return (
      <div className="mommy-theme min-h-screen px-5 py-6">
        <div className="mx-auto max-w-md rounded-2xl border-4 border-mommy-primary bg-mommy-card p-6 text-center shadow-mommy">
          <div className="text-6xl">🌷</div>
          <h1 className="mt-2 font-display text-4xl text-mommy-primary">REST DAY</h1>
          <p className="mt-2 text-mommy-fg/90">{day.note}</p>
          <button
            onClick={onDone}
            className="mt-6 w-full rounded-2xl bg-mommy-primary py-4 font-display text-2xl text-white shadow-mommy"
          >
            BACK TO PLAN
          </button>
        </div>
      </div>
    );
  }

  const isDone = idx >= day.exercises.length || finished;

  if (isDone) {
    return (
      <div className="mommy-theme min-h-screen px-5 py-6">
        <div className="mx-auto max-w-md rounded-2xl border-4 border-mommy-primary bg-mommy-card p-6 text-center shadow-mommy">
          <div className="text-6xl">🌸</div>
          <h1 className="mt-2 font-display text-4xl text-mommy-primary">DAY {progress.currentDay} DONE</h1>
          <p className="mt-2 text-mommy-fg/90">You showed up. Amazing.</p>
          <p className="mt-1 text-xs text-mommy-muted">Tell us how it felt — TOO EASY or TOO HARD will adjust future workouts and let you re-do today at the new level.</p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={() => { nudge(1); notifyReward("💗 Mommy plan boosted", "Kicked your plan up a notch — today will restart at the new level."); onDone(); }}
              className="rounded-xl border-2 border-mommy-primary bg-mommy-primary py-3 font-display text-lg text-white"
            >
              TOO EASY? ⬆️
            </button>
            <button
              onClick={() => { nudge(-1); notifyReward("💗 Mommy plan eased", "Dialed it back — today will restart at the new level."); onDone(); }}
              className="rounded-xl border-2 border-mommy-primary bg-white py-3 font-display text-lg text-mommy-primary"
            >
              TOO HARD? ⬇️
            </button>
          </div>
          <button
            onClick={() => { complete(); onDone(); }}
            className="mt-3 w-full rounded-xl border-2 border-mommy-border bg-mommy-card py-3 font-display text-lg text-mommy-fg"
          >
            JUST RIGHT — ADVANCE ✓
          </button>
        </div>
      </div>
    );
  }


  const item = day.exercises[idx];
  const isTimed = item.unit === "sec" || item.unit === "min";
  const totalSec = item.unit === "min" ? item.amount * 60 : item.amount;

  return (
    <div className="mommy-theme min-h-screen px-5 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="font-condensed text-xs uppercase text-mommy-muted">← Quit</button>
          <div className="text-center">
            <div className="font-display text-xl text-mommy-primary leading-none">{day.title}</div>
            <div className="font-condensed text-xs uppercase text-mommy-muted">Mommy's Course · Day {progress.currentDay}</div>
          </div>
          <div className="font-condensed text-xs font-black text-mommy-fg">{idx + 1} / {day.exercises.length}</div>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-mommy-muted/30">
          <div className="h-full bg-mommy-primary" style={{ width: `${(idx / day.exercises.length) * 100}%` }} />
        </div>

        {phase === "ready" && (
          <div className="mt-6 rounded-2xl border-4 border-mommy-primary bg-white/70 p-8 text-center">
            <div className="font-condensed text-lg font-black uppercase text-mommy-primary">GET READY!</div>
            <div className="font-display text-[24vw] leading-none text-mommy-primary md:text-[180px]">
              {countdown > 0 ? countdown : "GO!"}
            </div>
          </div>
        )}

        <div className={`mt-6 rounded-2xl border-2 border-mommy-primary bg-mommy-card p-5 ${phase === "ready" ? "opacity-40" : ""}`}>
          <h1 className="font-display text-4xl text-mommy-primary">{item.emoji} {item.name}</h1>
          {item.usesWeights && (
            <div className="mt-2 inline-block rounded-full bg-mommy-accent px-3 py-1 font-condensed text-xs font-black uppercase text-white">
              🏋️ {item.usesWeights} lb weights
            </div>
          )}
          <div className="mt-4 inline-block rounded-xl border-2 border-mommy-primary bg-white px-6 py-3">
            <div className="font-display text-5xl text-mommy-primary">
              {isTimed && phase === "running" && remaining != null
                ? formatTime(remaining)
                : isTimed ? formatTime(totalSec) : item.amount}
            </div>
            <div className="font-condensed text-xs font-black uppercase text-mommy-muted">
              {isTimed && phase === "running" ? "TIME LEFT" : item.unit === "reps" ? "REPS" : item.unit === "sec" ? "SECONDS" : "MINUTES"}
            </div>
          </div>
          <div className="mt-4 rounded-xl border-2 border-mommy-border bg-white/60 p-4">
            <div className="font-display text-lg text-mommy-fg">How to do it</div>
            <ol className="mt-2 space-y-1 text-sm">
              {item.how.map((step, i) => (
                <li key={i}>{i + 1}. {step}</li>
              ))}
            </ol>
          </div>
          <div className="mt-3 rounded-xl border-2 border-mommy-accent bg-mommy-accent/10 p-3 text-sm text-mommy-fg italic">
            {item.note}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 pb-16">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0 || phase !== "idle"} className="rounded-xl border-2 border-mommy-border bg-white px-4 py-3 font-display text-xl text-mommy-fg disabled:opacity-40">← BACK</button>
          {isTimed ? (
            phase === "running" ? (
              <button onClick={() => { setPhase("idle"); setRemaining(null); }} className="flex-1 rounded-xl bg-mommy-danger px-5 py-4 font-display text-2xl text-white">STOP TIMER</button>
            ) : phase === "ready" ? (
              <button onClick={() => { setPhase("idle"); setCountdown(3); }} className="flex-1 rounded-xl bg-mommy-danger px-5 py-4 font-display text-2xl text-white">CANCEL</button>
            ) : (
              <button onClick={() => { setCountdown(3); setPhase("ready"); }} className="flex-1 rounded-xl bg-mommy-primary px-5 py-4 font-display text-2xl text-white">START ⏱️</button>
            )
          ) : (
            <button onClick={() => { if (idx === day.exercises.length - 1) setFinished(true); else setIdx((i) => i + 1); }} className="flex-1 rounded-xl bg-mommy-primary px-5 py-4 font-display text-2xl text-white">
              {idx === day.exercises.length - 1 ? "FINISH 💗" : "DONE — NEXT →"}
            </button>
          )}
          {isTimed && phase !== "ready" && (
            <button onClick={() => { setPhase("idle"); setRemaining(null); setIdx((i) => i + 1); }} className="rounded-xl border-2 border-mommy-border bg-white px-3 py-3 font-condensed text-xs font-black uppercase text-mommy-fg">SKIP</button>
          )}
        </div>
      </div>
    </div>
  );
}
