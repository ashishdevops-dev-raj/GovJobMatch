"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BRANCHES, INDIAN_STATES, QUALIFICATIONS, SOCIAL_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { CandidateProfile } from "@/types/profile";
import { EMPTY_PROFILE } from "@/types/profile";

const STEPS = ["Basic Information", "Education", "Experience", "Preferences", "Results"];

export function EligibilityWizard({ initial }: { initial?: Partial<CandidateProfile> }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [form, setForm] = useState<CandidateProfile>({ ...EMPTY_PROFILE, ...initial });

  const agePreview = useMemo(() => {
    if (!form.date_of_birth) return null;
    const birth = new Date(`${form.date_of_birth}T00:00:00`);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years -= 1;
    return years;
  }, [form.date_of_birth]);

  function update<K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function next() {
    if (step < 4) setStep(step + 1);
  }

  function run() {
    start(async () => {
      const res = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) return;
      const payload = await res.json();
      sessionStorage.setItem("gjm-eligibility-profile", JSON.stringify(form));
      sessionStorage.setItem("gjm-eligibility-results", JSON.stringify(payload));
      router.push("/eligibility/results");
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-lg p-space-sm text-left ${
              index === step ? "bg-primary text-on-primary" : "bg-surface-container-low"
            }`}
          >
            <p className="text-label-sm opacity-80">Step {index + 1}</p>
            <p className="text-label-md font-semibold">{label}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="State / domicile">
              <Select value={form.state} onChange={(e) => update("state", e.target.value)}>
                <option value="">Select</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
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
            {agePreview != null ? (
              <p className="md:col-span-2 text-body-sm text-secondary">Calculated age today: {agePreview} years (exact cutoff used at match time).</p>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Highest qualification">
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
            <Field label="Branch / stream">
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
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Experience level">
              <Select
                value={form.experience_level}
                onChange={(e) => update("experience_level", e.target.value)}
              >
                <option value="fresher">Fresher</option>
                <option value="experienced">Experienced</option>
              </Select>
            </Field>
            <Field label="Years of experience">
              <Input
                type="number"
                min={0}
                step="0.5"
                value={form.experience_years ?? 0}
                onChange={(e) => update("experience_years", Number(e.target.value))}
              />
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <p className="text-body-sm text-on-surface-variant">
              Preferred states are used when a notification is state-specific. Central / All-India jobs still appear.
            </p>
            <div className="flex flex-wrap gap-2">
              {INDIAN_STATES.slice(0, 12).map((state) => {
                const on = form.preferred_states.includes(state);
                return (
                  <button
                    type="button"
                    key={state}
                    onClick={() =>
                      update(
                        "preferred_states",
                        on
                          ? form.preferred_states.filter((item) => item !== state)
                          : [...form.preferred_states, state],
                      )
                    }
                    className={`rounded-full px-3 py-1 text-label-sm ${on ? "bg-primary text-on-primary" : "bg-surface-container"}`}
                  >
                    {state}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-2 text-body-md">
            <p>
              <strong>{form.full_name || "Candidate"}</strong> · {form.highest_qualification || "Qualification not set"}{" "}
              {form.branch && form.branch !== "any" ? `· ${form.branch}` : ""} · {form.state || "State not set"} ·{" "}
              {form.experience_level || "experience not set"}
            </p>
            <p className="text-on-surface-variant">
              Matching uses structured job criteria only. Results are an automated indication, not an official eligibility certificate.
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            Back
          </Button>
          {step < 4 ? (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={run} disabled={pending}>
              {pending ? "Matching…" : "Show matching jobs"}
            </Button>
          )}
        </div>
      </div>
    </div>
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
