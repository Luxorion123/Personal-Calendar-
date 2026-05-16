import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CATEGORY_COLORS } from '@/types'
import type { Task } from '@/types'
import useStore from '@/store'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const tasks = useStore((s) => s.tasks)
  const reflections = useStore((s) => s.reflections)
  const setSelectedDate = useStore((s) => s.setSelectedDate)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const q = query.toLowerCase().trim()

  const matchedTasks: Task[] = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
      ).slice(0, 8)
    : []

  const matchedReflections = q
    ? Object.entries(reflections)
        .filter(([, r]) => r.overview.toLowerCase().includes(q))
        .slice(0, 4)
    : []

  function goToTask(task: Task) {
    setSelectedDate(task.date)
    navigate('/daily')
    onClose()
  }

  function goToReflection(_date: string) {
    navigate('/reflection')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e2a]">
          <Search className="w-4 h-4 text-[#55556a] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks and reflections..."
            className="flex-1 bg-transparent text-[#e8e8f0] text-sm placeholder:text-[#55556a] outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X className="w-4 h-4 text-[#55556a] hover:text-[#888898]" />
            </button>
          )}
        </div>

        {(matchedTasks.length > 0 || matchedReflections.length > 0) ? (
          <div className="max-h-96 overflow-y-auto py-2">
            {matchedTasks.length > 0 && (
              <>
                <p className="px-4 py-1.5 text-xs text-[#55556a] font-medium uppercase tracking-wider">
                  Tasks
                </p>
                {matchedTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => goToTask(task)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a20] text-left transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[task.category] }}
                    />
                    <span className="text-sm text-[#e8e8f0] truncate">{task.title}</span>
                    <span className="text-xs text-[#55556a] ml-auto">{task.date}</span>
                  </button>
                ))}
              </>
            )}
            {matchedReflections.length > 0 && (
              <>
                <p className="px-4 py-1.5 text-xs text-[#55556a] font-medium uppercase tracking-wider mt-1">
                  Reflections
                </p>
                {matchedReflections.map(([date, ref]) => (
                  <button
                    key={date}
                    onClick={() => goToReflection(date)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a20] text-left transition-colors"
                  >
                    <span className="text-sm text-[#e8e8f0] truncate flex-1">
                      {ref.overview.slice(0, 60)}…
                    </span>
                    <span className="text-xs text-[#55556a]">{date}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        ) : q ? (
          <div className="py-8 text-center text-[#55556a] text-sm">
            No results for "{query}"
          </div>
        ) : (
          <div className="py-8 text-center text-[#55556a] text-sm">
            Start typing to search...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
