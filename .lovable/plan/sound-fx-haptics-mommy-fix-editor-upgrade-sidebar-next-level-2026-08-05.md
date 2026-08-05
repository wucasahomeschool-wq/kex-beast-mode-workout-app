# Sound FX, Haptics, Mommy Fix, Editor Upgrade, Sidebar, Next-Level Animation

## 1. Sound effects + haptics (edit this list freely)

All sounds are generated in-app with WebAudio (no downloads, instant, offline-safe). A global mute toggle plus a volume slider live in the sidebar; preference is remembered per device. Every sound respects "silent" mode and never plays more than one of the same cue at once. Haptics use `navigator.vibrate` on Android/Chrome mobile (iOS ignores it silently) and are tied to the same on/off switch.

### UI / navigation

- Button tap: short soft "click" pop. Haptic: 10ms tick.
- Big yellow CTA tap: deeper "thud" with a rising blip. Haptic: 20ms.
- Disabled tap: low "bonk" buzz. Haptic: double 15ms buzz.
- Screen open (sidebar item, back): quick upward "whoosh".
- Sidebar open/close: short swipe whoosh.
- Toast appears: light "ding".
- Dialog/modal open: soft "pop"; close: reverse pop.

### Workout flow

- START WORKOUT: comic "SMASH" — impact boom + zoom-line sizzle. Haptic: 60ms heavy.
- Workout prepping ring: quiet looping hum that fades out when the workout opens.
- Routine name slam-in: bass drum hit. Haptic: 40ms.
- READY / SET: two rising beeps. Haptic: 15ms each.
- GO!: bright triple-blast fanfare. Haptic: 30-40-30 pattern.
- Timer tick: soft tick each second (only for the last 10 seconds, so it isn't annoying).
- Last 3 seconds: sharper, higher urgent ticks. Haptic: 10ms per tick.
- Timer complete: satisfying "ping-DING" chime. Haptic: 30ms.
- DONE — NEXT tap: rubber-stamp "thunk". Haptic: 25ms.
- Exercise finished checkmark: bright "stamp + sparkle".
- Progress notch pop: tiny "tick" per completed step.
- Stretch section: soft chime, gentler and quieter; ticks removed; airy pad tone instead of urgent beeps.
- Quit workout: descending sad "wah".

### Rewards

- Workout complete: big fanfare (rising chord + cymbal-ish burst) under the confetti. Haptic: long celebratory pattern.
- Stats count-up: rapid soft "blip blip blip" while numbers roll, ending on a chime.
- Streak flame roll-up: whoosh + crackle.
- Koins earned: coin "cha-ching" cascade, pitch rising per coin, then a gold "clink" when the balance lands. Haptic: 15ms per coin batch.
- Trophy unlock: full orchestral-ish sting (rising sweep + shimmering bells). Haptic: heavy pattern.
- Purchase (freeze/rest day): coin drain "shhk" plus a metallic shield "clang". Haptic: 40ms.
- Insufficient koins: dry "nope" buzz.

### Tournaments

- New tournament reveal: paper-unfold rustle + typewriter clicks while the name types in.
- Leaderboard rows: soft staggered "tick" per row (capped at ~8 so it doesn't machine-gun).
- Your row highlight: shimmer sweep sound.
- Countdown seconds: quiet pulse tick.

### Mommy's course (softer palette)

- Taps: soft marimba notes instead of comic clicks.
- Day complete: warm harp glissando + heart-pop sounds. Haptic: gentle double buzz.
- Rest day: slow breathing pad tone (in/out).
- Too easy / too hard: two-note confirm.

### Misc

- Sign in success: short welcome riff.
- Editor mode on/off: robotic blip.

## 2. Mommy course bug — confirmed real, two causes

Verified in the code:

1. `TOO EASY?` and `TOO HARD?` only change the difficulty offset — they never advance the day. Only the third button (`JUST RIGHT — ADVANCE`) moves you forward. A user tapping "too hard" every session stays on Day 1 forever, which is exactly the reported behavior.
2. Progress is advanced inside a React state-updater that also writes to storage, and the screen navigates away in the same click. When the screen unmounts first, the write is skipped or double-applied, so the day silently doesn't stick.

Fix: advance the day on every finish path (including too easy / too hard, which will apply the new level to the *next* day rather than replaying the current one), and move the storage write out of the state updater so it always commits before navigating. Both Mommy screens will read from one shared progress source so the plan view can't show stale data. Also make the "streak broken" reset show a clear "restarted at Day 1" state that then progresses normally.

## 3. Editor upgrades

**Multi-line editing.** Tapping a pressable with several lines of text now shows a line picker: each text line inside that button is listed with a preview of its content, and you pick which one to edit. Same for any element containing multiple text lines (cards, stat tiles, headings + subtitles). Each line keeps its own independent text and style override.

**Koin economy settings panel (EDITOR only).** A gear button in the sidebar opens a settings panel with sliders, saved to the backend so all devices see the same economy:

- Global koin value multiplier (scales every earning at once).
- Per-difficulty workout reward (Level 1 through Level 5, each its own slider).
- Mommy course workout reward.
- Mercy plea reward.
- Ongoing streak bonus per day.
- Trophy unlock rewards: streak trophies (per-milestone factor), workout-count trophies, difficulty trophies, tournament-win trophies.
- Tournament placement rewards: 1st, 2nd, 3rd, top-10, participation.
- Cost side: streak freeze base cost, cost added per streak day, rest-day discount, buy-ahead discount per day.
- Live preview line showing example results ("Level 3 workout = 28 koins", "Freeze at 10-day streak = 105 koins") plus a RESET TO DEFAULTS button.

## 4. Sidebar navigation

A slide-out sidebar (hamburger in the header, closes by tapping outside or the X) holds: Tournaments, Streak Board, Trophies, Koin Shop, Preferences, and Mommy ♥️ — removed from the home screen grid. Stats move into the sidebar header area: streak count and workout count only; the Plank Seconds stat is deleted everywhere it appears on the home screen. Koin balance and the Plead For Mercy button stay on the home screen so the primary flow is still one tap. Sound/haptics toggles and (for the editor) the koin settings button live at the bottom of the sidebar.

## 5. Animation, next level

- **Timers shake for real**: the ring and the number jitter continuously while running, escalating from a subtle 1px wobble to a violent shake in the last 3 seconds, with the ring flashing red and the digits punching in scale each tick.
- **DONE — NEXT stamp**: tapping slams a big green checkmark stamp diagonally across the card with a rubber-stamp squash, ink-splat edges, and a dust puff; the card then flips away and the next exercise slides in.
- **Exercise cards**: 3D flip/slide transitions between exercises instead of a plain swap, with the emoji doing a little bounce entrance.
- **GO!**: full-screen white flash, radial speed lines, screen shake, and the word exploding outward in comic lettering.
- **Progress bar**: liquid fill with a leading glow and a notch that pops and sparkles at each completed step.
- **Home screen**: parallax tilt on course cards (follows pointer/gyro), yellow CTA with a traveling shine sweep and breathing glow, stat numbers that spin like slot reels on mount.
- **Koins**: coins arc along curved paths to the balance chip, chip juices (squash, gold flash, ring pulse), and the number rolls with a blur.
- **Trophy unlock**: trophy punches in with rotation, rays sweep, sparkles orbit, then it slam-lands into the grid with a shockwave that ripples nearby tiles.
- **Workout complete**: staged sequence — flash, confetti cannon from both bottom corners, "WORKOUT COMPLETE" letters dropping in one by one, then stats counting up with pulsing chips and a flame that flickers.
- **Leaderboard**: rows fly in from alternating sides; your row gets a glowing sweep and a rank badge that spins in.
- **Tournament reveal**: card unfolds, title types itself out, NEW badge pulses, background gets a comic halftone drift.
- **Mercy dialog**: Kex's response types out with a little bounce per line.
- **Mommy course**: same juice but gentle — slow blooms, floating petals on day complete, breathing pulse on rest days.
- **Global press feel**: every pressable squashes and its comic shadow collapses, with a subtle spring back overshoot.
- `prefers-reduced-motion` still collapses everything to simple fades, and all sound stays optional.

## Technical notes

- New `src/lib/kex-sound.ts`: WebAudio synth (no asset files), single unlocked AudioContext created on first user gesture, per-cue functions, master mute/volume in localStorage, plus `haptic(pattern)` wrapping `navigator.vibrate`. A tiny `useKexFx()` hook fires sound + haptic + animation together so call sites stay one-liners.
- Animation additions extend `src/styles.css` keyframes and `src/components/kex-fx.tsx` (StampCheck, GoFlash, ParallaxCard, SlotNumber, LiquidProgress, RankRow).
- Mommy fix in `src/lib/kex-mommy.ts` + the two Mommy components in `src/routes/index.tsx`.
- Editor line picker in `src/lib/kex-copy.tsx` (`openFor` collects all text nodes instead of the first).
- Koin economy stored as a backend-backed config row and read through a `useKoinEconomy()` hook that `src/lib/kex-koins.ts` consumes, so all reward math flows through the editable values.
- Sidebar built with the existing shadcn sidebar primitives; home screen grid trimmed accordingly.
- All new user-visible strings go through the editor copy layer.