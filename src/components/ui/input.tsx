import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'ghost' | 'glass' | 'underline';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "border border-border bg-background hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm",
      filled: "border-transparent bg-muted/60 hover:bg-muted focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20",
      ghost: "border-transparent bg-transparent hover:bg-muted/50 focus:bg-muted/50 focus:ring-2 focus:ring-primary/20",
      glass: "border-white/10 bg-white/5 backdrop-blur-xl text-foreground placeholder:text-muted-foreground/50 hover:bg-white/10 focus:bg-white/10 focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
      underline: "border-0 border-b-2 border-border rounded-none bg-transparent hover:border-primary/40 focus:border-primary px-0 focus:ring-0"
    }
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl px-4 py-3 text-sm font-medium",
          "ring-offset-background transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary file:cursor-pointer file:mr-3",
          "placeholder:text-muted-foreground/50 placeholder:font-normal",
          "focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
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
