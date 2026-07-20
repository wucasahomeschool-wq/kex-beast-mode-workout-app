// Best-effort notification scheduling using in-page setTimeout while the app is open.
// True background push would require a push server + VAPID; we do the pragmatic thing
// instead: schedule today's remaining streak reminders whenever the app loads, and
// fire local Notification() calls for tournament / reward events immediately.

export type NotifPrefs = {
  streak: boolean;
  tournaments: boolean;
  rewards: boolean;
  asked: boolean;
};

const PREF_KEY = "kex-notif-prefs";
const FIRED_KEY = "kex-notif-fired"; // yyyy-mm-dd -> hours[]

export function loadPrefs(): NotifPrefs {
  if (typeof window === "undefined") return { streak: true, tournaments: true, rewards: true, asked: false };
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return { streak: true, tournaments: true, rewards: true, asked: false, ...JSON.parse(raw) };
  } catch {}
  return { streak: true, tournaments: true, rewards: true, asked: false };
}

export function savePrefs(p: NotifPrefs) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch {}
}

export async function askForPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") return Notification.permission;
  return await Notification.requestPermission();
}

export function canNotify() {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

async function showNotification(title: string, body: string, tag?: string) {
  if (!canNotify()) return;
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) return reg.showNotification(title, { body, tag, icon: "/__l5e/assets-v1/9587b530-c4c4-4be7-8793-d93d8c0cdf31/kex-icon.jpg", badge: "/__l5e/assets-v1/9587b530-c4c4-4be7-8793-d93d8c0cdf31/kex-icon.jpg" });
    }
    new Notification(title, { body, tag, icon: "/__l5e/assets-v1/9587b530-c4c4-4be7-8793-d93d8c0cdf31/kex-icon.jpg" });
  } catch {}
}

export function notifyTournament(title: string, body: string) {
  const prefs = loadPrefs();
  if (!prefs.tournaments) return;
  void showNotification(title, body, "kex-tournament");
}

export function notifyReward(title: string, body: string) {
  const prefs = loadPrefs();
  if (!prefs.rewards) return;
  void showNotification(title, body, "kex-reward-" + Date.now());
}

const STREAK_HOURS = [7, 10, 12, 15, 17];
const STREAK_LINES = [
  "🔥 Wake up! Kex has been up since 5am doing planks. Time to work out.",
  "😤 Kex is checking his watch. Your streak is on the line.",
  "☠️ It's already noon. Kex says: 'What are you, a couch?'",
  "🚨 3PM. Your streak is starting to sweat. Save it.",
  "😱 LAST CALL. Kex is disappointed. Do a workout NOW to keep your streak.",
];

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getFired(): Record<string, number[]> {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) || "{}"); } catch { return {}; }
}
function setFired(map: Record<string, number[]>) {
  try { localStorage.setItem(FIRED_KEY, JSON.stringify(map)); } catch {}
}

/** Schedule streak reminders for today. Skips ones already fired or in the past. */
export function scheduleStreakReminders(opts: { workedOutToday: boolean }) {
  if (typeof window === "undefined") return;
  if (opts.workedOutToday) return;
  const prefs = loadPrefs();
  if (!prefs.streak) return;
  if (!canNotify()) return;

  const now = new Date();
  if (now.getDay() === 0) return; // Sunday is a rest day
  const key = todayKey(now);
  const fired = getFired();
  const alreadyToday = new Set(fired[key] ?? []);

  for (const hour of STREAK_HOURS) {
    if (alreadyToday.has(hour)) continue;
    const target = new Date(now);
    target.setHours(hour, 0, 0, 0);
    const delta = target.getTime() - now.getTime();
    if (delta < 0) continue;
    const idx = STREAK_HOURS.indexOf(hour);
    setTimeout(() => {
      // Recheck: don't fire if user already worked out (best-effort — caller can also cancel).
      const f = getFired();
      f[key] = [...new Set([...(f[key] ?? []), hour])];
      setFired(f);
      void showNotification("KEEP YOUR STREAK ALIVE", STREAK_LINES[idx], "kex-streak-" + hour);
    }, delta);
  }
}
