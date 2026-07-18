// Static data for the Kex app: difficulties, exercises, routines, tournaments.

export type DifficultyId = 0 | 1 | 2 | 3 | 4 | 5;
export type Category = "core" | "upper" | "legs";

export const DIFFICULTIES: {
  id: DifficultyId;
  name: string;
  tag: string;
  mult: number;
  color: string;
}[] = [
  { id: 0, name: "ZERO MUSCLES KEX", tag: "Just born. Cannot flex.", mult: 0.3, color: "bg-muted text-muted-foreground" },
  { id: 1, name: "WIMPY KEX", tag: "Can lift a spoon.", mult: 0.7, color: "bg-accent text-accent-foreground" },
  { id: 2, name: "AVERAGE KEX", tag: "Normal human. Boring.", mult: 1.2, color: "bg-primary text-primary-foreground" },
  { id: 3, name: "STRONG KEX", tag: "Snaps carrots with pinky.", mult: 2.0, color: "bg-secondary text-secondary-foreground" },
  { id: 4, name: "RIPPED KEX", tag: "Abs visible from space.", mult: 3.5, color: "bg-danger text-white" },
  { id: 5, name: "BOOMBAKRAXIN KEX", tag: "☢️ Do not attempt. Ever.", mult: 7.0, color: "bg-black text-primary border-2 border-primary" },
];

export type Exercise = {
  id: string;
  name: string;
  emoji: string;
  base: number;
  unit: "reps" | "sec" | "min";
  needsPullupBar?: boolean;
  isPlank?: boolean;
  isPullup?: boolean;
  how: string[];
  kexNote: string;
};

function ex(id: string, e: Omit<Exercise, "id">): Exercise {
  return { id, ...e };
}

