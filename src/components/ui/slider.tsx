import * as React from "react"
import { cn } from "../../lib/utils"

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = 0, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100

    return (
      <div className="relative w-full">
        <input
          type="range"
          ref={ref}
          value={value}
          onChange={(e) => onValueChange?.(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className={cn(
            "w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110",
            "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110",
            className
          )}
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--secondary)) ${percentage}%, hsl(var(--secondary)) 100%)`
          }}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
