import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  mult: number;
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
  base: number;
  unit: "reps" | "sec" | "min";
  how: string[];
  kexNote: string;
};

type Routine = {
  name: string;
  flavor: string;
  exercises: Exercise[];
};

/* ---------------- EXERCISE LIBRARY ---------------- */

const CORE: Record<string, Exercise> = {
  plank: {
    name: "Plank of Doom", emoji: "🧱", base: 60, unit: "sec",
    how: [
      "Lie face down on the floor.",
      "Prop up on your forearms and toes, elbows under shoulders.",
      "Squeeze your belly button toward your spine.",
      "Keep your body straight like a laser beam. No sagging butts allowed.",
    ],
    kexNote: "Kex holds this for 15 minutes without shivering. You have permission to shiver.",
  },
  hollow: {
    name: "Hollow Body Hold", emoji: "🥣", base: 30, unit: "sec",
    how: [
      "Lie on your back, arms overhead.",
      "Press your lower back into the floor — pretend a ninja is trying to slide a pancake under it.",
      "Lift your legs, head, and arms off the floor into a banana shape.",
      "Hold. Do not eat the banana.",
    ],
    kexNote: "Kex can hold this while eating a sandwich with his feet.",
  },
  vups: {
    name: "V-Ups", emoji: "🇻", base: 20, unit: "reps",
    how: [
      "Lie flat on your back, arms stretched overhead.",
      "In one big move, lift your legs AND upper body to touch fingers to toes.",
      "You should look like a folded slice of pizza.",
      "Slowly lower down. Repeat.",
    ],
    kexNote: "Since Kex weighs less than 50 lbs, gravity is basically a suggestion.",
  },
  toes: {
    name: "Toes-to-Sky", emoji: "🦶", base: 25, unit: "reps",
    how: [
      "Lie flat, legs straight up like flagpoles.",
      "Push your toes toward the ceiling by lifting your hips.",
      "Imagine you are stamping a footprint on the moon.",
      "Lower with control.",
    ],
    kexNote: "Kex once put a footprint on the actual ceiling. Landlord not amused.",
  },
  bicycle: {
    name: "Bicycle Crunches", emoji: "🚴", base: 40, unit: "reps",
    how: [
      "Lie on your back, hands lightly behind your head (do NOT yank your neck).",
      "Bring left elbow to right knee while extending the other leg.",
      "Switch sides like a slow-motion cartoon bicycle.",
    ],
    kexNote: "Kex does 1000 of these while watching one episode of anything.",
  },
  deadbug: {
    name: "Dead Bug", emoji: "🪳", base: 20, unit: "reps",
    how: [
      "Lie on your back, arms up, knees bent to 90°.",
      "Slowly lower your right arm and left leg toward the floor without touching.",
      "Return, switch. Do not actually become a dead bug.",
    ],
    kexNote: "Named after Kex's least favorite houseguest.",
  },
  scissors: {
    name: "Scissor Kicks", emoji: "✂️", base: 40, unit: "reps",
    how: [
      "Lie on your back, hands under your butt, legs straight.",
      "Lift both legs a few inches off the ground.",
      "Cross one over the other, then switch, like a pair of angry scissors.",
      "Count each cross as one rep.",
    ],
    kexNote: "Kex cuts his own hair with these. It shows.",
  },
  flutter: {
    name: "Flutter Kicks", emoji: "🐟", base: 45, unit: "reps",
    how: [
      "Lie flat, legs straight, hands under your butt.",
      "Lift legs a few inches off the floor.",
      "Kick up and down in tiny fast flutters, like a fish having a bad day.",
      "Count each leg lift as one rep.",
    ],
    kexNote: "Kex once flutter-kicked across a swimming pool. Backwards. Blindfolded.",
  },
  russian: {
    name: "Russian Twists", emoji: "🌀", base: 30, unit: "reps",
    how: [
      "Sit on your butt, lean back slightly, feet hovering off the floor.",
      "Clasp your hands (or hold a soup can) in front of your chest.",
      "Twist to the left, then to the right. Each twist is one rep.",
      "Do not eat the soup mid-set.",
    ],
    kexNote: "Kex uses a full watermelon. He drops it. Every time. On purpose.",
  },
  situps: {
    name: "Full Sit-Ups", emoji: "🪑", base: 25, unit: "reps",
    how: [
      "Lie on your back, knees bent, feet flat.",
      "Sit all the way up until your chest meets your knees.",
      "Slowly roll back down. No launching yourself with your arms.",
    ],
    kexNote: "Kex learned these before he learned to walk. That's a lie. But barely.",
  },
  crunches: {
    name: "Classic Crunches", emoji: "🥨", base: 40, unit: "reps",
    how: [
      "Lie on your back, knees bent, hands lightly behind your head.",
      "Curl your shoulder blades off the floor. Not your whole back.",
      "Squeeze your abs at the top. Lower with control.",
    ],
    kexNote: "Basic. Boring. Devastating. Kex approves.",
  },
  legRaises: {
    name: "Lying Leg Raises", emoji: "🦵", base: 20, unit: "reps",
    how: [
      "Lie flat on your back, hands under your butt for support.",
      "Keep legs straight and together, lift them until they point at the sky.",
      "Slowly lower back down without touching the floor.",
    ],
    kexNote: "Kex holds a snack between his ankles for extra resistance. Do not attempt with pizza.",
  },
  mountain: {
    name: "Mountain Climbers", emoji: "⛰️", base: 40, unit: "reps",
    how: [
      "Start in a high plank position.",
      "Drive one knee toward your chest, then quickly switch.",
      "Go fast, like you're running up a very short, very close mountain.",
      "Each knee drive is one rep.",
    ],
    kexNote: "Kex climbed a real mountain last summer. In flip-flops. Uphill both ways.",
  },
  boat: {
    name: "Boat Pose Hold", emoji: "⛵", base: 30, unit: "sec",
    how: [
      "Sit on your butt with knees bent.",
      "Lean back slightly and lift your feet off the floor.",
      "Straighten your legs into a V. Arms reach forward.",
      "Try not to capsize.",
    ],
    kexNote: "Kex holds this while narrating his own pirate movie. In progress.",
  },
  windshield: {
    name: "Windshield Wipers", emoji: "🚗", base: 20, unit: "reps",
    how: [
      "Lie on your back, arms out wide for balance.",
      "Lift legs straight up toward the ceiling.",
      "Slowly lower them to the left, then to the right, like wipers.",
      "Each side counts as one rep.",
    ],
    kexNote: "Kex charges $5 per windshield. He does not accept tips.",
  },
  sidePlank: {
    name: "Side Plank (each side)", emoji: "📐", base: 30, unit: "sec",
    how: [
      "Lie on your side, prop up on one forearm.",
      "Stack your feet and lift your hips so your body is a straight diagonal line.",
      "Hold. Then flip and do the other side for the same time.",
    ],
    kexNote: "Kex does this on ONE finger. Then he laughs at you.",
  },
  reverseCrunch: {
    name: "Reverse Crunches", emoji: "🔁", base: 20, unit: "reps",
    how: [
      "Lie on your back, knees bent, feet off the floor.",
      "Pull your knees toward your chest by curling your hips off the ground.",
      "Slowly lower back down without letting your feet touch.",
    ],
    kexNote: "Kex says these are like normal crunches, but backwards. Groundbreaking analysis.",
  },
  toeTouches: {
    name: "Standing Toe Touches", emoji: "👣", base: 25, unit: "reps",
    how: [
      "Lie on your back, legs straight up in the air.",
      "Reach both hands up and try to slap your toes.",
      "Slap them like they owe you money. Lower with control.",
    ],
    kexNote: "Kex slaps his toes so hard they filed a restraining order.",
  },
};

