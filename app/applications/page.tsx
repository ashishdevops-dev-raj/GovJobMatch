import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { fetchPublishedJobs } from "@/lib/jobs/queries";
import { ApplicationsTable } from "./table";
import { EmptyState } from "@/components/ui/empty-state";
import type { ApplicationRecord } from "@/types/jobs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/applications");
  const supabase = await createServerSupabase();
  if (!supabase) {
    return (
      <EmptyState
        title="Supabase required"
        description="Connect Supabase to persist application tracking."
      />
    );
  }
  const jobs = await fetchPublishedJobs();
  const { data } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const records = ((data ?? []) as ApplicationRecord[]).map((row) => ({
    ...row,
    job: jobs.find((job) => job.id === row.job_id),
  }));

  return (
    <div className="space-y-4">
      <h1 className="font-headline-xl font-bold text-primary">Application tracker</h1>
      <ApplicationsTable records={records} />
    </div>
  );
}
