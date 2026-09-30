import { NextResponse } from "next/server";
import { getSessionUser, isAdminUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !(await isAdminUser(user.id))) {
    return null;
  }
  return user;
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const admin = createAdminClient();
  const { error } = await admin.from("jobs").insert({
    ...body,
    slug: body.slug || slugify(body.title ?? "job"),
    status: body.status ?? "pending",
    is_verified: Boolean(body.is_verified),
    is_sample: Boolean(body.is_sample),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, ...patch } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("jobs").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await request.json();
  const admin = createAdminClient();
  const { error } = await admin.from("jobs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
