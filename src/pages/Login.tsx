import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(err.message ?? 'Login failed')
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-header">
          <h1>RadiusOne</h1>
          <p>Login to Administration</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username / Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <p className="login-footer">© {new Date().getFullYear()} RadiusOne</p>
      </div>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }
        .login-card {
          width: 100%;
          max-width: 380px;
        }
        .login-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .login-header h1 {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .login-header p {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .login-error {
          color: var(--danger);
          font-size: 0.85rem;
          margin: 0.5rem 0 0 0;
        }
        .login-footer {
          text-align: center;
          margin: 1.5rem 0 0 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
