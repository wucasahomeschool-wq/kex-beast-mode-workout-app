import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import trainer1 from "@/assets/VideoCapture_20260717-074024.jpg.asset.json";
import trainer2 from "@/assets/VideoCapture_20260717-074031.jpg.asset.json";
import trainer3 from "@/assets/VideoCapture_20260717-074038.jpg.asset.json";
import trainer4 from "@/assets/VideoCapture_20260717-074041.jpg.asset.json";
import trainer5 from "@/assets/VideoCapture_20260717-074044.jpg.asset.json";

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

type Screen = "intro" | "home" | "workout";
type Category = "core" | "upper" | "legs";
type DifficultyId = 0 | 1 | 2 | 3 | 4 | 5;

const DIFFICULTIES: {
  id: DifficultyId;
  name: string;
  tag: string;
  mult: number; // reps/time multiplier vs base
  color: string;
}[] = [
  { id: 0, name: "ZERO MUSCLES KEX", tag: "Just born. Cannot flex.", mult: 0.15, color: "bg-muted text-muted-foreground" },
  { id: 1, name: "WIMPY KEX", tag: "Can lift a spoon.", mult: 0.35, color: "bg-accent text-accent-foreground" },
  { id: 2, name: "AVERAGE KEX", tag: "Normal human. Boring.", mult: 0.6, color: "bg-primary text-primary-foreground" },
  { id: 3, name: "STRONG KEX", tag: "Snaps carrots with pinky.", mult: 1.0, color: "bg-secondary text-secondary-foreground" },
  { id: 4, name: "RIPPED KEX", tag: "Abs visible from space.", mult: 1.75, color: "bg-danger text-white" },
  { id: 5, name: "BOOMBAKRAXIN KEX", tag: "☢️ Do not attempt. Ever.", mult: 3.5, color: "bg-black text-primary border-2 border-primary" },
];

type Exercise = {
  name: string;
  emoji: string;
  base: number; // base reps OR seconds
  unit: "reps" | "sec" | "min";
  how: string[];
  kexNote: string;
};

