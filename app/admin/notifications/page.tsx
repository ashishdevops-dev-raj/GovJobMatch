import { redirect } from "next/navigation";
import { getSessionUser, isAdminUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin notifications" };

export default async function AdminNotificationsPage() {
  const user = await getSessionUser();
  if (!user || !(await isAdminUser(user.id))) redirect("/");
  const supabase = await createServerSupabase();
  if (!supabase) {
    return (
      <EmptyState
        title="Supabase required"
        description="In-app notifications are stored in Postgres. No paid email provider is used."
      />
    );
  }
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  return (
    <div className="space-y-4">
      <h1 className="font-headline-xl font-bold text-primary">Notifications log</h1>
      {(data ?? []).map((item) => (
        <article key={item.id} className="rounded-xl bg-surface-container-lowest p-space-md">
          <p className="font-semibold">{item.title}</p>
          <p className="text-body-sm">{item.message}</p>
        </article>
      ))}
    </div>
  );
}
