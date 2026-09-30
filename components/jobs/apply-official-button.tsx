"use client";

import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ApplyOfficialButton({ href }: { href: string | null | undefined }) {
  const [confirming, setConfirming] = useState(false);

  if (!href) {
    return (
      <span className={cn(buttonVariants({ variant: "ghost" }), "opacity-60")}>
        Official link unavailable
      </span>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className={cn(buttonVariants({ variant: "primary" }), "text-on-primary")}
        onClick={() => setConfirming(true)}
      >
        Apply Officially
        <ExternalLink className="h-4 w-4" />
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: "success" }))}
      onClick={() => setConfirming(false)}
    >
      Continue to official website
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

export function SaveJobButton({ jobId, saved }: { jobId: string; saved?: boolean }) {
  const [isSaved, setSaved] = useState(Boolean(saved));
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    start(async () => {
      const res = await fetch("/api/saved-jobs", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (res.status === 401) {
        setMessage("Sign in to save jobs.");
        return;
      }
      if (res.ok) setSaved(!isSaved);
    });
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        aria-label={isSaved ? "Unsave job" : "Save job"}
      >
        {isSaved ? "★" : "☆"}
      </button>
      {message ? <span className="text-label-sm text-error">{message}</span> : null}
    </div>
  );
}
