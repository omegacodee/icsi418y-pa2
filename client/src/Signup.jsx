import { useState } from 'react'

function Signup({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    f_name: '',
    l_name: '',
    username: '',
    password: '',
  })
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)

    // Basic client-side check so the user gets instant feedback,
    // but the backend is the source of truth for validation.
    const { f_name, l_name, username, password } = formData
    if (!f_name || !l_name || !username || !password) {
      setStatus({ type: 'error', message: 'Please fill out all fields.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus({ type: 'success', message: data.message })
        setFormData({ f_name: '', l_name: '', username: '', password: '' })
      } else {
        setStatus({ type: 'error', message: data.message || 'Signup failed.' })
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
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="f_name">First Name</label>
        <input
          id="f_name"
          name="f_name"
          type="text"
          value={formData.f_name}
          onChange={handleChange}
        />

        <label htmlFor="l_name">Last Name</label>
        <input
          id="l_name"
          name="l_name"
          type="text"
          value={formData.l_name}
          onChange={handleChange}
        />

        <label htmlFor="signup-username">Username</label>
        <input
          id="signup-username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
        />

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
        />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      {status && (
        <p className={`status-message ${status.type}`}>{status.message}</p>
      )}

      <p className="switch-link">
        Already have an account?{' '}
        <button type="button" className="link-button" onClick={onSwitchToLogin}>
          Log In
        </button>
      </p>
    </div>
  )
}

export default Signup
