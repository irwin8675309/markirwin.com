import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

const root = document.getElementById('root')
if (!root) throw new Error('The app root was not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', window.location.href)
    void navigator.serviceWorker.register(swUrl, { scope: './' }).catch(() => {
      // The app still works online if service worker registration is blocked.
    })
  })
}