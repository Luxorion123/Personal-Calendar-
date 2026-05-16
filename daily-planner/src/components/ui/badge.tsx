import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#4f8ef7]/20 text-[#4f8ef7]',
        work: 'bg-[#4f8ef7]/15 text-[#4f8ef7]',
        personal: 'bg-[#8b5cf6]/15 text-[#8b5cf6]',
        health: 'bg-[#22c55e]/15 text-[#22c55e]',
        other: 'bg-[#f59e0b]/15 text-[#f59e0b]',
        low: 'bg-[#55556a]/20 text-[#888898]',
        medium: 'bg-[#4f8ef7]/15 text-[#4f8ef7]',
        high: 'bg-[#ef4444]/15 text-[#ef4444]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
