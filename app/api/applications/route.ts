import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";

const ALLOWED = new Set([
  "planning",
  "applied",
  "exam_scheduled",
  "exam_completed",
  "result_declared",
  "selected",
  "not_selected",
]);

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const { jobId, status } = await request.json();
  if (!jobId || !ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    job_id: jobId,
    status,
    applied_at: status === "applied" ? new Date().toISOString() : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const { id, status, notes } = await request.json();
  if (!id || (status && !ALLOWED.has(status))) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { error } = await supabase
    .from("applications")
    .update({
      status,
      notes,
      updated_at: new Date().toISOString(),
      applied_at: status === "applied" ? new Date().toISOString() : undefined,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
