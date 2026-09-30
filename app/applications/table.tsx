"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { ApplicationRecord } from "@/types/jobs";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";

export function ApplicationsTable({ records }: { records: ApplicationRecord[] }) {
  const [, start] = useTransition();
  if (records.length === 0) {
    return (
      <EmptyState
        title="No tracked applications"
        description="Open a job and use Track Application."
        actionHref="/jobs"
        actionLabel="Browse jobs"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-sm">
      <table className="w-full text-left text-body-sm">
        <thead className="bg-surface-container-low text-label-md">
          <tr>
            <th className="p-3">Job</th>
            <th className="p-3">Status</th>
            <th className="p-3">Updated</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-t border-outline-variant">
              <td className="p-3">
                <Link href={`/jobs/${record.job?.slug ?? record.job_id}`} className="font-semibold text-primary">
                  {record.job?.title ?? record.job_id}
                </Link>
              </td>
              <td className="p-3">
                <select
                  defaultValue={record.status}
                  className="rounded-lg bg-surface-container-low px-2 py-1"
                  onChange={(e) =>
                    start(async () => {
                      await fetch("/api/applications", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: record.id, status: e.target.value }),
                      });
                    })
                  }
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-3 text-on-surface-variant">{record.updated_at?.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
