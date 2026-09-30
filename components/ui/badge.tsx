import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "success" | "warn" | "danger" | "info";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-surface-container text-on-surface",
    success: "bg-secondary-container text-on-secondary-container",
    warn: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    danger: "bg-error-container text-on-error-container",
    info: "bg-primary-fixed text-on-primary-fixed",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-bold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