const WORKOUTS: Record<Category, { title: string; subtitle: string; trainerImg: string; exercises: Exercise[] }> = {
  core: {
    title: "CORE COURSE",
    subtitle: "The Beast Six Pack Program",
    trainerImg: trainer1.url,
    exercises: [
      {
        name: "Plank of Doom",
        emoji: "🧱",
        base: 60,
        unit: "sec",
        how: [
          "Lie face down on the floor.",
          "Prop up on your forearms and toes, elbows under shoulders.",
          "Squeeze your belly button toward your spine.",
          "Keep your body straight like a laser beam. No sagging butts allowed.",
        ],
        kexNote: "Kex holds this for 15 minutes without shivering. You have permission to shiver.",
      },
      {
        name: "Hollow Body Hold",
        emoji: "🥣",
        base: 30,
        unit: "sec",
        how: [
          "Lie on your back, arms overhead.",
          "Press your lower back into the floor — pretend a ninja is trying to slide a pancake under it.",
          "Lift your legs, head, and arms off the floor into a banana shape.",
          "Hold. Do not eat the banana.",
        ],
        kexNote: "Kex can hold this while eating a sandwich with his feet.",
      },
      {
        name: "V-Ups",
        emoji: "🇻",
        base: 20,
        unit: "reps",
        how: [
          "Lie flat on your back, arms stretched overhead.",
          "In one big move, lift your legs AND upper body to touch fingers to toes.",
          "You should look like a folded slice of pizza.",
          "Slowly lower down. Repeat.",
        ],
        kexNote: "Since Kex weighs less than 50 lbs, gravity is basically a suggestion.",
      },
      {
        name: "Toes-to-Sky",
        emoji: "🦶",
        base: 25,
        unit: "reps",
        how: [
          "Lie flat, legs straight up in the air like flagpoles.",
          "Push your toes toward the ceiling by lifting your hips.",
          "Imagine you are stamping a footprint on the moon.",
          "Lower with control.",
        ],
        kexNote: "Kex once put a footprint on the actual ceiling. Landlord not amused.",
      },
      {
        name: "Bicycle Crunches",
        emoji: "🚴",
        base: 40,
        unit: "reps",
        how: [
          "Lie on your back, hands lightly behind your head (do NOT yank your neck).",
          "Bring left elbow to right knee while extending the other leg.",
          "Switch sides like a slow-motion cartoon bicycle.",
        ],
        kexNote: "Kex prefers real bicycles. He does 1000 of these while watching one episode of anything.",
      },
      {
        name: "Dead Bug",
        emoji: "🪳",
        base: 20,
        unit: "reps",
        how: [
          "Lie on your back, arms up, knees bent to 90°.",
          "Slowly lower your right arm and left leg toward the floor without touching.",
          "Return, switch. Do not actually become a dead bug.",
        ],
        kexNote: "Named after Kex's least favorite houseguest.",
      },
    ],
  },
  upper: {
    title: "UPPER BODY SIDE QUEST",
    subtitle: "Arms of Kex Legend",
    trainerImg: trainer2.url,
    exercises: [
      {
        name: "Push-Ups",
        emoji: "💪",
        base: 20,
        unit: "reps",
        how: [
          "Hands under shoulders, body in a straight line.",
          "Lower your chest to almost touch the floor.",
          "Push back up like you're launching yourself into orbit.",
        ],
        kexNote: "Kex does these on one finger. He recommends starting with all ten.",
      },
      {
        name: "Pike Push-Ups",
        emoji: "🔺",
        base: 12,
        unit: "reps",
        how: [
          "Start in downward-dog: butt in the air, hands and feet on the floor.",
          "Bend your elbows to lower the TOP of your head toward the floor.",
          "Push back up. Feel the shoulder burn.",
        ],
        kexNote: "This is Kex's HARD one. He has more trouble because his arms are tiny. Show him mercy.",
      },
      {
        name: "Superman Holds",
        emoji: "🦸",
        base: 30,
        unit: "sec",
        how: [
          "Lie face down. Stretch arms in front, legs behind.",
          "Lift arms, chest, and legs off the floor at the same time.",
          "Fly. But don't actually try to fly out the window.",
        ],
        kexNote: "Kex insists his cape was in the wash.",
      },
      {
        name: "Diamond Push-Ups",
        emoji: "💎",
        base: 10,
        unit: "reps",
        how: [
          "Put your hands together under your chest forming a diamond shape with thumbs and index fingers.",
          "Lower your chest to your hands.",
          "Push up. Triceps will file a complaint.",
        ],
        kexNote: "Harder than regular push-ups. Kex actually struggles a bit on these.",
      },
    ],
  },
  legs: {
    title: "LEG DAY OF DESTINY",
    subtitle: "Do Not Skip. Kex Is Watching.",
    trainerImg: trainer3.url,
    exercises: [
      {
        name: "Bodyweight Squats",
        emoji: "🏋️",
        base: 30,
        unit: "reps",
        how: [
          "Feet shoulder-width apart, toes slightly out.",
          "Sit back like there's an invisible chair.",
          "Lower until thighs are parallel to the floor.",
          "Stand up. Do not sit on the invisible chair. It's fake.",
        ],
        kexNote: "Kex can do 500 while reading a comic book.",
      },
      {
        name: "Lunges",
        emoji: "🚶",
        base: 20,
        unit: "reps",
        how: [
          "Step one leg forward big.",
          "Lower your back knee toward the floor.",
          "Front knee stays over the ankle, not past the toes.",
          "Push back up. Alternate legs.",
        ],
        kexNote: "Count both legs together as reps. Or don't. Kex won't know.",
      },
      {
        name: "Wall Sit",
        emoji: "🧱",
        base: 45,
        unit: "sec",
        how: [
          "Back flat against a wall.",
          "Slide down until your thighs are parallel to the floor.",
          "Pretend you're sitting on a real chair. Suffer.",
        ],
        kexNote: "Kex does this while writing his memoir.",
      },
      {
        name: "Jump Squats",
        emoji: "🦘",
        base: 15,
        unit: "reps",
        how: [
          "Squat down.",
          "Explode UP into a jump.",
          "Land softly, immediately squat again.",
          "Try not to hit the ceiling fan.",
        ],
        kexNote: "Kex once jumped so high he was late for dinner because he was still airborne.",
      },
      {
        name: "Single-Leg Glute Bridge",
        emoji: "🌉",
        base: 12,
        unit: "reps",
        how: [
          "Lie on your back, knees bent.",
          "Lift one leg straight up.",
          "Push through the other heel to raise your hips.",
          "Squeeze your butt like it owes you money. Lower. Switch sides.",
        ],
        kexNote: "This is another one Kex actually finds hard. Solidarity.",
      },
    ],
  },
};

