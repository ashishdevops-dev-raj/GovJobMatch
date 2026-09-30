import { Badge } from "@/components/ui/badge";
import type { EligibilityResult } from "@/types/eligibility";

export function EligibilityBadge({ result }: { result: EligibilityResult | null }) {
  if (!result) return null;
  if (result.status === "ELIGIBLE") {
    return <Badge tone="success">Appears eligible</Badge>;
  }
  if (result.status === "CHECK_DETAILS") {
    return <Badge tone="warn">Check details</Badge>;
  }
  return <Badge tone="danger">Does not appear eligible</Badge>;
}
