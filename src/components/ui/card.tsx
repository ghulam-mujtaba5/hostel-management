import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    variant?: 'default' | 'premium' | 'glass' | 'interactive' | 'elevated' | 'gradient' | 'outline' 
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm",
    premium: "rounded-3xl bg-gradient-to-br from-card via-card to-card/95 border border-border/40 shadow-xl dark:shadow-black/20",
    glass: "rounded-3xl bg-card/80 backdrop-blur-xl border border-border/30 shadow-xl",
    interactive: "rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer",
    elevated: "rounded-2xl bg-card text-card-foreground shadow-lg shadow-black/5 dark:shadow-black/20 border-0",
    gradient: "rounded-3xl bg-gradient-to-br from-primary/5 via-card to-purple-500/5 border border-primary/10 shadow-lg",
    outline: "rounded-2xl bg-transparent border-2 border-dashed border-border/60 hover:border-primary/40 transition-colors",
  }
  
  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
