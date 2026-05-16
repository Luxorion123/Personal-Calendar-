import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
  isSameMonth,
  parseISO,
  addDays,
  subDays,
  startOfDay,
} from 'date-fns'

export {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
  isSameMonth,
  parseISO,
  addDays,
  subDays,
  startOfDay,
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function fromDateString(str: string): Date {
  return parseISO(str)
}

export function todayString(): string {
  return toDateString(new Date())
}

export function getMonthDays(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function formatDisplayDate(str: string): string {
  return format(parseISO(str), 'EEEE, MMMM d')
}

export function formatShortDate(str: string): string {
  return format(parseISO(str), 'MMM d')
}

export function getNext14Days(): string[] {
  const days: string[] = []
  for (let i = 0; i < 14; i++) {
    days.push(toDateString(addDays(new Date(), i)))
  }
  return days
}
