import type { Task, DayReflection, Category } from '../types'
import { subDays, parseISO, isWithinInterval } from 'date-fns'
import { toDateString } from './dateUtils'

export function calcProductivityScore(
  tasks: Task[],
  reflection: DayReflection | undefined
): number {
  if (!reflection || tasks.length === 0) return 0
  const completedTasks = tasks.filter((t) => t.completed)
  if (completedTasks.length === 0) return 0

  const totalEstimated = completedTasks.reduce(
    (sum, t) => sum + t.estimatedMinutes,
    0
  )
  const totalActual = completedTasks.reduce((sum, t) => {
    const ref = reflection.taskReflections.find((r) => r.taskId === t.id)
    return sum + (ref?.actualMinutes || t.estimatedMinutes)
  }, 0)

  if (totalActual === 0) return 0
  return Math.min(100, Math.round((totalEstimated / totalActual) * 100))
}

export function calcReflectionStreak(
  reflections: Record<string, DayReflection>
): number {
  let streak = 0
  let date = new Date()
  while (true) {
    const key = toDateString(date)
    const ref = reflections[key]
    if (ref && (ref.overview.trim() || ref.mood > 0)) {
      streak++
      date = subDays(date, 1)
    } else {
      break
    }
  }
  return streak
}

export function getCategoryMinutes(
  tasks: Task[],
  reflections: Record<string, DayReflection>
): Record<Category, number> {
  const result: Record<Category, number> = {
    work: 0,
    personal: 0,
    health: 0,
    other: 0,
  }

  const thirtyDaysAgo = subDays(new Date(), 30)

  tasks.forEach((t) => {
    if (!t.completed) return
    try {
      const taskDate = parseISO(t.date)
      if (!isWithinInterval(taskDate, { start: thirtyDaysAgo, end: new Date() }))
        return
      const ref = reflections[t.date]
      const entry = ref?.taskReflections.find((r) => r.taskId === t.id)
      const mins = entry?.actualMinutes || t.estimatedMinutes
      result[t.category] = (result[t.category] || 0) + mins
    } catch {
      // skip invalid dates
    }
  })

  return result
}