const UPPER: Record<string, Exercise> = {
  pushup: {
    name: "Push-Ups", emoji: "💪", base: 20, unit: "reps",
    how: [
      "Hands under shoulders, body in a straight line.",
      "Lower your chest to almost touch the floor.",
      "Push back up like you're launching yourself into orbit.",
    ],
    kexNote: "Kex does these on one finger. He recommends starting with all ten.",
  },
  pike: {
    name: "Pike Push-Ups", emoji: "🔺", base: 12, unit: "reps",
    how: [
      "Start in downward-dog: butt in the air, hands and feet on the floor.",
      "Bend elbows to lower the TOP of your head toward the floor.",
      "Push back up. Feel the shoulder burn.",
    ],
    kexNote: "This is Kex's HARD one. His arms are tiny. Show him mercy.",
  },
  superman: {
    name: "Superman Holds", emoji: "🦸", base: 30, unit: "sec",
    how: [
      "Lie face down. Stretch arms in front, legs behind.",
      "Lift arms, chest, and legs off the floor at the same time.",
      "Fly. But don't actually try to fly out the window.",
    ],
    kexNote: "Kex insists his cape was in the wash.",
  },
  diamond: {
    name: "Diamond Push-Ups", emoji: "💎", base: 10, unit: "reps",
    how: [
      "Put hands together under your chest forming a diamond with thumbs and index fingers.",
      "Lower your chest to your hands.",
      "Push up. Triceps will file a complaint.",
    ],
    kexNote: "Harder than regular push-ups. Kex actually struggles a bit on these.",
  },
  wide: {
    name: "Wide-Grip Push-Ups", emoji: "🦅", base: 15, unit: "reps",
    how: [
      "Set your hands wider than your shoulders.",
      "Lower slowly, chest toward the floor.",
      "Push up. Chest muscles say hello.",
    ],
    kexNote: "Kex calls these 'eagle push-ups' because he yells 'CAW!' at the top of each rep.",
  },
  incline: {
    name: "Incline Push-Ups", emoji: "🛋️", base: 20, unit: "reps",
    how: [
      "Place your hands on a couch, bench, or bed.",
      "Body straight, lower your chest to the surface.",
      "Push back up.",
    ],
    kexNote: "For when you want push-ups but also want to be almost lying on furniture. Kex respects that.",
  },
  decline: {
    name: "Decline Push-Ups", emoji: "🪜", base: 12, unit: "reps",
    how: [
      "Put your feet on a chair or couch, hands on the floor.",
      "Lower your chest to the ground.",
      "Push back up. Shoulders will scream.",
    ],
    kexNote: "Kex does these with his feet on the ceiling. Also a lie. Kind of.",
  },
  tricepDip: {
    name: "Tricep Dips", emoji: "🪑", base: 15, unit: "reps",
    how: [
      "Sit on the edge of a sturdy chair, hands next to your hips.",
      "Slide your butt off the chair, supporting yourself with your arms.",
      "Bend elbows to lower down. Push back up.",
      "Do not tip the chair. That is not part of the exercise.",
    ],
    kexNote: "Kex uses a stack of encyclopedias. He calls it 'reading between dips.'",
  },
  plankUpDown: {
    name: "Plank Up-Downs", emoji: "🔃", base: 16, unit: "reps",
    how: [
      "Start in a high plank on your hands.",
      "Lower to your right forearm, then your left forearm.",
      "Push back up to your right hand, then your left hand.",
      "Each full up-and-down is one rep.",
    ],
    kexNote: "Kex times these with his ringtone. Very confusing when someone actually calls.",
  },
  archer: {
    name: "Archer Push-Ups", emoji: "🏹", base: 8, unit: "reps",
    how: [
      "Set hands wider than shoulders in push-up position.",
      "Lower toward ONE hand while keeping the other arm straight.",
      "Push back up. Switch sides.",
      "Count each side as one rep.",
    ],
    kexNote: "Kex nailed a bullseye with his abs once. Nobody saw it. Very sad.",
  },
  shoulderTap: {
    name: "Plank Shoulder Taps", emoji: "👋", base: 30, unit: "reps",
    how: [
      "High plank position, body straight.",
      "Tap your right hand to your left shoulder. Then left to right.",
      "Try not to wobble like a jelly.",
      "Each tap is one rep.",
    ],
    kexNote: "Kex taps so gently he says his shoulders don't even notice. That's the goal.",
  },
  bearCrawl: {
    name: "Bear Crawl", emoji: "🐻", base: 30, unit: "sec",
    how: [
      "Get on hands and feet, knees hovering an inch off the floor.",
      "Crawl forward: opposite hand + opposite foot together.",
      "Growl if it helps. It helps.",
    ],
    kexNote: "Kex crawls to the fridge like this. Every time. His parents are exhausted.",
  },
  crabWalk: {
    name: "Crab Walk", emoji: "🦀", base: 30, unit: "sec",
    how: [
      "Sit on the floor. Place hands behind you, feet in front, hips lifted.",
      "Walk sideways on your hands and feet.",
      "Do not pinch anyone.",
    ],
    kexNote: "Kex challenges you to a crab-walk race. He will win. He always wins.",
  },
};

