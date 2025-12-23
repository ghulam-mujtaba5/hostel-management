import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-[#8b5cf6] text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-105",
        destructive:
          "bg-gradient-to-r from-destructive to-red-500 text-destructive-foreground shadow-lg shadow-destructive/20 hover:shadow-destructive/30 hover:brightness-105",
        outline:
          "border-2 border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/40 transition-colors",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md transition-all",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground transition-colors",
        link: "text-primary underline-offset-4 hover:underline transition-colors",
        premium: "bg-gradient-to-r from-primary via-[#8b5cf6] to-[#06b6d4] text-white shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:brightness-105 hover:scale-[1.01] transition-all",
        success: "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-105",
        warning: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-105",
        subtle: "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 hover:border-primary/30",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all",
        glow: "relative bg-gradient-to-r from-primary to-[#8b5cf6] text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
      },
      size: {
        default: "h-11 px-5 py-2.5 rounded-xl",
        sm: "h-9 px-4 text-xs rounded-lg",
        lg: "h-12 px-8 text-base rounded-xl",
        xl: "h-14 px-10 text-lg rounded-2xl",
        icon: "h-11 w-11 rounded-xl",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-lg": "h-14 w-14 rounded-xl",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
