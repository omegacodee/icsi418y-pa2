import { useEffect, useState } from 'react'

const STATUS_OPTIONS = ['Planning', 'Active', 'Completed']

function CreateProject() {
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Planning',
    project_lead_id: '',
  })
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/users')
        const data = await res.json()
        if (data.success) {
          setUsers(data.users)
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadUsers()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)

    const { name, description, status: projStatus, project_lead_id } = formData
    if (!name || !description || !projStatus || !project_lead_id) {
      setStatus({ type: 'error', message: 'Please fill out all fields, including a project lead.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus({ type: 'success', message: data.message })
        setFormData({ name: '', description: '', status: 'Planning', project_lead_id: '' })
      } else {
        setStatus({ type: 'error', message: data.message || 'Could not create project.' })
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
      <h2>Create Project</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="project-name">Name</label>
        <input
          id="project-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
        />

        <label htmlFor="project-description">Description</label>
        <textarea
          id="project-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />

        <label htmlFor="project-status">Status</label>
        <select
          id="project-status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <label htmlFor="project-lead">Project Lead</label>
        <select
          id="project-lead"
          name="project_lead_id"
          value={formData.project_lead_id}
          onChange={handleChange}
        >
          <option value="">-- Select a registered user --</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.f_name} {user.l_name} ({user.username})
            </option>
          ))}
        </select>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating project...' : 'Create Project'}
        </button>
      </form>

      {status && (
        <p className={`status-message ${status.type}`}>{status.message}</p>
      )}
    </div>
  )
}

export default CreateProject
