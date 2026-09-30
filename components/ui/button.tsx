import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-container shadow-sm",
        secondary: "bg-surface-container-lowest text-primary border border-primary/20 hover:bg-surface-container-low",
        success: "bg-secondary text-on-secondary hover:bg-on-secondary-container",
        ghost: "bg-surface-container hover:bg-surface-container-high text-primary",
        danger: "bg-error text-on-error hover:bg-on-error-container",
        outline: "border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-on-surface",
      },
      size: {
        sm: "h-9 px-3 text-label-md",
        md: "h-11 px-4 text-label-lg",
        lg: "h-12 px-6 text-label-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