/* ---------------- CORE ---------------- */
export const CORE: Record<string, Exercise> = {
  plank: ex("core.plank", {
    name: "Plank of Doom", emoji: "🧱", base: 60, unit: "sec", isPlank: true,
    how: [
      "Lie face down on the floor.",
      "Prop up on your forearms and toes, elbows under shoulders.",
      "Squeeze your belly button toward your spine.",
      "Keep your body straight like a laser beam. No sagging butts allowed.",
    ],
    kexNote: "Kex holds this for 15 minutes without shivering. You have permission to shiver.",
  }),
  hollow: ex("core.hollow", {
    name: "Hollow Body Hold", emoji: "🥣", base: 30, unit: "sec",
    how: [
      "Lie on your back, arms overhead.",
      "Press your lower back into the floor.",
      "Lift your legs, head, and arms off the floor into a banana shape.",
      "Hold. Do not eat the banana.",
    ],
    kexNote: "Kex holds this while eating a sandwich with his feet.",
  }),
  vups: ex("core.vups", {
    name: "V-Ups", emoji: "🇻", base: 20, unit: "reps",
    how: [
      "Lie flat on your back, arms stretched overhead.",
      "In one big move, lift your legs AND upper body to touch fingers to toes.",
      "You should look like a folded slice of pizza.",
      "Slowly lower down. Repeat.",
    ],
    kexNote: "Since Kex weighs less than a sack of potatoes, gravity is basically a suggestion.",
  }),
  toes: ex("core.toes", {
    name: "Toes-to-Sky", emoji: "🦶", base: 25, unit: "reps",
    how: [
      "Lie flat, legs straight up like flagpoles.",
      "Push your toes toward the ceiling by lifting your hips.",
      "Lower with control.",
    ],
    kexNote: "Kex once put a footprint on the actual ceiling. Landlord not amused.",
  }),
  bicycle: ex("core.bicycle", {
    name: "Bicycle Crunches", emoji: "🚴", base: 40, unit: "reps",
    how: [
      "Lie on your back, hands lightly behind your head (do NOT yank your neck).",
      "Bring left elbow to right knee while extending the other leg.",
      "Switch sides like a slow-motion cartoon bicycle.",
    ],
    kexNote: "Kex does 1000 of these while watching one episode of anything.",
  }),
  deadbug: ex("core.deadbug", {
    name: "Dead Bug", emoji: "🪳", base: 20, unit: "reps",
    how: [
      "Lie on your back, arms up, knees bent to 90°.",
      "Slowly lower your right arm and left leg toward the floor without touching.",
      "Return, switch. Do not actually become a dead bug.",
    ],
    kexNote: "Named after Kex's least favorite houseguest.",
  }),
  scissors: ex("core.scissors", {
    name: "Scissor Kicks", emoji: "✂️", base: 40, unit: "reps",
    how: [
      "Lie on your back, hands under your butt, legs straight.",
      "Lift both legs a few inches off the ground.",
      "Cross one over the other, then switch, like a pair of angry scissors.",
    ],
    kexNote: "Kex cuts his own hair with these. It shows.",
  }),
  flutter: ex("core.flutter", {
    name: "Flutter Kicks", emoji: "🐟", base: 45, unit: "reps",
    how: [
      "Lie flat, legs straight, hands under your butt.",
      "Kick up and down in tiny fast flutters.",
    ],
    kexNote: "Kex once flutter-kicked across a swimming pool. Backwards. Blindfolded.",
  }),
  russian: ex("core.russian", {
    name: "Russian Twists", emoji: "🌀", base: 30, unit: "reps",
    how: [
      "Sit on your butt, lean back slightly, feet hovering off the floor.",
      "Twist to the left, then to the right. Each twist is one rep.",
    ],
    kexNote: "Kex uses a full watermelon. He drops it. Every time. On purpose.",
  }),
  situps: ex("core.situps", {
    name: "Full Sit-Ups", emoji: "🪑", base: 25, unit: "reps",
    how: [
      "Lie on your back, knees bent, feet flat.",
      "Sit all the way up until your chest meets your knees.",
      "Slowly roll back down. No launching yourself with your arms.",
    ],
    kexNote: "Kex learned these before he learned to walk. That's a lie. But barely.",
  }),
  crunches: ex("core.crunches", {
    name: "Classic Crunches", emoji: "🥨", base: 40, unit: "reps",
    how: [
      "Lie on your back, knees bent, hands lightly behind your head.",
      "Curl your shoulder blades off the floor. Not your whole back.",
      "Squeeze your abs at the top. Lower with control.",
    ],
    kexNote: "Basic. Boring. Devastating. Kex approves.",
  }),
  legRaises: ex("core.legRaises", {
    name: "Lying Leg Raises", emoji: "🦵", base: 20, unit: "reps",
    how: [
      "Lie flat on your back, hands under your butt for support.",
      "Keep legs straight and together, lift them until they point at the sky.",
      "Slowly lower back down without touching the floor.",
    ],
    kexNote: "Kex holds a snack between his ankles for extra resistance. Do not attempt with pizza.",
  }),
  mountain: ex("core.mountain", {
    name: "Mountain Climbers", emoji: "⛰️", base: 40, unit: "reps",
    how: [
      "Start in a high plank position.",
      "Drive one knee toward your chest, then quickly switch.",
      "Each knee drive is one rep.",
    ],
    kexNote: "Kex climbed a real mountain last summer. In flip-flops. Uphill both ways.",
  }),
  boat: ex("core.boat", {
    name: "Boat Pose Hold", emoji: "⛵", base: 30, unit: "sec",
    how: [
      "Sit on your butt with knees bent.",
      "Lean back slightly and lift your feet off the floor.",
      "Straighten your legs into a V. Arms reach forward.",
    ],
    kexNote: "Kex holds this while narrating his own pirate movie. In progress.",
  }),
  windshield: ex("core.windshield", {
    name: "Windshield Wipers", emoji: "🚗", base: 20, unit: "reps",
    how: [
      "Lie on your back, arms out wide for balance.",
      "Lift legs straight up toward the ceiling.",
      "Slowly lower them to the left, then to the right, like wipers.",
    ],
    kexNote: "Kex charges $5 per windshield. He does not accept tips.",
  }),
  sidePlank: ex("core.sidePlank", {
    name: "Side Plank (each side)", emoji: "📐", base: 30, unit: "sec",
    how: [
      "Lie on your side, prop up on one forearm.",
      "Stack your feet and lift your hips so your body is a straight diagonal line.",
      "Hold. Then flip and do the other side for the same time.",
    ],
    kexNote: "Kex does this on ONE finger. Then he laughs at you.",
  }),
  reverseCrunch: ex("core.reverseCrunch", {
    name: "Reverse Crunches", emoji: "🔁", base: 20, unit: "reps",
    how: [
      "Lie on your back, knees bent, feet off the floor.",
      "Pull your knees toward your chest by curling your hips off the ground.",
      "Slowly lower back down.",
    ],
    kexNote: "Kex says these are like normal crunches, but backwards. Groundbreaking analysis.",
  }),
  toeTouches: ex("core.toeTouches", {
    name: "Standing Toe Touches", emoji: "👣", base: 25, unit: "reps",
    how: [
      "Lie on your back, legs straight up in the air.",
      "Reach both hands up and try to slap your toes.",
      "Slap them like they owe you money.",
    ],
    kexNote: "Kex slaps his toes so hard they filed a restraining order.",
  }),
  hangingKneeRaise: ex("core.hangingKneeRaise", {
    name: "Hanging Knee Raises", emoji: "🐒", base: 12, unit: "reps", needsPullupBar: true,
    how: [
      "Grab the pull-up bar, hands about shoulder width.",
      "Hang with arms straight.",
      "Pull your knees up toward your chest.",
      "Slowly lower back down without swinging.",
    ],
    kexNote: "Kex swings just for fun. You: do not swing. Boring but correct.",
  }),
  hangingLegRaise: ex("core.hangingLegRaise", {
    name: "Hanging Leg Raises", emoji: "🚀", base: 8, unit: "reps", needsPullupBar: true,
    how: [
      "Hang from the pull-up bar with straight arms.",
      "Keep legs straight and lift them until they're parallel to the floor (or higher).",
      "Lower slowly. No jerking. Kex hates jerks.",
    ],
    kexNote: "Kex's favorite way to end an argument. Just quietly does these.",
  }),
};

