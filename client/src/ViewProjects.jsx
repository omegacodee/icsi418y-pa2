import { useEffect, useState } from 'react'

function ViewProjects() {
  const [projects, setProjects] = useState([])
  const [status, setStatus] = useState(null) // { type: 'error', message: string }
  const [loading, setLoading] = useState(true)

  async function loadProjects() {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.success) {
        setProjects(data.projects)
      } else {
        setStatus({ type: 'error', message: data.message || 'Could not load projects.' })
      }
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Could not reach the server. Please try again later.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  return (
    <div className="auth-card">
      <h2>Projects</h2>
      <button type="button" onClick={loadProjects} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>

      {status && <p className={`status-message ${status.type}`}>{status.message}</p>}

      {!loading && projects.length === 0 && !status && (
        <p>No projects have been created yet.</p>
      )}

      <ul className="project-list">
        {projects.map((project) => (
          <li key={project._id} className="project-list-item">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <p>
              <strong>Status:</strong> {project.status}
            </p>
            <p>
              <strong>Project Lead:</strong>{' '}
              {project.project_lead
                ? `${project.project_lead.f_name} ${project.project_lead.l_name} (${project.project_lead.username})`
                : 'Unknown'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ViewProjects
