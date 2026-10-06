import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Ustaw motyw przed renderowaniem (zapobiega migotaniu przy ciemnym trybie)
try {
  document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
} catch (e) { /* ignore */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
