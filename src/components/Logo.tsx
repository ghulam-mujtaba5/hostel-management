\"use client\";

import { Building2 } from \"lucide-react\";
import { cn } from \"@/lib/utils\";

interface LogoProps {
  className?: string;
  size?: \"sm\" | \"md\" | \"lg\";
  variant?: \"default\" | \"minimal\";
}

export function Logo({ 
  className, 
  size = \"md\", 
  variant = \"default\" 
}: LogoProps) {
  const sizes = {
    sm: { icon: \"h-4 w-4\", container: \"h-8 w-8 rounded-lg\", text: \"text-lg\" },
    md: { icon: \"h-5 w-5\", container: \"h-10 w-10 rounded-xl\", text: \"text-xl\" },
    lg: { icon: \"h-6 w-6\", container: \"h-12 w-12 rounded-xl\", text: \"text-2xl\" },
  };

  return (
    <div className={cn(\"flex items-center gap-2.5 font-bold tracking-tight\", className)}>
      <div className={cn(
        \"flex items-center justify-center transition-colors\",
        variant === \"default\" ? \"bg-primary text-primary-foreground\" : \"bg-primary/10 text-primary\",
        sizes[size].container
      )}>
        <Building2 className={sizes[size].icon} strokeWidth={2.5} />
      </div>
      <span className={cn(\"text-foreground\", sizes[size].text)}>
        HostelMate
      </span>
    </div>
  );
}
