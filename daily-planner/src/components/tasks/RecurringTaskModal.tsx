import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { RecurringTask, Category, Priority } from '@/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface RecurringTaskModalProps {
  open: boolean
  onClose: () => void
  onSave: (task: Omit<RecurringTask, 'id'>) => void
  onDelete?: () => void
  editTask?: RecurringTask
}

export function RecurringTaskModal({
  open,
  onClose,
  onSave,
  onDelete,
  editTask,
}: RecurringTaskModalProps) {
  const [title, setTitle] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [category, setCategory] = useState<Category>('work')
  const [priority, setPriority] = useState<Priority>('medium')
  const [notes, setNotes] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([1])

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setEstimatedMinutes(editTask.estimatedMinutes)
      setCategory(editTask.category)
      setPriority(editTask.priority)
      setNotes(editTask.notes)
      setSelectedDays(editTask.daysOfWeek)
    } else {
      setTitle('')
      setEstimatedMinutes(30)
      setCategory('work')
      setPriority('medium')
      setNotes('')
      setSelectedDays([1])
    }
  }, [editTask, open])

  function toggleDay(d: number) {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  function handleSave() {
    if (!title.trim() || selectedDays.length === 0) return
    onSave({ title, estimatedMinutes, category, priority, notes, daysOfWeek: selectedDays })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editTask ? 'Edit Recurring Task' : 'Set Recurring Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#888898] mb-1.5 block">Title</label>
            <Input
              placeholder="e.g. Wake up at 6:45"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-[#888898] mb-2 block">Repeat on</label>
            <div className="flex gap-2">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  onClick={() => toggleDay(i)}
                  className={cn(
                    'flex-1 py-1.5 text-xs rounded-md border transition-colors',
                    selectedDays.includes(i)
                      ? 'bg-[#4f8ef7] border-[#4f8ef7] text-white'
                      : 'border-[#1e1e2a] text-[#888898] hover:border-[#2a2a38]'
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#888898] mb-1.5 block">
                Est. (min)
              </label>
              <Input
                type="number"
                min={1}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-[#888898] mb-1.5 block">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
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
                <SelectTrigger>
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

          <div className="flex justify-between pt-1">
            {onDelete ? (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!title.trim() || selectedDays.length === 0}
              >
                {editTask ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