/* ---------------- UPPER ---------------- */
export const UPPER: Record<string, Exercise> = {
  pushup: ex("upper.pushup", {
    name: "Push-Ups", emoji: "💪", base: 20, unit: "reps",
    how: [
      "Hands under shoulders, body in a straight line.",
      "Lower your chest to almost touch the floor.",
      "Push back up like you're launching yourself into orbit.",
    ],
    kexNote: "Kex does these on one finger. He recommends starting with all ten.",
  }),
  pike: ex("upper.pike", {
    name: "Pike Push-Ups", emoji: "🔺", base: 12, unit: "reps",
    how: [
      "Start in downward-dog: butt in the air, hands and feet on the floor.",
      "Bend elbows to lower the TOP of your head toward the floor.",
      "Push back up. Feel the shoulder burn.",
    ],
    kexNote: "This is Kex's HARD one. His arms are tiny. Show him mercy.",
  }),
  superman: ex("upper.superman", {
    name: "Superman Holds", emoji: "🦸", base: 30, unit: "sec",
    how: [
      "Lie face down. Stretch arms in front, legs behind.",
      "Lift arms, chest, and legs off the floor at the same time.",
      "Fly. But don't actually try to fly out the window.",
    ],
    kexNote: "Kex insists his cape was in the wash.",
  }),
  diamond: ex("upper.diamond", {
    name: "Diamond Push-Ups", emoji: "💎", base: 10, unit: "reps",
    how: [
      "Put hands together under your chest forming a diamond with thumbs and index fingers.",
      "Lower your chest to your hands.",
      "Push up. Triceps will file a complaint.",
    ],
    kexNote: "Harder than regular push-ups. Kex actually struggles a bit on these.",
  }),
  wide: ex("upper.wide", {
    name: "Wide-Grip Push-Ups", emoji: "🦅", base: 15, unit: "reps",
    how: [
      "Set your hands wider than your shoulders.",
      "Lower slowly, chest toward the floor.",
      "Push up. Chest muscles say hello.",
    ],
    kexNote: "Kex calls these 'eagle push-ups' because he yells 'CAW!' at the top of each rep.",
  }),
  incline: ex("upper.incline", {
    name: "Incline Push-Ups", emoji: "🛋️", base: 20, unit: "reps",
    how: [
      "Place your hands on a couch, bench, or bed.",
      "Body straight, lower your chest to the surface.",
      "Push back up.",
    ],
    kexNote: "For when you want push-ups but also want to be almost lying on furniture.",
  }),
  decline: ex("upper.decline", {
    name: "Decline Push-Ups", emoji: "🪜", base: 12, unit: "reps",
    how: [
      "Put your feet on a chair or couch, hands on the floor.",
      "Lower your chest to the ground.",
      "Push back up.",
    ],
    kexNote: "Kex does these with his feet on the ceiling. Also a lie. Kind of.",
  }),
  tricepDip: ex("upper.tricepDip", {
    name: "Tricep Dips", emoji: "🪑", base: 15, unit: "reps",
    how: [
      "Sit on the edge of a sturdy chair, hands next to your hips.",
      "Slide your butt off the chair.",
      "Bend elbows to lower down. Push back up.",
    ],
    kexNote: "Kex uses a stack of encyclopedias. He calls it 'reading between dips.'",
  }),
  plankUpDown: ex("upper.plankUpDown", {
    name: "Plank Up-Downs", emoji: "🔃", base: 16, unit: "reps",
    how: [
      "Start in a high plank on your hands.",
      "Lower to your right forearm, then your left forearm.",
      "Push back up to your right hand, then your left hand.",
    ],
    kexNote: "Kex times these with his ringtone. Very confusing when someone actually calls.",
  }),
  archer: ex("upper.archer", {
    name: "Archer Push-Ups", emoji: "🏹", base: 8, unit: "reps",
    how: [
      "Set hands wider than shoulders in push-up position.",
      "Lower toward ONE hand while keeping the other arm straight.",
      "Push back up. Switch sides.",
    ],
    kexNote: "Kex nailed a bullseye with his abs once. Nobody saw it. Very sad.",
  }),
  shoulderTap: ex("upper.shoulderTap", {
    name: "Plank Shoulder Taps", emoji: "👋", base: 30, unit: "reps",
    how: [
      "High plank position, body straight.",
      "Tap your right hand to your left shoulder. Then left to right.",
      "Try not to wobble like a jelly.",
    ],
    kexNote: "Kex taps so gently he says his shoulders don't even notice.",
  }),
  bearCrawl: ex("upper.bearCrawl", {
    name: "Bear Crawl", emoji: "🐻", base: 30, unit: "sec",
    how: [
      "Get on hands and feet, knees hovering an inch off the floor.",
      "Crawl forward: opposite hand + opposite foot together.",
      "Growl if it helps. It helps.",
    ],
    kexNote: "Kex crawls to the fridge like this. Every time.",
  }),
  crabWalk: ex("upper.crabWalk", {
    name: "Crab Walk", emoji: "🦀", base: 30, unit: "sec",
    how: [
      "Sit on the floor. Place hands behind you, feet in front, hips lifted.",
      "Walk sideways on your hands and feet.",
      "Do not pinch anyone.",
    ],
    kexNote: "Kex challenges you to a crab-walk race. He will win.",
  }),
  // ------- PULL-UP BAR EXERCISES -------
  pullup: ex("upper.pullup", {
    name: "Pull-Ups", emoji: "🧗", base: 8, unit: "reps", needsPullupBar: true, isPullup: true,
    how: [
      "Grip the pull-up bar overhand, hands slightly wider than shoulders.",
      "Hang with arms straight, feet off the floor.",
      "Pull your chest toward the bar until your chin is above it.",
      "Lower slowly. No wiggling. Kex is watching.",
    ],
    kexNote: "Kex can do one pull-up. Just one. But he does it perfectly. And loudly.",
  }),
  chinup: ex("upper.chinup", {
    name: "Chin-Ups", emoji: "🤏", base: 10, unit: "reps", needsPullupBar: true, isPullup: true,
    how: [
      "Grip the bar underhand (palms facing you), hands shoulder width.",
      "Hang with straight arms.",
      "Pull yourself up until your chin passes the bar.",
      "Lower under control.",
    ],
    kexNote: "Chin-ups are Kex's warm-up. And also his cool-down. And also his lunch.",
  }),
  pullupNegative: ex("upper.pullupNegative", {
    name: "Pull-Up Negatives", emoji: "⬇️", base: 5, unit: "reps", needsPullupBar: true, isPullup: true,
    how: [
      "Jump or step up so your chin is above the pull-up bar.",
      "Hold there for a second.",
      "Lower yourself down as SLOWLY as humanly possible (aim for 5 seconds).",
      "Repeat. Cry gently.",
    ],
    kexNote: "Kex says slow is strong. Kex also says fast is fun. Both are true.",
  }),
  deadHang: ex("upper.deadHang", {
    name: "Dead Hang", emoji: "🪢", base: 30, unit: "sec", needsPullupBar: true,
    how: [
      "Grab the pull-up bar with both hands.",
      "Let your body hang, arms straight, feet off the floor.",
      "Just hang. Do not swing. Do not let go.",
    ],
    kexNote: "Kex hangs from the bar during breakfast. Cereal goes everywhere.",
  }),
  archerPullup: ex("upper.archerPullup", {
    name: "Archer Pull-Ups", emoji: "🏹", base: 4, unit: "reps", needsPullupBar: true, isPullup: true,
    how: [
      "Grip the bar wider than shoulders.",
      "Pull yourself up toward ONE hand while the other arm stays straight.",
      "Lower and switch sides. Each side counts as one rep.",
    ],
    kexNote: "Kex won an archery contest with these. There was no archery contest.",
  }),
  scapPullup: ex("upper.scapPullup", {
    name: "Scapular Pull-Ups", emoji: "🎯", base: 10, unit: "reps", needsPullupBar: true,
    how: [
      "Hang from the pull-up bar with straight arms.",
      "Without bending your elbows, pull your shoulder blades down and back.",
      "Your body should rise about an inch. Feel your back turn on.",
      "Lower slowly.",
    ],
    kexNote: "These look like nothing. They ruin you. Kex laughs.",
  }),
};

