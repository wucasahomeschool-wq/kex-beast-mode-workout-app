# Phone-shaped Kex: full-screen flow, real sound library, Mommy streak fix

## Part 0 — Leftovers from last run

Sidebar, editor toggle, koin sliders and the AI regimen builder all shipped. What never got wired into the real screens: the stamp-checkmark, liquid progress bar, slot-machine numbers, trophy reveal, drop-in letters and typewriter effects. They exist as components and get used by the new full-screen flow below.

## Part 1 — Phone frame (mobile-first everywhere)

On any screen wider than a phone, the whole app renders inside a fixed portrait column (max ~430px wide, full height, centered) with the leftover space on the sides left as blank backdrop. One layout to design for, on phone and desktop alike. Every screen becomes a fixed-height, no-scroll "window" wherever the content fits; only genuinely long lists (leaderboards, exercise library, preferences) scroll inside their own window.

## Part 2 — Full-screen window flow

Everything below is one thing at a time, swipe/arrow navigation, with slide transitions between windows.

### Starting a workout
1. **Pick your mode** — 4 big cards, one per screen height: KEX WORKOUT / CUSTOM WORKOUT / AI REGIMEN / MOMMY ♥. (Hidden while a regimen is active — that goes straight to today's regimen workout, plus the quit escape.)
2. **Pick your course** — one course image at a time, full-bleed, left/right arrows + swipe, dots at the bottom showing position.
3. **Pick your difficulty** — one level at a time, same arrows/swipe, level name slams in on change.
4. **Confirm** — routine name, exercise count, estimated time, one START WORKOUT button. No scrolling from step 1 to here.

### Inside a workout
5. **Exercise intro window** (2s, auto-advances) — Kex image + exercise name slamming in, "3 of 11" corner counter.
6. **Exercise window** — name, how-to, "KEX SAYS", and one button: DONE–NEXT (reps) or START EXERCISE (timed).
7. **Countdown window** (timed only) — full-screen READY / SET / GO! over 3 seconds, then back to the exercise window with the timer live and shaking as it nears zero.
8. **Exercise complete window** — same layout as the intro, but the name is already there and a big green checkmark slams in, then auto-advances to the next intro.
9. **Workout complete window** — confetti, koins counting up on slot-machine digits, streak number rolling up, then back to home.

### Other full-screen windows in the same style
- **Rest between exercises** (optional short breather window with a liquid progress bar).
- **Tournament reveal** — new tournament unfolds, name typed out, rules revealed, then the leaderboard as its own window.
- **Trophy unlocked** — takeover with the trophy reveal animation.
- **Koins earned** — takeover on big payouts (regimen jackpot, tournament win) instead of the small toast.
- **Mercy plea** — reason picker one option at a time, then Kex's reply as its own window.
- **Mommy course** — day card, exercise intro/complete windows in the soft green theme, rest day as its own window.
- **Regimen builder** — length, difficulty, workouts-per-day and the goal text box each as their own step, then a "building your plan" window, then the day-1 window.
- **Preferences / Koin shop / Sidebar panels** — kept as scrollable windows, since they are genuinely lists.

## Part 3 — Real sound effects (audio sprite)

The uploaded master file gets hosted as an app asset and played through a sprite player (one buffer, seek to offset, stop after the clip length) layered on top of the existing synthesized FX. Mapping:

| Sound | Used for |
| --- | --- |
| start_workout | START WORKOUT pressed |
| 3-2-1_countdown | the READY/SET/GO countdown window |
| success_1 | each exercise completed (checkmark stamp) |
| success_2 | Mommy day complete / regimen day complete |
| finish_workout | workout complete window |
| cha-ching | koins awarded |
| coins_falling_into_bag | koin shop purchase |
| cannon | trophy unlocked + regimen jackpot |
| glass_breaking | streak broken / regimen quit |
| dun-dun-duuuunnn | hardest difficulty selected, and the tournament reveal |
| double_pop | window-to-window advance (course/difficulty arrows) |
| swipe | sidebar open/close, card swipes |
| error | not enough koins, invalid action, mercy already used |

Existing ticks, hums and Mommy chimes stay as they are. Sound/vibration toggles in Preferences keep working for both layers.

## Part 4 — Mommy streak parity

The code does insert a `mommy` row into the shared workout history on day completion and on rest-day completion, and the streak calculation counts every history row regardless of category — so the exact failure isn't confirmed yet. First step is to reproduce a Mommy day end-to-end and watch whether the row actually lands (only one `mommy` row exists in history so far). Then, regardless of what reproduction shows, harden it:

- log the day the moment it completes rather than as a side effect of rendering the "day done" screen, so quitting or bouncing between screens can't skip it;
- retry and surface a visible error if the write fails instead of failing silently;
- make sure the day-completion write is not blocked by the shared "already logging" guard;
- refresh streak/workout counts immediately after, so the number on screen matches;
- confirm Mommy days pay koins like any other workout and Sundays stay free.

## Technical notes

- Phone frame: a shell wrapper in the root layout with `h-[100dvh]` and a fixed max-width column; screens become flex columns with their own internal overflow instead of one long page.
- Window flow: a small step-state machine per flow (mode → course → difficulty → confirm; intro → exercise → countdown → done) with directional slide transitions and swipe handling; existing components (`StampCheck`, `LiquidProgress`, `SlotNumber`, `TrophyReveal`, `DropLetters`, `TypeOut`) get used at last.
- Sprite audio: uploaded MP3 becomes a CDN asset, decoded once into an AudioContext buffer, played via offset/duration through the same master gain as the synth FX so the volume slider covers both; falls back to the synth cue if decode fails.
- Mommy fix: move the history write into the completion handler, keep it idempotent per day, and verify against the shared streak calculation.
