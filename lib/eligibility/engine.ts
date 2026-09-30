import type { CandidateProfile } from "@/types/profile";
import type { Job } from "@/types/jobs";
import type {
  AgeRelaxation,
  EligibilityResult,
  EligibilityRuleResult,
  EligibilityStatus,
} from "@/types/eligibility";
import { ageInYears, isAgeWithinRange } from "./age";
import { branchSatisfies, formatBranch } from "./branch";
import { displayQualification, qualificationSatisfies } from "./qualification";

function todayIso(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function cutoffDate(job: Job): string {
  const fromRules = job.age_relaxation?.cutoff_date;
  if (typeof fromRules === "string" && fromRules) return fromRules;
  return job.application_end_date || job.application_start_date || todayIso();
}

function relaxationYears(job: Job, category: string): number {
  const rules = (job.age_relaxation ?? {}) as AgeRelaxation;
  const keys = Object.keys(rules).filter((key) => key !== "cutoff_date");
  if (keys.length === 0) return 0;
  const cat = category.toLowerCase();
  const value = rules[cat];
  return typeof value === "number" ? value : 0;
}

function experienceSatisfies(
  profile: CandidateProfile,
  job: Job,
): EligibilityRuleResult {
  const required = (job.experience ?? "").toLowerCase();
  const years = Number(profile.experience_years ?? 0);
  const fresher =
    profile.experience_level === "fresher" || years === 0 || !profile.experience_level;

  if (!required || required.includes("not specified")) {
    return {
      kind: "experience",
      passed: true,
      label: "Experience",
      detail: "No structured experience requirement in the stored criteria.",
    };
  }

  if (
    required.includes("fresher") ||
    required.includes("no experience") ||
    required.includes("0 year") ||
    required.includes("nil")
  ) {
    return {
      kind: "experience",
      passed: true,
      label: "Experience",
      detail: fresher
        ? "No experience required; fresher profiles match."
        : "No experience required; experienced candidates typically remain eligible.",
    };
  }

  const match = required.match(/(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:year|yr)/);
  if (match) {
    const needed = Number(match[1]);
    const ok = years >= needed;
    return {
      kind: "experience",
      passed: ok,
      label: "Experience",
      detail: ok
        ? `${years} year(s) meets the stated ${needed}+ year requirement.`
        : `${years} year(s) is below the stated ${needed}+ year requirement.`,
    };
  }

  return {
    kind: "experience",
    passed: true,
    label: "Experience",
    detail: "Experience text could not be parsed fully — verify the official notification.",
  };
}

function stateSatisfies(profile: CandidateProfile, job: Job): EligibilityRuleResult {
  const states = (job.states ?? []).map((s) => s.toLowerCase());
  if (
    states.length === 0 ||
    states.some((s) =>
      ["all india", "all-india", "central", "pan india", "pan-india", "any"].includes(s),
    )
  ) {
    return {
      kind: "state",
      passed: true,
      label: "State / domicile",
      detail: "All-India / central posting — state of domicile is not a hard filter here.",
    };
  }

  const candidateStates = [profile.state, ...(profile.preferred_states ?? [])]
    .filter(Boolean)
    .map((s) => s.toLowerCase());

  const ok = candidateStates.some((s) => states.includes(s));
  return {
    kind: "state",
    passed: ok,
    label: "State / domicile",
    detail: ok
      ? "Your state / preferred states appear in the notification geography."
      : `This notification lists ${job.states.join(", ")}. Your profile state is ${profile.state || "not set"}.`,
  };
}

function categoryNote(profile: CandidateProfile, job: Job): EligibilityRuleResult {
  const reserved = job.age_relaxation;
  if (profile.category && reserved && Object.keys(reserved).length > 0) {
    return {
      kind: "category",
      passed: true,
      label: "Category",
      detail: `Category ${profile.category.toUpperCase()} is recorded. Reservation and age relaxation (if any) still need official confirmation.`,
    };
  }
  return {
    kind: "category",
    passed: true,
    label: "Category",
    detail:
      "Category usually does not disqualify an application; it affects reservation and relaxation. Verify the official notice.",
  };
}

export function checkEligibility(
  profile: CandidateProfile,
  job: Job,
  asOfDate?: string,
): EligibilityResult {
  const matchedRules: EligibilityRuleResult[] = [];
  const failedRules: EligibilityRuleResult[] = [];
  const warnings: EligibilityRuleResult[] = [];

  const qual = qualificationSatisfies(
    profile.highest_qualification,
    job.qualification_codes ?? [],
    job.qualification,
  );
  const qualRule: EligibilityRuleResult = {
    kind: "qualification",
    passed: qual.matched,
    label: "Qualification",
    detail: qual.reason,
  };
  (qual.matched ? matchedRules : failedRules).push(qualRule);

  const branch = branchSatisfies(profile.branch, job.branches ?? []);
  const branchRule: EligibilityRuleResult = {
    kind: "branch",
    passed: branch.matched,
    label: "Branch",
    detail: branch.reason,
  };
  if (!branch.matched) failedRules.push(branchRule);
  else if (branch.needsReview) warnings.push(branchRule);
  else matchedRules.push(branchRule);

  const cutoff = asOfDate || cutoffDate(job);
  if (profile.date_of_birth && (job.minimum_age != null || job.maximum_age != null)) {
    const extra = relaxationYears(job, profile.category);
    const age = ageInYears(profile.date_of_birth, cutoff);
    const ok = isAgeWithinRange(age, job.minimum_age, job.maximum_age, extra);
    const range = `${job.minimum_age ?? "—"}–${job.maximum_age ?? "—"} years`;
    const ageRule: EligibilityRuleResult = {
      kind: "age",
      passed: ok,
      label: "Age",
      detail: ok
        ? `Age ${age} (as of ${cutoff}) is within ${range}${extra ? ` including ${extra} year(s) recorded relaxation for ${profile.category}` : ""}.`
        : `Age ${age} (as of ${cutoff}) is outside ${range}. Relaxation is applied only when this job's structured data specifies it for your category.`,
    };
    (ok ? matchedRules : failedRules).push(ageRule);
    if (ok && extra > 0) {
      warnings.push({
        kind: "age",
        passed: true,
        label: "Age relaxation",
        detail: `Relaxation of ${extra} year(s) for ${profile.category.toUpperCase()} was taken from this job's structured data — confirm it in the official notification.`,
      });
    }
  } else if (!profile.date_of_birth) {
    warnings.push({
      kind: "age",
      passed: true,
      label: "Age",
      detail: "Date of birth missing — age could not be compared to the notification range.",
    });
  } else {
    matchedRules.push({
      kind: "age",
      passed: true,
      label: "Age",
      detail: "No structured age range on this job. Verify age limits in the official notification.",
    });
  }

  const expRule = experienceSatisfies(profile, job);
  (expRule.passed ? matchedRules : failedRules).push(expRule);
  if (expRule.passed && expRule.detail.includes("could not be parsed")) {
    warnings.push(expRule);
  }

  const stateRule = stateSatisfies(profile, job);
  (stateRule.passed ? matchedRules : failedRules).push(stateRule);

  const catRule = categoryNote(profile, job);
  matchedRules.push(catRule);

  for (const condition of job.required_conditions ?? []) {
    warnings.push({
      kind: "condition",
      passed: true,
      label: condition.label,
      detail: `Additional condition to verify: ${condition.label}${condition.value ? ` (${condition.value})` : ""}.`,
    });
  }

  let status: EligibilityStatus;
  if (failedRules.length > 0) status = "NOT_ELIGIBLE";
  else if (warnings.length > 0) status = "CHECK_DETAILS";
  else status = "ELIGIBLE";

  return { status, matchedRules, failedRules, warnings };
}

export function summarizeEligibility(result: EligibilityResult): string {
  if (result.status === "ELIGIBLE") {
    return result.matchedRules.map((rule) => `✓ ${rule.detail}`).join(" ");
  }
  if (result.status === "NOT_ELIGIBLE") {
    return result.failedRules.map((rule) => `✕ ${rule.detail}`).join(" ");
  }
  return result.warnings.map((rule) => `⚠ ${rule.detail}`).join(" ");
}

export { displayQualification, formatBranch };
