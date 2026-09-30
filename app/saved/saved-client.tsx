"use client";

import { useState } from "react";
import type { EligibilityResult } from "@/types/eligibility";
import type { DeadlineState, Job } from "@/types/jobs";
import { JobCard } from "@/components/jobs/job-card";
import { EmptyState } from "@/components/ui/empty-state";

type Item = {
  job: Job;
  eligibility: EligibilityResult | null;
  deadline: DeadlineState;
  applied: boolean;
};

export function SavedJobsClient({ items }: { items: Item[] }) {
  const [tab, setTab] = useState<"all" | "eligible" | "closing" | "applied">("all");
  const filtered = items.filter((item) => {
    if (tab === "eligible") return item.eligibility?.status === "ELIGIBLE";
    if (tab === "closing") return item.deadline === "CLOSING_SOON" || item.deadline === "CLOSING_TODAY";
    if (tab === "applied") return item.applied;
    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="font-headline-xl font-bold text-primary">Saved jobs</h1>
      <div className="flex flex-wrap gap-2">
        {(["all", "eligible", "closing", "applied"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-3 py-1 text-label-md ${tab === key ? "bg-primary text-on-primary" : "bg-surface-container"}`}
          >
            {key === "all" ? "All" : key === "eligible" ? "Eligible" : key === "closing" ? "Closing Soon" : "Applied"}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          title="No saved jobs in this tab."
          description="Save listings from search to track them here."
          actionHref="/jobs"
          actionLabel="Browse jobs"
        />
      ) : (
        filtered.map((item) => (
          <JobCard key={item.job.id} job={item.job} eligibility={item.eligibility} saved />
        ))
      )}
    </div>
  );
}