function App() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [category, setCategory] = useState<Category>("core");
  const [difficulty, setDifficulty] = useState<DifficultyId>(3);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {screen === "intro" && <Intro onStart={() => setScreen("home")} />}
      {screen === "home" && (
        <Home
          onStart={(c, d) => {
            setCategory(c);
            setDifficulty(d);
            setScreen("workout");
          }}
          onBack={() => setScreen("intro")}
        />
      )}
      {screen === "workout" && (
        <Workout
          category={category}
          difficulty={difficulty}
          onExit={() => setScreen("home")}
        />
      )}
    </div>
  );
}

/* ---------------- INTRO ---------------- */

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative min-h-screen">
      {/* radiating background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[200vmax] w-[200vmax] bg-zoom-lines" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-10 md:py-16">
        {/* Title */}
        <div className="text-center">
          <div className="inline-block rotate-[-2deg] bg-secondary px-4 py-1 font-condensed text-lg font-black uppercase text-secondary-foreground shadow-comic">
            The world's silliest ab program
          </div>
          <h1
            className="display mt-4 text-[15vw] md:text-[128px] leading-[0.85] text-primary text-stroke-thick"
          >
            GET RIPPED
            <br />
            <span className="inline-block rotate-[-3deg] text-secondary">WITH KEX</span>
          </h1>
        </div>

        {/* Hero image */}
        <div className="relative mx-auto mt-8 w-full max-w-md">
          <div className="animate-pulse-glow rounded-2xl border-4 border-primary bg-card p-2 shadow-comic-lg">
            <img
              src={trainer1.url}
              alt="Kex, your 7-year-old AI trainer, flexing"
              className="w-full rounded-xl"
            />
          </div>
          <div className="absolute -top-6 -right-4 rotate-[8deg] rounded-lg bg-primary px-3 py-2 font-display text-2xl text-primary-foreground shadow-comic">
            50 LBS OF FURY
          </div>
          <div className="absolute -bottom-4 -left-4 rotate-[-6deg] rounded-lg bg-accent px-3 py-2 font-display text-xl text-accent-foreground shadow-comic">
            AGE: 7
          </div>
        </div>

        {/* Intro copy */}
        <div className="mx-auto mt-12 max-w-2xl space-y-6 text-lg">
          <p className="rounded-xl border-2 border-primary bg-card p-5 shadow-comic">
            <span className="font-display text-3xl text-primary">HEY YOU.</span>{" "}
            I'm Kex. I'm 7 years old, I weigh less than a golden retriever, and I have abs
            you could grate cheese on. This app is going to make YOU look like ME.
            Except taller. Probably.
          </p>
          <FeatureRow n="1" title="Three courses">
            The main event is my <b>Beast Six Pack Core Program</b>. Side quests for
            upper body and legs are available for people who want to be balanced,
            I guess. Whatever.
          </FeatureRow>
          <FeatureRow n="2" title="Six difficulty levels">
            From <b>ZERO MUSCLES KEX</b> (you were born yesterday) all the way up to{" "}
            <b>BOOMBAKRAXIN KEX</b> (do not attempt without a signed waiver).
          </FeatureRow>
          <FeatureRow n="3" title="Zero equipment">
            All bodyweight. If I can do it in my bedroom in cargo shorts, so can you.
          </FeatureRow>
          <FeatureRow n="4" title="How ripped, how fast?">
            Follow my program 5 days a week. In <b>6 weeks</b> you get "friends notice."
            In <b>12 weeks</b> you get "abs at the beach." In <b>26 weeks</b> you get
            "small children fear you at the grocery store." Just like me.
          </FeatureRow>
        </div>

        {/* CTA */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={onStart}
            className="group relative rotate-[-1deg] rounded-2xl bg-primary px-10 py-5 font-display text-4xl md:text-6xl text-primary-foreground shadow-comic-lg transition-transform hover:rotate-0 hover:scale-105 active:translate-x-1 active:translate-y-1"
          >
            LET'S GET RIPPED
            <span className="absolute -right-3 -top-3 rotate-12 rounded-full bg-secondary px-3 py-1 font-condensed text-sm text-secondary-foreground shadow-comic">
              GO!
            </span>
          </button>
        </div>

        <p className="mt-6 text-center font-condensed text-sm uppercase tracking-widest text-muted-foreground">
          Disclaimer: Kex is not a licensed personal trainer. Kex is a 7-year-old.
        </p>
      </div>
    </div>
  );
}

