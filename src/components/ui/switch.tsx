"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.HTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg'
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, size = 'default', ...props }, ref) => {
    const sizes = {
      sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
      default: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
      lg: { track: 'h-7 w-14', thumb: 'h-6 w-6', translate: 'translate-x-7' },
    }
    
    const sizeStyles = sizes[size]
    
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        className={cn(
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full",
          "border-2 border-transparent",
          "transition-all duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked 
            ? "bg-gradient-to-r from-primary to-[#8b5cf6] shadow-md shadow-primary/25" 
            : "bg-muted hover:bg-muted-foreground/20",
          sizeStyles.track,
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block rounded-full bg-white shadow-lg ring-0",
            "transition-all duration-200 ease-in-out",
            checked ? sizeStyles.translate : "translate-x-0",
            checked && "shadow-md",
            sizeStyles.thumb
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
