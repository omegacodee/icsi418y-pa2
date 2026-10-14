import { useState } from 'react'
import CreateProject from './CreateProject'
import ViewProjects from './ViewProjects'
import ManageMembership from './ManageMembership'

const TABS = [
  { key: 'create', label: 'Create Project' },
  { key: 'view', label: 'View Projects' },
  { key: 'membership', label: 'Manage Membership' },
]

function Dashboard({ currentUser, onLogout }) {
  const [tab, setTab] = useState('create')

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <p>
          Logged in as <strong>{currentUser?.username}</strong>
        </p>
        <button type="button" className="link-button" onClick={onLogout}>
          Log Out
        </button>
      </div>

      <nav className="dashboard-nav">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? 'nav-button active' : 'nav-button'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'create' && <CreateProject />}
      {tab === 'view' && <ViewProjects />}
      {tab === 'membership' && <ManageMembership />}
    </div>
  )
}

export default Dashboard
