import type { Exam, Job, JobSearchParams, Organization, PaginatedJobs } from "@/types/jobs";
import { DEMO_EXAMS, DEMO_JOBS, DEMO_ORGANIZATIONS, DEMO_SOURCES } from "@/lib/data/demo";
import { filterJobs, paginateJobs, sortJobs } from "@/lib/jobs/search";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/constants";

function publicJobs(jobs: Job[]): Job[] {
  return jobs.filter((job) => job.status === "published" && job.is_verified);
}

function mapRow(row: Record<string, unknown>): Job {
  const org = row.organizations as Record<string, unknown> | null | undefined;
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    source_id: (row.source_id as string) ?? null,
    title: String(row.title),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    qualification: String(row.qualification ?? ""),
    branches: (row.branches as string[]) ?? [],
    minimum_age: (row.minimum_age as number) ?? null,
    maximum_age: (row.maximum_age as number) ?? null,
    age_relaxation: (row.age_relaxation as Job["age_relaxation"]) ?? {},
    experience: String(row.experience ?? ""),
    states: (row.states as string[]) ?? [],
    locations: (row.locations as string[]) ?? [],
    vacancies: (row.vacancies as number) ?? null,
    salary_min: (row.salary_min as number) ?? null,
    salary_max: (row.salary_max as number) ?? null,
    salary_text: (row.salary_text as string) ?? null,
    job_type: (row.job_type as string) ?? null,
    category: (row.category as string) ?? null,
    application_start_date: (row.application_start_date as string) ?? null,
    application_end_date: (row.application_end_date as string) ?? null,
    exam_date: (row.exam_date as string) ?? null,
    selection_process: (row.selection_process as string[]) ?? [],
    application_fee: (row.application_fee as Record<string, unknown>) ?? {},
    official_notification_url: (row.official_notification_url as string) ?? null,
    official_apply_url: (row.official_apply_url as string) ?? null,
    source_url: (row.source_url as string) ?? null,
    status: String(row.status ?? "pending"),
    is_verified: Boolean(row.is_verified),
    is_sample: Boolean(row.is_sample),
    fingerprint: (row.fingerprint as string) ?? null,
    qualification_codes: (row.qualification_codes as string[]) ?? [],
    required_conditions: (row.required_conditions as Job["required_conditions"]) ?? [],
    exam_family: (row.exam_family as string) ?? null,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
    organization: org
      ? {
          id: String(org.id),
          name: String(org.name),
          slug: String(org.slug),
          official_website: (org.official_website as string) ?? null,
          logo_url: (org.logo_url as string) ?? null,
        }
      : null,
  };
}

async function supabaseOrNull() {
  if (!isSupabaseConfigured()) return null;
  return createServerSupabase();
}

export async function fetchPublishedJobs(): Promise<Job[]> {
  const supabase = await supabaseOrNull();
  if (!supabase) return publicJobs(DEMO_JOBS);

  const { data, error } = await supabase
    .from("jobs")
    .select("*, organizations(*)")
    .eq("status", "published")
    .eq("is_verified", true)
    .order("application_end_date", { ascending: true, nullsFirst: false })
    .limit(500);

  if (error || !data) return publicJobs(DEMO_JOBS);
  return data.map((row) => mapRow(row as Record<string, unknown>));
}

export async function searchJobs(params: JobSearchParams): Promise<PaginatedJobs> {
  const all = await fetchPublishedJobs();
  const filtered = sortJobs(filterJobs(all, params), params.sort);
  return paginateJobs(filtered, params.page ?? 1, params.pageSize ?? PAGE_SIZE);
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  const supabase = await supabaseOrNull();
  if (supabase) {
    const { data } = await supabase
      .from("jobs")
      .select("*, organizations(*)")
      .eq("slug", slug)
      .maybeSingle();
    if (data) return mapRow(data as Record<string, unknown>);
  }
  return DEMO_JOBS.find((job) => job.slug === slug || job.id === slug) ?? null;
}

export async function getOrganizations(): Promise<Organization[]> {
  const supabase = await supabaseOrNull();
  if (supabase) {
    const { data } = await supabase.from("organizations").select("*").order("name");
    if (data?.length) return data as Organization[];
  }
  return DEMO_ORGANIZATIONS;
}

export async function getExams(): Promise<Exam[]> {
  const supabase = await supabaseOrNull();
  if (supabase) {
    const { data } = await supabase.from("exams").select("*").order("family");
    if (data?.length) return data as Exam[];
  }
  return DEMO_EXAMS;
}

export async function countJobsByCategory(): Promise<Record<string, number>> {
  const jobs = await fetchPublishedJobs();
  const counts: Record<string, number> = {};
  for (const job of jobs) {
    const key = job.category || "other";
    counts[key] = (counts[key] ?? 0) + 1;
    if ((job.qualification_codes ?? []).includes("12th")) {
      counts["12th"] = (counts["12th"] ?? 0) + 1;
    }
    if ((job.qualification_codes ?? []).includes("10th")) {
      counts["10th"] = (counts["10th"] ?? 0) + 1;
    }
  }
  return counts;
}

export async function homepageSections() {
  const jobs = await fetchPublishedJobs();
  const closing = jobs.filter((job) => {
    if (!job.application_end_date) return false;
    const end = new Date(`${job.application_end_date}T00:00:00`).getTime();
    const now = Date.now();
    const days = Math.round((end - now) / 86_400_000);
    return days >= 0 && days <= 7;
  });
  const btech = jobs.filter((job) =>
    (job.qualification_codes ?? []).some((c) => c === "btech" || c === "be"),
  );
  const twelfth = jobs.filter((job) => (job.qualification_codes ?? []).includes("12th"));
  const technical = jobs.filter(
    (job) => job.category === "technical" || job.exam_family === "Technical" || job.category === "psu",
  );
  const latest = [...jobs].sort((a, b) =>
    (b.created_at ?? b.application_start_date ?? "").localeCompare(
      a.created_at ?? a.application_start_date ?? "",
    ),
  );

  return {
    total: jobs.length,
    latest: latest.slice(0, 6),
    closingSoon: closing.slice(0, 6),
    btech: btech.slice(0, 6),
    twelfth: twelfth.slice(0, 6),
    technical: technical.slice(0, 6),
    counts: await countJobsByCategory(),
  };
}

export async function adminStats() {
  const supabase = await supabaseOrNull();
  if (!supabase) {
    const jobs = DEMO_JOBS;
    return {
      totalJobs: jobs.length,
      verifiedJobs: jobs.filter((j) => j.is_verified).length,
      pendingJobs: jobs.filter((j) => j.status === "pending").length,
      closingSoon: jobs.filter((j) => j.application_end_date && j.application_end_date <= "2026-10-08").length,
      users: 0,
      savedJobs: 0,
      usingDemo: true,
    };
  }

  const [jobsRes, verifiedRes, pendingRes, usersRes, savedRes] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_verified", true),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("saved_jobs").select("id", { count: "exact", head: true }),
  ]);

  const today = new Date();
  const soon = new Date(today.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);
  const closing = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .gte("application_end_date", today.toISOString().slice(0, 10))
    .lte("application_end_date", soon);

  return {
    totalJobs: jobsRes.count ?? 0,
    verifiedJobs: verifiedRes.count ?? 0,
    pendingJobs: pendingRes.count ?? 0,
    closingSoon: closing.count ?? 0,
    users: usersRes.count ?? 0,
    savedJobs: savedRes.count ?? 0,
    usingDemo: false,
  };
}

export { DEMO_SOURCES };
