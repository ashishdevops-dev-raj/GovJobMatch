import { JobCardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <JobCardSkeleton />
      <JobCardSkeleton />
    </div>
  );
}
