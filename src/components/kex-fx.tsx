import { useEffect, useMemo, useState } from "react";
import { prefersReducedMotion, useCountUp, useReveal, stagger } from "@/lib/kex-motion";

/* ---------- scroll reveal wrapper ---------- */
export function Reveal({
  children, delay = 0, className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${className} ${shown ? "animate-fade-up" : "opacity-0"}`}
      style={shown ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ---------- number that rolls up ---------- */
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const v = useCountUp(to);
  return <>{v}{suffix}</>;
}

/* ---------- comic impact burst ---------- */
export function ImpactBurst() {
  if (prefersReducedMotion()) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
      <div className="animate-burst-lines h-[60vmin] w-[60vmin] rounded-full bg-zoom-lines opacity-70" />
      <div className="animate-shockwave absolute inset-0 rounded-full border-8 border-primary" />
    </div>
  );
}

/* ---------- confetti / star burst ---------- */
const CONFETTI = ["🌟", "💥", "🔥", "🏆", "⭐", "🪙", "💪"];
export function Confetti({ count = 28 }: { count?: number }) {
  const bits = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      i,
      left: Math.random() * 100,
      dx: `${(Math.random() - 0.5) * 200}px`,
      dur: `${1.8 + Math.random() * 1.8}s`,
      delay: `${Math.random() * 0.6}s`,
      char: CONFETTI[i % CONFETTI.length],
      size: 18 + Math.random() * 22,
    })),
    [count],
  );
  if (prefersReducedMotion()) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.i}
          className="animate-confetti absolute top-0"
          style={{
            left: `${b.left}%`,
            fontSize: b.size,
            ["--kex-dx" as string]: b.dx,
            ["--kex-dur" as string]: b.dur,
            ["--kex-delay" as string]: b.delay,
          }}
        >
          {b.char}
        </span>
      ))}
    </div>
  );
}

/* ---------- flying koins toward the balance chip ---------- */
export function CoinFlight({ count = 10 }: { count?: number }) {
  const bits = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      i,
      dx: `${(Math.random() - 0.5) * 260}px`,
      dy: `${-90 - Math.random() * 140}px`,
      delay: `${i * 55}ms`,
    })),
    [count],
  );
  if (prefersReducedMotion()) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 z-[94]">
      {bits.map((b) => (
        <span
          key={b.i}
          className="animate-coin-fly absolute text-3xl"
          style={{
            ["--kex-dx" as string]: b.dx,
            ["--kex-dy" as string]: b.dy,
            ["--kex-delay" as string]: b.delay,
          }}
        >
          🪙
        </span>
      ))}
    </div>
  );
}

/* ---------- hearts (Mommy course) ---------- */
export function HeartBurst({ count = 14 }: { count?: number }) {
  const bits = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      i, left: 20 + Math.random() * 60,
      dx: `${(Math.random() - 0.5) * 160}px`,
      delay: `${i * 70}ms`,
    })),
    [count],
  );
  if (prefersReducedMotion()) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.i}
          className="animate-heart-burst absolute bottom-24 text-4xl"
          style={{ left: `${b.left}%`, ["--kex-dx" as string]: b.dx, ["--kex-delay" as string]: b.delay }}
        >
          💗
        </span>
      ))}
    </div>
  );
}

/* ---------- comic loading ring (used while the workout is prepared) ---------- */
export function LoadingRing({ label }: { label: string }) {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d % 3) + 1), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="animate-pop-in flex flex-col items-center gap-5 rounded-2xl border-4 border-primary bg-card px-10 py-8 shadow-comic-lg">
        <div className="relative h-24 w-24">
          <div className="animate-comic-spin absolute inset-0 rounded-full border-8 border-dashed border-primary" />
          <div className="absolute inset-3 animate-pulse-glow rounded-full border-4 border-secondary" />
        </div>
        <div className="font-display text-2xl text-primary">
          {label}{".".repeat(dots)}
        </div>
      </div>
    </div>
  );
}

/* ---------- circular timer ring (shakes, escalates, punches per tick) ---------- */
export function TimerRing({
  remaining, total, calm = false, children,
}: { remaining: number; total: number; calm?: boolean; children: React.ReactNode }) {
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const r = 66;
  const c = 2 * Math.PI * r;
  const last3 = !calm && remaining <= 3 && remaining > 0;
  const reduced = prefersReducedMotion();
  const wobble = reduced || calm ? "" : last3 ? "animate-jitter-hard" : "animate-jitter";
  return (
    <div className={`relative inline-flex h-[160px] w-[160px] items-center justify-center ${wobble}`}>
      {last3 && <div className="absolute inset-0 animate-shockwave rounded-full border-4 border-danger" />}
      <svg viewBox="0 0 160 160" className="absolute inset-0 -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--muted)" strokeWidth="12" />
        <circle
          cx="80" cy="80" r={r} fill="none"
          stroke={last3 ? "var(--danger)" : calm ? "var(--accent)" : "var(--primary)"}
          strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.9s linear" }}
        />
      </svg>
      <div className={`relative text-center ${last3 ? "animate-danger-pulse" : ""}`}>
        <div key={remaining} className={reduced ? "" : "animate-digit-punch"}>{children}</div>
      </div>
    </div>
  );
}

/* ---------- rubber-stamp checkmark over a finished card ---------- */
export function StampCheck({ calm = false }: { calm?: boolean }) {
  if (prefersReducedMotion()) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="animate-dust absolute h-40 w-40 rounded-full bg-foreground/20 blur-xl" />
      <div
        className={`animate-stamp-check select-none font-display text-[26vw] leading-none md:text-[200px] ${calm ? "text-accent" : "text-primary"}`}
        style={{ WebkitTextStroke: "6px oklch(0.14 0.02 300)" }}
      >
        ✓
      </div>
    </div>
  );
}

/* ---------- full-screen GO! blast ---------- */
export function GoFlash() {
  if (prefersReducedMotion()) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[93] flex items-center justify-center">
      <div className="animate-screen-flash absolute inset-0 bg-foreground" />
      <div className="animate-burst-lines absolute h-[200vmax] w-[200vmax] bg-zoom-lines opacity-40" />
    </div>
  );
}

/* ---------- slot-reel number ---------- */
export function SlotNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <span className="inline-block overflow-hidden align-bottom">
      <span key={value} className="inline-block animate-slot">
        <CountUp to={value} suffix={suffix} />
      </span>
    </span>
  );
}

/* ---------- liquid progress bar with notch pops ---------- */
export function LiquidProgress({
  value, total, calm = false,
}: { value: number; total: number; calm?: boolean }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  return (
    <div className="relative mt-3 h-3 w-full overflow-hidden rounded-full border-2 border-border bg-muted">
      <div
        className={`relative h-full rounded-full transition-[width] duration-500 ease-out ${calm ? "bg-accent" : "bg-liquid"}`}
        style={{ width: `${pct}%` }}
      >
        <span className="absolute right-0 top-0 h-full w-3 bg-foreground/70 blur-[3px]" />
      </div>
      {Array.from({ length: Math.max(0, total) }, (_, i) => (
        <span
          key={i}
          className={`absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${i < value ? "animate-notch-pop bg-foreground" : "bg-border"}`}
          style={{ left: `calc(${((i + 1) / total) * 100}% - 4px)` }}
        />
      ))}
    </div>
  );
}

/* ---------- pointer-parallax card wrapper ---------- */
export function ParallaxCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const b = el.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width - 0.5;
    const py = (e.clientY - b.top) / b.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg) scale(1.03)`;
  };
  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`transition-transform duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- petals (Mommy day complete) ---------- */
export function PetalBurst({ count = 18 }: { count?: number }) {
  const bits = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      i, left: 10 + Math.random() * 80,
      dx: `${(Math.random() - 0.5) * 180}px`,
      delay: `${i * 90}ms`,
      char: ["🌸", "🌷", "💗", "🌼"][i % 4],
    })),
    [count],
  );
  if (prefersReducedMotion()) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.i}
          className="animate-petal absolute bottom-20 text-3xl"
          style={{ left: `${b.left}%`, ["--kex-dx" as string]: b.dx, ["--kex-delay" as string]: b.delay }}
        >
          {b.char}
        </span>
      ))}
    </div>
  );
}

/* ---------- letters dropping in one at a time ---------- */
export function DropLetters({ text, className = "" }: { text: string; className?: string }) {
  if (prefersReducedMotion()) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className="inline-block animate-letter-drop"
          style={{ ["--kex-delay" as string]: `${i * 55}ms` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

/* ---------- typewriter text ---------- */
export function TypeOut({ text, speed = 32, onTick }: { text: string; speed?: number; onTick?: () => void }) {
  const [n, setN] = useState(prefersReducedMotion() ? text.length : 0);
  useEffect(() => {
    if (prefersReducedMotion()) { setN(text.length); return; }
    setN(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setN(i);
      onTick?.();
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);
  return <>{text.slice(0, n)}</>;
}

/* ---------- full-screen trophy unlock takeover ---------- */
export function TrophyReveal({
  emoji, name, onDone,
}: { emoji: string; name: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-[97] flex items-center justify-center bg-background/85 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        <div className="animate-rays h-[200vmax] w-[200vmax] bg-zoom-lines" />
      </div>
      <Confetti count={20} />
      <div className="relative text-center">
        <div className="animate-trophy-reveal text-[28vw] leading-none md:text-[180px]">{emoji}</div>
        <div className="animate-slam-in mt-2 font-display text-4xl text-primary text-stroke-black md:text-6xl">
          TROPHY UNLOCKED
        </div>
        <div className="animate-fade-up mt-1 font-display text-2xl text-foreground" style={stagger(6, 60)}>{name}</div>
      </div>
    </div>
  );
}

