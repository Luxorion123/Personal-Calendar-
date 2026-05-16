import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TaskModal } from '@/components/tasks/TaskModal'
import { SearchModal } from './SearchModal'
import { useKeyboard } from '@/hooks/useKeyboard'
import useStore from '@/store'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { todayString } from '@/lib/dateUtils'

export function Layout() {
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const addTask = useStore((s) => s.addTask)
  const selectedDate = useStore((s) => s.selectedDate)
  const { createCalendarEvent } = useGoogleCalendar()

  useKeyboard('n', () => setTaskModalOpen(true), [])
  useKeyboard('k', () => setSearchOpen(true), [])

  async function handleAddTask(taskData: Parameters<typeof addTask>[0]) {
    const task = addTask(taskData)
    const eventId = await createCalendarEvent(task)
    if (eventId) {
      useStore.getState().updateTask(task.id, { googleEventId: eventId })
    }
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          onNewTask={() => setTaskModalOpen(true)}
          onSearch={() => setSearchOpen(true)}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-14 overflow-y-auto pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav — hidden on desktop */}
      <BottomNav onNewTask={() => setTaskModalOpen(true)} />

      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleAddTask}
        defaultDate={selectedDate || todayString()}
      />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
