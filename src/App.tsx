import { Route, Routes } from 'react-router-dom'
import BootScreen from './pages/BootScreen'

/**
 * Phase 0 only proves the pipeline: React + Router + Tailwind rendering on
 * GitHub Pages. The real app shell and routes land in Phase 1.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BootScreen />} />
      <Route path="*" element={<BootScreen />} />
    </Routes>
  )
}
