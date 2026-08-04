# Make Kex Move: Animation, Smarter AI Coach, Freeze Fix

## 1. Animation — full list

### App shell & navigation

- **Screen transitions**: every screen swap (home → workout → done, tournaments, trophies, shop, prefs) slides/fades in with a comic-style pop (`scale-in` + `fade-in`, ~250ms).
- **Home cards stagger**: course cards and stat tiles fade-up one after another (40ms delay each) on first paint.
- **Scroll reveal**: sections below the fold pop in when scrolled into view (IntersectionObserver + `animate-fade-in`).
- **Sticky header**: shrinks/darkens slightly on scroll.

### Buttons & pressables (global)

- **Press feedback**: every button squashes on press (scale 0.94) and springs back; comic shadow offset collapses so it looks physically pushed.
- **Hover**: lift + shadow grow on desktop.
- **Big yellow CTAs**: idle "breathing" glow pulse so the primary action always looks alive.
- **Disabled**: gentle shake when tapped while disabled (e.g. custom workout under 5 exercises).

### START WORKOUT flow

- **Smash**: button fires a comic "impact" burst — radial zoom lines expand behind it, button scales up then out.
- **AI loading**: while the AI coach tunes the workout, a spinning comic loading ring (rotating dashed circle + pulsing dots) shows over a dimmed panel; capped so a slow/failed call still moves on. No mention of AI — label is a generic "PREPARING KEX WORKOUT..." style line (editable text).
- **Workout intro**: routine name slams in from above with a slight overshoot + screen shake.

### During a workout

- **Exercise card entry**: each new exercise slides in from the right, old one slides out left.
- **READY/SET/GO countdown**: each number pops in huge with scale-down + fade, color flashes, final "GO!" flashes the screen and shakes.
- **Timer ring**: circular progress ring drains as the timer runs with a slight shake every second; last 3 seconds it pulses red, ticks bigger and shakes harder.
- **Rep exercises**: rep count pulses each time it's displayed; the "DONE — NEXT" button gets a satisfying stamp animation on tap.
- **Exercise finished**: green checkmark stamps over the card with a spring, card flips/slides away.
- **Progress bar**: animated fill between exercises, with a small notch pop at each completed step.
- **Stretch section**: gentler, slower fade-in (calmer tone) to signal cooldown. All stretching exercises will have less shaking, a lighter blue color scheme for the text, and overall a less stressful, more relaxing feel.

### Workout complete

- **Finish sequence**: confetti/star burst, "WORKOUT COMPLETE" text slams in with shake, then stats count up from 0 (workouts, streak).
- **Streak flame**: streak number rolls up like an odometer and the flame icon pulses.

### Koins & rewards

- **Koin popup**: existing "+N 🪙" banner upgraded — coins fly from the center toward the balance chip, balance counts up, chip flashes gold.
- **Trophy unlock**: full-screen takeover — trophy scales in from tiny with rotation, light rays sweep behind it, sparkles, then it settles into the trophy grid.
- **Locked → unlocked**: trophy tile flips from grey to colored.
- **Purchase (freeze/rest day)**: coins drain animation, shield icon stamps onto the calendar date with a shockwave.

### Tournaments

- **New tournament reveal**: first time you see a tournament, a card unfolds/flips open with the name typing in and the description fading up; "NEW" badge pulses. Tracked per user so it only plays once per tournament.
- **Leaderboard**: rows stagger in; your own row highlights with a glow sweep; rank changes animate position.
- **Countdown to next tournament**: ticking pulse on the seconds, and a slight shake every second.

### Mommy's course

- Same system, but softer: slower easings, gentle fades, green glow instead of comic slams. Day-complete gets a heart burst; rest days get a calm breathing animation.

### Misc

- Toasts slide in from the top with a bounce.
- Dialogs/modals scale in with backdrop blur fade.
- Editor mode: editable elements get a subtle dashed outline shimmer so it's obvious what's tappable.
- Respect `prefers-reduced-motion` — animations reduce to simple fades.
  &nbsp;

## 2. AI coach may change exercises

Extend the coach so it can swap exercises, not just amounts: it gets the full pool of allowed exercises for the category (plus your excluded-exercise preferences so it never picks an omitted one), and may replace up to ~1/3 of the session with safer/better-balanced alternatives, keeping the same exercise count and length. Amount adjustments stay capped as they are. Any invalid or unknown exercise id in the response is dropped; total failure still silently changes nothing.

## 3. Streak freezes = yesterday only

Freezes become purchasable only for yesterday (within the 24h window). Today and all future dates are Rest Days only. The shop UI splits into "FREEZE YESTERDAY" and "BUY REST DAYS" so it's unambiguous, and the yesterday option disappears once the window closes or that day is already covered.

## Do NOT build the fourth request, "Editor koin economy panel". I've changed my mind, that will wait for the next run no matter what.

## Technical notes

- Animation lives in `src/styles.css` as keyframes/utilities plus a small `src/lib/kex-motion.ts` (reveal hook, count-up hook, reduced-motion helper) and a few presentational components (burst, confetti, timer ring, loading ring, trophy reveal). No business-logic changes for animation.
- AI change goes in `src/lib/kex-ai-coach.functions.ts` (schema + validation) and the call site in `src/routes/index.tsx`.
- Freeze rule changes `shieldableDates`/`shieldCost` usage in `src/lib/kex-koins.ts` and the shop UI.
- All new user-visible strings go through the `<T>` editor layer and are seeded into Cloud copy.