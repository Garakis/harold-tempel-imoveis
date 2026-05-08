import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-navy-700 text-white hover:bg-navy-800 active:bg-navy-900 shadow-card",
        secondary:
          "bg-white text-navy-700 border border-gold-500 hover:bg-gold-50",
        ghost: "text-navy-700 hover:bg-navy-50",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-muted",
        accent:
          "bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-700 shadow-card",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-red-700",
        link: "text-navy-700 underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-13 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
