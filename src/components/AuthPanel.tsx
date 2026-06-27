import { useState } from 'react'
import { signInWithEmail, signUpWithEmail } from '../lib/supabaseData'

interface AuthPanelProps {
  onAuthenticated?: () => void
}

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      if (mode === 'sign-in') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
      }

      onAuthenticated?.()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card auth-card">
      <h3>{mode === 'sign-in' ? 'Sign in to sync' : 'Create account'}</h3>
      <p className="subtle">You can still use the app without signing in.</p>
      <form onSubmit={handleSubmit} className="stack-form">
        <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
        <button type="submit" className="coach-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <button type="button" className="text-button" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
        {mode === 'sign-in' ? 'Need an account?' : 'Already have an account?'}
      </button>
      {message ? <p className="subtle">{message}</p> : null}
    </div>
  )
}
