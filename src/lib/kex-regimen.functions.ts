import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { ALL_EXERCISES, DIFFICULTIES, type Exercise } from "./kex-data";

export type RegimenWorkout = { name: string; exerciseIds: string[] };
export type RegimenDay = {
  day: number;
  kind: "workout" | "rest";
  title: string;
  note: string;
  workouts: RegimenWorkout[];
};
export type RegimenRow = {
  id: string;
  name: string;
  goal: string;
  days: number;
  difficulty: number;
  per_day: number;
  plan: RegimenDay[];
  current_day: number;
  completed_days: number[];
  active: boolean;
  finished: boolean;
  jackpot_paid: boolean;
};

const Input = z.object({
  days: z.number().int().min(1).max(60),
  difficulty: z.number().int().min(0).max(5),
  perDay: z.number().int().min(1).max(3),
  goal: z.string().trim().max(600),
});

function realExercises(): Exercise[] {
  return Object.values(ALL_EXERCISES).filter((e) => !e.id.startsWith("stretch."));
}

/** A safe, deterministic plan used when the AI is unavailable or replies badly. */
function fallbackPlan(days: number, perDay: number): RegimenDay[] {
  const pool = realExercises();
  const out: RegimenDay[] = [];
  for (let d = 1; d <= days; d++) {
    const rest = d % 4 === 0;
    if (rest) {
      out.push({ day: d, kind: "rest", title: "REST DAY", note: "Walk, stretch, eat. Kex allows it.", workouts: [] });
      continue;
    }
    const workouts: RegimenWorkout[] = [];
    for (let w = 0; w < perDay; w++) {
      const start = ((d * 7) + w * 5) % pool.length;
      const ids: string[] = [];
      for (let i = 0; i < 6; i++) ids.push(pool[(start + i * 3) % pool.length].id);
      workouts.push({ name: perDay > 1 ? `SESSION ${w + 1}` : "DAILY GRIND", exerciseIds: Array.from(new Set(ids)) });
    }
    out.push({ day: d, kind: "workout", title: `DAY ${d}`, note: "", workouts });
  }
  return out;
}

function normalizePlan(raw: unknown, days: number, perDay: number): RegimenDay[] {
  const valid = new Set(realExercises().map((e) => e.id));
  const arr = Array.isArray(raw) ? raw : [];
  const out: RegimenDay[] = [];
  for (let d = 1; d <= days; d++) {
    const src = arr.find((x) => typeof x === "object" && x && (x as { day?: number }).day === d)
      ?? arr[d - 1];
    const o = (src ?? {}) as {
      kind?: string; title?: string; note?: string;
      workouts?: { name?: string; exerciseIds?: unknown }[];
    };
    const kind = o.kind === "rest" ? "rest" : "workout";
    if (kind === "rest") {
      out.push({
        day: d, kind: "rest",
        title: typeof o.title === "string" && o.title ? o.title : "REST DAY",
        note: typeof o.note === "string" ? o.note : "Rest up. You earned it.",
        workouts: [],
      });
      continue;
    }
    const workouts: RegimenWorkout[] = [];
    for (const w of (o.workouts ?? []).slice(0, perDay)) {
      const ids = (Array.isArray(w?.exerciseIds) ? w.exerciseIds : [])
        .filter((x): x is string => typeof x === "string" && valid.has(x));
      const unique = Array.from(new Set(ids)).slice(0, 12);
      if (unique.length >= 4) {
        workouts.push({ name: typeof w?.name === "string" && w.name ? w.name : "SESSION", exerciseIds: unique });
      }
    }
    if (workouts.length === 0) {
      // AI gave nothing usable for this day — patch it with the deterministic plan.
      const fb = fallbackPlan(days, perDay)[d - 1];
      out.push({ ...fb, day: d });
      continue;
    }
    out.push({
      day: d, kind: "workout",
      title: typeof o.title === "string" && o.title ? o.title : `DAY ${d}`,
      note: typeof o.note === "string" ? o.note : "",
      workouts,
    });
  }
  return out;
}

