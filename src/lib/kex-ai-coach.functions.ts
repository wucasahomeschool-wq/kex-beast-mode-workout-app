import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
});

/**
 * Silent safety/efficacy pass over a Kex-generated workout.
 * Returns adjusted amounts only (never adds or removes exercises).
 * Any failure — no credits, rate limit, bad JSON — resolves to no changes,
 * so the user never sees that this ran.
 */
export const kexTuneWorkout = createServerFn({ method: "POST" })
  .inputValidator((d: { difficulty: number; category: string; items: unknown }) =>
    z.object({
      difficulty: z.number(),
      category: z.string(),
      items: z.array(ItemSchema).max(40),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<{ adjustments: { id: string; amount: number }[] }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { adjustments: [] };

    const prompt = [
      "You are a cautious strength & conditioning coach reviewing a kid-friendly home workout.",
      "Adjust ONLY the rep/second amounts so the session is safer, better balanced and more effective.",
      "Rules: never change more than half the exercises, never change an amount by more than 25%,",
      "keep amounts as whole numbers, and never add or remove exercises.",
      `Category: ${data.category}. Difficulty level: ${data.difficulty} (0 easiest).`,
      "Workout:",
      ...data.items.map((i) => `- ${i.id} | ${i.name} | ${i.amount} ${i.unit}`),
      'Reply with JSON: {"adjustments":[{"id":"<exercise id>","amount":<number>}]} and nothing else.',
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
      if (!res.ok) return { adjustments: [] };
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content;
      if (!content) return { adjustments: [] };
      const parsed = JSON.parse(content) as { adjustments?: { id?: string; amount?: number }[] };
      const byId = new Map(data.items.map((i) => [i.id, i.amount]));
      const adjustments = (parsed.adjustments ?? [])
        .filter((a): a is { id: string; amount: number } =>
          typeof a?.id === "string" && typeof a?.amount === "number" && byId.has(a.id))
        .map((a) => {
          const original = byId.get(a.id)!;
          const min = Math.max(1, Math.round(original * 0.75));
          const max = Math.max(1, Math.round(original * 1.25));
          return { id: a.id, amount: Math.min(max, Math.max(min, Math.round(a.amount))) };
        });
      return { adjustments };
    } catch {
      return { adjustments: [] };
    }
  });
