import Link from "next/link";
import { Suspense } from "react";
import { JobCard } from "@/components/jobs/job-card";
import { JobFilters } from "@/components/jobs/job-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { JobCardSkeleton } from "@/components/ui/skeleton";
import { getOrganizations, searchJobs } from "@/lib/jobs/queries";
import { normalizeSearchParams } from "@/lib/jobs/search";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { checkEligibility } from "@/lib/eligibility/engine";
import { FiltersSheet } from "./filters-sheet";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Government Jobs",
  description: "Search verified and demo-labelled Indian government job listings with eligibility filters.",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = normalizeSearchParams(raw);
  const [result, organizations, user] = await Promise.all([
    searchJobs(params),
    getOrganizations(),
    getSessionUser(),
  ]);
  const profile = user ? await getProfile(user.id) : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <h1 className="font-headline-xl tracking-tight text-primary">
          Government Jobs{" "}
          <span className="font-normal text-on-surface-variant">({result.total} listings)</span>
        </h1>
        <p className="mt-2 max-w-3xl text-body-lg text-on-surface-variant">
          Browse recruitment notifications linked to official websites. Filters are stored in the URL so they survive refresh.
        </p>
        <form className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-12">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search jobs, exams, departments, or qualifications"
            className="h-12 rounded-lg bg-surface-container-low px-4 md:col-span-8"
          />
          <button type="submit" className="h-12 rounded-lg bg-primary text-on-primary md:col-span-3">
            Search
          </button>
          <div className="md:col-span-1 md:hidden">
            <FiltersSheet organizations={organizations} />
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
        <div className="hidden xl:col-span-4 xl:block">
          <JobFilters organizations={organizations} />
        </div>
        <div className="space-y-4 xl:col-span-8">
          <Suspense fallback={<JobCardSkeleton />}>
            {result.jobs.length === 0 ? (
              <EmptyState
                title="No government jobs found."
                description="Try removing some filters or searching a broader qualification / state."
                actionHref="/jobs"
                actionLabel="Clear filters"
              />
            ) : (
              result.jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  eligibility={profile ? checkEligibility(profile, job) : null}
                />
              ))
            )}
          </Suspense>
          <Pagination page={result.page} pageCount={result.pageCount} params={raw} />
        </div>
      </div>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  params,
}: {
  page: number;
  pageCount: number;
  params: Record<string, string | string[] | undefined>;
}) {
  const make = (next: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const v = Array.isArray(value) ? value[0] : value;
      if (v) search.set(key, v);
    }
    search.set("page", String(next));
    return `/jobs?${search.toString()}`;
  };
  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface-container-lowest p-space-md">
      <span className="text-body-sm text-on-surface-variant">
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={make(page - 1)} className="rounded-lg bg-surface-container px-3 py-2 text-label-md">
            Previous
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link href={make(page + 1)} className="rounded-lg bg-primary px-3 py-2 text-label-md text-on-primary">
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
