import { useState } from 'react'
import './App.css'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header>
        <h1>MyApp</h1>
        <p>Velkommen til appen din</p>
      </header>
      <main>
        <div className="card">
          <button onClick={() => setCount(c => c + 1)}>
            Trykket {count} {count === 1 ? 'gang' : 'ganger'}
          </button>
          <p>Rediger <code>src/App.jsx</code> for å komme i gang.</p>
        </div>
      </main>
    </div>
  )
}
