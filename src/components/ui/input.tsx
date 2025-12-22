import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'ghost' | 'glass';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "border border-input bg-background hover:border-primary/50 focus:border-primary shadow-sm",
      filled: "border-transparent bg-muted/50 hover:bg-muted focus:bg-background focus:border-primary",
      ghost: "border-transparent bg-transparent hover:bg-muted/50 focus:bg-muted/50",
      glass: "border-white/10 bg-white/5 backdrop-blur-xl text-foreground placeholder:text-muted-foreground/50 hover:bg-white/10 focus:bg-white/10 focus:border-primary/50"
    }
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl px-4 py-3 text-sm font-medium",
          "ring-offset-background transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
