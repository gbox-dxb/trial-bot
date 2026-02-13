import React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, min = 0, max = 100, step = 1, value = [0], onValueChange, ...props }, ref) => {
  const val = value[0] ?? min
  
  const handleInputChange = (e) => {
    const newValue = parseFloat(e.target.value)
    if (onValueChange) {
      onValueChange([newValue])
    }
  }

  const percentage = ((val - min) / (max - min)) * 100

  return (
    <div
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      {/* Track */}
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-[#252B33]">
        {/* Range (Filled part) */}
        <div
          className="absolute h-full bg-gradient-to-r from-[#00D9FF] to-[#9D4EDD] shadow-glow-cyan"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Thumb */}
      <div
        className="absolute h-5 w-5 rounded-full border-2 border-[#00D9FF] bg-white shadow-glow-cyan transition-all hover:scale-110"
        style={{ 
            left: `${percentage}%`,
            transform: `translateX(-50%)`
        }}
      />

      {/* Input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={handleInputChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 appearance-none"
        style={{ zIndex: 20 }}
      />
    </div>
  )
})
Slider.displayName = "Slider"

export { Slider }