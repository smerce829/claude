import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/tokens.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// The splash is markup in index.html so it shows before any JS parses.
// Nothing waits on it — it is dismissed on the first painted frame.
requestAnimationFrame(() => {
  requestAnimationFrame(() => document.getElementById('splash')?.classList.add('gone'))
})

// The app has no server dependency, so offline is a requirement, not a bonus.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Unsupported or blocked. The app still runs; it just will not be offline.
    })
  })
}
