// Kex sound FX + haptics. Everything is synthesized with WebAudio — no asset files,
// works offline, instant. One AudioContext, unlocked on the first user gesture.

export type SoundPrefs = { sound: boolean; haptics: boolean; volume: number };

const PREF_KEY = "kex-sound-prefs";
const DEFAULTS: SoundPrefs = { sound: true, haptics: true, volume: 0.7 };

let prefs: SoundPrefs = DEFAULTS;
let prefsLoaded = false;

export function loadSoundPrefs(): SoundPrefs {
  if (prefsLoaded) return prefs;
  prefsLoaded = true;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) prefs = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SoundPrefs>) };
  } catch {}
  return prefs;
}

export function saveSoundPrefs(next: SoundPrefs) {
  prefs = next;
  prefsLoaded = true;
  try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch {}
}

/* ---------------- audio graph ---------------- */

type Ctor = typeof AudioContext;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  loadSoundPrefs();
  if (!prefs.sound) return null;
  if (!ctx) {
    const AC: Ctor | undefined = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
    master = ctx.createGain();
    master.gain.value = prefs.volume;
    master.connect(ctx.destination);
  }
  if (master) master.gain.value = prefs.volume;
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call once from a real user gesture so mobile browsers allow audio. */
export function unlockAudio() { audio(); }

type ToneOpts = {
  freq: number;
  to?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  attack?: number;
};

function tone(o: ToneOpts) {
  const c = audio();
  if (!c || !master) return;
  const t0 = c.currentTime + (o.delay ?? 0);
  const dur = o.dur ?? 0.12;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.to && o.to !== o.freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
  const peak = o.gain ?? 0.25;
  const atk = o.attack ?? 0.006;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur = 0.2, gain = 0.18, delay = 0, hp = 400) {
  const c = audio();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "highpass";
  filt.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(g).connect(master);
  src.start(t0);
}

/** Vibration on Android/Chrome mobile; silently ignored elsewhere. */
export function haptic(pattern: number | number[]) {
  loadSoundPrefs();
  if (!prefs.haptics) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try { navigator.vibrate(pattern); } catch {}
}

/* ---------------- one looping cue (workout prep hum) ---------------- */
let humStop: (() => void) | null = null;

