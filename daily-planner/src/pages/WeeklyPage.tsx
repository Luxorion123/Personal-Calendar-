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
  const [mobileDayIndex, setMobileDayIndex] = useState(() => {
    // Default to today's index in the week
    const today = new Date()
    const day = today.getDay()
    return day === 0 ? 6 : day - 1 // Mon=0...Sun=6
  })
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
  const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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

  const mobileDay = days[mobileDayIndex]
  const mobileDateStr = toDateString(mobileDay)
  const mobileDayTasks = getTasksForDay(mobileDateStr)

  function prevMobileDay() {
    if (mobileDayIndex > 0) {
      setMobileDayIndex(mobileDayIndex - 1)
    } else {
      setWeekStart(subWeeks(weekStart, 1))
      setMobileDayIndex(6)
    }
  }

  function nextMobileDay() {
    if (mobileDayIndex < 6) {
      setMobileDayIndex(mobileDayIndex + 1)
    } else {
      setWeekStart(addWeeks(weekStart, 1))
      setMobileDayIndex(0)
    }
  }

  return (
    <div className="p-3 md:p-6 flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4 mb-4 flex-shrink-0">
        <Button variant="ghost" size="icon" className="w-8 h-8 hidden md:flex" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="hidden md:block text-lg font-semibold text-[#e8e8f0] min-w-[200px] text-center">
          {weekRange}
        </span>
        <Button variant="ghost" size="icon" className="w-8 h-8 hidden md:flex" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Mobile week label */}
        <span className="md:hidden text-sm font-semibold text-[#e8e8f0] flex-1">{weekRange}</span>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs hidden md:flex"
          onClick={() => setWeekStart(new Date())}
        >
          This Week
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 hidden md:flex"
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
            <span className="hidden md:inline">Set Recurring</span>
            <span className="md:hidden">Repeat</span>
          </Button>
        </div>
      </div>

      {/* Recurring tasks list — desktop only */}
      {showRecurringList && recurringTasks.length > 0 && (
        <div className="mb-4 rounded-xl border border-[#1e1e2a] bg-[#141418] p-4 flex-shrink-0 hidden md:block">
          <p className="text-xs font-medium text-[#55556a] mb-3">Recurring Tasks</p>
          <div className="space-y-2">
            {recurringTasks.map((rt) => {
              const DAYS_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
              return (
                <div key={rt.id} className="flex items-center gap-3 text-sm text-[#e8e8f0]">
                  <span className="flex-1 truncate">{rt.title}</span>
                  <div className="flex gap-0.5">
                    {[0,1,2,3,4,5,6].map((d) => (
                      <span key={d} className={cn(
                        'text-[10px] w-5 h-5 flex items-center justify-center rounded',
                        rt.daysOfWeek.includes(d) ? 'bg-[#4f8ef7]/20 text-[#4f8ef7]' : 'text-[#55556a]'
                      )}>{DAYS_ABBR[d]}</span>
                    ))}
                  </div>
                  <button onClick={() => setEditRecurring(rt)} className="text-[#55556a] hover:text-[#888898]">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteRecurringTask(rt.id)} className="text-[#55556a] hover:text-[#ef4444]">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MOBILE: Single day view */}
      <div className="md:hidden flex-1 flex flex-col min-h-0">
        {/* Day selector strip */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {days.map((day, i) => {
            const dateStr = toDateString(day)
            const dayTaskCount = getTasksForDay(dateStr).length
            return (
              <button
                key={dateStr}
                onClick={() => setMobileDayIndex(i)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-colors min-w-[48px]',
                  i === mobileDayIndex
                    ? 'border-[#4f8ef7] bg-[#4f8ef7]/10'
                    : 'border-[#1e1e2a] bg-[#141418]',
                  isToday(day) && i !== mobileDayIndex && 'border-[#4f8ef7]/30'
                )}
              >
                <span className="text-[10px] text-[#55556a]">{DAYS_SHORT[i]}</span>
                <span className={cn(
                  'text-sm font-semibold',
                  isToday(day) ? 'text-[#4f8ef7]' : 'text-[#e8e8f0]'
                )}>
                  {format(day, 'd')}
                </span>
                {dayTaskCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4f8ef7]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Day navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" className="w-9 h-9" onClick={prevMobileDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#e8e8f0]">
              {isToday(mobileDay) ? 'Today' : format(mobileDay, 'EEEE')}
            </p>
            <p className="text-xs text-[#55556a]">{format(mobileDay, 'MMMM d')}</p>
          </div>
          <Button variant="ghost" size="icon" className="w-9 h-9" onClick={nextMobileDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Tasks for selected day */}
        <div className="flex-1 overflow-y-auto space-y-2.5">
          {mobileDayTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1e1e2a] p-8 text-center">
              <p className="text-sm text-[#55556a]">No tasks</p>
            </div>
          ) : (
            mobileDayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
                onClick={() => setEditTask(task)}
              />
            ))
          )}
        </div>

        <button
          onClick={() => setAddForDate(mobileDateStr)}
          className="mt-3 w-full py-3 rounded-xl border border-dashed border-[#1e1e2a] text-[#55556a] hover:border-[#2a2a38] hover:text-[#888898] text-sm transition-colors"
        >
          + Add task
        </button>
      </div>

      {/* DESKTOP: 7-column layout */}
      <div className="hidden md:grid grid-cols-7 gap-3 flex-1 min-h-0">
        {days.map((day, i) => {
          const dateStr = toDateString(day)
          const dayTasks = getTasksForDay(dateStr)
          const isCurrentDay = isToday(day)

          return (
            <div key={dateStr} className="flex flex-col min-h-0">
              <div className={cn(
                'flex flex-col items-center mb-3 pb-3 border-b',
                isCurrentDay ? 'border-[#4f8ef7]/30' : 'border-[#1e1e2a]'
              )}>
                <span className="text-xs text-[#55556a] font-medium">{DAYS_SHORT[i]}</span>
                <span className={cn(
                  'text-lg font-semibold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full',
                  isCurrentDay ? 'bg-[#4f8ef7] text-white' : 'text-[#e8e8f0]'
                )}>
                  {format(day, 'd')}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
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
          onDelete={() => { deleteRecurringTask(editRecurring.id); setEditRecurring(null) }}
          editTask={editRecurring}
        />
      )}
    </div>
  )
}
