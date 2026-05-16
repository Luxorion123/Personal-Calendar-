import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import type { Task, Category, Priority } from '@/types'
import { todayString } from '@/lib/dateUtils'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSave: (task: Omit<Task, 'id'>) => void
  onDelete?: () => void
  defaultDate?: string
  editTask?: Task
}

export function TaskModal({
  open,
  onClose,
  onSave,
  onDelete,
  defaultDate,
  editTask,
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate || todayString())
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [category, setCategory] = useState<Category>('work')
  const [priority, setPriority] = useState<Priority>('medium')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setDate(editTask.date)
      setEstimatedMinutes(editTask.estimatedMinutes)
      setCategory(editTask.category)
      setPriority(editTask.priority)
      setNotes(editTask.notes)
    } else {
      setTitle('')
      setDate(defaultDate || todayString())
      setEstimatedMinutes(30)
      setCategory('work')
      setPriority('medium')
      setNotes('')
    }
  }, [editTask, defaultDate, open])

  function handleSave() {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      date,
      estimatedMinutes,
      category,
      priority,
      notes,
      completed: editTask?.completed ?? false,
      googleEventId: editTask?.googleEventId,
      isRecurring: editTask?.isRecurring,
      recurringId: editTask?.recurringId,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editTask ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#888898] mb-1.5 block">Title</label>
            <Input
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              className="h-11 text-base md:text-sm md:h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888898] mb-1.5 block">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="[color-scheme:dark] h-11 text-base md:text-sm md:h-9"
              />
            </div>
            <div>
              <label className="text-xs text-[#888898] mb-1.5 block">
                Est. (min)
              </label>
              <Input
                type="number"
                min={1}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="h-11 text-base md:text-sm md:h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888898] mb-1.5 block">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="h-11 text-base md:text-sm md:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[#888898] mb-1.5 block">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-11 text-base md:text-sm md:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#888898] mb-1.5 block">Notes</label>
            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-1 pb-1">
            {onDelete ? (
              <Button variant="destructive" size="sm" onClick={onDelete} className="h-11 px-4 md:h-9">
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="h-11 px-4 md:h-9">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!title.trim()} className="h-11 px-4 md:h-9">
                {editTask ? 'Save' : 'Add Task'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