/* ---------------- LEGS ---------------- */
export const LEGS: Record<string, Exercise> = {
  squat: ex("legs.squat", {
    name: "Bodyweight Squats", emoji: "🏋️", base: 30, unit: "reps",
    how: [
      "Feet shoulder-width apart, toes slightly out.",
      "Sit back like there's an invisible chair.",
      "Lower until thighs are parallel to the floor.",
      "Stand up.",
    ],
    kexNote: "Kex can do 500 while reading a comic book.",
  }),
  lunge: ex("legs.lunge", {
    name: "Alternating Lunges", emoji: "🚶", base: 20, unit: "reps",
    how: [
      "Step one leg forward big.",
      "Lower your back knee toward the floor.",
      "Push back up. Alternate legs.",
    ],
    kexNote: "Kex won't know if you count both legs together. But he suspects.",
  }),
  wallSit: ex("legs.wallSit", {
    name: "Wall Sit", emoji: "🧱", base: 45, unit: "sec",
    how: [
      "Back flat against a wall.",
      "Slide down until your thighs are parallel to the floor.",
      "Pretend you're sitting on a real chair. Suffer.",
    ],
    kexNote: "Kex does this while writing his memoir.",
  }),
  jumpSquat: ex("legs.jumpSquat", {
    name: "Jump Squats", emoji: "🦘", base: 15, unit: "reps",
    how: [
      "Squat down.",
      "Explode UP into a jump.",
      "Land softly, immediately squat again.",
    ],
    kexNote: "Kex once jumped so high he was late for dinner because he was still airborne.",
  }),
  singleBridge: ex("legs.singleBridge", {
    name: "Single-Leg Glute Bridge", emoji: "🌉", base: 12, unit: "reps",
    how: [
      "Lie on your back, knees bent.",
      "Lift one leg straight up.",
      "Push through the other heel to raise your hips.",
      "Squeeze. Lower. Switch sides.",
    ],
    kexNote: "This is another one Kex actually finds hard. Solidarity.",
  }),
  bridge: ex("legs.bridge", {
    name: "Glute Bridges", emoji: "🏗️", base: 25, unit: "reps",
    how: [
      "Lie on your back, knees bent, feet flat.",
      "Push through your heels and lift your hips to the sky.",
      "Squeeze your glutes at the top. Lower.",
    ],
    kexNote: "Kex has cracked actual walnuts with these. Do not verify.",
  }),
  reverseLunge: ex("legs.reverseLunge", {
    name: "Reverse Lunges", emoji: "↩️", base: 20, unit: "reps",
    how: [
      "Stand tall.",
      "Step ONE leg backward and lower your back knee toward the floor.",
      "Push through the front heel to stand back up.",
    ],
    kexNote: "Same as lunges but backwards. Kex says this counts as time travel.",
  }),
  curtsy: ex("legs.curtsy", {
    name: "Curtsy Lunges", emoji: "👸", base: 20, unit: "reps",
    how: [
      "Stand tall. Step your right foot diagonally BEHIND your left leg.",
      "Bend both knees like you're doing an awkward royal bow.",
      "Push back up. Switch sides.",
    ],
    kexNote: "Kex does these to greet his stuffed animals. They love it.",
  }),
  calfRaise: ex("legs.calfRaise", {
    name: "Calf Raises", emoji: "🐮", base: 40, unit: "reps",
    how: [
      "Stand tall, feet hip-width apart.",
      "Rise onto the balls of your feet as high as you can.",
      "Lower slowly.",
    ],
    kexNote: "Kex's calves are the size of grapes. He does 2000 of these anyway.",
  }),
  sideLunge: ex("legs.sideLunge", {
    name: "Side Lunges", emoji: "🤸", base: 20, unit: "reps",
    how: [
      "Stand tall, feet together.",
      "Step your right foot WAY out to the side and bend that knee.",
      "Keep the other leg straight. Push back to center.",
    ],
    kexNote: "Kex uses these to dodge his little sister's toys.",
  }),
  pistolPrep: ex("legs.pistolPrep", {
    name: "Assisted Pistol Squats", emoji: "🔫", base: 10, unit: "reps",
    how: [
      "Hold onto a door frame or sturdy chair for balance.",
      "Extend one leg straight in front of you.",
      "Squat down on the other leg as low as you can.",
      "Push back up. Switch legs.",
    ],
    kexNote: "Kex struggles here because his balance is 80% chaos.",
  }),
  frog: ex("legs.frog", {
    name: "Frog Jumps", emoji: "🐸", base: 15, unit: "reps",
    how: [
      "Squat down into a low, wide stance.",
      "Explode forward and up into a jump.",
      "Land in a squat and immediately jump again.",
    ],
    kexNote: "Kex once out-jumped an actual frog. The frog still hasn't recovered.",
  }),
  stepUp: ex("legs.stepUp", {
    name: "Step-Ups", emoji: "📶", base: 20, unit: "reps",
    how: [
      "Find a sturdy step, chair, or bench.",
      "Step up with your right leg, bring the left up to meet it.",
      "Step down. Alternate leading legs.",
    ],
    kexNote: "Kex climbs the stairs 47 times a day for 'training.' Neighbors have complained.",
  }),
  gobletSquat: ex("legs.gobletSquat", {
    name: "Slow-Motion Squats", emoji: "🐢", base: 15, unit: "reps",
    how: [
      "Feet shoulder-width apart.",
      "Take FIVE seconds to lower into a squat.",
      "Pause at the bottom for one second.",
      "Take THREE seconds to stand back up.",
    ],
    kexNote: "Kex says slow squats build actual leg muscles.",
  }),
};

