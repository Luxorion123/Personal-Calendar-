import { useState } from 'react'
import { Bot, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Progress } from '@/components/ui/progress'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskModal } from '@/components/tasks/TaskModal'
import { CategoryDonut } from '@/components/charts/CategoryDonut'
import useStore from '@/store'
import { todayString, getNext14Days, formatDisplayDate, formatShortDate, fromDateString } from '@/lib/dateUtils'
import { calcProductivityScore, getCategoryMinutes } from '@/lib/productivityUtils'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import type { Task } from '@/types'
import { isToday } from 'date-fns'

export default function HomePage() {
  const tasks = useStore((s) => s.tasks)
  const reflections = useStore((s) => s.reflections)
  const updateTask = useStore((s) => s.updateTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const toggleTask = useStore((s) => s.toggleTask)
  const setSelectedDate = useStore((s) => s.setSelectedDate)
  const navigate = useNavigate()
  const { deleteCalendarEvent } = useGoogleCalendar()

  const [editTask, setEditTask] = useState<Task | null>(null)
  const today = todayString()
  const todayTasks = tasks.filter((t) => t.date === today)
  const todayReflection = reflections[today]
  const productivityScore = calcProductivityScore(todayTasks, todayReflection)
  const categoryMins = getCategoryMinutes(tasks, reflections)

  const next14 = getNext14Days().slice(1)
  const upcomingByDay = next14
    .map((d) => ({
      date: d,
      tasks: tasks.filter((t) => t.date === d),
    }))
    .filter((g) => g.tasks.length > 0)
    .slice(0, 7)

  async function handleUpdateTask(taskData: Omit<Task, 'id'>) {
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
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 md:space-y-6">
      {/* AI Placeholder */}
      <div className="rounded-xl border border-[#1e1e2a] bg-[#141418] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-[#4f8ef7]/60" />
          </div>
          <span className="text-sm font-medium text-[#55556a]">AI Assistant</span>
          <span className="ml-auto text-xs text-[#55556a] bg-[#1a1a20] px-2 py-0.5 rounded-full">
            Coming soon
          </span>
        </div>
        <div className="h-10 rounded-lg border border-[#1e1e2a] bg-[#0a0a0f] flex items-center px-3 opacity-40 cursor-not-allowed">
          <span className="text-sm text-[#55556a]">Ask me anything about your day...</span>
        </div>
      </div>

      {/* Today's Tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-[#e8e8f0]">Today</h2>
            <p className="text-xs text-[#55556a]">{formatDisplayDate(today)}</p>
          </div>
          {productivityScore > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#888898]">Productivity</p>
              <p className="text-sm font-semibold text-[#4f8ef7]">{productivityScore}%</p>
            </div>
          )}
        </div>

        {productivityScore > 0 && (
          <Progress value={productivityScore} className="mb-4" />
        )}

        {todayTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1e1e2a] p-8 text-center">
            <p className="text-sm text-[#55556a]">No tasks today.</p>
            <p className="text-xs text-[#55556a] mt-1">Tap + to add one.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
                onClick={() => setEditTask(task)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Next 2 weeks */}
      {upcomingByDay.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-[#e8e8f0] mb-3">Coming up</h2>
          <div className="space-y-4">
            {upcomingByDay.map(({ date, tasks: dayTasks }) => (
              <div key={date}>
                <button
                  className="flex items-center gap-2 mb-2 group"
                  onClick={() => {
                    setSelectedDate(date)
                    navigate('/daily')
                  }}
                >
                  <span className="text-xs font-medium text-[#888898] group-hover:text-[#e8e8f0] transition-colors">
                    {isToday(fromDateString(date)) ? 'Today' : formatShortDate(date)}
                  </span>
                  <ChevronRight className="w-3 h-3 text-[#55556a] group-hover:text-[#888898]" />
                </button>
                <div className="space-y-2">
                  {dayTasks.slice(0, 3).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      compact
                      onClick={() => {
                        setSelectedDate(date)
                        navigate('/daily')
                      }}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-xs text-[#55556a] pl-3">
                      +{dayTasks.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category chart */}
      <section>
        <h2 className="text-base font-semibold text-[#e8e8f0] mb-1">Past 30 days</h2>
        <p className="text-xs text-[#55556a] mb-3">Time by category</p>
        <div className="rounded-xl border border-[#1e1e2a] bg-[#141418] p-4">
          <CategoryDonut data={categoryMins} height={180} />
        </div>
      </section>

      {/* Edit task modal */}
      {editTask && (
        <TaskModal
          open
          onClose={() => setEditTask(null)}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
          editTask={editTask}
        />
      )}
    </div>
  )
}
