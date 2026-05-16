import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Layout } from '@/components/layout/Layout'
import { AuthGuard } from '@/components/layout/AuthGuard'
import HomePage from '@/pages/HomePage'
import MonthlyPage from '@/pages/MonthlyPage'
import WeeklyPage from '@/pages/WeeklyPage'
import DailyPage from '@/pages/DailyPage'
import ReflectionPage from '@/pages/ReflectionPage'

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <AuthGuard>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/monthly" element={<MonthlyPage />} />
              <Route path="/weekly" element={<WeeklyPage />} />
              <Route path="/daily" element={<DailyPage />} />
              <Route path="/reflection" element={<ReflectionPage />} />
            </Route>
          </Routes>
        </AuthGuard>
      </BrowserRouter>
    </TooltipProvider>
  )
}

export default App
