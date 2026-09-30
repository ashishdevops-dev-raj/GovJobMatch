"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { useState, useTransition } from "react";
import { BRANCHES, INDIAN_STATES, QUALIFICATIONS, SOCIAL_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { EMPTY_PROFILE, type ProfileRecord } from "@/types/profile";

export function ProfileForm({
  email,
  profile,
}: {
  email: string;
  profile: ProfileRecord | null;
}) {
  const [form, setForm] = useState({ ...EMPTY_PROFILE, ...profile });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function update(key: string, value: string | number | null | string[]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="grid gap-4 rounded-xl bg-surface-container-lowest p-space-lg md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          setMessage(res.ok ? "Profile saved." : "Could not save profile. Is Supabase configured?");
        });
      }}
    >
      <div className="md:col-span-2 flex items-center justify-between">
        <p className="text-body-sm text-on-surface-variant">Signed in as {email}</p>
        <LogoutButton />
      </div>
      <Field label="Name">
        <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
      </Field>
      <Field label="Date of birth">
        <Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} />
      </Field>
      <Field label="State">
        <Select value={form.state} onChange={(e) => update("state", e.target.value)}>
          <option value="">Select</option>
          {INDIAN_STATES.map((state) => (
            <option key={state}>{state}</option>
          ))}
        </Select>
      </Field>
      <Field label="Category">
        <Select value={form.category} onChange={(e) => update("category", e.target.value)}>
          <option value="">Select</option>
          {SOCIAL_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Qualification">
        <Select
          value={form.highest_qualification}
          onChange={(e) => update("highest_qualification", e.target.value)}
        >
          <option value="">Select</option>
          {QUALIFICATIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Branch">
        <Select value={form.branch} onChange={(e) => update("branch", e.target.value)}>
          <option value="">Select</option>
          {BRANCHES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Passing year">
        <Input
          type="number"
          value={form.passing_year ?? ""}
          onChange={(e) => update("passing_year", e.target.value ? Number(e.target.value) : null)}
        />
      </Field>
      <Field label="Experience">
        <Select value={form.experience_level} onChange={(e) => update("experience_level", e.target.value)}>
          <option value="fresher">Fresher</option>
          <option value="experienced">Experienced</option>
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          Save profile
        </Button>
        {message ? <p className="mt-2 text-body-sm text-secondary">{message}</p> : null}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
