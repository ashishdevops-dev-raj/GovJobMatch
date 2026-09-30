"use client";

import { useTransition } from "react";
import type { Job } from "@/types/jobs";
import { Badge } from "@/components/ui/badge";

export function AdminJobsTable({ jobs }: { jobs: Job[] }) {
  const [, start] = useTransition();

  function patch(id: string, body: Record<string, unknown>) {
    start(async () => {
      await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-surface-container-lowest">
      <table className="w-full text-left text-body-sm">
        <thead className="bg-surface-container-low">
          <tr>
            <th className="p-3">Title</th>
            <th className="p-3">Status</th>
            <th className="p-3">Flags</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-t border-outline-variant">
              <td className="p-3">
                <div className="font-semibold">{job.title}</div>
                <a className="text-label-sm text-primary underline" href={job.official_notification_url ?? "#"}>
                  Official notice
                </a>
              </td>
              <td className="p-3">{job.status}</td>
              <td className="p-3">
                {job.is_sample ? <Badge tone="warn">Demo Data</Badge> : null}
                {job.is_verified ? <Badge tone="success">Verified</Badge> : <Badge>Unverified</Badge>}
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  <button type="button" onClick={() => patch(job.id, { status: "published", is_verified: true })}>
                    Publish / Verify
                  </button>
                  <button type="button" onClick={() => patch(job.id, { status: "unpublished" })}>
                    Unpublish
                  </button>
                  <button type="button" onClick={() => patch(job.id, { is_sample: !job.is_sample })}>
                    Toggle sample
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      start(async () => {
                        await fetch("/api/admin/jobs", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: job.id }),
                        });
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
