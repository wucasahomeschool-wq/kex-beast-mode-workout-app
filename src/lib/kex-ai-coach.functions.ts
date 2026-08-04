import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
});

const PoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  base: z.number(),
});

/**
 * Silent safety/efficacy pass over a Kex-generated workout.
 * Returns amount adjustments AND optional exercise swaps (bounded to ~1/3 of
 * the session), so the exercise count and session length never change.
 * Any failure — no credits, rate limit, bad JSON — resolves to no changes,
 * so the user never sees that this ran.
 */
export const kexTuneWorkout = createServerFn({ method: "POST" })
  .inputValidator((d: { difficulty: number; category: string; items: unknown; pool?: unknown }) =>
    z.object({
      difficulty: z.number(),
      category: z.string(),
      items: z.array(ItemSchema).max(40),
      pool: z.array(PoolSchema).max(120).optional(),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<{
    adjustments: { id: string; amount: number }[];
    swaps: { from: string; to: string; amount: number }[];
  }> => {
    const key = process.env["LOVABLE_API_KEY"];
    const empty = { adjustments: [], swaps: [] };
    if (!key) return empty;

    const inWorkout = new Set(data.items.map((i) => i.id));
    const pool = (data.pool ?? []).filter((p) => !inWorkout.has(p.id));
    const maxSwaps = Math.max(1, Math.floor(data.items.length / 3));

    const prompt = [
      "You are a cautious strength & conditioning coach reviewing a kid-friendly home workout.",
      "Improve the session's safety, balance and effectiveness in two ways:",
      "1) Adjust rep/second amounts (never by more than 25%, whole numbers only).",
      `2) Replace up to ${maxSwaps} exercises with better-balanced alternatives from the ALLOWED list only.`,
      "Never change the number of exercises. Never invent exercise ids. Keep swapped-in amounts sensible",
      "and similar in effort to the exercise being replaced.",
      `Category: ${data.category}. Difficulty level: ${data.difficulty} (0 easiest).`,
      "Workout:",
      ...data.items.map((i) => `- ${i.id} | ${i.name} | ${i.amount} ${i.unit}`),
      pool.length ? "ALLOWED replacements (id | name | unit | typical base amount):" : "No replacements available.",
      ...pool.map((p) => `- ${p.id} | ${p.name} | ${p.unit} | ${p.base}`),
      'Reply with JSON: {"adjustments":[{"id":"<id>","amount":<number>}],"swaps":[{"from":"<workout id>","to":"<allowed id>","amount":<number>}]} and nothing else.',
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
      if (!res.ok) return empty;
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content;
      if (!content) return empty;
      const parsed = JSON.parse(content) as {
        adjustments?: { id?: string; amount?: number }[];
        swaps?: { from?: string; to?: string; amount?: number }[];
      };

      const byId = new Map(data.items.map((i) => [i.id, i.amount]));
      const poolById = new Map(pool.map((p) => [p.id, p]));

      const clamp = (original: number, next: number) => {
        const min = Math.max(1, Math.round(original * 0.75));
        const max = Math.max(1, Math.round(original * 1.25));
        return Math.min(max, Math.max(min, Math.round(next)));
      };

      // Swaps first — they consume the "from" slot, so those ids can't also be adjusted.
      const usedFrom = new Set<string>();
      const usedTo = new Set<string>();
      const swaps: { from: string; to: string; amount: number }[] = [];
      for (const s of parsed.swaps ?? []) {
        if (swaps.length >= maxSwaps) break;
        if (typeof s?.from !== "string" || typeof s?.to !== "string") continue;
        if (!byId.has(s.from) || usedFrom.has(s.from)) continue;
        const target = poolById.get(s.to);
        if (!target || usedTo.has(s.to)) continue;
        const fallback = target.base;
        const raw = typeof s.amount === "number" ? s.amount : fallback;
        // Keep the swapped-in amount within a sane band of the exercise's own base.
        const amount = Math.max(1, Math.min(Math.round(fallback * 2.5), Math.round(raw)));
        usedFrom.add(s.from);
        usedTo.add(s.to);
        swaps.push({ from: s.from, to: s.to, amount });
      }

      const adjustments = (parsed.adjustments ?? [])
        .filter((a): a is { id: string; amount: number } =>
          typeof a?.id === "string" && typeof a?.amount === "number"
          && byId.has(a.id) && !usedFrom.has(a.id))
        .map((a) => ({ id: a.id, amount: clamp(byId.get(a.id)!, a.amount) }));

      return { adjustments, swaps };
    } catch {
      return empty;
    }
  });
