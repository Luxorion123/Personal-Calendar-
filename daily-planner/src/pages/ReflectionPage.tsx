import { useState } from 'react'
import { Download, Flame } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import useStore from '@/store'
import { todayString, formatDisplayDate, formatShortDate } from '@/lib/dateUtils'
import { calcProductivityScore, calcReflectionStreak } from '@/lib/productivityUtils'
import { exportReflectionAsMarkdown, downloadMarkdown } from '@/lib/exportUtils'
import { cn } from '@/lib/utils'

const MOODS = [
  { value: 1, emoji: '😔', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
]

export default function ReflectionPage() {
  const tasks = useStore((s) => s.tasks)
  const reflections = useStore((s) => s.reflections)
  const updateReflection = useStore((s) => s.updateReflection)
  const updateTaskReflection = useStore((s) => s.updateTaskReflection)
  const toggleTask = useStore((s) => s.toggleTask)

  const today = todayString()
  const streak = calcReflectionStreak(reflections)

  const [historyDate, setHistoryDate] = useState(today)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const todayRef = reflections[today] || { date: today, taskReflections: [], mood: 0, overview: '' }
  const todayTasks = tasks.filter((t) => t.date === today)
  const todayScore = calcProductivityScore(todayTasks, todayRef)

  const histRef = reflections[historyDate]
  const histTasks = tasks.filter((t) => t.date === historyDate)

  const reflectionDays = Object.keys(reflections)
    .filter((d) => {
      const r = reflections[d]
      if (!r.overview && r.mood === 0 && r.taskReflections.length === 0) return false
      if (filterCategory === 'all') return true
      return tasks
        .filter((t) => t.date === d && t.category === filterCategory)
        .some((t) => r.taskReflections.find((tr) => tr.taskId === t.id))
    })
    .sort((a, b) => b.localeCompare(a))

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-[#e8e8f0]">Reflection</h1>
          <p className="text-xs text-[#55556a]">How did your day go?</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-full px-3 py-1.5">
            <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span className="text-xs font-semibold text-[#f59e0b]">{streak} day streak</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="today">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="today" className="flex-1 md:flex-none">Today</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 md:flex-none">History</TabsTrigger>
        </TabsList>

        {/* TODAY TAB */}
        <TabsContent value="today" className="space-y-5">
          {todayScore > 0 && (
            <div className="rounded-xl border border-[#1e1e2a] bg-[#141418] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#888898]">Productivity score</span>
                <span className="text-lg font-bold text-[#4f8ef7]">{todayScore}%</span>
              </div>
              <Progress value={todayScore} />
            </div>
          )}

          {/* Mood — shown first on mobile for quick access */}
          <section>
            <h2 className="text-sm font-semibold text-[#e8e8f0] mb-3">How are you feeling?</h2>
            <div className="flex gap-2 md:gap-3">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => updateReflection(today, { mood: todayRef.mood === m.value ? 0 : m.value })}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 md:gap-1.5 py-3 rounded-xl border transition-all',
                    todayRef.mood === m.value
                      ? 'border-[#4f8ef7] bg-[#4f8ef7]/10'
                      : 'border-[#1e1e2a] bg-[#141418] hover:border-[#2a2a38] active:bg-[#1a1a20]'
                  )}
                >
                  <span className="text-xl md:text-2xl">{m.emoji}</span>
                  <span className="text-[9px] md:text-[10px] text-[#55556a] hidden sm:block">{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Task reflections */}
          {todayTasks.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[#e8e8f0] mb-3">
                Tasks — {formatDisplayDate(today)}
              </h2>
              <div className="space-y-3">
                {todayTasks.map((task) => {
                  const ref = todayRef.taskReflections.find((r) => r.taskId === task.id)
                  return (
                    <div key={task.id} className="rounded-xl border border-[#1e1e2a] bg-[#141418] p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <button
                          className={cn(
                            'w-5 h-5 rounded border flex-shrink-0 transition-colors',
                            task.completed ? 'bg-[#4f8ef7] border-[#4f8ef7]' : 'border-[#2a2a38]'
                          )}
                          onClick={() => toggleTask(task.id)}
                        >
                          {task.completed && (
                            <svg className="w-3 h-3 m-auto" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <span className={cn(
                          'text-sm font-medium text-[#e8e8f0] flex-1',
                          task.completed && 'line-through text-[#55556a]'
                        )}>
                          {task.title}
                        </span>
                        <span className="text-xs text-[#55556a] flex-shrink-0">est. {task.estimatedMinutes}m</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[#55556a] block mb-1.5">Actual time (min)</label>
                          <Input
                            type="number"
                            min={0}
                            placeholder={String(task.estimatedMinutes)}
                            value={ref?.actualMinutes || ''}
                            onChange={(e) => updateTaskReflection(today, task.id, Number(e.target.value), ref?.note || '')}
                            className="h-10 md:h-9"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#55556a] block mb-1.5">How it went</label>
                          <Input
                            placeholder="Brief note..."
                            value={ref?.note || ''}
                            onChange={(e) => updateTaskReflection(today, task.id, ref?.actualMinutes || 0, e.target.value)}
                            className="h-10 md:h-9"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Overview */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-[#e8e8f0]">Day overview</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  const content = exportReflectionAsMarkdown(today, todayRef, todayTasks)
                  downloadMarkdown(content, `reflection-${today}.md`)
                }}
              >
                <Download className="w-3 h-3" />
                Export
              </Button>
            </div>
            <Textarea
              placeholder="How did today go? What did you learn? What could be better?"
              rows={4}
              value={todayRef.overview}
              onChange={(e) => updateReflection(today, { overview: e.target.value })}
            />
          </section>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-5">
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
              className="flex-1 md:w-40 md:flex-none [color-scheme:dark] text-sm h-10 md:h-9"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="flex-1 md:w-36 md:flex-none h-10 md:h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {histRef ? (
            <div className="rounded-xl border border-[#1e1e2a] bg-[#141418] p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#e8e8f0]">{formatDisplayDate(historyDate)}</p>
                {histRef.mood > 0 && (
                  <span className="text-2xl">{MOODS.find((m) => m.value === histRef.mood)?.emoji}</span>
                )}
              </div>
              {histRef.overview && (
                <p className="text-sm text-[#888898] leading-relaxed">{histRef.overview}</p>
              )}
              {histTasks.length > 0 && (
                <div className="space-y-1.5">
                  {histTasks.map((task) => {
                    const tr = histRef.taskReflections.find((r) => r.taskId === task.id)
                    return (
                      <div key={task.id} className="flex items-center gap-2 text-xs text-[#888898]">
                        <span className={cn(task.completed ? 'line-through text-[#55556a]' : '')}>
                          {task.title}
                        </span>
                        {tr?.actualMinutes ? <span className="text-[#55556a]">· {tr.actualMinutes}m</span> : null}
                        {tr?.note ? <span className="text-[#55556a] truncate">· {tr.note}</span> : null}
                      </div>
                    )
                  })}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  const content = exportReflectionAsMarkdown(historyDate, histRef, histTasks)
                  downloadMarkdown(content, `reflection-${historyDate}.md`)
                }}
              >
                <Download className="w-3 h-3" />
                Export this day
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#1e1e2a] p-8 text-center">
              <p className="text-sm text-[#55556a]">No reflection for this date</p>
            </div>
          )}

          {reflectionDays.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[#e8e8f0] mb-3">Past reflections</h2>
              <div className="space-y-2">
                {reflectionDays.map((d) => {
                  const r = reflections[d]
                  const dayTasks = tasks.filter((t) => t.date === d)
                  const score = calcProductivityScore(dayTasks, r)
                  return (
                    <button
                      key={d}
                      onClick={() => setHistoryDate(d)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors',
                        d === historyDate
                          ? 'border-[#4f8ef7]/30 bg-[#4f8ef7]/5'
                          : 'border-[#1e1e2a] bg-[#141418] hover:bg-[#1a1a20] active:bg-[#1a1a20]'
                      )}
                    >
                      <span className="text-xs font-medium text-[#e8e8f0] w-20 flex-shrink-0">
                        {formatShortDate(d)}
                      </span>
                      {r.mood > 0 && (
                        <span className="text-lg">{MOODS.find((m) => m.value === r.mood)?.emoji}</span>
                      )}
                      <span className="text-xs text-[#888898] flex-1 truncate">
                        {r.overview.slice(0, 50) || 'No overview'}
                        {r.overview.length > 50 && '…'}
                      </span>
                      {score > 0 && (
                        <span className="text-xs text-[#4f8ef7] flex-shrink-0">{score}%</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
