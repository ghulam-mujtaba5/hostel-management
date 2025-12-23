"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  optional?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, optional, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-semibold leading-none tracking-tight text-foreground",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        "transition-colors",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-destructive">*</span>
      )}
      {optional && (
        <span className="ml-2 text-xs font-normal text-muted-foreground">(optional)</span>
      )}
    </label>
  )
)
Label.displayName = "Label"

export { Label }
