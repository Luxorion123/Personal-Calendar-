import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, RecurringTask, DayReflection, AppState } from '../types'
import { generateId } from '../lib/utils'
import { todayString, toDateString, getWeekDays } from '../lib/dateUtils'
import { addDays } from '../lib/dateUtils'

interface Actions {
  addTask: (task: Omit<Task, 'id'>) => Task
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void

  addRecurringTask: (task: Omit<RecurringTask, 'id'>) => void
  updateRecurringTask: (id: string, updates: Partial<RecurringTask>) => void
  deleteRecurringTask: (id: string) => void
  generateRecurringTasks: (weeksAhead?: number) => void

  updateReflection: (date: string, updates: Partial<DayReflection>) => void
  updateTaskReflection: (
    date: string,
    taskId: string,
    actualMinutes: number,
    note: string
  ) => void

  setSelectedDate: (date: string) => void
  setGoogleAccessToken: (token: string | null) => void
}

type Store = AppState & Actions

const useStore = create<Store>()(
  persist(
    (set, get) => ({
      tasks: [],
      recurringTasks: [],
      reflections: {},
      googleAccessToken: null,
      selectedDate: todayString(),

      addTask: (taskData) => {
        const task: Task = { ...taskData, id: generateId() }
        set((s) => ({ tasks: [...s.tasks, task] }))
        return task
      },

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),

      addRecurringTask: (taskData) => {
        const task: RecurringTask = { ...taskData, id: generateId() }
        set((s) => ({ recurringTasks: [...s.recurringTasks, task] }))
        get().generateRecurringTasks(4)
      },

      updateRecurringTask: (id, updates) => {
        const today = todayString()
        set((s) => ({
          recurringTasks: s.recurringTasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          // Only remove future incomplete instances — past and completed ones are kept
          tasks: s.tasks.filter(
            (t) =>
              !(t.isRecurring && t.recurringId === id && t.date >= today && !t.completed)
          ),
        }))
        get().generateRecurringTasks(4)
      },

      deleteRecurringTask: (id) => {
        const today = todayString()
        set((s) => ({
          recurringTasks: s.recurringTasks.filter((t) => t.id !== id),
          // Only remove future incomplete instances — past and completed ones are kept
          tasks: s.tasks.filter(
            (t) =>
              !(t.isRecurring && t.recurringId === id && t.date >= today && !t.completed)
          ),
        }))
      },

      generateRecurringTasks: (weeksAhead = 4) => {
        const { recurringTasks, tasks } = get()
        const today = new Date()
        const newTasks: Task[] = []

        for (let w = 0; w < weeksAhead; w++) {
          const weekStart = addDays(today, w * 7)
          const weekDays = getWeekDays(weekStart)

          recurringTasks.forEach((rt) => {
            weekDays.forEach((day) => {
              const dow = day.getDay()
              if (!rt.daysOfWeek.includes(dow)) return
              const dateStr = toDateString(day)
              const alreadyExists = tasks.some(
                (t) => t.isRecurring && t.recurringId === rt.id && t.date === dateStr
              )
              if (!alreadyExists) {
                newTasks.push({
                  id: generateId(),
                  title: rt.title,
                  date: dateStr,
                  estimatedMinutes: rt.estimatedMinutes,
                  category: rt.category,
                  priority: rt.priority,
                  notes: rt.notes,
                  completed: false,
                  isRecurring: true,
                  recurringId: rt.id,
                })
              }
            })
          })
        }

        if (newTasks.length > 0) {
          set((s) => ({ tasks: [...s.tasks, ...newTasks] }))
        }
      },

      updateReflection: (date, updates) =>
        set((s) => {
          const existing = s.reflections[date] || {
            date,
            taskReflections: [],
            mood: 0,
            overview: '',
          }
          return {
            reflections: {
              ...s.reflections,
              [date]: { ...existing, ...updates },
            },
          }
        }),

      updateTaskReflection: (date, taskId, actualMinutes, note) =>
        set((s) => {
          const existing = s.reflections[date] || {
            date,
            taskReflections: [],
            mood: 0,
            overview: '',
          }
          const taskRefs = existing.taskReflections.filter(
            (r) => r.taskId !== taskId
          )
          return {
            reflections: {
              ...s.reflections,
              [date]: {
                ...existing,
                taskReflections: [...taskRefs, { taskId, actualMinutes, note }],
              },
            },
          }
        }),

      setSelectedDate: (date) => set({ selectedDate: date }),
      setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
    }),
    {
      name: 'daily-planner-store',
    }
  )
)

export default useStore
