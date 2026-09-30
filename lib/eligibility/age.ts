import type { DeadlineState } from "@/types/jobs";

const MS_PER_DAY = 86_400_000;

export function parseIsoDate(value: string): Date {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

/** Exact calendar age as of a cutoff date. Not year-minus-year. */
export function calculateAge(
  dateOfBirth: string,
  asOfDate: string,
): { years: number; months: number; days: number } {
  const birth = parseIsoDate(dateOfBirth);
  const asOf = parseIsoDate(asOfDate);
  if (birth > asOf) {
    return { years: 0, months: 0, days: 0 };
  }

  let years = asOf.getFullYear() - birth.getFullYear();
  let months = asOf.getMonth() - birth.getMonth();
  let days = asOf.getDate() - birth.getDate();

  if (days < 0) {
    const previousMonth = new Date(asOf.getFullYear(), asOf.getMonth(), 0);
    days += previousMonth.getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days };
}

export function ageInYears(dateOfBirth: string, asOfDate: string): number {
  return calculateAge(dateOfBirth, asOfBirthSafe(dateOfBirth, asOfDate)).years;
}

function asOfBirthSafe(dateOfBirth: string, asOfDate: string): string {
  return asOfDate || dateOfBirth;
}

export function isAgeWithinRange(
  ageYears: number,
  minimumAge: number | null | undefined,
  maximumAge: number | null | undefined,
  extraYears = 0,
): boolean {
  const max = maximumAge == null ? null : maximumAge + extraYears;
  if (minimumAge != null && ageYears < minimumAge) return false;
  if (max != null && ageYears > max) return false;
  return true;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntil(endDate: string, today = new Date()): number {
  const end = startOfDay(parseIsoDate(endDate)).getTime();
  const now = startOfDay(today).getTime();
  return Math.round((end - now) / MS_PER_DAY);
}

export function getDeadlineState(
  applicationStartDate: string | null | undefined,
  applicationEndDate: string | null | undefined,
  today = new Date(),
): DeadlineState {
  if (!applicationEndDate) return "OPEN";
  const remaining = daysUntil(applicationEndDate, today);
  if (remaining < 0) return "CLOSED";
  if (remaining === 0) return "CLOSING_TODAY";
  if (applicationStartDate) {
    const untilStart = daysUntil(applicationStartDate, today);
    if (untilStart > 0) return "UPCOMING";
  }
  if (remaining <= 7) return "CLOSING_SOON";
  return "OPEN";
}

export function deadlineLabel(
  state: DeadlineState,
  applicationEndDate: string | null | undefined,
  today = new Date(),
): string {
  if (!applicationEndDate) return "Dates not specified";
  if (state === "CLOSED") return "Closed";
  if (state === "CLOSING_TODAY") return "Closes today";
  if (state === "UPCOMING") return "Applications not yet open";
  const remaining = daysUntil(applicationEndDate, today);
  if (state === "CLOSING_SOON") return `${remaining} day${remaining === 1 ? "" : "s"} left`;
  return `${remaining} days left`;
}
