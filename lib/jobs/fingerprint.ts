import { createHash } from "crypto";

export function jobFingerprint(
  organization: string,
  title: string,
  applicationEndDate: string | null | undefined,
): string {
  const key = [
    organization.trim().toLowerCase(),
    title.trim().toLowerCase(),
    (applicationEndDate ?? "").trim(),
  ].join("|");
  return createHash("sha256").update(key).digest("hex");
}
