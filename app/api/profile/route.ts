import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const body = await request.json();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: String(body.full_name ?? "").slice(0, 120),
    date_of_birth: body.date_of_birth || null,
    gender: body.gender || null,
    state: body.state || null,
    category: body.category || null,
    highest_qualification: body.highest_qualification || null,
    branch: body.branch || null,
    passing_year: body.passing_year || null,
    experience_level: body.experience_level || null,
    experience_years: body.experience_years ?? null,
    preferred_states: body.preferred_states ?? [],
    preferred_categories: body.preferred_categories ?? [],
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