const LEGS: Record<string, Exercise> = {
  squat: {
    name: "Bodyweight Squats", emoji: "🏋️", base: 30, unit: "reps",
    how: [
      "Feet shoulder-width apart, toes slightly out.",
      "Sit back like there's an invisible chair.",
      "Lower until thighs are parallel to the floor.",
      "Stand up. Do not sit on the invisible chair. It's fake.",
    ],
    kexNote: "Kex can do 500 while reading a comic book.",
  },
  lunge: {
    name: "Alternating Lunges", emoji: "🚶", base: 20, unit: "reps",
    how: [
      "Step one leg forward big.",
      "Lower your back knee toward the floor.",
      "Front knee stays over the ankle, not past the toes.",
      "Push back up. Alternate legs. Each leg counts as one rep.",
    ],
    kexNote: "Kex won't know if you count both legs together. But he suspects.",
  },
  wallSit: {
    name: "Wall Sit", emoji: "🧱", base: 45, unit: "sec",
    how: [
      "Back flat against a wall.",
      "Slide down until your thighs are parallel to the floor.",
      "Pretend you're sitting on a real chair. Suffer.",
    ],
    kexNote: "Kex does this while writing his memoir.",
  },
  jumpSquat: {
    name: "Jump Squats", emoji: "🦘", base: 15, unit: "reps",
    how: [
      "Squat down.",
      "Explode UP into a jump.",
      "Land softly, immediately squat again.",
      "Try not to hit the ceiling fan.",
    ],
    kexNote: "Kex once jumped so high he was late for dinner because he was still airborne.",
  },
  singleBridge: {
    name: "Single-Leg Glute Bridge", emoji: "🌉", base: 12, unit: "reps",
    how: [
      "Lie on your back, knees bent.",
      "Lift one leg straight up.",
      "Push through the other heel to raise your hips.",
      "Squeeze your butt like it owes you money. Lower. Switch sides.",
    ],
    kexNote: "This is another one Kex actually finds hard. Solidarity.",
  },
  bridge: {
    name: "Glute Bridges", emoji: "🏗️", base: 25, unit: "reps",
    how: [
      "Lie on your back, knees bent, feet flat.",
      "Push through your heels and lift your hips to the sky.",
      "Squeeze your glutes at the top like you're crushing a walnut. Lower.",
    ],
    kexNote: "Kex has cracked actual walnuts with these. Do not verify.",
  },
  reverseLunge: {
    name: "Reverse Lunges", emoji: "↩️", base: 20, unit: "reps",
    how: [
      "Stand tall.",
      "Step ONE leg backward and lower your back knee toward the floor.",
      "Push through the front heel to stand back up.",
      "Alternate. Each leg is one rep.",
    ],
    kexNote: "Same as lunges but backwards. Kex says this counts as time travel.",
  },
  curtsy: {
    name: "Curtsy Lunges", emoji: "👸", base: 20, unit: "reps",
    how: [
      "Stand tall. Step your right foot diagonally BEHIND your left leg.",
      "Bend both knees like you're doing an awkward royal bow.",
      "Push back up. Switch sides.",
    ],
    kexNote: "Kex does these to greet his stuffed animals. They love it.",
  },
  calfRaise: {
    name: "Calf Raises", emoji: "🐮", base: 40, unit: "reps",
    how: [
      "Stand tall, feet hip-width apart.",
      "Rise onto the balls of your feet as high as you can.",
      "Lower slowly. Feel the calves complain.",
    ],
    kexNote: "Kex's calves are the size of grapes. He does 2000 of these anyway.",
  },
  sideLunge: {
    name: "Side Lunges", emoji: "🤸", base: 20, unit: "reps",
    how: [
      "Stand tall, feet together.",
      "Step your right foot WAY out to the side and bend that knee.",
      "Keep the other leg straight. Push back to center.",
      "Alternate sides. Each leg is one rep.",
    ],
    kexNote: "Kex uses these to dodge his little sister's toys. Extremely functional.",
  },
  pistolPrep: {
    name: "Assisted Pistol Squats", emoji: "🔫", base: 10, unit: "reps",
    how: [
      "Hold onto a door frame or sturdy chair for balance.",
      "Extend one leg straight in front of you.",
      "Squat down on the other leg as low as you can.",
      "Push back up. Switch legs. Each leg is one rep.",
    ],
    kexNote: "Kex struggles here because his balance is 80% chaos. He gets it done anyway.",
  },
  frog: {
    name: "Frog Jumps", emoji: "🐸", base: 15, unit: "reps",
    how: [
      "Squat down into a low, wide stance.",
      "Explode forward and up into a jump.",
      "Land in a squat and immediately jump again.",
      "Ribbit optional. Encouraged.",
    ],
    kexNote: "Kex once out-jumped an actual frog. The frog still hasn't recovered.",
  },
  stepUp: {
    name: "Step-Ups", emoji: "📶", base: 20, unit: "reps",
    how: [
      "Find a sturdy step, chair, or bench.",
      "Step up with your right leg, bring the left up to meet it.",
      "Step down. Alternate leading legs.",
    ],
    kexNote: "Kex climbs the stairs 47 times a day for 'training.' Neighbors have complained.",
  },
  gobletSquat: {
    name: "Slow-Motion Squats", emoji: "🐢", base: 15, unit: "reps",
    how: [
      "Feet shoulder-width apart.",
      "Take FIVE seconds to lower into a squat.",
      "Pause at the bottom for one second.",
      "Take THREE seconds to stand back up.",
    ],
    kexNote: "Kex says slow squats build actual leg muscles. He was slow-squatting when he said it. Very believable.",
  },
};

