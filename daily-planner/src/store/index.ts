import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, RecurringTask, DayReflection, AppState } from '../types'
import { generateId } from '../lib/utils'
import { todayString, toDateString, getWeekDays } from '../lib/dateUtils'
import { addDays } from '../lib/dateUtils'
import {
  upsertTask,
  dbDeleteTask,
  upsertManyTasks,
  upsertRecurringTask,
  dbDeleteRecurringTask,
  upsertReflection,
  fetchAllData,
} from '../lib/db'

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
  updateTaskReflection: (date: string, taskId: string, actualMinutes: number, note: string) => void

  setSelectedDate: (date: string) => void
  setGoogleAccessToken: (token: string | null) => void

  // Cloud sync
  userId: string | null
  setUserId: (id: string | null) => void
  loadFromCloud: (userId: string) => Promise<void>
  migrateLocalToCloud: (userId: string) => Promise<void>
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
      userId: null,

      // ── tasks ────────────────────────────────────────────────────────────

      addTask: (taskData) => {
        const task: Task = { ...taskData, id: generateId() }
        set((s) => ({ tasks: [...s.tasks, task] }))
        const { userId } = get()
        if (userId) upsertTask(task, userId).catch(console.error)
        return task
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }))
        const { userId, tasks } = get()
        if (userId) {
          const task = tasks.find((t) => t.id === id)
          if (task) upsertTask({ ...task, ...updates }, userId).catch(console.error)
        }
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
        dbDeleteTask(id).catch(console.error)
      },

      toggleTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        }))
        const { userId, tasks } = get()
        if (userId) {
          const task = tasks.find((t) => t.id === id)
          if (task) upsertTask(task, userId).catch(console.error)
        }
      },

      // ── recurring tasks ──────────────────────────────────────────────────

      addRecurringTask: (taskData) => {
        const rt: RecurringTask = { ...taskData, id: generateId() }
        set((s) => ({ recurringTasks: [...s.recurringTasks, rt] }))
        const { userId } = get()
        if (userId) upsertRecurringTask(rt, userId).catch(console.error)
        get().generateRecurringTasks(4)
      },

      updateRecurringTask: (id, updates) => {
        const today = todayString()
        set((s) => ({
          recurringTasks: s.recurringTasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          tasks: s.tasks.filter(
            (t) =>
              !(t.isRecurring && t.recurringId === id && t.date >= today && !t.completed)
          ),
        }))
        const { userId, recurringTasks } = get()
        if (userId) {
          const rt = recurringTasks.find((t) => t.id === id)
          if (rt) upsertRecurringTask(rt, userId).catch(console.error)
        }
        get().generateRecurringTasks(4)
      },

      deleteRecurringTask: (id) => {
        const today = todayString()
        set((s) => ({
          recurringTasks: s.recurringTasks.filter((t) => t.id !== id),
          tasks: s.tasks.filter(
            (t) =>
              !(t.isRecurring && t.recurringId === id && t.date >= today && !t.completed)
          ),
        }))
        dbDeleteRecurringTask(id).catch(console.error)
      },

      generateRecurringTasks: (weeksAhead = 4) => {
        const { recurringTasks, tasks, userId } = get()
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
              const exists = tasks.some(
                (t) => t.isRecurring && t.recurringId === rt.id && t.date === dateStr
              )
              if (!exists) {
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
          if (userId) upsertManyTasks(newTasks, userId).catch(console.error)
        }
      },

      // ── reflections ──────────────────────────────────────────────────────

      updateReflection: (date, updates) => {
        set((s) => {
          const existing = s.reflections[date] || {
            date,
            taskReflections: [],
            mood: 0,
            overview: '',
          }
          const updated = { ...existing, ...updates }
          const { userId } = get()
          if (userId) upsertReflection(updated, userId).catch(console.error)
          return { reflections: { ...s.reflections, [date]: updated } }
        })
      },

      updateTaskReflection: (date, taskId, actualMinutes, note) => {
        set((s) => {
          const existing = s.reflections[date] || {
            date,
            taskReflections: [],
            mood: 0,
            overview: '',
          }
          const taskRefs = existing.taskReflections.filter((r) => r.taskId !== taskId)
          const updated = {
            ...existing,
            taskReflections: [...taskRefs, { taskId, actualMinutes, note }],
          }
          const { userId } = get()
          if (userId) upsertReflection(updated, userId).catch(console.error)
          return { reflections: { ...s.reflections, [date]: updated } }
        })
      },

      // ── cloud sync ───────────────────────────────────────────────────────

      setUserId: (id) => set({ userId: id }),

      loadFromCloud: async (userId) => {
        const { tasks, recurringTasks, reflections } = await fetchAllData(userId)
        set({ tasks, recurringTasks, reflections, userId })
        get().generateRecurringTasks(4)
      },

      // Upload existing localStorage data to Supabase on first login
      migrateLocalToCloud: async (userId) => {
        const { tasks, recurringTasks, reflections } = get()
        await Promise.all([
          upsertManyTasks(tasks, userId),
          ...recurringTasks.map((rt) => upsertRecurringTask(rt, userId)),
          ...Object.values(reflections).map((r) => upsertReflection(r, userId)),
        ]).catch(console.error)
      },

      // ── misc ─────────────────────────────────────────────────────────────

      setSelectedDate: (date) => set({ selectedDate: date }),
      setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
    }),
    {
      name: 'daily-planner-store',
      // Don't persist userId — auth state comes from Supabase session
      partialize: (s) => ({
        tasks: s.tasks,
        recurringTasks: s.recurringTasks,
        reflections: s.reflections,
        selectedDate: s.selectedDate,
        googleAccessToken: s.googleAccessToken,
      }),
    }
  )
)

export default useStore
