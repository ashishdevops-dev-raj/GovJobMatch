import Link from "next/link";
import type { EligibilityResult } from "@/types/eligibility";
import type { Job } from "@/types/jobs";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { deadlineLabel, getDeadlineState } from "@/lib/eligibility/age";
import { formatDate, formatNumber, cn } from "@/lib/utils";
import { EligibilityBadge } from "./eligibility-badge";
import { SaveJobButton } from "./save-job-button";
import { ApplyOfficialButton } from "./apply-official-button";

export function JobCard({
  job,
  eligibility,
  saved,
}: {
  job: Job;
  eligibility?: EligibilityResult | null;
  saved?: boolean;
}) {
  const deadline = getDeadlineState(job.application_start_date, job.application_end_date);
  const orgName = job.organization?.name ?? "Government organisation";
  const orgShort = job.organization?.slug?.toUpperCase() ?? orgName.slice(0, 4).toUpperCase();

  return (
    <article className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-space-md">
        <div className="flex items-start gap-space-md">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-container-low font-headline-sm font-bold text-primary">
            {orgShort.slice(0, 4)}
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-label-sm font-semibold text-primary">
                {orgName}
              </span>
              {job.is_sample ? <Badge tone="warn">Demo Data</Badge> : <Badge tone="info">Fetched / verified</Badge>}
              {job.is_verified ? <Badge tone="success">Verified listing</Badge> : null}
            </div>
            <h2 className="font-headline-md text-headline-md tracking-tight text-primary">{job.title}</h2>
            <p className="text-body-sm text-on-surface-variant">
              {job.locations?.slice(0, 3).join(" • ") || "Location in official notice"}
            </p>
          </div>
        </div>
        <EligibilityBadge result={eligibility ?? null} />
      </div>

      <div className="grid grid-cols-2 gap-space-sm rounded-xl bg-surface-container-low p-space-sm sm:grid-cols-4">
        <Meta label="Qualification" value={job.qualification || "See notice"} />
        <Meta
          label="Age"
          value={
            job.minimum_age != null || job.maximum_age != null
              ? `${job.minimum_age ?? "—"} – ${job.maximum_age ?? "—"} yrs`
              : "See notice"
          }
        />
        <Meta label="Vacancies" value={job.vacancies ? `${formatNumber(job.vacancies)} posts` : "See notice"} />
        <Meta
          label="Last date"
          value={`${formatDate(job.application_end_date)} (${deadlineLabel(deadline, job.application_end_date)})`}
          warn={deadline === "CLOSING_SOON" || deadline === "CLOSING_TODAY"}
        />
      </div>

      {eligibility ? (
        <div
          className={cn(
            "rounded-xl p-space-sm text-body-sm",
            eligibility.status === "ELIGIBLE" && "bg-secondary/10 text-on-surface",
            eligibility.status === "CHECK_DETAILS" && "bg-tertiary-fixed/60 text-on-surface",
            eligibility.status === "NOT_ELIGIBLE" && "bg-error-container/50 text-on-surface",
          )}
        >
          {eligibility.status === "ELIGIBLE"
            ? eligibility.matchedRules.slice(0, 4).map((rule) => (
                <p key={rule.label}>✓ {rule.detail}</p>
              ))
            : null}
          {eligibility.warnings.map((rule) => (
            <p key={rule.label}>⚠ {rule.detail}</p>
          ))}
          {eligibility.failedRules.map((rule) => (
            <p key={rule.label}>✕ {rule.detail}</p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <p className="text-body-sm text-on-surface-variant">
          Status: {deadline.replaceAll("_", " ")}
        </p>
        <div className="flex flex-wrap items-center gap-space-sm">
          <SaveJobButton jobId={job.id} saved={saved} />
          <Link href={`/jobs/${job.slug}`} className={cn(buttonVariants({ variant: "ghost" }))}>
            View Details
          </Link>
          <ApplyOfficialButton href={job.official_apply_url || job.official_notification_url} />
        </div>
      </div>
    </article>
  );
}

function Meta({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <span className={cn("font-headline-sm text-headline-sm font-bold", warn ? "text-error" : "text-primary")}>
        {value}
      </span>
    </div>
  );
}
