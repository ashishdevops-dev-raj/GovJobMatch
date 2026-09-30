import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ELIGIBILITY_DISCLAIMER } from "@/lib/constants";
import { getJobBySlug } from "@/lib/jobs/queries";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { checkEligibility } from "@/lib/eligibility/engine";
import { formatDate, formatNumber, sanitizeText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ApplyOfficialButton } from "@/components/jobs/apply-official-button";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { EligibilityBadge } from "@/components/jobs/eligibility-badge";
import { TrackApplicationButton } from "./track-button";
import { deadlineLabel, getDeadlineState } from "@/lib/eligibility/age";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobBySlug(id);
  if (!job) return { title: "Job not found" };
  return {
    title: job.title,
    description: sanitizeText(job.description).slice(0, 160),
    alternates: { canonical: `/jobs/${job.slug}` },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobBySlug(id);
  if (!job) notFound();
  const user = await getSessionUser();
  const profile = user ? await getProfile(user.id) : null;
  const eligibility = profile ? checkEligibility(profile, job) : null;
  const deadline = getDeadlineState(job.application_start_date, job.application_end_date);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-md">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-label-md font-bold tracking-wider text-primary uppercase">
            {job.organization?.name}
          </span>
          {job.is_sample ? <Badge tone="warn">Demo Data</Badge> : <Badge tone="info">Source-linked listing</Badge>}
          <EligibilityBadge result={eligibility} />
        </div>
        <h1 className="font-headline-xl font-bold tracking-tight text-primary">{job.title}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">{sanitizeText(job.description)}</p>
        <p className="mt-4 text-label-md text-error">
          {formatDate(job.application_end_date)} · {deadlineLabel(deadline, job.application_end_date)}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <ApplyOfficialButton href={job.official_apply_url || job.official_notification_url} />
          <SaveJobButton jobId={job.id} />
          <TrackApplicationButton jobId={job.id} />
        </div>
        <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
          {ELIGIBILITY_DISCLAIMER}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Qualification" value={job.qualification} />
        <Fact label="Branch" value={job.branches.join(", ") || "Any / see notice"} />
        <Fact
          label="Age"
          value={
            job.minimum_age != null
              ? `${job.minimum_age}–${job.maximum_age} years`
              : "See official notification"
          }
        />
        <Fact
          label="Age relaxation"
          value={
            Object.keys(job.age_relaxation || {}).filter((k) => k !== "cutoff_date").length
              ? JSON.stringify(job.age_relaxation)
              : "Not specified in structured data"
          }
        />
        <Fact label="Experience" value={job.experience || "See notice"} />
        <Fact label="Salary" value={job.salary_text || "See notice"} />
        <Fact label="Vacancies" value={job.vacancies ? formatNumber(job.vacancies) : "See notice"} />
        <Fact label="Location" value={job.locations.join(", ") || job.states.join(", ")} />
        <Fact label="Application start" value={formatDate(job.application_start_date)} />
        <Fact label="Application end" value={formatDate(job.application_end_date)} />
        <Fact label="Exam date" value={formatDate(job.exam_date)} />
        <Fact label="Job type" value={job.job_type || "See notice"} />
      </div>

      <section className="rounded-xl bg-surface-container-lowest p-space-lg">
        <h2 className="mb-3 font-headline-lg text-primary">Application fee</h2>
        <pre className="text-body-sm whitespace-pre-wrap text-on-surface-variant">
          {JSON.stringify(job.application_fee, null, 2)}
        </pre>
      </section>

      <section className="rounded-xl bg-surface-container-lowest p-space-lg">
        <h2 className="mb-3 font-headline-lg text-primary">Selection process</h2>
        <ol className="list-decimal space-y-1 pl-5 text-body-md">
          {job.selection_process.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      {eligibility ? (
        <section className="rounded-xl bg-surface-container-lowest p-space-lg">
          <h2 className="mb-3 font-headline-lg text-primary">Why this indication</h2>
          {eligibility.matchedRules.map((rule) => (
            <p key={rule.label} className="text-body-sm">
              ✓ {rule.detail}
            </p>
          ))}
          {eligibility.warnings.map((rule) => (
            <p key={rule.label} className="text-body-sm">
              ⚠ {rule.detail}
            </p>
          ))}
          {eligibility.failedRules.map((rule) => (
            <p key={rule.label} className="text-body-sm">
              ✕ {rule.detail}
            </p>
          ))}
        </section>
      ) : null}

      <section className="rounded-xl bg-surface-container-lowest p-space-lg">
        <h2 className="mb-3 font-headline-lg text-primary">Official notification</h2>
        <a className="text-primary underline" href={job.official_notification_url ?? undefined} target="_blank" rel="noopener noreferrer">
          {job.official_notification_url}
        </a>
        <p className="mt-2 text-body-sm">
          Official application:{" "}
          <a className="underline" href={job.official_apply_url ?? undefined} target="_blank" rel="noopener noreferrer">
            {job.official_apply_url}
          </a>
        </p>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      <p className="text-label-sm tracking-wider text-on-surface-variant uppercase">{label}</p>
      <p className="mt-1 font-headline-sm font-bold text-on-surface">{value}</p>
    </div>
  );
}
