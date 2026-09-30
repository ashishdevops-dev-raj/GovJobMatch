import type { EligibilityResult } from "@/types/eligibility";
import type { Job } from "@/types/jobs";
import { JobCard } from "@/components/jobs/job-card";

export function EligibilityResultCard({
  job,
  result,
}: {
  job: Job;
  result: EligibilityResult;
}) {
  return (
    <div className="space-y-2">
      <JobCard job={job} eligibility={result} />
    </div>
  );
}
