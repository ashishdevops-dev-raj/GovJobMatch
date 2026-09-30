import { redirect } from "next/navigation";
import { SavedJobsClient } from "./saved-client";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { fetchPublishedJobs } from "@/lib/jobs/queries";
import { checkEligibility } from "@/lib/eligibility/engine";
import { getDeadlineState } from "@/lib/eligibility/age";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved Jobs" };

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/saved");
  const supabase = await createServerSupabase();
  const profile = await getProfile(user.id);
  const allJobs = await fetchPublishedJobs();
  let savedIds = new Set<string>();
  let appliedIds = new Set<string>();

  if (supabase) {
    const { data: saved } = await supabase.from("saved_jobs").select("job_id").eq("user_id", user.id);
    const { data: apps } = await supabase.from("applications").select("job_id").eq("user_id", user.id);
    savedIds = new Set((saved ?? []).map((row) => row.job_id));
    appliedIds = new Set((apps ?? []).map((row) => row.job_id));
  }

  const jobs = allJobs
    .filter((job) => savedIds.has(job.id))
    .map((job) => ({
      job,
      eligibility: profile ? checkEligibility(profile, job) : null,
      deadline: getDeadlineState(job.application_start_date, job.application_end_date),
      applied: appliedIds.has(job.id),
    }));

  return <SavedJobsClient items={jobs} />;
}
