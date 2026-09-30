import type { Job, JobSearchParams, PaginatedJobs } from "@/types/jobs";
import { PAGE_SIZE } from "@/lib/constants";
import { getDeadlineState } from "@/lib/eligibility/age";

export function normalizeSearchParams(
  input: Record<string, string | string[] | undefined>,
): JobSearchParams {
  const first = (key: string) => {
    const value = input[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number(first("page") || "1");
  return {
    q: first("q")?.trim() || undefined,
    qualification: first("qualification") || undefined,
    branch: first("branch") || undefined,
    state: first("state") || undefined,
    organization: first("organization") || undefined,
    category: first("category") || undefined,
    experience: first("experience") || undefined,
    job_type: first("job_type") || undefined,
    application_status: first("application_status") || undefined,
    sort: (first("sort") as JobSearchParams["sort"]) || "deadline",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZE,
  };
}

function haystack(job: Job): string {
  return [
    job.title,
    job.qualification,
    job.category,
    job.exam_family,
    job.description,
    job.organization?.name,
    ...(job.branches ?? []),
    ...(job.locations ?? []),
    ...(job.states ?? []),
    ...(job.qualification_codes ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesQuery(job: Job, q?: string): boolean {
  if (!q) return true;
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const text = haystack(job);
  return tokens.every((token) => text.includes(token));
}

export function filterJobs(jobs: Job[], params: JobSearchParams, today = new Date()): Job[] {
  return jobs.filter((job) => {
    if (!matchesQuery(job, params.q)) return false;

    if (params.qualification) {
      const code = params.qualification.toLowerCase();
      const codes = (job.qualification_codes ?? []).map((c) => c.toLowerCase());
      const text = (job.qualification ?? "").toLowerCase();
      if (!codes.includes(code) && !text.includes(code)) return false;
    }

    if (params.branch && params.branch !== "any") {
      const wanted = params.branch.toLowerCase();
      const branches = (job.branches ?? []).map((b) => b.toLowerCase());
      if (!branches.includes("any") && !branches.includes(wanted)) return false;
    }

    if (params.state) {
      const wanted = params.state.toLowerCase();
      const states = (job.states ?? []).map((s) => s.toLowerCase());
      const locations = (job.locations ?? []).map((s) => s.toLowerCase());
      const allIndia = states.some((s) => s.includes("all india") || s === "central");
      if (!allIndia && !states.includes(wanted) && !locations.some((l) => l.includes(wanted))) {
        return false;
      }
    }

    if (params.organization) {
      const wanted = params.organization.toLowerCase();
      const slug = job.organization?.slug?.toLowerCase();
      const name = job.organization?.name?.toLowerCase() ?? "";
      if (slug !== wanted && !name.includes(wanted) && job.organization_id !== params.organization) {
        return false;
      }
    }

    if (params.category && job.category !== params.category && job.exam_family?.toLowerCase() !== params.category) {
      return false;
    }

    if (params.experience === "fresher") {
      const exp = (job.experience ?? "").toLowerCase();
      if (exp && !exp.includes("fresher") && !exp.includes("no experience") && !exp.includes("nil")) {
        return false;
      }
    }
    if (params.experience === "experienced") {
      const exp = (job.experience ?? "").toLowerCase();
      if (exp.includes("fresher") || exp.includes("no experience")) return false;
    }

    if (params.job_type && job.job_type !== params.job_type) return false;

    if (params.application_status) {
      const state = getDeadlineState(job.application_start_date, job.application_end_date, today);
      if (params.application_status === "open" && (state === "CLOSED" || state === "UPCOMING")) return false;
      if (params.application_status === "closing_soon" && state !== "CLOSING_SOON" && state !== "CLOSING_TODAY") return false;
      if (params.application_status === "closed" && state !== "CLOSED") return false;
      if (params.application_status === "upcoming" && state !== "UPCOMING") return false;
    }

    return true;
  });
}

export function sortJobs(jobs: Job[], sort: JobSearchParams["sort"] = "deadline"): Job[] {
  const copy = [...jobs];
  copy.sort((a, b) => {
    if (sort === "newest") {
      return (b.created_at ?? "").localeCompare(a.created_at ?? "") || b.slug.localeCompare(a.slug);
    }
    if (sort === "vacancies") {
      return (b.vacancies ?? 0) - (a.vacancies ?? 0);
    }
    const aEnd = a.application_end_date ?? "9999-12-31";
    const bEnd = b.application_end_date ?? "9999-12-31";
    return aEnd.localeCompare(bEnd);
  });
  return copy;
}

export function paginateJobs(jobs: Job[], page = 1, pageSize = PAGE_SIZE): PaginatedJobs {
  const pageCount = Math.max(1, Math.ceil(jobs.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    jobs: jobs.slice(start, start + pageSize),
    total: jobs.length,
    page: safePage,
    pageSize,
    pageCount,
  };
}
