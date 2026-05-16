import { useState } from 'react'
import { Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Account created! Check your email to confirm, then sign in.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#4f8ef7]/20 border border-[#4f8ef7]/30 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-[#4f8ef7]" />
          </div>
          <h1 className="text-xl font-semibold text-[#e8e8f0]">Daily Planner</h1>
          <p className="text-sm text-[#55556a] mt-1">Your productivity, synced everywhere</p>
        </div>

        {/* Card */}
        <div className="bg-[#141418] border border-[#1e1e2a] rounded-2xl p-6">
          <div className="flex gap-1 mb-6 bg-[#1a1a20] rounded-lg p-1">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-[#141418] text-[#e8e8f0]'
                  : 'text-[#55556a] hover:text-[#888898]'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
              className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-[#141418] text-[#e8e8f0]'
                  : 'text-[#55556a] hover:text-[#888898]'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-[#888898] block mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div>
              <label className="text-xs text-[#888898] block mb-1.5">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 mt-1"
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#55556a] mt-4">
          Your data is private and synced across all your devices.
        </p>
      </div>
    </div>
  )
}