/** Builds a regimen with Lovable AI, validates it against the real exercise library, and stores it. */
export const kexBuildRegimen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; regimen: RegimenRow } | { ok: false; error: string }> => {
    const { supabase, userId } = context;
    const key = process.env["LOVABLE_API_KEY"];

    const catalog = realExercises()
      .map((e) => `${e.id} | ${e.name} | ${e.base} ${e.unit}${e.needsPullupBar ? " | needs pull-up bar" : ""}`)
      .join("\n");

    let plan: RegimenDay[] = fallbackPlan(data.days, data.perDay);
    let name = `${data.days}-DAY PLAN`;

    if (key) {
      const prompt = [
        "You are a strength & conditioning coach building a home workout regimen for a family fitness app.",
        `Goal from the user: ${data.goal || "general fitness"}`,
        `Length: ${data.days} days. Workouts per day: ${data.perDay}. Difficulty level: ${data.difficulty} (${DIFFICULTIES[data.difficulty]?.name ?? "unknown"}, 0 easiest, 5 hardest).`,
        "Rules:",
        `- Output exactly ${data.days} day objects, day numbers 1..${data.days}.`,
        "- Use ONLY exercise ids from the ALLOWED list. Never invent ids.",
        `- Each workout day has exactly ${data.perDay} workout(s), each with 5 to 10 exercise ids.`,
        "- Include sensible rest days for recovery, and progress the plan over time toward the goal.",
        "- Give each day a short punchy uppercase title and a one-line coaching note.",
        "ALLOWED exercises (id | name | base amount):",
        catalog,
        'Reply with JSON only: {"name":"SHORT PLAN NAME","plan":[{"day":1,"kind":"workout","title":"...","note":"...","workouts":[{"name":"...","exerciseIds":["core.plank"]}]}]}',
      ].join("\n");

      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });
        if (res.status === 429) return { ok: false, error: "Kex's AI coach is busy right now. Try again in a minute." };
        if (res.status === 402) return { ok: false, error: "AI credits ran out. Add credits to build new regimens." };
        if (res.ok) {
          const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content) as { name?: string; plan?: unknown };
            plan = normalizePlan(parsed.plan, data.days, data.perDay);
            if (typeof parsed.name === "string" && parsed.name.trim()) name = parsed.name.trim().slice(0, 60);
          }
        }
      } catch {
        // keep the fallback plan
      }
    }

    // Only one active regimen at a time.
    await supabase.from("regimens").update({ active: false }).eq("user_id", userId).eq("active", true);

    const { data: row, error } = await supabase
      .from("regimens")
      .insert({
        user_id: userId,
        name,
        goal: data.goal,
        days: data.days,
        difficulty: data.difficulty,
        per_day: data.perDay,
        plan: plan as never,
        current_day: 1,
        completed_days: [] as never,
        active: true,
      })
      .select("*")
      .single();
    if (error || !row) return { ok: false, error: error?.message ?? "Could not save the regimen." };
    return { ok: true, regimen: row as unknown as RegimenRow };
  });

export const kexGetRegimen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RegimenRow | null> => {
    const { data } = await context.supabase
      .from("regimens")
      .select("*")
      .eq("user_id", context.userId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as unknown as RegimenRow) ?? null;
  });

export const kexAdvanceRegimen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ finished: boolean; currentDay: number }> => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("regimens").select("*").eq("id", data.id).eq("user_id", userId).maybeSingle();
    if (!row) throw new Error("Regimen not found.");
    const r = row as unknown as RegimenRow;
    const done = Array.from(new Set([...(r.completed_days ?? []), r.current_day]));
    const nextDay = r.current_day + 1;
    const finished = nextDay > r.days;
    await supabase.from("regimens").update({
      completed_days: done as never,
      current_day: finished ? r.days : nextDay,
      finished,
      active: !finished,
      updated_at: new Date().toISOString(),
    }).eq("id", r.id);
    return { finished, currentDay: finished ? r.days : nextDay };
  });

export const kexQuitRegimen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("regimens")
      .update({ active: false }).eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });
