import { useState } from 'react'
import Login from './Login'
import Signup from './Signup'
import Dashboard from './Dashboard'
import './App.css'

function App() {
  const [view, setView] = useState('login') // 'login' | 'signup' | 'dashboard'
  const [currentUser, setCurrentUser] = useState(null)

  function handleLoginSuccess(user) {
    setCurrentUser(user)
    setView('dashboard')
  }

  function handleLogout() {
    setCurrentUser(null)
    setView('login')
  }

  return (
    <div className="app-shell">
      {view === 'login' && (
        <Login
          onSwitchToSignup={() => setView('signup')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {view === 'signup' && <Signup onSwitchToLogin={() => setView('login')} />}
      {view === 'dashboard' && (
        <Dashboard currentUser={currentUser} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
