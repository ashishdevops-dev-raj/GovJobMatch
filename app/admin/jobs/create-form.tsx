"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function CreateJobForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-xl bg-surface-container-lowest p-space-md md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        start(async () => {
          const res = await fetch("/api/admin/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: form.get("title"),
              organization_id: form.get("organization_id"),
              qualification: form.get("qualification"),
              official_notification_url: form.get("official_notification_url"),
              official_apply_url: form.get("official_apply_url"),
              application_end_date: form.get("application_end_date"),
              status: "pending",
              is_verified: false,
              is_sample: form.get("is_sample") === "on",
              description: "Admin-created listing. Verify against the official notification.",
              qualification_codes: [],
              branches: [],
              required_conditions: [],
            }),
          });
          setMessage(res.ok ? "Job created as pending." : "Create failed (admin + service role required).");
        });
      }}
    >
      <h2 className="md:col-span-2 font-headline-md">Create job</h2>
      <div>
        <Label>Title</Label>
        <Input name="title" required />
      </div>
      <div>
        <Label>Organization UUID</Label>
        <Input name="organization_id" required />
      </div>
      <div>
        <Label>Qualification</Label>
        <Input name="qualification" />
      </div>
      <div>
        <Label>End date</Label>
        <Input name="application_end_date" type="date" />
      </div>
      <div>
        <Label>Official notification URL</Label>
        <Input name="official_notification_url" type="url" required />
      </div>
      <div>
        <Label>Official apply URL</Label>
        <Input name="official_apply_url" type="url" />
      </div>
      <label className="flex items-center gap-2 text-body-sm">
        <input type="checkbox" name="is_sample" /> Mark as sample / demo
      </label>
      <div>
        <Button type="submit" disabled={pending}>
          Create
        </Button>
        {message ? <p className="text-body-sm">{message}</p> : null}
      </div>
    </form>
  );
}
