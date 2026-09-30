import { Header } from "./header";
import { Footer } from "./footer";
import { BottomNav } from "./bottom-nav";
import { getProfile, getSessionUser, isAdminUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const profile = user ? await getProfile(user.id) : null;
  const admin = user ? await isAdminUser(user.id) : false;
  let unread = 0;
  if (user) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      unread = count ?? 0;
    }
  }

  const meta = profile
    ? [profile.highest_qualification, profile.branch].filter(Boolean).join(" • ")
    : null;

  return (
    <>
      <Header
        userName={profile?.full_name || user?.email || null}
        userMeta={meta}
        unread={unread}
        isAdmin={admin}
      />
      <main className="w-full bg-background pt-16">
        <div className="mx-auto min-h-[calc(100vh-280px)] max-w-[1440px] px-margin-sm pt-8 pb-8 md:px-margin">
          {children}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
