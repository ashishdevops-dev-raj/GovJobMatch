import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { MarkRead } from "./mark-read";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/notifications");
  const supabase = await createServerSupabase();
  if (!supabase) {
    return (
      <EmptyState
        title="In-app notifications need Supabase"
        description="Once Auth is connected, deadline and match alerts are stored in the notifications table. No paid email provider is required."
      />
    );
  }
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = data ?? [];
  return (
    <div className="space-y-4">
      <h1 className="font-headline-xl font-bold text-primary">Notifications</h1>
      {items.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="You will see match and deadline alerts here after jobs are verified and your profile is complete."
        />
      ) : (
        items.map((item) => (
          <article
            key={item.id}
            className={`rounded-xl p-space-md ${item.is_read ? "bg-surface-container-lowest" : "bg-surface-container-low"}`}
          >
            <h2 className="font-headline-sm">{item.title}</h2>
            <p className="text-body-sm text-on-surface-variant">{item.message}</p>
            <MarkRead id={item.id} read={item.is_read} />
          </article>
        ))
      )}
    </div>
  );
}
