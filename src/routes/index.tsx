import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import trainer1 from "@/assets/VideoCapture_20260717-074024.jpg.asset.json";
import trainer2 from "@/assets/VideoCapture_20260717-074031.jpg.asset.json";
import trainer3 from "@/assets/VideoCapture_20260717-074038.jpg.asset.json";
import trainer4 from "@/assets/VideoCapture_20260717-074041.jpg.asset.json";
import trainer5 from "@/assets/VideoCapture_20260717-074044.jpg.asset.json";
import legsTrainer from "@/assets/legs-trainer.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { kexSignup, kexSignin } from "@/lib/kex-auth.functions";
import {
  ALL_EXERCISES, ALL_TROPHIES, CORE, DIFFICULTIES, DIFFICULTY_MILESTONES, LEGS,
  STREAK_MILESTONES, TOURNAMENTS, UPPER, WORKOUT_MILESTONES, WORKOUTS,
  currentTournamentIndex, tournamentWindow,
  type Category, type DifficultyId, type Exercise,
} from "@/lib/kex-data";
import {
  fetchLeaderboard, scaleAmount, summarizeWorkout, useLeaderboard,
  useMyLogs, useMyPreferences, useProfile, useSession, useStats,
} from "@/lib/kex-store";

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

type Screen = "intro" | "auth" | "home" | "workout" | "custom" | "tournaments" | "trophies" | "prefs";
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
};

/* =========================================================
   ROOT
   ========================================================= */
