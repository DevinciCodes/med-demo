// client/src/App.jsx
import { useEffect, useState } from 'react'

export default function App() {
  const [apiMsg, setApiMsg] = useState('loading...')

  useEffect(() => {
    fetch('/api/message')
      .then(r => r.json())
      .then(d => setApiMsg(d.message))
      .catch(() => setApiMsg('API not reachable'))
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Hello World (React)</h1>
      <p>Devin says Hello</p>
      <p>Backend says: <strong>{apiMsg}</strong></p>
    </div>
  )
}
