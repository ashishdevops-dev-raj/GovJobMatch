"use client";

import { useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TrackApplicationButton({ jobId }: { jobId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className={cn(buttonVariants({ variant: "secondary" }))}
        onClick={() =>
          start(async () => {
            const res = await fetch("/api/applications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobId, status: "planning" }),
            });
            if (res.status === 401) setMessage("Sign in to track applications.");
            else if (res.ok) setMessage("Added to application tracker.");
          })
        }
      >
        Track Application
      </button>
      {message ? <p className="mt-1 text-label-sm text-secondary">{message}</p> : null}
    </div>
  );
}