export const ALL_EXERCISES: Record<string, Exercise> = { ...CORE, ...UPPER, ...LEGS };
export function exerciseById(id: string): Exercise | undefined {
  return ALL_EXERCISES[id.split(".")[1] as string] ?? Object.values(ALL_EXERCISES).find(e => e.id === id);
}

export type Routine = { name: string; flavor: string; exerciseIds: string[] };

export const WORKOUTS: Record<
  Category,
  { title: string; subtitle: string; routines: Routine[] }
> = {
  core: {
    title: "CORE COURSE",
    subtitle: "The Beast Six Pack Program",
    routines: [
      { name: "SIX-PACK STARTER PACK", flavor: "The classic. Kex's Monday morning warm-up.",
        exerciseIds: [CORE.plank.id, CORE.crunches.id, CORE.bicycle.id, CORE.legRaises.id, CORE.hollow.id, CORE.russian.id, CORE.deadbug.id, CORE.vups.id] },
      { name: "BANANA BOAT BLAST", flavor: "Curled up, folded up, all-around miserable.",
        exerciseIds: [CORE.hollow.id, CORE.boat.id, CORE.vups.id, CORE.toeTouches.id, CORE.situps.id, CORE.reverseCrunch.id, CORE.flutter.id, CORE.plank.id, CORE.crunches.id] },
      { name: "KEX'S FAVORITE THINGS", flavor: "The exercises Kex laughs while doing.",
        exerciseIds: [CORE.bicycle.id, CORE.scissors.id, CORE.flutter.id, CORE.mountain.id, CORE.russian.id, CORE.windshield.id, CORE.legRaises.id, CORE.plank.id] },
      { name: "HOLD THE LINE", flavor: "Almost all holds. Almost no fun.",
        exerciseIds: [CORE.plank.id, CORE.hollow.id, CORE.sidePlank.id, CORE.boat.id, UPPER.superman.id, CORE.plank.id, CORE.sidePlank.id] },
      { name: "GRATE CHEESE ON THESE ABS", flavor: "Longer, meaner, cheesier.",
        exerciseIds: [CORE.crunches.id, CORE.reverseCrunch.id, CORE.bicycle.id, CORE.russian.id, CORE.vups.id, CORE.legRaises.id, CORE.flutter.id, CORE.scissors.id, CORE.plank.id, CORE.hollow.id] },
      { name: "HANGING IN THERE", flavor: "Pull-up bar core annihilation.",
        exerciseIds: [CORE.hangingKneeRaise.id, CORE.hangingLegRaise.id, CORE.plank.id, CORE.hangingKneeRaise.id, CORE.hollow.id, CORE.hangingLegRaise.id, CORE.russian.id] },
      { name: "SPIN CYCLE", flavor: "Twist. Twist. Twist. Fall over.",
        exerciseIds: [CORE.russian.id, CORE.bicycle.id, CORE.windshield.id, CORE.mountain.id, CORE.sidePlank.id, CORE.scissors.id, CORE.plank.id] },
      { name: "TINY DANCER", flavor: "Little movements. Big pain.",
        exerciseIds: [CORE.deadbug.id, CORE.hollow.id, CORE.flutter.id, CORE.scissors.id, CORE.reverseCrunch.id, CORE.crunches.id, CORE.legRaises.id, CORE.plank.id] },
      { name: "50 LBS OF FURY", flavor: "Kex's personal record routine. Good luck.",
        exerciseIds: [CORE.plank.id, CORE.vups.id, CORE.bicycle.id, CORE.russian.id, CORE.legRaises.id, CORE.hollow.id, CORE.mountain.id, CORE.sidePlank.id, CORE.boat.id, CORE.crunches.id] },
    ],
  },
  upper: {
    title: "UPPER BODY SIDE QUEST",
    subtitle: "Arms of Kex Legend",
    routines: [
      { name: "ARMS DEALER", flavor: "Push, push, push some more.",
        exerciseIds: [UPPER.pushup.id, UPPER.wide.id, UPPER.diamond.id, UPPER.tricepDip.id, UPPER.superman.id, UPPER.pushup.id] },
      { name: "SHOULDER SHOWDOWN", flavor: "Pike push-ups all over the place.",
        exerciseIds: [UPPER.pike.id, UPPER.shoulderTap.id, UPPER.plankUpDown.id, UPPER.pike.id, UPPER.superman.id, UPPER.tricepDip.id] },
      { name: "ZOO CRAWL", flavor: "Animal moves only. Growling encouraged.",
        exerciseIds: [UPPER.bearCrawl.id, UPPER.crabWalk.id, UPPER.bearCrawl.id, UPPER.shoulderTap.id, UPPER.wide.id, UPPER.crabWalk.id, UPPER.superman.id] },
      { name: "PUSH-UP PALOOZA", flavor: "Every push-up variety Kex has invented.",
        exerciseIds: [UPPER.pushup.id, UPPER.wide.id, UPPER.diamond.id, UPPER.archer.id, UPPER.incline.id, UPPER.decline.id, UPPER.pike.id] },
      { name: "KEX'S IMPOSSIBLE PULL-UP DAY", flavor: "Bar go up. Bar go down. Bar go up.",
        exerciseIds: [UPPER.deadHang.id, UPPER.scapPullup.id, UPPER.pullup.id, UPPER.chinup.id, UPPER.pullupNegative.id, UPPER.deadHang.id, UPPER.pullup.id] },
      { name: "BAR NONE", flavor: "Everything hangs from the pull-up bar.",
        exerciseIds: [UPPER.deadHang.id, UPPER.pullup.id, UPPER.chinup.id, UPPER.archerPullup.id, UPPER.pullupNegative.id, UPPER.scapPullup.id] },
      { name: "TRICEP TROUBLE", flavor: "Back-of-arm burnout.",
        exerciseIds: [UPPER.diamond.id, UPPER.tricepDip.id, UPPER.diamond.id, UPPER.plankUpDown.id, UPPER.tricepDip.id, UPPER.pike.id, UPPER.superman.id] },
      { name: "CAPE-IN-THE-WASH", flavor: "Superman pretends really hard.",
        exerciseIds: [UPPER.superman.id, UPPER.pushup.id, UPPER.shoulderTap.id, UPPER.superman.id, UPPER.bearCrawl.id, UPPER.wide.id, UPPER.superman.id] },
      { name: "EAGLE VS DIAMOND", flavor: "Wide, narrow, wide, narrow, cry.",
        exerciseIds: [UPPER.wide.id, UPPER.diamond.id, UPPER.wide.id, UPPER.diamond.id, UPPER.archer.id, UPPER.plankUpDown.id, UPPER.tricepDip.id] },
    ],
  },
  legs: {
    title: "LEG DAY OF DESTINY",
    subtitle: "Do Not Skip. Kex Is Watching.",
    routines: [
      { name: "SQUAT-O-RAMA", flavor: "Squats. In every possible flavor.",
        exerciseIds: [LEGS.squat.id, LEGS.gobletSquat.id, LEGS.jumpSquat.id, LEGS.sideLunge.id, LEGS.wallSit.id, LEGS.squat.id, LEGS.calfRaise.id] },
      { name: "LUNGE BUFFET", flavor: "Forward, back, sideways, sideways-behind.",
        exerciseIds: [LEGS.lunge.id, LEGS.reverseLunge.id, LEGS.sideLunge.id, LEGS.curtsy.id, LEGS.lunge.id, LEGS.wallSit.id, LEGS.calfRaise.id] },
      { name: "GLUTE GARAGE", flavor: "Butts on. Full send.",
        exerciseIds: [LEGS.bridge.id, LEGS.singleBridge.id, LEGS.squat.id, LEGS.curtsy.id, LEGS.bridge.id, LEGS.stepUp.id, LEGS.singleBridge.id] },
      { name: "JUMP AROUND", flavor: "Explosive. Neighbors will complain.",
        exerciseIds: [LEGS.jumpSquat.id, LEGS.frog.id, LEGS.jumpSquat.id, LEGS.stepUp.id, LEGS.frog.id, LEGS.wallSit.id, LEGS.calfRaise.id] },
      { name: "TINY LEGS BIG PROBLEM", flavor: "Kex-approved endurance marathon.",
        exerciseIds: [LEGS.squat.id, LEGS.lunge.id, LEGS.bridge.id, LEGS.calfRaise.id, LEGS.reverseLunge.id, LEGS.wallSit.id, LEGS.squat.id, LEGS.stepUp.id, LEGS.calfRaise.id] },
      { name: "BALANCE OF POWER", flavor: "Everything on one leg. Kex is furious.",
        exerciseIds: [LEGS.singleBridge.id, LEGS.pistolPrep.id, LEGS.curtsy.id, LEGS.singleBridge.id, LEGS.pistolPrep.id, LEGS.stepUp.id, LEGS.wallSit.id] },
      { name: "SLOW & LOW", flavor: "Every rep painfully controlled.",
        exerciseIds: [LEGS.gobletSquat.id, LEGS.wallSit.id, LEGS.gobletSquat.id, LEGS.bridge.id, LEGS.reverseLunge.id, LEGS.gobletSquat.id, LEGS.calfRaise.id] },
      { name: "THE FROG PRINCE", flavor: "Jumping, curtsying, ribbiting.",
        exerciseIds: [LEGS.frog.id, LEGS.curtsy.id, LEGS.frog.id, LEGS.jumpSquat.id, LEGS.sideLunge.id, LEGS.frog.id, LEGS.wallSit.id, LEGS.calfRaise.id] },
    ],
  },
};

