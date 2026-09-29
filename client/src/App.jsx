import { useState } from 'react'
import Login from './Login'
import Signup from './Signup'
import './App.css'

function App() {
  const [view, setView] = useState('login') // 'login' | 'signup'

  return (
    <div className="app-shell">
      {view === 'login' ? (
        <Login onSwitchToSignup={() => setView('signup')} />
      ) : (
        <Signup onSwitchToLogin={() => setView('login')} />
      )}
    </div>
  )
}

export default App