/* ---------------- ROUTINES ---------------- */

const WORKOUTS: Record<Category, { title: string; subtitle: string; trainerImg: string; routines: Routine[] }> = {
  core: {
    title: "CORE COURSE",
    subtitle: "The Beast Six Pack Program",
    trainerImg: trainer1.url,
    routines: [
      {
        name: "SIX-PACK STARTER PACK",
        flavor: "The classic. Kex's Monday morning warm-up.",
        exercises: [CORE.plank, CORE.crunches, CORE.bicycle, CORE.legRaises, CORE.hollow, CORE.russian, CORE.deadbug, CORE.vups],
      },
      {
        name: "BANANA BOAT BLAST",
        flavor: "Curled up, folded up, all-around miserable.",
        exercises: [CORE.hollow, CORE.boat, CORE.vups, CORE.toeTouches, CORE.situps, CORE.reverseCrunch, CORE.flutter, CORE.plank, CORE.crunches],
      },
      {
        name: "KEX'S FAVORITE THINGS",
        flavor: "The exercises Kex laughs while doing.",
        exercises: [CORE.bicycle, CORE.scissors, CORE.flutter, CORE.mountain, CORE.russian, CORE.windshield, CORE.legRaises, CORE.plank],
      },
      {
        name: "HOLD THE LINE",
        flavor: "Almost all holds. Almost no fun.",
        exercises: [CORE.plank, CORE.hollow, CORE.sidePlank, CORE.boat, CORE.superman, CORE.plank, CORE.sidePlank],
      },
      {
        name: "GRATE CHEESE ON THESE ABS",
        flavor: "Longer, meaner, cheesier.",
        exercises: [CORE.crunches, CORE.reverseCrunch, CORE.bicycle, CORE.russian, CORE.vups, CORE.legRaises, CORE.flutter, CORE.scissors, CORE.plank, CORE.hollow],
      },
      {
        name: "SPIN CYCLE",
        flavor: "Twist. Twist. Twist. Fall over.",
        exercises: [CORE.russian, CORE.bicycle, CORE.windshield, CORE.mountain, CORE.sidePlank, CORE.scissors, CORE.plank],
      },
      {
        name: "TINY DANCER",
        flavor: "Little movements. Big pain.",
        exercises: [CORE.deadbug, CORE.hollow, CORE.flutter, CORE.scissors, CORE.reverseCrunch, CORE.crunches, CORE.legRaises, CORE.plank],
      },
      {
        name: "50 LBS OF FURY",
        flavor: "Kex's personal record routine. Good luck.",
        exercises: [CORE.plank, CORE.vups, CORE.bicycle, CORE.russian, CORE.legRaises, CORE.hollow, CORE.mountain, CORE.sidePlank, CORE.boat, CORE.crunches],
      },
    ],
  },
  upper: {
    title: "UPPER BODY SIDE QUEST",
    subtitle: "Arms of Kex Legend",
    trainerImg: trainer2.url,
    routines: [
      {
        name: "ARMS DEALER",
        flavor: "Push, push, push some more.",
        exercises: [UPPER.pushup, UPPER.wide, UPPER.diamond, UPPER.tricepDip, UPPER.superman, UPPER.pushup],
      },
      {
        name: "SHOULDER SHOWDOWN",
        flavor: "Pike push-ups all over the place. Kex's least favorite.",
        exercises: [UPPER.pike, UPPER.shoulderTap, UPPER.plankUpDown, UPPER.pike, UPPER.superman, UPPER.tricepDip],
      },
      {
        name: "ZOO CRAWL",
        flavor: "Animal moves only. Growling encouraged.",
        exercises: [UPPER.bearCrawl, UPPER.crabWalk, UPPER.bearCrawl, UPPER.shoulderTap, UPPER.wide, UPPER.crabWalk, UPPER.superman],
      },
      {
        name: "PUSH-UP PALOOZA",
        flavor: "Every push-up variety Kex has invented.",
        exercises: [UPPER.pushup, UPPER.wide, UPPER.diamond, UPPER.archer, UPPER.incline, UPPER.decline, UPPER.pike],
      },
      {
        name: "TRICEP TROUBLE",
        flavor: "Back-of-arm burnout.",
        exercises: [UPPER.diamond, UPPER.tricepDip, UPPER.diamond, UPPER.plankUpDown, UPPER.tricepDip, UPPER.pike, UPPER.superman],
      },
      {
        name: "CAPE-IN-THE-WASH",
        flavor: "Superman pretends really hard.",
        exercises: [UPPER.superman, UPPER.pushup, UPPER.shoulderTap, UPPER.superman, UPPER.bearCrawl, UPPER.wide, UPPER.superman],
      },
      {
        name: "EAGLE VS DIAMOND",
        flavor: "Wide, narrow, wide, narrow, cry.",
        exercises: [UPPER.wide, UPPER.diamond, UPPER.wide, UPPER.diamond, UPPER.archer, UPPER.plankUpDown, UPPER.tricepDip],
      },
    ],
  },
  legs: {
    title: "LEG DAY OF DESTINY",
    subtitle: "Do Not Skip. Kex Is Watching.",
    trainerImg: trainer3.url,
    routines: [
      {
        name: "SQUAT-O-RAMA",
        flavor: "Squats. In every possible flavor.",
        exercises: [LEGS.squat, LEGS.gobletSquat, LEGS.jumpSquat, LEGS.sideLunge, LEGS.wallSit, LEGS.squat, LEGS.calfRaise],
      },
      {
        name: "LUNGE BUFFET",
        flavor: "Forward, back, sideways, sideways-behind.",
        exercises: [LEGS.lunge, LEGS.reverseLunge, LEGS.sideLunge, LEGS.curtsy, LEGS.lunge, LEGS.wallSit, LEGS.calfRaise],
      },
      {
        name: "GLUTE GARAGE",
        flavor: "Butts on. Full send.",
        exercises: [LEGS.bridge, LEGS.singleBridge, LEGS.squat, LEGS.curtsy, LEGS.bridge, LEGS.stepUp, LEGS.singleBridge],
      },
      {
        name: "JUMP AROUND",
        flavor: "Explosive. Neighbors will complain.",
        exercises: [LEGS.jumpSquat, LEGS.frog, LEGS.jumpSquat, LEGS.stepUp, LEGS.frog, LEGS.wallSit, LEGS.calfRaise],
      },
      {
        name: "TINY LEGS BIG PROBLEM",
        flavor: "Kex-approved endurance marathon.",
        exercises: [LEGS.squat, LEGS.lunge, LEGS.bridge, LEGS.calfRaise, LEGS.reverseLunge, LEGS.wallSit, LEGS.squat, LEGS.stepUp, LEGS.calfRaise],
      },
      {
        name: "BALANCE OF POWER",
        flavor: "Everything on one leg. Kex is furious about this one.",
        exercises: [LEGS.singleBridge, LEGS.pistolPrep, LEGS.curtsy, LEGS.singleBridge, LEGS.pistolPrep, LEGS.stepUp, LEGS.wallSit],
      },
      {
        name: "SLOW & LOW",
        flavor: "Every rep painfully controlled.",
        exercises: [LEGS.gobletSquat, LEGS.wallSit, LEGS.gobletSquat, LEGS.bridge, LEGS.reverseLunge, LEGS.gobletSquat, LEGS.calfRaise],
      },
      {
        name: "THE FROG PRINCE",
        flavor: "Jumping, curtsying, ribbiting.",
        exercises: [LEGS.frog, LEGS.curtsy, LEGS.frog, LEGS.jumpSquat, LEGS.sideLunge, LEGS.frog, LEGS.wallSit, LEGS.calfRaise],
      },
    ],
  },
};

