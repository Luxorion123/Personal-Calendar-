import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-[#1e1e2a] bg-[#0a0a0f] px-3 py-1 text-sm text-[#e8e8f0] placeholder:text-[#55556a] focus:outline-none focus:ring-1 focus:ring-[#4f8ef7] focus:border-[#4f8ef7] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
