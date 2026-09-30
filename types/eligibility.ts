export type EligibilityStatus = "ELIGIBLE" | "CHECK_DETAILS" | "NOT_ELIGIBLE";

export type EligibilityRuleKind =
  | "qualification"
  | "branch"
  | "age"
  | "experience"
  | "state"
  | "category"
  | "condition";

export interface EligibilityRuleResult {
  kind: EligibilityRuleKind;
  passed: boolean;
  label: string;
  detail: string;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  matchedRules: EligibilityRuleResult[];
  failedRules: EligibilityRuleResult[];
  warnings: EligibilityRuleResult[];
}

export interface RequiredCondition {
  type: string;
  label: string;
  value?: string | number;
}

export interface AgeRelaxation {
  general?: number;
  obc?: number;
  sc?: number;
  st?: number;
  ews?: number;
  pwd?: number;
  cutoff_date?: string;
  [key: string]: number | string | undefined;
}
