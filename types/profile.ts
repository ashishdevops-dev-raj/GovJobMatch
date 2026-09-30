export type Gender = "male" | "female" | "other" | "";
export type SocialCategory = "general" | "obc" | "sc" | "st" | "ews" | "pwd" | "";
export type ExperienceLevel = "fresher" | "experienced" | "";

export interface CandidateProfile {
  id?: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender | string;
  state: string;
  category: SocialCategory | string;
  highest_qualification: string;
  branch: string;
  passing_year: number | null;
  experience_level: ExperienceLevel | string;
  experience_years: number | null;
  preferred_states: string[];
  preferred_categories: string[];
}

export interface ProfileRecord extends CandidateProfile {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export const EMPTY_PROFILE: CandidateProfile = {
  full_name: "",
  date_of_birth: "",
  gender: "",
  state: "",
  category: "",
  highest_qualification: "",
  branch: "",
  passing_year: null,
  experience_level: "fresher",
  experience_years: 0,
  preferred_states: [],
  preferred_categories: [],
};