function App() {
  const { ready, userId } = useSession();
  const profile = useProfile(userId);
  const [screen, setScreen] = useState<Screen>("intro");
  const [session, setSession] = useState<Session | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const logs = useMyLogs(userId, refreshKey);
  const stats = useStats(logs);
  const { excluded, save: savePrefs } = useMyPreferences(userId);

  // Once we know the auth state, auto-route: signed in => home, else => intro
  useEffect(() => {
    if (!ready) return;
    if (userId) setScreen((s) => (s === "intro" || s === "auth" ? "home" : s));
    else setScreen((s) => (s === "home" || s === "workout" || s === "custom" || s === "tournaments" || s === "trophies" || s === "prefs" ? "intro" : s));
  }, [ready, userId]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center font-display text-3xl text-primary">LOADING KEX…</div>;
  }

  const startBuiltWorkout = (category: Category, difficulty: DifficultyId) => {
    const w = WORKOUTS[category];
    // filter routines with no allowed exercises after exclusions
    const usable = w.routines.map((r) => ({
      r,
      ids: r.exerciseIds.filter((id) => !excluded.includes(id)),
    })).filter((x) => x.ids.length >= 3);
    const pick = usable.length ? usable[Math.floor(Math.random() * usable.length)] : {
      r: w.routines[0], ids: w.routines[0].exerciseIds,
    };
    const items: WorkoutItem[] = pick.ids.map((id) => {
      const meta = findExerciseById(id)!;
      return { id, meta, unit: meta.unit, amount: scaleAmount(meta.base, DIFFICULTIES[difficulty].mult) };
    });
    setSession({ category, difficulty, routineName: pick.r.name, flavor: pick.r.flavor, isCustom: false, items });
    setScreen("workout");
  };

  const startCustomWorkout = (difficulty: DifficultyId, ids: string[]) => {
    const items: WorkoutItem[] = ids.map((id) => {
      const meta = findExerciseById(id)!;
      return { id, meta, unit: meta.unit, amount: scaleAmount(meta.base, DIFFICULTIES[difficulty].mult) };
    });
    setSession({ category: "custom", difficulty, routineName: "CUSTOM CHAOS", flavor: "You picked this. Kex is amused.", isCustom: true, items });
    setScreen("workout");
  };

  const completeWorkout = async () => {
    if (!session || !userId) { setScreen("home"); return; }
    const exercisesJson = session.items.map((i) => ({ id: i.id, amount: i.amount, unit: i.unit }));
    const { plankSeconds, pullupReps } = summarizeWorkout(exercisesJson);
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
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {screen === "intro" && <Intro onStart={() => setScreen("auth")} />}
      {screen === "auth" && <Auth onDone={() => setScreen("home")} onBack={() => setScreen("intro")} />}
      {screen === "home" && profile && (
        <Home
          profile={profile}
          stats={stats}
          onStart={startBuiltWorkout}
          onCustom={() => setScreen("custom")}
          onTournaments={() => setScreen("tournaments")}
          onTrophies={() => setScreen("trophies")}
          onPrefs={() => setScreen("prefs")}
          onSignOut={async () => { await supabase.auth.signOut(); setScreen("intro"); }}
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
      {screen === "prefs" && <Preferences excluded={excluded} onSave={savePrefs} onBack={() => setScreen("home")} />}
    </div>
  );
}

function findExerciseById(id: string): Exercise | undefined {
  const parts = id.split(".");
  return ALL_EXERCISES[parts[1]] ?? Object.values(ALL_EXERCISES).find((e) => e.id === id);
}

/* =========================================================
   INTRO
   ========================================================= */
function Intro({ onStart }: { onStart: () => void }) {
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
          <FeatureRow n="1" title="Three courses">
            The main event is my <b>Beast Six Pack Core Program</b>. Side quests for upper body and legs are available for people who want to be balanced, I guess.
          </FeatureRow>
          <FeatureRow n="2" title="Six difficulty levels">
            From <b>ZERO MUSCLES KEX</b> (you were born yesterday) all the way up to <b>BOOMBAKRAXIN KEX</b> (do not attempt without a signed waiver).
          </FeatureRow>
          <FeatureRow n="3" title="A whole vault of workouts">
            Every time you press START, I roll the dice and hand you a fresh routine. You never memorize your way out of leg day.
          </FeatureRow>
          <FeatureRow n="4" title="Tournaments, trophies, streaks">
            Sign in with a username and I track everything — your workout streak, all your trophies, and every 2 weeks I run a new tournament where everyone competes.
          </FeatureRow>
          <FeatureRow n="5" title="How ripped, how fast?">
            Follow my program 5 days a week. In <b>6 weeks</b> "friends notice." In <b>12 weeks</b> "abs at the beach." In <b>26 weeks</b> "small children fear you at the grocery store."
          </FeatureRow>
        </div>
        <div className="mt-12 flex justify-center">
          <button onClick={onStart} className="group relative rotate-[-1deg] rounded-2xl bg-primary px-10 py-5 font-display text-4xl md:text-6xl text-primary-foreground shadow-comic-lg transition-transform hover:rotate-0 hover:scale-105 active:translate-x-1 active:translate-y-1">
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
   AUTH  (username-only)
   ========================================================= */
function Auth({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
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
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something exploded.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen px-5 py-10">
      <div className="mx-auto max-w-md">
        <button onClick={onBack} className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary">← Back</button>
        <div className="mt-6 rounded-2xl border-4 border-primary bg-card p-6 shadow-comic-lg">
          <h1 className="font-display text-5xl text-primary text-stroke-black">
            {mode === "signup" ? "JOIN THE GAINS" : "WELCOME BACK"}
          </h1>
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
      </div>
    </div>
  );
}

/* =========================================================
   HOME
   ========================================================= */
function Home({
  profile, stats, onStart, onCustom, onTournaments, onTrophies, onPrefs, onSignOut,
}: {
  profile: { username: string };
  stats: ReturnType<typeof useStats>;
  onStart: (c: Category, d: DifficultyId) => void;
  onCustom: () => void;
  onTournaments: () => void;
  onTrophies: () => void;
  onPrefs: () => void;
  onSignOut: () => void;
}) {
  const [category, setCategory] = useState<Category>("core");
  const [difficulty, setDifficulty] = useState<DifficultyId>(3);
  return (
    <div className="relative min-h-screen px-5 py-6">
      <div className="mx-auto max-w-5xl">
        <TopBar profile={profile} onSignOut={onSignOut} />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <NavBtn label="TOURNAMENTS" emoji="🏆" onClick={onTournaments} />
          <NavBtn label="TROPHIES" emoji="🏅" onClick={onTrophies} />
          <NavBtn label="CUSTOM" emoji="🛠️" onClick={onCustom} />
          <NavBtn label="PREFERENCES" emoji="⚙️" onClick={onPrefs} />
        </div>

        <StatsStrip stats={stats} />

        <h2 className="mt-8 font-display text-5xl md:text-6xl text-foreground">
          Pick your <span className="text-secondary">poison</span>.
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <CategoryCard title="CORE" subtitle="The main event" emoji="🔥" img={CATEGORY_IMG.core} selected={category === "core"} onSelect={() => setCategory("core")} badge="★ MAIN COURSE" />
          <CategoryCard title="UPPER BODY" subtitle="Side quest" emoji="💪" img={CATEGORY_IMG.upper} selected={category === "upper"} onSelect={() => setCategory("upper")} />
          <CategoryCard title="LEGS" subtitle="Do not skip" emoji="🦵" img={CATEGORY_IMG.legs} selected={category === "legs"} onSelect={() => setCategory("legs")} />
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
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="font-display text-4xl text-primary text-stroke-black">{emoji} {title}</div>
          <div className="font-condensed text-sm font-bold uppercase text-foreground/90">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   WORKOUT
   ========================================================= */
function Workout({ session, onExit, onFinish }: { session: Session; onExit: () => void; onFinish: () => void }) {
  const [idx, setIdx] = useState(0);
  const trainerImgs = [trainer1.url, trainer2.url, trainer3.url, trainer4.url, trainer5.url];
  const done = idx >= session.items.length;
  const [remaining, setRemaining] = useState<number | null>(null); // seconds
  const [running, setRunning] = useState(false);
  const diff = DIFFICULTIES[session.difficulty];

  useEffect(() => {
    // reset timer when moving between exercises
    setRemaining(null);
    setRunning(false);
  }, [idx]);

  useEffect(() => {
    if (!running || remaining == null) return;
    if (remaining <= 0) {
      setRunning(false);
      setIdx((i) => i + 1);
      return;
    }
    const t = setTimeout(() => setRemaining((r) => (r == null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [running, remaining]);

  useEffect(() => {
    if (done) { onFinish(); }
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
  const unitLabel = item.unit === "reps" ? "REPS" : item.unit === "sec" ? "SECONDS" : "MINUTES";
  const trainerImg = trainerImgs[idx % trainerImgs.length];
  const isTimed = item.unit === "sec" || item.unit === "min";
  const totalSec = item.unit === "min" ? item.amount * 60 : item.amount;
  const displaySec = remaining ?? totalSec;

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary">← Quit</button>
          <div className="text-center">
            <div className="font-display text-xl text-primary leading-none">{session.routineName}</div>
            <div className="font-condensed text-xs uppercase text-muted-foreground">
              {session.category === "custom" ? "CUSTOM" : WORKOUTS[session.category].title} · {diff.name}
            </div>
          </div>
          <div className="font-condensed text-sm font-black text-foreground">{idx + 1} / {session.items.length}</div>
        </div>

        <div className="mt-2 text-center font-condensed text-xs italic text-secondary">"{session.flavor}"</div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${(idx / session.items.length) * 100}%` }} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.2fr]">
          <div className="relative">
            <img src={trainerImg} alt="Kex demonstrating" className="w-full rounded-2xl border-4 border-primary shadow-comic-lg" />
            <div className="absolute -bottom-4 -right-4 rotate-[-4deg] rounded-lg bg-secondary px-4 py-3 font-display text-xl text-secondary-foreground shadow-comic">WATCH & LEARN</div>
            {ex.needsPullupBar && (
              <div className="absolute -top-3 -left-3 rotate-[-6deg] rounded-lg bg-accent px-3 py-2 font-condensed text-xs font-black uppercase text-accent-foreground shadow-comic">🪝 Pull-up bar</div>
            )}
          </div>

          <div>
            <div className="font-condensed text-sm font-black uppercase tracking-widest text-secondary">Exercise {idx + 1}</div>
            <h1 className="font-display text-5xl md:text-6xl leading-[0.9] text-primary text-stroke-black">{ex.emoji} {ex.name}</h1>

            <div className="mt-4 inline-block rounded-xl border-2 border-primary bg-card px-6 py-3 shadow-comic">
              <div className="font-display text-6xl leading-none text-primary">
                {isTimed && running ? formatTime(displaySec) : (isTimed ? formatTime(totalSec) : item.amount)}
              </div>
              <div className="font-condensed text-sm font-black uppercase tracking-widest text-muted-foreground">
                {isTimed && running ? "TIME LEFT" : unitLabel}
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
              <div className="font-condensed text-xs font-black uppercase tracking-widest text-secondary">Kex says</div>
              <p className="mt-1 italic text-foreground/90">"{ex.kexNote}"</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 pb-16">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0 || running} className="rounded-xl border-2 border-border bg-card px-5 py-3 font-display text-2xl text-foreground disabled:opacity-40">← BACK</button>
          {isTimed ? (
            running ? (
              <button onClick={() => { setRunning(false); setRemaining(null); }} className="flex-1 rounded-xl bg-danger px-5 py-4 font-display text-3xl text-white shadow-comic-lg">STOP TIMER</button>
            ) : (
              <button onClick={() => { setRemaining(totalSec); setRunning(true); }} className="flex-1 rounded-xl bg-primary px-5 py-4 font-display text-3xl text-primary-foreground shadow-comic-lg">START EXERCISE ⏱️</button>
            )
          ) : (
            <button onClick={() => setIdx((i) => i + 1)} className="flex-1 rounded-xl bg-primary px-5 py-4 font-display text-3xl text-primary-foreground shadow-comic-lg">
              {idx === session.items.length - 1 ? "FINISH 🏆" : "DONE — NEXT →"}
            </button>
          )}
          {isTimed && (
            <button onClick={() => setIdx((i) => i + 1)} className="rounded-xl border-2 border-border bg-card px-4 py-3 font-condensed text-xs font-black uppercase text-foreground">SKIP</button>
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
    const all = Object.values(ALL_EXERCISES);
    let filtered = all;
    if (filter === "core") filtered = Object.values(CORE);
    else if (filter === "upper") filtered = Object.values(UPPER);
    else if (filter === "legs") filtered = Object.values(LEGS);
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
        <p className="mt-1 text-foreground/80">Pick exercises. Pick a difficulty. Kex will scale the numbers for you.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["all", "core", "upper", "legs", "pullup"] as const).map((f) => (
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
                      <div className="font-condensed text-xs uppercase text-muted-foreground">{e.base} {e.unit}{e.needsPullupBar ? " · pull-up bar" : ""}</div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TOURNAMENTS
   ========================================================= */
function Tournaments({ myUserId, onBack }: { myUserId: string; onBack: () => void }) {
  const [selectedIdx, setSelectedIdx] = useState<number>(currentTournamentIndex());
  const rows = useLeaderboard(selectedIdx);
  const t = TOURNAMENTS[selectedIdx];
  const win = tournamentWindow(selectedIdx);
  const isCurrent = selectedIdx === currentTournamentIndex();

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <button onClick={onBack} className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary">← Home</button>
        <h1 className="mt-2 font-display text-5xl text-primary text-stroke-black">🏆 TOURNAMENTS</h1>
        <p className="mt-1 text-foreground/80">New challenge every 2 weeks. Every user who has signed up is on the leaderboard.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {TOURNAMENTS.map((tt, i) => (
            <button key={tt.id} onClick={() => setSelectedIdx(i)} className={`rounded-lg border-2 px-3 py-1 font-condensed text-xs font-black uppercase ${selectedIdx === i ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
              #{i + 1}{i === currentTournamentIndex() ? " · LIVE" : ""}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-xl border-2 border-primary bg-card p-5 shadow-comic-lg">
          <div className="font-condensed text-xs font-black uppercase tracking-widest text-secondary">
            {isCurrent ? "LIVE — ENDS " + win.end.toLocaleDateString() : "ROTATION #" + (selectedIdx + 1)}
          </div>
          <h2 className="mt-1 font-display text-3xl text-primary">{t.name}</h2>
          <p className="mt-2 text-foreground/90">{t.description}</p>
          <div className="mt-2 font-condensed text-xs italic text-muted-foreground">Ties broken by highest difficulty completed.</div>
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
    // A user has won a tournament if they are #1 in a PAST cycle window with score > 0.
    (async () => {
      const wins = new Set<string>();
      const currentIdx = currentTournamentIndex();
      for (let i = 0; i < TOURNAMENTS.length; i++) {
        const win = tournamentWindow(i);
        if (win.end.getTime() > Date.now()) continue; // not yet ended (current or future)
        // Only past cycles
        if (i === currentIdx) continue;
        const rows = await fetchLeaderboard(i);
        if (rows.length && rows[0].user_id === myUserId && rows[0].score > 0) wins.add(TOURNAMENTS[i].id);
      }
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
function Preferences({ excluded, onSave, onBack }: { excluded: string[]; onSave: (next: string[]) => void; onBack: () => void }) {
  const [local, setLocal] = useState<string[]>(excluded);
  useEffect(() => setLocal(excluded), [excluded]);
  const toggle = (id: string) => setLocal((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const all = Object.values(ALL_EXERCISES);
  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <button onClick={onBack} className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary">← Home</button>
        <h1 className="mt-2 font-display text-5xl text-primary text-stroke-black">⚙️ PREFERENCES</h1>
        <p className="mt-1 text-foreground/80">Tap any exercise to permanently exclude it from your workouts. Kex will pretend it never existed.</p>

        <div className="mt-4 rounded-xl border-2 border-border bg-card p-3">
          {all.map((e) => {
            const off = local.includes(e.id);
            return (
              <button key={e.id} onClick={() => toggle(e.id)} className={`mb-2 flex w-full items-center gap-3 rounded-lg border-2 p-2 text-left ${off ? "border-danger bg-danger/10" : "border-border"}`}>
                <span className="text-2xl">{e.emoji}</span>
                <span className="flex-1">
                  <div className={`font-display text-lg leading-none ${off ? "text-danger line-through" : "text-foreground"}`}>{e.name}</div>
                  <div className="font-condensed text-xs uppercase text-muted-foreground">
                    {e.id.startsWith("core") ? "Core" : e.id.startsWith("upper") ? "Upper" : "Legs"}{e.needsPullupBar ? " · pull-up bar" : ""}
                  </div>
                </span>
                <span className={`font-condensed text-xs font-black uppercase ${off ? "text-danger" : "text-muted-foreground"}`}>{off ? "EXCLUDED" : "ACTIVE"}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex gap-3 pb-16">
          <button onClick={() => { onSave(local); onBack(); }} className="flex-1 rounded-xl bg-primary py-4 font-display text-2xl text-primary-foreground shadow-comic-lg">SAVE</button>
          <button onClick={onBack} className="rounded-xl border-2 border-border bg-card px-6 font-display text-xl text-foreground">CANCEL</button>
        </div>
      </div>
    </div>
  );
}
