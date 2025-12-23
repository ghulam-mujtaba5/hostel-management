import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'filled' | 'ghost'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "border border-border bg-background hover:border-primary/40 focus:border-primary shadow-sm",
      filled: "border-transparent bg-muted/60 hover:bg-muted focus:bg-background focus:border-primary",
      ghost: "border-transparent bg-transparent hover:bg-muted/50 focus:bg-muted/50",
    }
    
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl px-4 py-3",
          "text-sm font-medium resize-none",
          "ring-offset-background transition-all duration-200",
          "placeholder:text-muted-foreground/50 placeholder:font-normal",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
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
Textarea.displayName = "Textarea"

export { Textarea }
