import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Shared "password" used for every account. Users only ever type a username.
const SHARED_PASSWORD = "kex-shared-workout-app-b00mbakraxin";
const usernameSchema = z
  .string()
  .trim()
  .min(2, "At least 2 characters")
  .max(24, "At most 24 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, or underscore only");

function emailFor(username: string) {
  return `${username.toLowerCase()}@kex.local`;
}

export const kexSignup = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string }) => ({
    username: usernameSchema.parse(d.username),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", data.username)
      .maybeSingle();
    if (existing) {
      throw new Error("That username is taken. Try another.");
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: emailFor(data.username),
      password: SHARED_PASSWORD,
      email_confirm: true,
      user_metadata: { username: data.username },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Could not create account");
    }

    const { error: profErr } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      username: data.username,
    });
    if (profErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(profErr.message);
    }
    return { email: emailFor(data.username), password: SHARED_PASSWORD };
  });

export const kexSignin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string }) => ({
    username: usernameSchema.parse(d.username),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .ilike("username", data.username)
      .maybeSingle();
    if (!prof) throw new Error("No user with that username. Sign up first!");
    return { email: emailFor(prof.username), password: SHARED_PASSWORD };
  });