/* ---------------- APP ---------------- */

function App() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [category, setCategory] = useState<Category>("core");
  const [difficulty, setDifficulty] = useState<DifficultyId>(3);
  const [routineIdx, setRoutineIdx] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {screen === "intro" && <Intro onStart={() => setScreen("home")} />}
      {screen === "home" && (
        <Home
          onStart={(c, d) => {
            setCategory(c);
            setDifficulty(d);
            const routines = WORKOUTS[c].routines;
            setRoutineIdx(Math.floor(Math.random() * routines.length));
            setSessionKey((k) => k + 1);
            setScreen("workout");
          }}
          onBack={() => setScreen("intro")}
        />
      )}
      {screen === "workout" && (
        <Workout
          key={sessionKey}
          category={category}
          difficulty={difficulty}
          routineIdx={routineIdx}
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
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[200vmax] w-[200vmax] bg-zoom-lines" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-10 md:py-16">
        <div className="text-center">
          <div className="inline-block rotate-[-2deg] bg-secondary px-4 py-1 font-condensed text-lg font-black uppercase text-secondary-foreground shadow-comic">
            The world's silliest ab program
          </div>
          <h1 className="display mt-4 text-[15vw] md:text-[128px] leading-[0.85] text-primary text-stroke-thick">
            GET RIPPED
            <br />
            <span className="inline-block rotate-[-3deg] text-secondary">WITH KEX</span>
          </h1>
        </div>

        <div className="relative mx-auto mt-8 w-full max-w-md">
          <div className="animate-pulse-glow rounded-2xl border-4 border-primary bg-card p-2 shadow-comic-lg">
            <img src={trainer1.url} alt="Kex, your 7-year-old AI trainer, flexing" className="w-full rounded-xl" />
          </div>
          <div className="absolute -top-6 -right-4 rotate-[8deg] rounded-lg bg-primary px-3 py-2 font-display text-2xl text-primary-foreground shadow-comic">
            50 LBS OF FURY
          </div>
          <div className="absolute -bottom-4 -left-4 rotate-[-6deg] rounded-lg bg-accent px-3 py-2 font-display text-xl text-accent-foreground shadow-comic">
            AGE: 7
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-2xl space-y-6 text-lg">
          <p className="rounded-xl border-2 border-primary bg-card p-5 shadow-comic">
            <span className="font-display text-3xl text-primary">HEY YOU.</span>{" "}
            I'm Kex. I'm 7 years old, I weigh less than a golden retriever, and I have abs
            you could grate cheese on. This app is going to make YOU look like ME.
            Except taller. Probably.
          </p>
          <FeatureRow n="1" title="Three courses">
            The main event is my <b>Beast Six Pack Core Program</b>. Side quests for upper body and legs
            are available for people who want to be balanced, I guess. Whatever.
          </FeatureRow>
          <FeatureRow n="2" title="Six difficulty levels">
            From <b>ZERO MUSCLES KEX</b> (you were born yesterday) all the way up to{" "}
            <b>BOOMBAKRAXIN KEX</b> (do not attempt without a signed waiver).
          </FeatureRow>
          <FeatureRow n="3" title="A whole vault of workouts">
            Every time you press START, I roll the dice and hand you a fresh routine.
            Same course, same level, brand new pain. You never memorize your way out of leg day.
          </FeatureRow>
          <FeatureRow n="4" title="How ripped, how fast?">
            Follow my program 5 days a week. In <b>6 weeks</b> you get "friends notice."
            In <b>12 weeks</b> you get "abs at the beach." In <b>26 weeks</b> you get
            "small children fear you at the grocery store." Just like me.
          </FeatureRow>
        </div>

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

        <h3 className="mt-10 font-display text-4xl text-foreground">
          How much <span className="text-primary">Kex</span> can you handle?
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`relative overflow-hidden rounded-xl border-2 p-4 text-left transition-transform hover:scale-[1.02] ${
                difficulty === d.id ? "border-primary shadow-comic-pink" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`inline-block rounded px-2 py-0.5 font-condensed text-xs font-black uppercase ${d.color}`}>
                    Level {d.id}
                  </div>
                  <div className="mt-1 font-display text-2xl leading-none text-foreground">{d.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{d.tag}</div>
                </div>
                <div className="font-display text-3xl text-primary">{"★".repeat(d.id + 1)}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-xl border-2 border-dashed border-secondary bg-secondary/10 p-4 text-center">
          <div className="font-condensed text-xs font-black uppercase tracking-widest text-secondary">
            Kex's Random Routine Generator™
          </div>
          <p className="mt-1 text-foreground/90">
            Every time you smash <b>START WORKOUT</b>, I pick a random routine from{" "}
            <b>{WORKOUTS[category].routines.length}</b> different {WORKOUTS[category].title.toLowerCase()} routines.
            Press it again — get a whole new workout.
          </p>
        </div>

        <div className="mt-6 flex justify-center pb-16">
          <button
            onClick={() => onStart(category, difficulty)}
            className="rotate-[-1deg] rounded-2xl bg-primary px-10 py-5 font-display text-4xl text-primary-foreground shadow-comic-lg transition-transform hover:rotate-0 hover:scale-105 active:translate-x-1 active:translate-y-1"
          >
            START WORKOUT 🎲
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
          <div className="font-condensed text-sm font-bold uppercase text-foreground/90">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

/* ---------------- WORKOUT ---------------- */

function Workout({
  category,
  difficulty,
  routineIdx,
  onExit,
}: {
  category: Category;
  difficulty: DifficultyId;
  routineIdx: number;
  onExit: () => void;
}) {
  const w = WORKOUTS[category];
  const routine = useMemo(() => w.routines[routineIdx % w.routines.length], [w, routineIdx]);
  const diff = DIFFICULTIES[difficulty];
  const [idx, setIdx] = useState(0);
  const done = idx >= routine.exercises.length;
  const trainerImgs = [trainer1.url, trainer2.url, trainer3.url, trainer4.url, trainer5.url];

  if (done) {
    return (
      <div className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-condensed text-sm font-black uppercase tracking-widest text-secondary">
            Workout complete
          </div>
          <h1 className="mt-2 font-display text-6xl text-primary text-stroke-thick">YOU DID IT!</h1>
          <div className="mt-2 font-display text-2xl text-secondary">"{routine.name}" — SURVIVED</div>
          <img
            src={trainer5.url}
            alt="Kex approves"
            className="mx-auto mt-6 w-full max-w-xs rounded-2xl border-4 border-primary shadow-comic-lg"
          />
          <p className="mt-6 rounded-xl border-2 border-border bg-card p-5 text-lg shadow-comic">
            Kex is <b className="text-primary">mildly impressed</b>. That's the highest
            praise he gives. Come back tomorrow — I'll pick a different routine and pretend
            it's easier. It won't be.
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

  const ex = routine.exercises[idx];
  const amount = Math.max(1, Math.round(ex.base * diff.mult));
  const unitLabel = ex.unit === "reps" ? "REPS" : ex.unit === "sec" ? "SECONDS" : "MINUTES";
  const trainerImg = trainerImgs[idx % trainerImgs.length];

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="font-condensed text-sm font-bold uppercase text-muted-foreground hover:text-primary"
          >
            ← Quit
          </button>
          <div className="text-center">
            <div className="font-display text-xl text-primary leading-none">{routine.name}</div>
            <div className="font-condensed text-xs uppercase text-muted-foreground">
              {w.title} · {diff.name}
            </div>
          </div>
          <div className="font-condensed text-sm font-black text-foreground">
            {idx + 1} / {routine.exercises.length}
          </div>
        </div>

        <div className="mt-2 text-center font-condensed text-xs italic text-secondary">
          "{routine.flavor}"
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(idx / routine.exercises.length) * 100}%` }}
          />
        </div>

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
              <div className="font-display text-6xl leading-none text-primary">{amount}</div>
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
            {idx === routine.exercises.length - 1 ? "FINISH 🏆" : "DONE — NEXT →"}
          </button>
        </div>
      </div>
    </div>
  );
}
