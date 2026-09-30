import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { CandidateProfile, ProfileRecord } from "@/types/profile";

export async function getSessionUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId?: string): Promise<ProfileRecord | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const id = userId ?? (await getSessionUser())?.id;
  if (!id) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return (data as ProfileRecord | null) ?? null;
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "admin";
}

export function profileCompletion(profile: CandidateProfile | null): number {
  if (!profile) return 0;
  const fields = [
    profile.full_name,
    profile.date_of_birth,
    profile.gender,
    profile.state,
    profile.category,
    profile.highest_qualification,
    profile.branch,
    profile.passing_year,
    profile.experience_level,
  ];
  const filled = fields.filter((value) => value !== null && value !== undefined && String(value).trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
}
