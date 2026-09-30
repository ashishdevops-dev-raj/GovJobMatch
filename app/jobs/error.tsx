"use client";

import { ErrorState } from "@/components/ui/empty-state";

export default function Error() {
  return <ErrorState title="Unable to load jobs." description="Try again in a moment." />;
}
