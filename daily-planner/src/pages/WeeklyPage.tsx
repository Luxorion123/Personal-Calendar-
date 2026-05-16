import { useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Repeat, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskModal } from '@/components/tasks/TaskModal'
import { RecurringTaskModal } from '@/components/tasks/RecurringTaskModal'
import useStore from '@/store'
import {
  addWeeks,
  subWeeks,
  getWeekDays,
  format,
  toDateString,
  isToday,
} from '@/lib/dateUtils'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import type { Task, RecurringTask } from '@/types'
import { cn } from '@/lib/utils'

export default function WeeklyPage() {
  const [weekStart, setWeekStart] = useState(new Date())
  const [addForDate, setAddForDate] = useState<string | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [recurringOpen, setRecurringOpen] = useState(false)
  const [editRecurring, setEditRecurring] = useState<RecurringTask | null>(null)
  const [showRecurringList, setShowRecurringList] = useState(false)

  const tasks = useStore((s) => s.tasks)
  const recurringTasks = useStore((s) => s.recurringTasks)
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const toggleTask = useStore((s) => s.toggleTask)
  const addRecurringTask = useStore((s) => s.addRecurringTask)
  const updateRecurringTask = useStore((s) => s.updateRecurringTask)
  const deleteRecurringTask = useStore((s) => s.deleteRecurringTask)
  const { createCalendarEvent, deleteCalendarEvent } = useGoogleCalendar()

  const days = getWeekDays(weekStart)
  const weekRange = `${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d, yyyy')}`

  function getTasksForDay(date: string) {
    return tasks.filter((t) => t.date === date)
  }

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

  function handleAddRecurring(taskData: Omit<RecurringTask, 'id'>) {
    addRecurringTask(taskData)
  }

  function handleEditRecurring(taskData: Omit<RecurringTask, 'id'>) {
    if (!editRecurring) return
    updateRecurringTask(editRecurring.id, taskData)
    setEditRecurring(null)
  }

  const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="p-6 flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-lg font-semibold text-[#e8e8f0] min-w-[200px] text-center">
          {weekRange}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setWeekStart(new Date())}
        >
          This Week
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => setShowRecurringList(!showRecurringList)}
          >
            <Repeat className="w-3 h-3" />
            Recurring ({recurringTasks.length})
          </Button>
          <Button
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => setRecurringOpen(true)}
          >
            <RefreshCw className="w-3 h-3" />
            Set Recurring
          </Button>
        </div>
      </div>

      {/* Recurring tasks list */}
      {showRecurringList && recurringTasks.length > 0 && (
        <div className="mb-4 rounded-xl border border-[#1e1e2a] bg-[#141418] p-4 flex-shrink-0">
          <p className="text-xs font-medium text-[#55556a] mb-3">Recurring Tasks</p>
          <div className="space-y-2">
            {recurringTasks.map((rt) => {
              const DAYS_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
              return (
                <div
                  key={rt.id}
                  className="flex items-center gap-3 text-sm text-[#e8e8f0]"
                >
                  <span className="flex-1 truncate">{rt.title}</span>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                      <span
                        key={d}
                        className={cn(
                          'text-[10px] w-5 h-5 flex items-center justify-center rounded',
                          rt.daysOfWeek.includes(d)
                            ? 'bg-[#4f8ef7]/20 text-[#4f8ef7]'
                            : 'text-[#55556a]'
                        )}
                      >
                        {DAYS_ABBR[d]}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setEditRecurring(rt)}
                    className="text-[#55556a] hover:text-[#888898]"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteRecurringTask(rt.id)}
                    className="text-[#55556a] hover:text-[#ef4444]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week columns */}
      <div className="grid grid-cols-7 gap-3 flex-1 min-h-0">
        {days.map((day, i) => {
          const dateStr = toDateString(day)
          const dayTasks = getTasksForDay(dateStr)
          const isCurrentDay = isToday(day)

          return (
            <div key={dateStr} className="flex flex-col min-h-0">
              <div
                className={cn(
                  'flex flex-col items-center mb-3 pb-3 border-b',
                  isCurrentDay ? 'border-[#4f8ef7]/30' : 'border-[#1e1e2a]'
                )}
              >
                <span className="text-xs text-[#55556a] font-medium">{DAYS_SHORT[i]}</span>
                <span
                  className={cn(
                    'text-lg font-semibold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full',
                    isCurrentDay
                      ? 'bg-[#4f8ef7] text-white'
                      : 'text-[#e8e8f0]'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {dayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    compact
                    onToggle={() => toggleTask(task.id)}
                    onClick={() => setEditTask(task)}
                  />
                ))}
              </div>

              <button
                onClick={() => setAddForDate(dateStr)}
                className="mt-2 w-full py-1.5 rounded-md border border-dashed border-[#1e1e2a] text-[#55556a] hover:border-[#2a2a38] hover:text-[#888898] text-xs transition-colors"
              >
                + Add
              </button>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      <TaskModal
        open={!!addForDate}
        onClose={() => setAddForDate(null)}
        onSave={handleAddTask}
        defaultDate={addForDate || toDateString(new Date())}
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

      <RecurringTaskModal
        open={recurringOpen}
        onClose={() => setRecurringOpen(false)}
        onSave={handleAddRecurring}
      />

      {editRecurring && (
        <RecurringTaskModal
          open
          onClose={() => setEditRecurring(null)}
          onSave={handleEditRecurring}
          onDelete={() => {
            deleteRecurringTask(editRecurring.id)
            setEditRecurring(null)
          }}
          editTask={editRecurring}
        />
      )}
    </div>
  )
}
