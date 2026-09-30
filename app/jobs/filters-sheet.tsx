"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { JobFilters } from "@/components/jobs/job-filters";
import { Button } from "@/components/ui/button";

export function FiltersSheet({
  organizations,
}: {
  organizations: { slug: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="ghost" className="w-full" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-primary/40" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 bottom-0 left-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex justify-between">
              <h2 className="font-headline-md">Filters</h2>
              <button type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <JobFilters organizations={organizations} mobile />
          </div>
        </div>
      ) : null}
    </>
  );
}