/* ---------------- TOURNAMENTS ---------------- */
// Anchor: Monday July 6, 2026. Every 2 weeks a new challenge cycles through the list.
export const TOURNAMENT_ANCHOR = new Date("2026-07-06T00:00:00Z").getTime();
export const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export type TournamentDef = {
  id: string;
  name: string;
  description: string;
  scoring: "pullup_workouts" | "plank_seconds" | "longest_streak" | "workouts_in_a_day" | "leg_workouts";
  scoreLabel: string;
};

export const TOURNAMENTS: TournamentDef[] = [
  {
    id: "impossible-pullup",
    name: "KEX'S IMPOSSIBLE PULL-UP CHALLENGE",
    description: "The user who completes the most pull-up workouts (any routine containing pull-ups) wins. Kex will not congratulate the winner. He never does.",
    scoring: "pullup_workouts",
    scoreLabel: "pull-up workouts",
  },
  {
    id: "absolute-abdominal-agony",
    name: "THE ABSOLUTE ABDOMINAL AGONY CHALLENGE",
    description: "Whoever logs the most plank seconds wins. NOTE: you cannot only do planks — you must complete entire workouts. If your workout doesn't include a plank? You'll just have to DO ANOTHER ONE!! ☠️",
    scoreLabel: "plank seconds",
    scoring: "plank_seconds",
  },
  {
    id: "kex-istancy",
    name: "THE KEX-ISTANCY CHALLENGE",
    description: "The user with the longest streak at the end of the tournament wins. Sundays are rest days and don't break your streak.",
    scoreLabel: "day streak",
    scoring: "longest_streak",
  },
  {
    id: "kex-didnt-sit-on-couch",
    name: "THE 'KEX DIDN'T GET HIS MUSCLES BY SITTING ON THE COUCH BEING LAZY' CHALLENGE",
    description: "Whoever completes the most workouts in a single day (during this challenge) wins.",
    scoreLabel: "workouts in one day",
    scoring: "workouts_in_a_day",
  },
  {
    id: "bulletproof-booty",
    name: "KEX'S BULLETPROOF BOOTY CHALLENGE",
    description: "The user who completes the most leg workouts wins.",
    scoreLabel: "leg workouts",
    scoring: "leg_workouts",
  },
];

