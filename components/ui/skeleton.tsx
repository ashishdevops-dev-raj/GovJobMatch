import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-container", className)} />;
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <Skeleton className="mb-4 h-6 w-2/3" />
      <Skeleton className="mb-2 h-4 w-1/2" />
      <div className="mt-4 grid grid-cols-4 gap-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}
