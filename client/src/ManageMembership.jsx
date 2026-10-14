import { useEffect, useState } from 'react'

function ManageMembership() {
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [members, setMembers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const [loadingMembers, setLoadingMembers] = useState(false)

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/users'),
        ])
        const projectsData = await projectsRes.json()
        const usersData = await usersRes.json()
        if (projectsData.success) setProjects(projectsData.projects)
        if (usersData.success) setUsers(usersData.users)
      } catch (err) {
        console.error(err)
        setStatus({ type: 'error', message: 'Could not reach the server. Please try again later.' })
      }
    }
    loadInitialData()
  }, [])

  async function loadMembers(projectId) {
    if (!projectId) {
      setMembers([])
      return
    }
    setLoadingMembers(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`)
      const data = await res.json()
      if (data.success) {
        setMembers(data.members)
      } else {
        setStatus({ type: 'error', message: data.message || 'Could not load members.' })
      }
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Could not reach the server. Please try again later.' })
    } finally {
      setLoadingMembers(false)
    }
  }

  function handleProjectChange(e) {
    const projectId = e.target.value
    setSelectedProjectId(projectId)
    setStatus(null)
    loadMembers(projectId)
  }

  async function handleAddMember(e) {
    e.preventDefault()
    setStatus(null)

    if (!selectedProjectId) {
      setStatus({ type: 'error', message: 'Please select a project first.' })
      return
    }
    if (!selectedUserId) {
      setStatus({ type: 'error', message: 'Please select a user to add.' })
      return
    }

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUserId }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus({ type: 'success', message: data.message })
        setSelectedUserId('')
        loadMembers(selectedProjectId)
      } else {
        setStatus({ type: 'error', message: data.message || 'Could not add member.' })
      }
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Could not reach the server. Please try again later.' })
    }
  }

  async function handleRemoveMember(userId) {
    setStatus(null)
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/members/${userId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus({ type: 'success', message: data.message })
        loadMembers(selectedProjectId)
      } else {
        setStatus({ type: 'error', message: data.message || 'Could not remove member.' })
      }
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Could not reach the server. Please try again later.' })
    }
  }

  // All registered users are selectable (not just non-members) so that
  // attempting to add an existing member demonstrates the backend's
  // duplicate-membership validation, per the assignment's video requirements.
  const memberUserIds = new Set(members.map((m) => m.user_id))

  return (
    <div className="auth-card">
      <h2>Manage Project Membership</h2>

      <label htmlFor="membership-project">Select a Project</label>
      <select id="membership-project" value={selectedProjectId} onChange={handleProjectChange}>
        <option value="">-- Select a project --</option>
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>

      {status && <p className={`status-message ${status.type}`}>{status.message}</p>}

      {selectedProjectId && (
        <>
          <h3>Current Members</h3>
          {loadingMembers ? (
            <p>Loading members...</p>
          ) : members.length === 0 ? (
            <p>No members yet.</p>
          ) : (
            <ul className="project-list">
              {members.map((member) => (
                <li key={member.membershipId} className="project-list-item">
                  {member.f_name} {member.l_name} ({member.username})
                  {member.isLead && <strong> — Project Lead</strong>}
                  {!member.isLead && (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleRemoveMember(member.user_id)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddMember} noValidate>
            <label htmlFor="membership-user">Add a Registered User</label>
            <select
              id="membership-user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">-- Select a user --</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.f_name} {user.l_name} ({user.username})
                  {memberUserIds.has(user._id) ? ' — already a member' : ''}
                </option>
              ))}
            </select>
            <button type="submit">Add Member</button>
          </form>
        </>
      )}
    </div>
  )
}

export default ManageMembership
