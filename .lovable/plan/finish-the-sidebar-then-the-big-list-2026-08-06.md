# Finish the sidebar, then the big list

## Part 1 — Finish last run's leftovers

1. **Sidebar** (was planned, never built). Slide-out menu holding: Tournaments, Streak Board, Trophies, Koin Shop, Preferences, Mommy ♥️, plus your streak count and workout count. Plank Seconds stat removed everywhere. Home screen keeps only: Mercy plea, course picker, START WORKOUT, Custom Builder.
2. **Next-level effects wiring**: timers shake as they count down, DONE–NEXT gets stamped with a checkmark, liquid progress bar, tournament card unfold on first view, coin flights and trophy reveals — the components already exist, they just need to be used on the real screens.

## Part 2 — Your list

### 1. Remove the AI workout checker
Delete the silent pre-workout AI pass and its loading ring. Workouts start instantly.

### 2. AI Regimen Builder (biggest item)
- New sidebar entry: **AI REGIMEN**.
- Form: length (1–60 days), difficulty, workouts per day (1–3), and a free-text goal box ("six pack by end of month", "soccer tournament in a week").
- AI returns a day-by-day regimen built only from real exercises in the app (so every workout is playable, like Mommy's course).
- Saved to the backend so it follows you across devices.
- While a regimen is active, the normal course picker and custom builder are hidden — only regimen workouts are offered, plus a "quit regimen" escape.
- Regimen workouts count toward streak and pay koins like normal workouts. Finishing the whole regimen pays a **jackpot** scaled by length × difficulty, with its own slider in the editor settings.

### 3. Sound + vibration on mobile
Diagnosis: audio is only unlocked in a few places and most buttons never call the sound engine, so on mobile (which blocks audio until a real touch) almost nothing plays; vibration also silently no-ops on iOS. Fix: unlock audio on the very first tap anywhere, resume it whenever the app returns to foreground, route every button/timer/completion through the sound engine, and add a Sound/Vibration toggle + volume in Preferences. iOS Safari cannot vibrate at all — the app will say so instead of pretending.

### 4. Mommy streak parity
Mommy workout days **and** Mommy rest days both log to the shared history, so they hold your normal streak exactly like a Kex workout (Sundays still free).

### 5. Editor becomes a tool, not an account
- No more EDITOR login screen / signing out of your account.
- Sidebar gets **EDIT MODE** toggle. First use asks for the same password; after that it flips on/off freely and drops you right back on the page you were on.
- "Interact vs Edit" popup is gone — edit mode off = normal app, edit mode on = tap any text/box to edit.

### 6. Koin valuation panel in the sidebar
All koin sliders (workout payouts per level, mommy, mercy, streak/day, trophies, tournament placements, shield prices, discounts, regimen jackpot, global multiplier) move into a sidebar panel gated by the editor password.

### 7. More exercises and preset workouts
New exercises across core/upper/legs/cardio/soccer (including more pull-up-bar and stretching moves), plus additional hand-picked routines per category so the library and randomizer have more to draw from.

## Technical notes
- Regimen: new `regimens` table (owner-scoped RLS + grants) holding the generated plan JSON and progress; generation via a server function on Lovable AI with a strict schema validated against the real exercise ids, so a bad AI reply can never produce an unplayable day.
- Editor tool: password check stays server-side; edit mode becomes app state instead of an auth identity, and the `app_copy`/economy writes keep using the same authorized save path.
- Sound: single AudioContext unlocked from a global first-touch listener + `visibilitychange` resume; haptics feature-detected with an honest unsupported state.
- Mommy rest days insert a `mommy` log row so the shared streak calc sees them.
