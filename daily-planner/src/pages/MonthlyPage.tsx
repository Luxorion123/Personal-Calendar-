import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskModal } from '@/components/tasks/TaskModal'
import useStore from '@/store'
import {
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isSameDay,
  getMonthDays,
  toDateString,
} from '@/lib/dateUtils'
import { CATEGORY_COLORS } from '@/types'
import type { Category, Task } from '@/types'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { cn } from '@/lib/utils'

export default function MonthlyPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const tasks = useStore((s) => s.tasks)
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const toggleTask = useStore((s) => s.toggleTask)
  const { createCalendarEvent, deleteCalendarEvent } = useGoogleCalendar()

  const days = getMonthDays(currentMonth)
  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const WEEKDAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  function getTasksForDay(date: Date) {
    return tasks.filter((t) => t.date === toDateString(date))
  }

  const selectedDateStr = selectedDay ? toDateString(selectedDay) : null
  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : []

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

  return (
    <div className="p-3 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 h-screen">
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-4 mb-4">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-base md:text-xl font-semibold text-[#e8e8f0] flex-1 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h1>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs hidden md:flex"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className="text-center py-1.5">
              <span className="hidden md:inline text-xs text-[#55556a] font-medium">{d}</span>
              <span className="md:hidden text-xs text-[#55556a] font-medium">{WEEKDAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-px bg-[#1e1e2a] rounded-xl overflow-hidden flex-1">
          {days.map((day) => {
            const dayTasks = getTasksForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
            const isTodayDate = isToday(day)

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay!) ? null : day)}
                className={cn(
                  'bg-[#0a0a0f] p-1.5 md:p-2 text-left transition-colors min-h-[52px] md:min-h-[80px] flex flex-col gap-1',
                  !isCurrentMonth && 'opacity-30',
                  isSelected && 'bg-[#141418]',
                  !isSelected && 'hover:bg-[#141418] active:bg-[#141418]'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full text-[11px] md:text-xs',
                    isTodayDate
                      ? 'bg-[#4f8ef7] text-white'
                      : 'text-[#888898]'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="flex flex-wrap gap-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <span
                      key={task.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[task.category as Category] }}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[9px] text-[#55556a]">+{dayTasks.length - 3}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Side panel — desktop: right column, mobile: bottom overlay */}
      {selectedDay && (
        <>
          {/* Mobile overlay backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSelectedDay(null)}
          />

          {/* Panel */}
          <div className={cn(
            // Mobile: fixed bottom sheet
            'fixed bottom-16 left-0 right-0 z-40 bg-[#0a0a0f] rounded-t-2xl border-t border-[#1e1e2a] p-4 max-h-[70vh] overflow-y-auto',
            // Desktop: sidebar column
            'md:static md:rounded-none md:border-t-0 md:bg-transparent md:max-h-none md:w-72 md:flex-shrink-0 md:flex md:flex-col md:overflow-visible md:p-0 md:z-auto'
          )}>
            {/* Mobile handle */}
            <div className="md:hidden w-10 h-1 bg-[#2a2a38] rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-[#e8e8f0]">
                  {format(selectedDay, 'EEEE')}
                </p>
                <p className="text-xs text-[#55556a]">
                  {format(selectedDay, 'MMMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-9 h-9"
                  onClick={() => setAddModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-9 h-9"
                  onClick={() => setSelectedDay(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {selectedTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#1e1e2a] p-6 text-center">
                <p className="text-xs text-[#55556a]">No tasks. Tap + to add one.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onClick={() => setEditTask(task)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <TaskModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddTask}
        defaultDate={selectedDateStr || toDateString(new Date())}
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
