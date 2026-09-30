const QUALIFICATION_LEVEL: Record<string, number> = {
  "10th": 1,
  matric: 1,
  "12th": 2,
  intermediate: 2,
  iti: 2,
  diploma: 3,
  polytechnic: 3,
  graduate: 4,
  bachelor: 4,
  btech: 5,
  be: 5,
  engineering: 5,
  postgrad: 6,
  masters: 6,
  medical: 5,
  phd: 7,
};

const QUALIFICATION_ALIASES: Record<string, string> = {
  "10th": "10th",
  "10th pass": "10th",
  matric: "10th",
  matriculation: "10th",
  secondary: "10th",
  "12th": "12th",
  "12th pass": "12th",
  intermediate: "12th",
  "higher secondary": "12th",
  "10+2": "12th",
  hsc: "12th",
  "plus two": "12th",
  iti: "iti",
  diploma: "diploma",
  polytechnic: "diploma",
  graduate: "graduate",
  graduation: "graduate",
  "any graduate": "graduate",
  "any degree": "graduate",
  degree: "graduate",
  bachelor: "graduate",
  "b.a": "graduate",
  ba: "graduate",
  "b.sc": "graduate",
  bsc: "graduate",
  "b.com": "graduate",
  bcom: "graduate",
  bca: "graduate",
  btech: "btech",
  "b.tech": "btech",
  "b.e": "be",
  be: "be",
  "bachelor of technology": "btech",
  "bachelor of engineering": "be",
  engineering: "btech",
  "b.tech / b.e.": "btech",
  "b.tech/b.e.": "btech",
  postgrad: "postgrad",
  "post graduate": "postgrad",
  "post-graduate": "postgrad",
  mtech: "postgrad",
  "m.tech": "postgrad",
  mca: "postgrad",
  mba: "postgrad",
  medical: "medical",
  mbbs: "medical",
  nursing: "medical",
};

export function canonicalizeQualification(raw: string | null | undefined): string {
  if (!raw) return "";
  const key = raw.toLowerCase().replace(/[./]/g, "").replace(/\s+/g, " ").trim();
  const compact = raw.toLowerCase().replace(/[.\s]/g, "");
  if (QUALIFICATION_ALIASES[raw.toLowerCase().trim()]) {
    return QUALIFICATION_ALIASES[raw.toLowerCase().trim()];
  }
  if (QUALIFICATION_ALIASES[key]) return QUALIFICATION_ALIASES[key];
  if (compact.includes("btech") || compact.includes("be")) return "btech";
  if (compact.includes("10+2") || key.includes("12th")) return "12th";
  if (key.includes("10th") || key.includes("matric")) return "10th";
  if (key.includes("diploma") || key.includes("polytechnic")) return "diploma";
  if (key.includes("graduate") || key.includes("degree")) return "graduate";
  if (key.includes("post")) return "postgrad";
  return key;
}

export function qualificationLevel(code: string): number {
  const canonical = canonicalizeQualification(code);
  return QUALIFICATION_LEVEL[canonical] ?? QUALIFICATION_LEVEL[code] ?? 0;
}

/**
 * B.Tech / B.E. satisfies graduate, diploma (typically), 12th, and 10th
 * minimums when a notification accepts "graduation" or lower.
 * A 12th-pass candidate does not satisfy a B.Tech-only notification.
 */
export function qualificationSatisfies(
  candidateQualification: string,
  acceptedCodes: string[],
  qualificationText?: string | null,
): { matched: boolean; reason: string } {
  const candidate = canonicalizeQualification(candidateQualification);
  const accepted = acceptedCodes
    .map(canonicalizeQualification)
    .filter(Boolean);

  if (qualificationText) {
    const fromText = canonicalizeQualification(qualificationText);
    if (fromText && !accepted.includes(fromText)) accepted.push(fromText);
  }

  if (accepted.length === 0) {
    return {
      matched: true,
      reason: "No structured qualification filter on this notification — verify the official PDF.",
    };
  }

  if (accepted.includes(candidate)) {
    return {
      matched: true,
      reason: `${displayQualification(candidate)} is listed among accepted qualifications.`,
    };
  }

  // Engineering aliases: B.Tech satisfies B.E. posts and vice versa.
  if (
    (candidate === "btech" || candidate === "be") &&
    (accepted.includes("btech") || accepted.includes("be") || accepted.includes("engineering"))
  ) {
    return {
      matched: true,
      reason: "B.Tech / B.E. is treated as equivalent for this engineering notification.",
    };
  }

  const candidateLevel = qualificationLevel(candidate);
  const acceptsAnyGraduate =
    accepted.includes("graduate") || accepted.includes("bachelor");

  if (
    (candidate === "btech" || candidate === "be" || candidateLevel >= 4) &&
    acceptsAnyGraduate
  ) {
    return {
      matched: true,
      reason: `${displayQualification(candidate)} satisfies a graduate-level requirement.`,
    };
  }

  // Higher qualification typically satisfies a lower educational minimum
  // when the job explicitly accepts that lower code (10th/12th/diploma).
  const minAccepted = Math.min(...accepted.map(qualificationLevel).filter((n) => n > 0));
  if (candidateLevel > 0 && minAccepted > 0 && candidateLevel >= minAccepted) {
    const onlyHigherProfessional = accepted.every(
      (code) => qualificationLevel(code) >= 5,
    );
    if (onlyHigherProfessional && candidateLevel < 5) {
      return {
        matched: false,
        reason: `${displayQualification(candidate)} does not meet the professional degree listed in this notification.`,
      };
    }
    if (!onlyHigherProfessional) {
      return {
        matched: true,
        reason: `${displayQualification(candidate)} meets or exceeds the stated educational minimum.`,
      };
    }
  }

  return {
    matched: false,
    reason: `${displayQualification(candidate)} does not match accepted qualifications (${accepted
      .map(displayQualification)
      .join(", ") || "see notification"}).`,
  };
}

export function displayQualification(code: string): string {
  const map: Record<string, string> = {
    "10th": "10th pass",
    "12th": "12th / Intermediate",
    iti: "ITI",
    diploma: "Diploma",
    graduate: "Graduation",
    btech: "B.Tech",
    be: "B.E.",
    postgrad: "Post Graduation",
    medical: "Medical",
  };
  return map[canonicalizeQualification(code)] ?? code;
}
