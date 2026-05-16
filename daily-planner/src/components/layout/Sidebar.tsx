import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Clock,
  BookOpen,
  Plus,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { todayString } from '@/lib/dateUtils'
import useStore from '@/store'
import { supabase } from '@/lib/supabase'

interface SidebarProps {
  onNewTask: () => void
  onSearch: () => void
}

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/monthly', icon: CalendarDays, label: 'Monthly' },
  { to: '/weekly', icon: CalendarRange, label: 'Weekly' },
  { to: '/daily', icon: Clock, label: 'Daily' },
  { to: '/reflection', icon: BookOpen, label: 'Reflection' },
]

export function Sidebar({ onNewTask, onSearch }: SidebarProps) {
  const { isSignedIn, signIn, signOut, syncFromCalendar, isLoading } =
    useGoogleCalendar()
  const setSelectedDate = useStore((s) => s.setSelectedDate)
  const navigate = useNavigate()

  function goToToday() {
    setSelectedDate(todayString())
    navigate('/daily')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-14 bg-[#0a0a0f] border-r border-[#1e1e2a] flex flex-col items-center py-4 gap-1 z-40">
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-[#4f8ef7]/20 border border-[#4f8ef7]/30 flex items-center justify-center mb-4">
        <Clock className="w-4 h-4 text-[#4f8ef7]" />
      </div>

      {/* Add task */}
      <SidebarButton icon={Plus} label="New Task (N)" onClick={onNewTask} accent />

      <div className="w-6 h-px bg-[#1e1e2a] my-1" />

      {/* Nav */}
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <Tooltip key={to} delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                  isActive
                    ? 'bg-[#4f8ef7]/15 text-[#4f8ef7]'
                    : 'text-[#55556a] hover:text-[#888898] hover:bg-[#1a1a20]'
                )
              }
            >
              <Icon className="w-4 h-4" />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="w-6 h-px bg-[#1e1e2a] my-1" />

      {/* Search */}
      <SidebarButton icon={Search} label="Search (Ctrl+K)" onClick={onSearch} />

      {/* Today */}
      <SidebarButton icon={CalendarDays} label="Go to Today" onClick={goToToday} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Google Calendar */}
      {isSignedIn ? (
        <>
          <SidebarButton
            icon={RefreshCw}
            label="Sync Calendar"
            onClick={syncFromCalendar}
            loading={isLoading}
          />
          <SidebarButton icon={LogOut} label="Disconnect Google Calendar" onClick={signOut} />
        </>
      ) : (
        <SidebarButton icon={LogIn} label="Connect Google Calendar" onClick={signIn} />
      )}

      <div className="w-6 h-px bg-[#1e1e2a] my-1" />

      {/* Account sign out */}
      <SidebarButton
        icon={User}
        label="Sign out of account"
        onClick={() => supabase.auth.signOut()}
      />
    </aside>
  )
}

function SidebarButton({
  icon: Icon,
  label,
  onClick,
  accent,
  loading,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  accent?: boolean
  loading?: boolean
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
            accent
              ? 'bg-[#4f8ef7] text-white hover:bg-[#6ba0f9]'
              : 'text-[#55556a] hover:text-[#888898] hover:bg-[#1a1a20]'
          )}
        >
          <Icon className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