export function currentTournamentIndex(now = Date.now()): number {
  const diff = Math.max(0, now - TOURNAMENT_ANCHOR);
  return Math.floor(diff / TWO_WEEKS_MS) % TOURNAMENTS.length;
}

export function tournamentWindow(index: number, now = Date.now()) {
  // find the start of the current cycle
  const diff = Math.max(0, now - TOURNAMENT_ANCHOR);
  const cyclesSinceAnchor = Math.floor(diff / TWO_WEEKS_MS);
  // shift back to the passed index within the current rotation
  const cycleStart = TOURNAMENT_ANCHOR + cyclesSinceAnchor * TWO_WEEKS_MS;
  return { start: new Date(cycleStart), end: new Date(cycleStart + TWO_WEEKS_MS) };
}

/* ---------------- TROPHY DEFINITIONS ---------------- */
export type Trophy = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: "streak" | "workouts" | "tournament" | "difficulty";
};

export const STREAK_MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];
export const WORKOUT_MILESTONES = [1, 5, 10, 20, 50, 100, 500, 1000];
export const DIFFICULTY_MILESTONES = [1, 5, 10, 25, 50];

export function buildTrophyList(): Trophy[] {
  const trophies: Trophy[] = [];
  for (const n of STREAK_MILESTONES) {
    const label = n === 1 ? "1 day streak" : n === 7 ? "1 week streak" : n === 14 ? "2 week streak" : n === 30 ? "1 month streak" : n === 365 ? "1 YEAR streak" : `${n} day streak`;
    trophies.push({ id: `streak-${n}`, name: label, description: `Work out ${n} day(s) in a row (Sundays are rest — they don't count against you).`, emoji: n >= 365 ? "🏆" : n >= 30 ? "🔥" : "⚡", category: "streak" });
  }
  for (const n of WORKOUT_MILESTONES) {
    trophies.push({ id: `workouts-${n}`, name: `${n} workout${n === 1 ? "" : "s"} completed`, description: `Complete ${n} total workout${n === 1 ? "" : "s"}.`, emoji: n >= 500 ? "👑" : n >= 100 ? "💎" : "🎖️", category: "workouts" });
  }
  for (const d of DIFFICULTIES) {
    for (const n of DIFFICULTY_MILESTONES) {
      trophies.push({
        id: `diff-${d.id}-${n}`,
        name: `${n}× ${d.name}`,
        description: `Complete ${n} workout${n === 1 ? "" : "s"} at ${d.name} difficulty.`,
        emoji: d.id >= 5 ? "☢️" : d.id >= 4 ? "🔥" : d.id >= 3 ? "💪" : "⭐",
        category: "difficulty",
      });
    }
  }
  for (const t of TOURNAMENTS) {
    trophies.push({ id: `tournament-${t.id}`, name: `${t.name} — Champion`, description: `Win the "${t.name}" tournament.`, emoji: "🏅", category: "tournament" });
  }
  return trophies;
}

export const ALL_TROPHIES = buildTrophyList();

/* ---------------- STREAK ---------------- */
// Compute streak from a set of unique workout ISO date strings (YYYY-MM-DD, in local time).
export function computeStreak(dateSet: Set<string>, today = new Date()): number {
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  // Walk backwards. Today with no workout doesn't break streak yet.
  let firstIter = true;
  while (true) {
    const day = cursor.getDay(); // 0 = Sunday
    const key = iso(cursor);
    if (day === 0) {
      // Sunday — rest day, skip without breaking
      cursor.setDate(cursor.getDate() - 1);
      firstIter = false;
      continue;
    }
    if (dateSet.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      firstIter = false;
      continue;
    }
    if (firstIter) {
      // today has no workout but doesn't break — check yesterday
      cursor.setDate(cursor.getDate() - 1);
      firstIter = false;
      continue;
    }
    break;
  }
  return streak;
}
