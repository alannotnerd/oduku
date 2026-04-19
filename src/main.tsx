import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installGestureLockdown } from './lib/gestureLockdown'

// Traces to: SPEC-003, SPEC-005. Install before React mounts so the listener
// is active even during first paint.
installGestureLockdown()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