function FeatureRow({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-xl border-2 border-border bg-card p-5 shadow-comic">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-3xl text-secondary-foreground shadow-comic">
        {n}
      </div>
      <div>
        <div className="font-display text-2xl text-primary">{title}</div>
        <div className="text-foreground/90">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- HOME ---------------- */

function Home({
  onStart,
  onBack,
}: {
  onStart: (c: Category, d: DifficultyId) => void;
  onBack: () => void;
}) {
  const [category, setCategory] = useState<Category>("core");
  const [difficulty, setDifficulty] = useState<DifficultyId>(3);

  return (
    <div className="relative min-h-screen px-5 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary"
          >
            ← Intro
          </button>
          <div className="font-display text-2xl text-primary">GET RIPPED WITH KEX</div>
          <div className="w-16" />
        </div>

        <h2 className="mt-6 font-display text-5xl md:text-6xl text-foreground">
          Pick your <span className="text-secondary">poison</span>.
        </h2>

        {/* Category selector */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <CategoryCard
            id="core"
            title="CORE"
            subtitle="The main event"
            emoji="🔥"
            img={trainer1.url}
            selected={category === "core"}
            onSelect={() => setCategory("core")}
            badge="★ MAIN COURSE"
          />
          <CategoryCard
            id="upper"
            title="UPPER BODY"
            subtitle="Side quest"
            emoji="💪"
            img={trainer2.url}
            selected={category === "upper"}
            onSelect={() => setCategory("upper")}
          />
          <CategoryCard
            id="legs"
            title="LEGS"
            subtitle="Do not skip"
            emoji="🦵"
            img={trainer4.url}
            selected={category === "legs"}
            onSelect={() => setCategory("legs")}
          />
        </div>

        {/* Difficulty */}
        <h3 className="mt-10 font-display text-4xl text-foreground">
          How much <span className="text-primary">Kex</span> can you handle?
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`relative overflow-hidden rounded-xl border-2 p-4 text-left transition-transform hover:scale-[1.02] ${
                difficulty === d.id
                  ? "border-primary shadow-comic-pink"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`inline-block rounded px-2 py-0.5 font-condensed text-xs font-black uppercase ${d.color}`}>
                    Level {d.id}
                  </div>
                  <div className="mt-1 font-display text-2xl leading-none text-foreground">
                    {d.name}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{d.tag}</div>
                </div>
                <div className="font-display text-3xl text-primary">
                  {"★".repeat(d.id + 1)}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Start */}
        <div className="mt-10 flex justify-center pb-16">
          <button
            onClick={() => onStart(category, difficulty)}
            className="rotate-[-1deg] rounded-2xl bg-primary px-10 py-5 font-display text-4xl text-primary-foreground shadow-comic-lg transition-transform hover:rotate-0 hover:scale-105 active:translate-x-1 active:translate-y-1"
          >
            START WORKOUT
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({
  title,
  subtitle,
  emoji,
  img,
  selected,
  onSelect,
  badge,
}: {
  id: Category;
  title: string;
  subtitle: string;
  emoji: string;
  img: string;
  selected: boolean;
  onSelect: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative overflow-hidden rounded-2xl border-4 text-left transition-transform hover:scale-[1.03] ${
        selected ? "border-primary shadow-comic-lg" : "border-border bg-card shadow-comic"
      }`}
    >
      <div className="relative aspect-[4/5] w-full">
        <img src={img} alt={title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        {badge && (
          <div className="absolute right-2 top-2 rotate-[6deg] rounded bg-secondary px-2 py-1 font-condensed text-xs font-black uppercase text-secondary-foreground shadow-comic">
            {badge}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="font-display text-4xl text-primary text-stroke-black">
            {emoji} {title}
          </div>
          <div className="font-condensed text-sm font-bold uppercase text-foreground/90">
            {subtitle}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ---------------- WORKOUT ---------------- */

function Workout({
  category,
  difficulty,
  onExit,
}: {
  category: Category;
  difficulty: DifficultyId;
  onExit: () => void;
}) {
  const w = WORKOUTS[category];
  const diff = DIFFICULTIES[difficulty];
  const [idx, setIdx] = useState(0);
  const done = idx >= w.exercises.length;
  const trainerImgs = [trainer1.url, trainer2.url, trainer3.url, trainer4.url, trainer5.url];

  if (done) {
    return (
      <div className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-condensed text-sm font-black uppercase tracking-widest text-secondary">
            Workout complete
          </div>
          <h1 className="mt-2 font-display text-6xl text-primary text-stroke-thick">
            YOU DID IT!
          </h1>
          <img
            src={trainer5.url}
            alt="Kex approves"
            className="mx-auto mt-6 w-full max-w-xs rounded-2xl border-4 border-primary shadow-comic-lg"
          />
          <p className="mt-6 rounded-xl border-2 border-border bg-card p-5 text-lg shadow-comic">
            Kex is <b className="text-primary">mildly impressed</b>. That's the highest
            praise he gives. Come back tomorrow. Same time. Bring water.
          </p>
          <button
            onClick={onExit}
            className="mt-8 rounded-2xl bg-primary px-8 py-4 font-display text-3xl text-primary-foreground shadow-comic-lg"
          >
            BACK TO HOME
          </button>
        </div>
      </div>
    );
  }

  const ex = w.exercises[idx];
  const amount = Math.max(1, Math.round(ex.base * diff.mult));
  const unitLabel = ex.unit === "reps" ? "REPS" : ex.unit === "sec" ? "SECONDS" : "MINUTES";
  const trainerImg = trainerImgs[idx % trainerImgs.length];

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary"
          >
            ← Quit
          </button>
          <div className="text-center">
            <div className="font-display text-xl text-primary leading-none">{w.title}</div>
            <div className="font-condensed text-xs uppercase text-muted-foreground">
              {diff.name}
            </div>
          </div>
          <div className="font-condensed text-sm font-black text-foreground">
            {idx + 1} / {w.exercises.length}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(idx / w.exercises.length) * 100}%` }}
          />
        </div>

        {/* Exercise card */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.2fr]">
          <div className="relative">
            <img
              src={trainerImg}
              alt="Kex demonstrating"
              className="w-full rounded-2xl border-4 border-primary shadow-comic-lg"
            />
            <div className="absolute -bottom-4 -right-4 rotate-[-4deg] rounded-lg bg-secondary px-4 py-3 font-display text-xl text-secondary-foreground shadow-comic">
              WATCH & LEARN
            </div>
          </div>

          <div>
            <div className="font-condensed text-sm font-black uppercase tracking-widest text-secondary">
              Exercise {idx + 1}
            </div>
            <h1 className="font-display text-5xl md:text-6xl leading-[0.9] text-primary text-stroke-black">
              {ex.emoji} {ex.name}
            </h1>

            <div className="mt-4 inline-block rounded-xl border-2 border-primary bg-card px-6 py-3 shadow-comic">
              <div className="font-display text-6xl leading-none text-primary">
                {amount}
              </div>
              <div className="font-condensed text-sm font-black uppercase tracking-widest text-muted-foreground">
                {unitLabel}
              </div>
            </div>

            <div className="mt-6 rounded-xl border-2 border-border bg-card p-5 shadow-comic">
              <div className="font-display text-2xl text-foreground">HOW TO DO IT</div>
              <ol className="mt-3 space-y-2">
                {ex.how.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-foreground/90">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 rounded-xl border-2 border-secondary bg-secondary/10 p-4">
              <div className="font-condensed text-xs font-black uppercase tracking-widest text-secondary">
                Kex says
              </div>
              <p className="mt-1 italic text-foreground/90">"{ex.kexNote}"</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between gap-3 pb-16">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="rounded-xl border-2 border-border bg-card px-5 py-3 font-display text-2xl text-foreground disabled:opacity-40"
          >
            ← BACK
          </button>
          <button
            onClick={() => setIdx((i) => i + 1)}
            className="flex-1 rounded-xl bg-primary px-5 py-4 font-display text-3xl text-primary-foreground shadow-comic-lg active:translate-x-1 active:translate-y-1"
          >
            {idx === w.exercises.length - 1 ? "FINISH 🏆" : "DONE — NEXT →"}
          </button>
        </div>
      </div>
    </div>
  );
}
