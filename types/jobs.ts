import type { AgeRelaxation, EligibilityResult, RequiredCondition } from "./eligibility";

export type JobStatus = "pending" | "published" | "unpublished" | "closed";
export type ApplicationStatus =
  | "saved"
  | "planning"
  | "applied"
  | "exam_scheduled"
  | "exam_completed"
  | "result_declared"
  | "selected"
  | "not_selected";

export type DeadlineState = "OPEN" | "CLOSING_SOON" | "CLOSING_TODAY" | "CLOSED" | "UPCOMING";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  official_website: string | null;
  logo_url: string | null;
}

export interface JobSource {
  id: string;
  organization_id: string;
  name: string;
  source_url: string;
  source_type: string;
  last_checked_at: string | null;
  status: string;
  enabled?: boolean;
}

export interface Job {
  id: string;
  organization_id: string;
  source_id: string | null;
  title: string;
  slug: string;
  description: string;
  qualification: string;
  branches: string[];
  minimum_age: number | null;
  maximum_age: number | null;
  age_relaxation: AgeRelaxation;
  experience: string;
  states: string[];
  locations: string[];
  vacancies: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_text: string | null;
  job_type: string | null;
  category: string | null;
  application_start_date: string | null;
  application_end_date: string | null;
  exam_date: string | null;
  selection_process: string[];
  application_fee: Record<string, unknown>;
  official_notification_url: string | null;
  official_apply_url: string | null;
  source_url: string | null;
  status: JobStatus | string;
  is_verified: boolean;
  is_sample: boolean;
  fingerprint?: string | null;
  qualification_codes: string[];
  required_conditions: RequiredCondition[];
  exam_family: string | null;
  created_at?: string;
  updated_at?: string;
  organization?: Organization | null;
}

export interface JobWithEligibility extends Job {
  eligibility?: EligibilityResult | null;
  deadline?: DeadlineState;
  saved?: boolean;
}

export interface JobSearchParams {
  q?: string;
  qualification?: string;
  branch?: string;
  state?: string;
  organization?: string;
  category?: string;
  experience?: string;
  job_type?: string;
  application_status?: string;
  sort?: "deadline" | "newest" | "vacancies";
  page?: number;
  pageSize?: number;
}

export interface PaginatedJobs {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface Exam {
  id: string;
  slug: string;
  name: string;
  family: string;
  description: string;
  official_url: string;
  typical_qualification: string | null;
  frequency: string | null;
  is_sample: boolean;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
  job?: Job;
}

export interface ApplicationRecord {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus | string;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
  job?: Job;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  job_id: string | null;
  is_read: boolean;
  created_at: string;
}
