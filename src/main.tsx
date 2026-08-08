import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found in index.html')

// HashRouter, not BrowserRouter: GitHub Pages serves static files with no
// rewrite rule, so /lessons/42 would 404 on refresh. /#/lessons/42 always works.
createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
