"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function bootstrapAction(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const secret = String(formData.get("bootstrap_secret") ?? "");

  const expectedSecret = process.env.BOOTSTRAP_SECRET;
  if (!expectedSecret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect(
      `/admin/bootstrap?error=${encodeURIComponent(
        "Bootstrap não está habilitado neste servidor."
      )}`
    );
  }

  if (secret !== expectedSecret) {
    redirect(
      `/admin/bootstrap?error=${encodeURIComponent("Bootstrap secret inválido.")}`
    );
  }

  if (password.length < 8) {
    redirect(
      `/admin/bootstrap?error=${encodeURIComponent("A senha deve ter ao menos 8 caracteres.")}`
    );
  }

  const admin = createAdminClient();

  // Re-check that profiles is empty (defense against race condition)
  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    redirect("/admin/login");
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip e-mail confirmation for the first user
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    redirect(
      `/admin/bootstrap?error=${encodeURIComponent(
        error?.message ?? "Falha ao criar usuário."
      )}`
    );
  }

  // The handle_new_user trigger creates the profile automatically;
  // ensure full_name is set on the row in case the trigger raced.
  await admin
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", data.user.id);

  redirect("/admin/login?bootstrap=ok");
}
