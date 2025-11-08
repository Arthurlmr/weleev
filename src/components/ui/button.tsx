import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumine-accent/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-lumine-accent text-white hover:bg-lumine-accent-dark shadow-sm hover:shadow-md",
        destructive:
          "bg-error text-white hover:bg-error/90 shadow-sm",
        outline:
          "border-2 border-lumine-neutral-400 bg-lumine-neutral-100 hover:bg-lumine-neutral-200 hover:border-lumine-accent text-lumine-primary shadow-sm",
        secondary:
          "bg-success/20 text-lumine-primary hover:bg-success/30 shadow-sm",
        ghost: "hover:bg-lumine-neutral-200 text-lumine-primary",
        link: "text-lumine-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
