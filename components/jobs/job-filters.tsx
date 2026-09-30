"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { BRANCHES, INDIAN_STATES, JOB_CATEGORIES, QUALIFICATIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";

export function JobFilters({
  organizations,
  mobile,
}: {
  organizations: { slug: string; name: string }[];
  mobile?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    router.push(`/jobs?${next.toString()}`);
  }

  function clear() {
    router.push("/jobs");
  }

  const current = {
    qualification: params.get("qualification") ?? "",
    branch: params.get("branch") ?? "",
    state: params.get("state") ?? "",
    organization: params.get("organization") ?? "",
    category: params.get("category") ?? "",
    experience: params.get("experience") ?? "",
    job_type: params.get("job_type") ?? "",
    application_status: params.get("application_status") ?? "",
    sort: params.get("sort") ?? "deadline",
  };

  return (
    <aside className={mobile ? "space-y-4" : "sticky top-20 space-y-4"}>
      <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-headline-sm text-primary">Filters</h2>
          <button type="button" onClick={clear} className="flex items-center gap-1 text-label-sm text-error">
            <X className="h-3 w-3" /> Reset
          </button>
        </div>
        <FilterSelect
          label="Qualification"
          value={current.qualification}
          onChange={(v) => setParam("qualification", v)}
          options={QUALIFICATIONS.map((item) => ({ value: item.value, label: item.label }))}
        />
        <FilterSelect
          label="Branch"
          value={current.branch}
          onChange={(v) => setParam("branch", v)}
          options={BRANCHES.map((item) => ({ value: item.value, label: item.label }))}
        />
        <FilterSelect
          label="State"
          value={current.state}
          onChange={(v) => setParam("state", v)}
          options={INDIAN_STATES.map((state) => ({ value: state, label: state }))}
        />
        <FilterSelect
          label="Organization"
          value={current.organization}
          onChange={(v) => setParam("organization", v)}
          options={organizations.map((org) => ({ value: org.slug, label: org.name }))}
        />
        <FilterSelect
          label="Category"
          value={current.category}
          onChange={(v) => setParam("category", v)}
          options={JOB_CATEGORIES.map((item) => ({ value: item.value, label: item.label }))}
        />
        <FilterSelect
          label="Experience"
          value={current.experience}
          onChange={(v) => setParam("experience", v)}
          options={[
            { value: "fresher", label: "Fresher" },
            { value: "experienced", label: "Experienced" },
          ]}
        />
        <FilterSelect
          label="Job type"
          value={current.job_type}
          onChange={(v) => setParam("job_type", v)}
          options={[
            { value: "permanent", label: "Permanent" },
            { value: "contract", label: "Contract" },
            { value: "apprentice", label: "Apprentice" },
          ]}
        />
        <FilterSelect
          label="Application status"
          value={current.application_status}
          onChange={(v) => setParam("application_status", v)}
          options={[
            { value: "open", label: "Open" },
            { value: "closing_soon", label: "Closing soon" },
            { value: "closed", label: "Closed" },
            { value: "upcoming", label: "Upcoming" },
          ]}
        />
        <FilterSelect
          label="Sort"
          value={current.sort}
          onChange={(v) => setParam("sort", v)}
          options={[
            { value: "deadline", label: "Deadline" },
            { value: "newest", label: "Newest" },
            { value: "vacancies", label: "Vacancies" },
          ]}
        />
        <Button type="button" variant="ghost" className="mt-2 w-full" onClick={clear}>
          Clear all filters
        </Button>
      </div>
    </aside>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mb-3">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg bg-surface-container-low px-2 text-body-sm"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
