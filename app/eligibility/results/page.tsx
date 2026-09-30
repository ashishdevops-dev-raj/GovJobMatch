"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { EligibilityResult } from "@/types/eligibility";
import type { Job } from "@/types/jobs";
import { EligibilityResultCard } from "@/components/eligibility/result-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ELIGIBILITY_DISCLAIMER } from "@/lib/constants";

interface Payload {
  summary: { total: number; eligible: number; check: number; notEligible: number };
  results: { job: Job; result: EligibilityResult }[];
}

function subscribe() {
  return () => undefined;
}

function snapshot() {
  return sessionStorage.getItem("gjm-eligibility-results");
}

function serverSnapshot() {
  return null;
}

export default function EligibilityResultsPage() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const data: Payload | null = raw ? (JSON.parse(raw) as Payload) : null;
  const [tab, setTab] = useState<"all" | "ELIGIBLE" | "CHECK_DETAILS" | "NOT_ELIGIBLE">("all");

  if (!data) {
    return (
      <EmptyState
        title="No matcher results yet"
        description="Complete the eligibility wizard to see matching jobs."
        actionHref="/eligibility"
        actionLabel="Start matcher"
      />
    );
  }

  const filtered =
    tab === "all" ? data.results : data.results.filter((item) => item.result.status === tab);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-surface-container-lowest p-space-lg">
        <h1 className="font-headline-xl font-bold text-primary">Personalized results</h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">{ELIGIBILITY_DISCLAIMER}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total matching evaluated" value={data.summary.total} onClick={() => setTab("all")} />
          <Stat label="Eligible indication" value={data.summary.eligible} onClick={() => setTab("ELIGIBLE")} />
          <Stat label="Check details" value={data.summary.check} onClick={() => setTab("CHECK_DETAILS")} />
          <Stat label="Not eligible indication" value={data.summary.notEligible} onClick={() => setTab("NOT_ELIGIBLE")} />
        </div>
        <Link href="/eligibility" className="mt-4 inline-block text-label-md text-primary underline">
          Edit parameters / re-run
        </Link>
      </section>
      <div className="space-y-4">
        {filtered.map(({ job, result }) => (
          <EligibilityResultCard key={job.id} job={job} result={result} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, onClick }: { label: string; value: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl bg-surface-container-low p-space-md text-left">
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-headline-lg font-bold text-primary">{value}</p>
    </button>
  );
}
