import { useState } from 'react'

function Login({ onSwitchToSignup }) {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)

    const { username, password } = formData
    if (!username || !password) {
      setStatus({ type: 'error', message: 'Please enter both username and password.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus({ type: 'success', message: data.message })
      } else {
        setStatus({ type: 'error', message: data.message || 'Login failed.' })
      }
    } catch (err) {
      console.error(err)
      setStatus({
        type: 'error',
        message: 'Could not reach the server. Please try again later.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-card">
      <h1>Log In</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="login-username">Username</label>
        <input
          id="login-username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
        />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      {status && (
        <p className={`status-message ${status.type}`}>{status.message}</p>
      )}

      <p className="switch-link">
        Don&apos;t have an account?{' '}
        <button type="button" className="link-button" onClick={onSwitchToSignup}>
          Sign Up
        </button>
      </p>
    </div>
  )
}

export default Login
