import { describe, expect, it } from "vitest";
import { checkEligibility } from "@/lib/eligibility/engine";
import { ageInYears, calculateAge, getDeadlineState, daysUntil } from "@/lib/eligibility/age";
import { qualificationSatisfies } from "@/lib/eligibility/qualification";
import { branchSatisfies } from "@/lib/eligibility/branch";
import { jobFingerprint } from "@/lib/jobs/fingerprint";
import { DEMO_JOBS } from "@/lib/data/demo";
import type { CandidateProfile } from "@/types/profile";
import type { Job } from "@/types/jobs";

const candidate: CandidateProfile = {
  full_name: "Test Candidate",
  date_of_birth: "2002-06-15",
  gender: "male",
  state: "Bihar",
  category: "general",
  highest_qualification: "btech",
  branch: "cse",
  passing_year: 2024,
  experience_level: "fresher",
  experience_years: 0,
  preferred_states: ["Bihar"],
  preferred_categories: [],
};

function job(partial: Partial<Job>): Job {
  return {
    id: "t",
    organization_id: "org",
    source_id: null,
    title: "Test",
    slug: "test",
    description: "test",
    qualification: "B.Tech",
    branches: ["cse"],
    minimum_age: 18,
    maximum_age: 30,
    age_relaxation: { cutoff_date: "2026-08-01" },
    experience: "No experience required",
    states: ["All India"],
    locations: ["All India"],
    vacancies: 10,
    salary_min: null,
    salary_max: null,
    salary_text: null,
    job_type: "permanent",
    category: "technical",
    application_start_date: "2026-09-01",
    application_end_date: "2026-10-15",
    exam_date: null,
    selection_process: [],
    application_fee: {},
    official_notification_url: "https://ssc.gov.in",
    official_apply_url: "https://ssc.gov.in",
    source_url: "https://ssc.gov.in",
    status: "published",
    is_verified: true,
    is_sample: true,
    qualification_codes: ["btech"],
    required_conditions: [],
    exam_family: "Technical",
    ...partial,
  };
}

describe("age calculation", () => {
  it("uses exact dates rather than year subtraction", () => {
    expect(calculateAge("2000-10-02", "2026-10-01")).toEqual({ years: 25, months: 11, days: 29 });
    expect(ageInYears("2000-10-01", "2026-10-01")).toBe(26);
    expect(ageInYears("2002-06-15", "2026-08-01")).toBe(24);
  });
});

describe("qualification matching", () => {
  it("lets B.Tech satisfy graduate posts", () => {
    const result = qualificationSatisfies("btech", ["graduate"]);
    expect(result.matched).toBe(true);
  });

  it("does not let 12th satisfy B.Tech-only posts", () => {
    const result = qualificationSatisfies("12th", ["btech"]);
    expect(result.matched).toBe(false);
  });
});

describe("branch matching", () => {
  it("matches CSE to CSE", () => {
    expect(branchSatisfies("cse", ["cse", "it"]).matched).toBe(true);
  });

  it("rejects CSE for mechanical-only jobs", () => {
    expect(branchSatisfies("cse", ["mechanical"]).matched).toBe(false);
  });
});

describe("deadline logic", () => {
  it("classifies open, closing soon, today, and closed", () => {
    const today = new Date("2026-10-01T00:00:00");
    expect(getDeadlineState("2026-09-01", "2026-10-20", today)).toBe("OPEN");
    expect(getDeadlineState("2026-09-01", "2026-10-05", today)).toBe("CLOSING_SOON");
    expect(getDeadlineState("2026-09-01", "2026-10-01", today)).toBe("CLOSING_TODAY");
    expect(getDeadlineState("2026-09-01", "2026-09-30", today)).toBe("CLOSED");
    expect(daysUntil("2026-10-08", today)).toBe(7);
  });
});

describe("duplicate detection", () => {
  it("creates a stable fingerprint", () => {
    const a = jobFingerprint("SSC", "CGL Demo", "2026-10-15");
    const b = jobFingerprint("ssc", "  cgl demo ", "2026-10-15");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});

describe("eligibility engine", () => {
  it("marks B.Tech CSE age 24 fresher as ELIGIBLE for a matching B.Tech job", () => {
    const result = checkEligibility(candidate, job({}));
    expect(result.status).toBe("ELIGIBLE");
    expect(result.failedRules).toHaveLength(0);
  });

  it("marks mechanical-only jobs as NOT_ELIGIBLE", () => {
    const mechanical = DEMO_JOBS.find((item) => item.slug === "drdo-mechanical-demo")!;
    const result = checkEligibility(candidate, mechanical);
    expect(result.status).toBe("NOT_ELIGIBLE");
    expect(result.failedRules.some((rule) => rule.kind === "branch")).toBe(true);
  });

  it("returns CHECK_DETAILS when additional conditions exist", () => {
    const gate = DEMO_JOBS.find((item) => item.slug === "psu-gate-demo")!;
    const result = checkEligibility(candidate, gate);
    expect(result.status).toBe("CHECK_DETAILS");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("applies age relaxation only when structured on the job", () => {
    const older: CandidateProfile = { ...candidate, date_of_birth: "1993-01-01", category: "obc" };
    const without = checkEligibility(older, job({ maximum_age: 32, age_relaxation: {} }));
    expect(without.status).toBe("NOT_ELIGIBLE");
    const withRelax = checkEligibility(
      older,
      job({ maximum_age: 32, age_relaxation: { obc: 3, cutoff_date: "2026-08-01" } }),
    );
    expect(withRelax.failedRules.some((rule) => rule.kind === "age")).toBe(false);
    expect(withRelax.warnings.some((rule) => rule.kind === "age")).toBe(true);
    expect(withRelax.status).toBe("CHECK_DETAILS");
  });
});
