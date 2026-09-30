import Link from "next/link";
import { Inbox } from "lucide-react";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
      <Inbox className="mx-auto mb-3 h-10 w-10 text-outline" />
      <h2 className="font-headline-md text-headline-md text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-body-md text-on-surface-variant">{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={cn(buttonVariants(), "mt-4 inline-flex")}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Unable to load jobs.",
  description = "Something went wrong while loading this page.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-error-container bg-error-container/40 p-space-xl text-center">
      <h2 className="font-headline-md text-headline-md text-error">{title}</h2>
      <p className="mt-2 text-body-md text-on-surface-variant">{description}</p>
      <Link href="." className={cn(buttonVariants({ variant: "secondary" }), "mt-4 inline-flex")}>
        Try again
      </Link>
    </div>
  );
}
