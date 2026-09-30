import { NextResponse } from "next/server";
import { checkEligibility } from "@/lib/eligibility/engine";
import { fetchPublishedJobs } from "@/lib/jobs/queries";
import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CandidateProfile } from "@/types/profile";

export async function POST(request: Request) {
  const profile = (await request.json()) as CandidateProfile;
  if (!profile.highest_qualification && !profile.date_of_birth) {
    return NextResponse.json({ error: "Profile is incomplete" }, { status: 400 });
  }

  const jobs = await fetchPublishedJobs();
  const results = jobs.map((job) => ({
    job,
    result: checkEligibility(profile, job),
  }));
  const summary = {
    total: results.length,
    eligible: results.filter((item) => item.result.status === "ELIGIBLE").length,
    check: results.filter((item) => item.result.status === "CHECK_DETAILS").length,
    notEligible: results.filter((item) => item.result.status === "NOT_ELIGIBLE").length,
  };

  const user = await getSessionUser();
  const supabase = await createServerSupabase();
  if (user && supabase) {
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: profile.full_name,
      date_of_birth: profile.date_of_birth || null,
      gender: profile.gender,
      state: profile.state,
      category: profile.category,
      highest_qualification: profile.highest_qualification,
      branch: profile.branch,
      passing_year: profile.passing_year,
      experience_level: profile.experience_level,
      experience_years: profile.experience_years,
      preferred_states: profile.preferred_states,
      preferred_categories: profile.preferred_categories,
      updated_at: new Date().toISOString(),
    });
    const rows = results.map((item) => ({
      user_id: user.id,
      job_id: item.job.id,
      status: item.result.status,
      matched_rules: item.result.matchedRules,
      failed_rules: item.result.failedRules,
      warnings: item.result.warnings,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length) {
      await supabase.from("eligibility_results").upsert(rows, { onConflict: "user_id,job_id" });
    }
  }

  return NextResponse.json({ summary, results });
}
