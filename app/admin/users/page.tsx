import { redirect } from "next/navigation";
import { getSessionUser, isAdminUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin users" };

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user || !(await isAdminUser(user.id))) redirect("/");
  const supabase = await createServerSupabase();
  if (!supabase) return <EmptyState title="Supabase required" description="User admin needs the connected database." />;
  const { data } = await supabase.from("profiles").select("id, full_name, state, highest_qualification").limit(100);
  return (
    <div className="space-y-4">
      <h1 className="font-headline-xl font-bold text-primary">Users</h1>
      <ul className="space-y-2">
        {(data ?? []).map((row) => (
          <li key={row.id} className="rounded-xl bg-surface-container-lowest p-space-md">
            {row.full_name || row.id} · {row.state} · {row.highest_qualification}
          </li>
        ))}
      </ul>
    </div>
  );
}
