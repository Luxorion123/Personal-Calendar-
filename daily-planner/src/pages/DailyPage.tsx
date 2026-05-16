import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TaskModal } from '@/components/tasks/TaskModal'
import useStore from '@/store'
import {
  addDays,
  subDays,
  format,
  toDateString,
  fromDateString,
  isToday,
} from '@/lib/dateUtils'
import { CATEGORY_COLORS } from '@/types'
import type { Task, Category, Priority } from '@/types'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { cn } from '@/lib/utils'

export default function DailyPage() {
  const selectedDate = useStore((s) => s.selectedDate)
  const setSelectedDate = useStore((s) => s.setSelectedDate)
  const tasks = useStore((s) => s.tasks)
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const toggleTask = useStore((s) => s.toggleTask)
  const { createCalendarEvent, deleteCalendarEvent } = useGoogleCalendar()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const dayTasks = tasks
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => {
      const pOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
      return pOrder[a.priority] - pOrder[b.priority]
    })

  const totalEstimated = dayTasks.reduce((s, t) => s + t.estimatedMinutes, 0)
  const completedCount = dayTasks.filter((t) => t.completed).length
  const date = fromDateString(selectedDate)

  async function handleAddTask(taskData: Omit<Task, 'id'>) {
    const task = addTask(taskData)
    const eventId = await createCalendarEvent(task)
    if (eventId) updateTask(task.id, { googleEventId: eventId })
  }

  async function handleEditTask(taskData: Omit<Task, 'id'>) {
    if (!editTask) return
    updateTask(editTask.id, taskData)
    setEditTask(null)
  }

  async function handleDeleteTask() {
    if (!editTask) return
    if (editTask.googleEventId) await deleteCalendarEvent(editTask.googleEventId)
    deleteTask(editTask.id)
    setEditTask(null)
  }

  function formatMinutes(mins: number) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Date navigation */}
      <div className="flex items-center gap-2 md:gap-3 mb-5">
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          onClick={() => setSelectedDate(toDateString(subDays(date, 1)))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg md:text-xl font-semibold text-[#e8e8f0]">
            {isToday(date) ? 'Today' : format(date, 'EEEE')}
          </h1>
          <p className="text-xs text-[#55556a]">{format(date, 'MMMM d, yyyy')}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          onClick={() => setSelectedDate(toDateString(addDays(date, 1)))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-10 md:w-36 [color-scheme:dark] text-xs opacity-0 md:opacity-100 md:w-36 absolute md:static"
        />
        {/* Mobile date picker — visible only on mobile */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="md:hidden w-9 h-9 opacity-0 absolute"
          style={{ width: 36, height: 36 }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 md:hidden"
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'date'
            input.value = selectedDate
            input.onchange = (e) => setSelectedDate((e.target as HTMLInputElement).value)
            input.click()
          }}
        >
          <Clock className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-5 p-3.5 md:p-4 rounded-xl border border-[#1e1e2a] bg-[#141418]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#4f8ef7]" />
          <span className="text-sm text-[#e8e8f0] font-medium">
            {formatMinutes(totalEstimated)}
          </span>
        </div>
        <div className="w-px h-4 bg-[#1e1e2a]" />
        <span className="text-sm text-[#888898]">
          {completedCount}/{dayTasks.length} done
        </span>
        <Button
          size="sm"
          className="ml-auto gap-1.5 h-9"
          onClick={() => setAddModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add task</span>
        </Button>
      </div>

      {/* Task list */}
      {dayTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1e1e2a] p-12 text-center">
          <p className="text-[#55556a] text-sm mb-3">No tasks scheduled</p>
          <Button size="sm" variant="outline" onClick={() => setAddModalOpen(true)}>
            Add your first task
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {dayTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setEditTask(task)}
              className={cn(
                'w-full flex items-start gap-3 md:gap-4 p-4 rounded-xl border border-[#1e1e2a] bg-[#141418] hover:bg-[#1a1a20] active:bg-[#1a1a20] transition-colors text-left border-l-4',
                task.priority === 'high' && 'border-l-[#ef4444]',
                task.priority === 'medium' && 'border-l-[#4f8ef7]',
                task.priority === 'low' && 'border-l-[#55556a]',
                task.completed && 'opacity-50'
              )}
            >
              {/* Checkbox */}
              <button
                className={cn(
                  'mt-0.5 w-5 h-5 md:w-4 md:h-4 rounded border flex-shrink-0 transition-colors',
                  task.completed
                    ? 'bg-[#4f8ef7] border-[#4f8ef7]'
                    : 'border-[#2a2a38] hover:border-[#4f8ef7]'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTask(task.id)
                }}
              >
                {task.completed && (
                  <svg className="w-3 h-3 m-auto" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium text-[#e8e8f0]',
                  task.completed && 'line-through text-[#55556a]'
                )}>
                  {task.title}
                </p>
                {task.notes && (
                  <p className="text-xs text-[#55556a] mt-0.5 truncate">{task.notes}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[task.category as Category] }}
                  />
                  <span className="text-xs text-[#888898]">{task.category}</span>
                  <span className="text-xs text-[#55556a]">·</span>
                  <span className="text-xs text-[#888898]">{formatMinutes(task.estimatedMinutes)}</span>
                  {task.isRecurring && (
                    <span className="text-xs text-[#55556a]">· recurring</span>
                  )}
                </div>
              </div>

              <Badge variant={task.priority as Priority} className="flex-shrink-0 self-start mt-0.5">
                {task.priority}
              </Badge>
            </button>
          ))}
        </div>
      )}

      <TaskModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddTask}
        defaultDate={selectedDate}
      />
      {editTask && (
        <TaskModal
          open
          onClose={() => setEditTask(null)}
          onSave={handleEditTask}
          onDelete={handleDeleteTask}
          editTask={editTask}
        />
      )}
    </div>
  )
}
