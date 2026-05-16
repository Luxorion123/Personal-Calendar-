import type { DayReflection, Task } from '../types'
import { formatDisplayDate } from './dateUtils'

export function exportReflectionAsMarkdown(
  date: string,
  reflection: DayReflection,
  tasks: Task[]
): string {
  const lines: string[] = []
  lines.push(`# Reflection: ${formatDisplayDate(date)}`)
  lines.push('')
  lines.push(`**Mood:** ${'⭐'.repeat(reflection.mood)}${'☆'.repeat(5 - reflection.mood)} (${reflection.mood}/5)`)
  lines.push('')

  if (reflection.overview) {
    lines.push('## Overview')
    lines.push(reflection.overview)
    lines.push('')
  }

  if (tasks.length > 0) {
    lines.push('## Tasks')
    tasks.forEach((task) => {
      const ref = reflection.taskReflections.find((r) => r.taskId === task.id)
      lines.push(`### ${task.title}`)
      lines.push(`- **Estimated:** ${task.estimatedMinutes} min`)
      if (ref?.actualMinutes) lines.push(`- **Actual:** ${ref.actualMinutes} min`)
      if (ref?.note) lines.push(`- **Note:** ${ref.note}`)
      lines.push(`- **Category:** ${task.category}`)
      lines.push(`- **Priority:** ${task.priority}`)
      lines.push('')
    })
  }

  return lines.join('\n')
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
