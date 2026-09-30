const BRANCH_ALIASES: Record<string, string[]> = {
  cse: [
    "cse",
    "cs",
    "computer science",
    "computer science and engineering",
    "computer science & engineering",
    "computer engineering",
    "computers",
  ],
  it: [
    "it",
    "information technology",
    "information tech",
    "computer applications",
    "bca",
    "mca",
  ],
  ece: [
    "ece",
    "electronics",
    "electronics and communication",
    "electronics & communication",
    "electronics and telecommunication",
  ],
  eee: ["eee", "electrical", "electrical and electronics", "electrical engineering"],
  mechanical: ["mechanical", "mech", "production", "automobile"],
  civil: ["civil", "environmental"],
  any: ["any", "all", "not applicable", "na", "any stream", "any branch"],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+]+/g, " ").trim();
}

export function canonicalizeBranch(raw: string | null | undefined): string {
  if (!raw) return "";
  const n = normalize(raw);
  for (const [code, aliases] of Object.entries(BRANCH_ALIASES)) {
    if (code === n || aliases.includes(n)) return code === "any" ? "any" : code;
  }
  if (n.includes("computer") || n.includes("software") || n === "cse") return "cse";
  if (n.includes("information technology") || n.split(" ").includes("it")) return "it";
  return n;
}

/**
 * CSE may satisfy IT when the notification lists IT/CSE together.
 * It must not satisfy Mechanical-only posts.
 */
export function branchSatisfies(
  candidateBranch: string,
  jobBranches: string[],
): { matched: boolean; reason: string; needsReview: boolean } {
  const candidate = canonicalizeBranch(candidateBranch);
  const accepted = jobBranches.map(canonicalizeBranch).filter(Boolean);

  if (accepted.length === 0 || accepted.includes("any")) {
    return {
      matched: true,
      needsReview: false,
      reason: "This notification does not restrict engineering / academic branch.",
    };
  }

  if (!candidate) {
    return {
      matched: true,
      needsReview: true,
      reason: "Job lists specific branches; add your branch in your profile to confirm.",
    };
  }

  if (accepted.includes(candidate)) {
    return {
      matched: true,
      needsReview: false,
      reason: `${formatBranch(candidate)} is listed among accepted branches.`,
    };
  }

  const cseItFamily = new Set(["cse", "it"]);
  const jobHasCseIt = accepted.some((code) => cseItFamily.has(code));
  if (cseItFamily.has(candidate) && jobHasCseIt) {
    return {
      matched: true,
      needsReview: candidate === "cse" && accepted.includes("it") && !accepted.includes("cse"),
      reason:
        candidate === "cse" && accepted.includes("it") && !accepted.includes("cse")
          ? "Computer Science is often accepted where IT is listed — confirm in the official notification."
          : "Computer Science / IT family matches the listed technical branches.",
    };
  }

  return {
    matched: false,
    needsReview: false,
    reason: `${formatBranch(candidate)} is not among accepted branches (${accepted
      .map(formatBranch)
      .join(", ")}).`,
  };
}

export function formatBranch(code: string): string {
  const map: Record<string, string> = {
    cse: "Computer Science",
    it: "Information Technology",
    ece: "Electronics",
    eee: "Electrical",
    mechanical: "Mechanical",
    civil: "Civil",
    any: "Any branch",
  };
  return map[canonicalizeBranch(code)] ?? code;
}
