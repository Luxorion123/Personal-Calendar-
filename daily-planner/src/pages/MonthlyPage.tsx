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

  function getTasksForDay(date: Date) {
    const dateStr = toDateString(date)
    return tasks.filter((t) => t.date === dateStr)
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
    <div className="p-6 flex gap-6 h-screen">
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-[#e8e8f0] min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-[#55556a] font-medium py-2">
              {d}
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
                  'bg-[#0a0a0f] p-2 text-left transition-colors min-h-[80px] flex flex-col gap-1',
                  !isCurrentMonth && 'opacity-30',
                  isSelected && 'bg-[#141418]',
                  !isSelected && 'hover:bg-[#141418]'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                    isTodayDate
                      ? 'bg-[#4f8ef7] text-white'
                      : 'text-[#888898]'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayTasks.slice(0, 4).map((task) => (
                    <span
                      key={task.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[task.category as Category] }}
                    />
                  ))}
                  {dayTasks.length > 4 && (
                    <span className="text-[9px] text-[#55556a]">+{dayTasks.length - 4}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Side panel */}
      {selectedDay && (
        <div className="w-72 flex-shrink-0 flex flex-col">
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
                className="w-7 h-7"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7"
                onClick={() => setSelectedDay(null)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1e1e2a] p-6 text-center">
              <p className="text-xs text-[#55556a]">No tasks. Click + to add one.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
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
      )}

      {/* Modals */}
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
