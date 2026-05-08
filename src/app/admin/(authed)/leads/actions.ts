"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { supabase, userId } = await requireAuth();
  const { error } = await supabase
    .from("leads")
    .update({
      status,
      assigned_to: status === "novo" ? null : userId,
    })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

export async function appendLeadNote(leadId: string, note: string) {
  const trimmed = note.trim();
  if (!trimmed) return;
  const { supabase, userId } = await requireAuth();

  // Fetch current notes to append
  const { data: existing } = await supabase
    .from("leads")
    .select("notes")
    .eq("id", leadId)
    .single();

  const stamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const entry = `[${stamp}] ${trimmed}`;
  const next = existing?.notes ? `${existing.notes}\n${entry}` : entry;

  const { error } = await supabase
    .from("leads")
    .update({ notes: next, assigned_to: userId })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function deleteLead(leadId: string) {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) throw error;
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}
