export const APP_NAME = "GovJobMatch";
export const APP_TAGLINE = "Government Jobs You Are Eligible For";
export const APP_DESCRIPTION =
  "Find Indian government jobs whose published criteria appear to match your qualification, age, state, and category. Always verify the official notification before applying.";

export const ELIGIBILITY_DISCLAIMER =
  "Eligibility information is an automated indication based on available recruitment criteria. Always verify the official notification before applying.";

export const STATUTORY_NOTICE =
  "GovJobMatch is an independent job discovery platform. It is not affiliated with or endorsed by the Government of India or any government recruitment organization. Always verify eligibility, dates, fees, vacancies, and application instructions from the official recruitment notification before applying.";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Ladakh",
  "Puducherry",
] as const;

export const QUALIFICATIONS = [
  { value: "10th", label: "10th Pass / Matric" },
  { value: "12th", label: "12th / Intermediate" },
  { value: "iti", label: "ITI" },
  { value: "diploma", label: "Diploma / Polytechnic" },
  { value: "graduate", label: "Graduate (Any Stream)" },
  { value: "btech", label: "B.Tech / B.E." },
  { value: "postgrad", label: "Post Graduate" },
  { value: "medical", label: "Medical / Nursing" },
] as const;

export const BRANCHES = [
  { value: "any", label: "Any / Not applicable" },
  { value: "cse", label: "Computer Science / IT" },
  { value: "ece", label: "Electronics & Communication" },
  { value: "eee", label: "Electrical" },
  { value: "mechanical", label: "Mechanical" },
  { value: "civil", label: "Civil" },
  { value: "arts", label: "Arts / Humanities" },
  { value: "commerce", label: "Commerce" },
  { value: "science", label: "Science" },
] as const;

export const SOCIAL_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "ews", label: "EWS" },
  { value: "obc", label: "OBC" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
  { value: "pwd", label: "PwD" },
] as const;

export const JOB_CATEGORIES = [
  { value: "ssc", label: "SSC", icon: "ClipboardList" },
  { value: "upsc", label: "UPSC", icon: "Landmark" },
  { value: "railway", label: "Railway", icon: "TrainFront" },
  { value: "banking", label: "Banking", icon: "IndianRupee" },
  { value: "defence", label: "Defence", icon: "Shield" },
  { value: "police", label: "Police", icon: "Siren" },
  { value: "psu", label: "PSU", icon: "Factory" },
  { value: "state-psc", label: "State PSC", icon: "Building2" },
  { value: "technical", label: "Technical / IT", icon: "Terminal" },
  { value: "teaching", label: "Teaching", icon: "BookOpen" },
  { value: "10th", label: "10th Pass", icon: "BadgeCheck" },
  { value: "12th", label: "12th Pass", icon: "Award" },
] as const;

export const EXAM_FAMILIES = [
  "SSC",
  "Railway",
  "Banking",
  "UPSC",
  "Defence",
  "Police",
  "PSU",
  "State PSC",
  "Technical",
] as const;

export const APPLICATION_STATUSES = [
  { value: "planning", label: "Planning to Apply" },
  { value: "applied", label: "Applied" },
  { value: "exam_scheduled", label: "Exam Scheduled" },
  { value: "exam_completed", label: "Exam Completed" },
  { value: "result_declared", label: "Result Declared" },
  { value: "selected", label: "Selected" },
  { value: "not_selected", label: "Not Selected" },
] as const;

export const PAGE_SIZE = 10;

export const OFFICIAL_PORTALS = [
  { name: "UPSC Official", href: "https://upsc.gov.in" },
  { name: "SSC Official", href: "https://ssc.gov.in" },
  { name: "RRB Official", href: "https://www.rrbcdg.gov.in" },
  { name: "IBPS Official", href: "https://www.ibps.in" },
  { name: "ISRO Careers", href: "https://www.isro.gov.in/Careers" },
  { name: "DRDO", href: "https://www.drdo.gov.in" },
] as const;
