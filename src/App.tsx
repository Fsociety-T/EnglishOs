import { Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'
import LessonDetail from '@/pages/LessonDetail'
import Lessons from '@/pages/Lessons'
import NotFound from '@/pages/NotFound'
import PodcastDetail from '@/pages/PodcastDetail'
import Podcasts from '@/pages/Podcasts'
import Progress from '@/pages/Progress'
import SessionView from '@/pages/SessionView'
import Settings from '@/pages/Settings'
import Speak from '@/pages/Speak'
import Vocabulary from '@/pages/Vocabulary'
import Write from '@/pages/Write'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/write" element={<Write />} />
        <Route path="/speak" element={<Speak />} />
        <Route path="/session/:id" element={<SessionView />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/lessons/:id" element={<LessonDetail />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/podcasts" element={<Podcasts />} />
        <Route path="/podcasts/:id" element={<PodcastDetail />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
