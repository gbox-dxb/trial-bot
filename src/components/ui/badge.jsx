import React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "bg-[#1A1A1A] text-white border border-custom",
  secondary: "bg-[#9D4EDD] text-white",
  destructive: "bg-[#FF3B30] text-white",
  outline: "border border-custom text-white bg-transparent",
  success: "bg-[#00FF41] text-[#0F1419] font-bold",
  danger: "bg-[#FF3B30] text-white font-bold",
  cyan: "bg-[#00D9FF] text-[#0F1419] font-bold",
}

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:ring-offset-2",
      badgeVariants[variant],
      className
    )}
    {...props}
  />
))
Badge.displayName = "Badge"

export { Badge, badgeVariants }