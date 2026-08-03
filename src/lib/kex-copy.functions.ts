import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// The app editor is NOT a user account — it's a text-editing tool.
const EDITOR_USERNAME = "EDITOR";
const EDITOR_PASSWORD = "bangersandmash";

export const kexEditorLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string }) =>
    z.object({ username: z.string().trim(), password: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.username.toUpperCase() !== EDITOR_USERNAME || data.password !== EDITOR_PASSWORD) {
      throw new Error("Wrong editor credentials. Kex is suspicious.");
    }
    return { token: EDITOR_PASSWORD };
  });

export const kexSaveCopy = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; key: string; value: string; style?: Record<string, unknown> }) =>
    z.object({
      token: z.string(),
      key: z.string().trim().min(1).max(200),
      value: z.string().max(4000),
      style: z.record(z.string(), z.unknown()).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.token !== EDITOR_PASSWORD) throw new Error("Not authorized to edit app text.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_copy")
      .upsert({
        key: data.key,
        value: data.value,
        style: (data.style ?? {}) as never,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const kexResetCopy = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; key: string }) =>
    z.object({ token: z.string(), key: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.token !== EDITOR_PASSWORD) throw new Error("Not authorized to edit app text.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("app_copy").delete().eq("key", data.key);
    return { ok: true };
  });
