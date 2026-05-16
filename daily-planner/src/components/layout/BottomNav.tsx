import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Clock,
  BookOpen,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/monthly', icon: CalendarDays, label: 'Month' },
  { to: '/weekly', icon: CalendarRange, label: 'Week' },
  { to: '/daily', icon: Clock, label: 'Daily' },
  { to: '/reflection', icon: BookOpen, label: 'Reflect' },
]

interface BottomNavProps {
  onNewTask: () => void
}

export function BottomNav({ onNewTask }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f] border-t border-[#1e1e2a] flex items-center md:hidden safe-bottom">
      {NAV_ITEMS.slice(0, 2).map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors',
              isActive ? 'text-[#4f8ef7]' : 'text-[#55556a]'
            )
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}

      {/* Centre add button */}
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={onNewTask}
          className="w-12 h-12 rounded-full bg-[#4f8ef7] flex items-center justify-center shadow-lg shadow-[#4f8ef7]/20 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {NAV_ITEMS.slice(2).map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors',
              isActive ? 'text-[#4f8ef7]' : 'text-[#55556a]'
            )
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
