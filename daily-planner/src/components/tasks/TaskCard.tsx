import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Task, Category, Priority } from '@/types'
import { CATEGORY_COLORS } from '@/types'

interface TaskCardProps {
  task: Task
  onToggle?: () => void
  onClick?: () => void
  compact?: boolean
}

const PRIORITY_BORDER: Record<Priority, string> = {
  low: 'border-l-[#55556a]',
  medium: 'border-l-[#4f8ef7]',
  high: 'border-l-[#ef4444]',
}

export function TaskCard({ task, onToggle, onClick, compact }: TaskCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg bg-[#141418] border border-[#1e1e2a] border-l-4 cursor-pointer hover:bg-[#1a1a20] transition-colors group',
        PRIORITY_BORDER[task.priority],
        task.completed && 'opacity-50'
      )}
      onClick={onClick}
    >
      {onToggle && (
        <button
          className={cn(
            'mt-0.5 flex-shrink-0 w-4 h-4 rounded border transition-colors',
            task.completed
              ? 'bg-[#4f8ef7] border-[#4f8ef7]'
              : 'border-[#1e1e2a] hover:border-[#4f8ef7]'
          )}
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
        >
          {task.completed && <Check className="w-3 h-3 text-white m-auto" />}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium text-[#e8e8f0] truncate',
            task.completed && 'line-through text-[#55556a]'
          )}
        >
          {task.title}
        </p>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[task.category as Category] }}
            />
            <span className="text-xs text-[#888898]">
              {task.estimatedMinutes} min
            </span>
            {task.priority !== 'medium' && (
              <Badge variant={task.priority} className="py-0">
                {task.priority}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
