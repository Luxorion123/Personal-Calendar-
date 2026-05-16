export type Category = 'work' | 'personal' | 'health' | 'other'
export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  date: string // ISO date string YYYY-MM-DD
  estimatedMinutes: number
  category: Category
  priority: Priority
  notes: string
  completed: boolean
  googleEventId?: string
  isRecurring?: boolean
  recurringId?: string
}

export interface RecurringTask {
  id: string
  title: string
  estimatedMinutes: number
  category: Category
  priority: Priority
  notes: string
  daysOfWeek: number[] // 0=Sun,1=Mon...6=Sat
}

export interface ReflectionEntry {
  taskId: string
  actualMinutes: number
  note: string
}

export interface DayReflection {
  date: string // YYYY-MM-DD
  taskReflections: ReflectionEntry[]
  mood: number // 1-5
  overview: string
}

export interface AppState {
  tasks: Task[]
  recurringTasks: RecurringTask[]
  reflections: Record<string, DayReflection>
  googleAccessToken: string | null
  selectedDate: string
}

export const CATEGORY_COLORS: Record<Category, string> = {
  work: '#4f8ef7',
  personal: '#8b5cf6',
  health: '#22c55e',
  other: '#f59e0b',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  work: 'Work',
  personal: 'Personal',
  health: 'Health',
  other: 'Other',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#55556a',
  medium: '#4f8ef7',
  high: '#ef4444',
}