export const sfx = {
  /* UI */
  tap() { tone({ freq: 620, to: 900, dur: 0.05, type: "square", gain: 0.09 }); haptic(10); },
  bigTap() { tone({ freq: 150, to: 90, dur: 0.14, type: "sine", gain: 0.3 }); tone({ freq: 500, to: 900, dur: 0.1, type: "triangle", gain: 0.12, delay: 0.03 }); haptic(20); },
  bonk() { tone({ freq: 120, to: 70, dur: 0.18, type: "sawtooth", gain: 0.2 }); haptic([15, 40, 15]); },
  whoosh() { noise(0.24, 0.13, 0, 700); },
  swipe() { noise(0.16, 0.1, 0, 900); haptic(8); },
  ding() { tone({ freq: 1180, dur: 0.16, type: "sine", gain: 0.16 }); },
  popOpen() { tone({ freq: 380, to: 780, dur: 0.1, type: "sine", gain: 0.16 }); },
  popClose() { tone({ freq: 780, to: 340, dur: 0.1, type: "sine", gain: 0.14 }); },
  blip() { tone({ freq: 900, to: 1400, dur: 0.06, type: "square", gain: 0.08 }); },

  /* Workout flow */
  smash() {
    tone({ freq: 90, to: 40, dur: 0.35, type: "sine", gain: 0.42 });
    noise(0.4, 0.28, 0, 250);
    tone({ freq: 1400, to: 300, dur: 0.3, type: "sawtooth", gain: 0.1, delay: 0.02 });
    haptic(60);
  },
  humStart() {
    const c = audio();
    if (!c || !master || humStop) return;
    const osc = c.createOscillator();
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = 132;
    lfo.frequency.value = 4.5;
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain).connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.07, c.currentTime + 0.3);
    osc.connect(g).connect(master);
    osc.start(); lfo.start();
    humStop = () => {
      try {
        g.gain.cancelScheduledValues(c.currentTime);
        g.gain.setValueAtTime(g.gain.value, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);
        osc.stop(c.currentTime + 0.3); lfo.stop(c.currentTime + 0.3);
      } catch {}
      humStop = null;
    };
  },
  humEnd() { humStop?.(); },
  slam() { tone({ freq: 70, to: 45, dur: 0.28, type: "sine", gain: 0.4 }); noise(0.2, 0.16, 0, 200); haptic(40); },
  readyBeep(step: number) { tone({ freq: 520 + step * 120, dur: 0.14, type: "square", gain: 0.16 }); haptic(15); },
  go() {
    [0, 0.08, 0.16].forEach((d, i) => tone({ freq: 700 + i * 220, to: 1200 + i * 220, dur: 0.16, type: "square", gain: 0.2, delay: d }));
    noise(0.3, 0.16, 0, 600);
    haptic([30, 40, 30]);
  },
  tick(urgent = false) {
    tone({ freq: urgent ? 1500 : 900, dur: urgent ? 0.05 : 0.035, type: "square", gain: urgent ? 0.14 : 0.07 });
    if (urgent) haptic(10);
  },
  calmTick() { tone({ freq: 480, dur: 0.12, type: "sine", gain: 0.05 }); },
  timerDone() {
    tone({ freq: 880, dur: 0.12, type: "sine", gain: 0.2 });
    tone({ freq: 1320, dur: 0.3, type: "sine", gain: 0.22, delay: 0.11 });
    haptic(30);
  },
  stamp() { noise(0.12, 0.24, 0, 300); tone({ freq: 190, to: 90, dur: 0.14, type: "sine", gain: 0.3 }); haptic(25); },
  sparkle() {
    [0, 0.05, 0.1, 0.15].forEach((d, i) => tone({ freq: 1300 + i * 320, dur: 0.1, type: "triangle", gain: 0.1, delay: d }));
  },
  notch() { tone({ freq: 1100, dur: 0.04, type: "square", gain: 0.07 }); },
  calmChime() { tone({ freq: 520, dur: 0.5, type: "sine", gain: 0.12 }); tone({ freq: 780, dur: 0.6, type: "sine", gain: 0.08, delay: 0.08 }); },
  quit() { [0, 0.09, 0.18].forEach((d, i) => tone({ freq: 400 - i * 90, dur: 0.18, type: "triangle", gain: 0.14, delay: d })); },

  /* Rewards */
  fanfare() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.5, type: "triangle", gain: 0.16, delay: i * 0.09 }));
    noise(0.7, 0.14, 0.1, 900);
    haptic([40, 60, 40, 60, 120]);
  },
  countBlip(i: number) { tone({ freq: 700 + (i % 6) * 60, dur: 0.04, type: "square", gain: 0.06 }); },
  flameRoll() { noise(0.5, 0.12, 0, 500); tone({ freq: 200, to: 600, dur: 0.5, type: "sawtooth", gain: 0.07 }); },
  coin(i = 0) {
    tone({ freq: 980 + i * 70, to: 1500 + i * 70, dur: 0.1, type: "square", gain: 0.12, delay: i * 0.05 });
  },
  coinLand() { tone({ freq: 1600, dur: 0.22, type: "triangle", gain: 0.16 }); haptic(15); },
  trophy() {
    tone({ freq: 200, to: 1200, dur: 0.7, type: "sawtooth", gain: 0.1 });
    [1046, 1318, 1568, 2093].forEach((f, i) => tone({ freq: f, dur: 0.6, type: "sine", gain: 0.12, delay: 0.3 + i * 0.1 }));
    haptic([60, 40, 60, 40, 160]);
  },
  purchase() { noise(0.3, 0.14, 0, 800); tone({ freq: 700, to: 260, dur: 0.28, type: "triangle", gain: 0.2, delay: 0.05 }); haptic(40); },
  nope() { tone({ freq: 200, to: 140, dur: 0.22, type: "sawtooth", gain: 0.18 }); haptic([20, 50, 20]); },

  /* Tournaments */
  unfold() { noise(0.35, 0.1, 0, 1200); },
  typeClick() { tone({ freq: 1400, dur: 0.02, type: "square", gain: 0.045 }); },
  rowTick(i = 0) { tone({ freq: 620 + i * 40, dur: 0.04, type: "triangle", gain: 0.07, delay: i * 0.045 }); },
  shimmer() { [0, 0.08, 0.16].forEach((d, i) => tone({ freq: 1100 + i * 300, dur: 0.2, type: "sine", gain: 0.07, delay: d })); },

  /* Mommy — softer palette */
  mommyTap() { tone({ freq: 660, dur: 0.16, type: "sine", gain: 0.12 }); haptic(8); },
  mommyDone() {
    [523, 587, 659, 784, 880, 1046].forEach((f, i) => tone({ freq: f, dur: 0.5, type: "sine", gain: 0.1, delay: i * 0.07 }));
    haptic([25, 60, 25]);
  },
  mommyBreathe() { tone({ freq: 320, to: 260, dur: 2.4, type: "sine", gain: 0.05, attack: 0.8 }); },
  mommyConfirm() { tone({ freq: 620, dur: 0.16, type: "sine", gain: 0.12 }); tone({ freq: 880, dur: 0.2, type: "sine", gain: 0.1, delay: 0.14 }); },

  /* Misc */
  welcome() { [523, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.3, type: "triangle", gain: 0.14, delay: i * 0.1 })); },
  editorBlip() { tone({ freq: 300, to: 1200, dur: 0.14, type: "square", gain: 0.12 }); },
};

export type SfxName = keyof typeof sfx;
