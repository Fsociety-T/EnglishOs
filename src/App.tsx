import { Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import LessonDetail from '@/pages/LessonDetail'
import Lessons from '@/pages/Lessons'
import LevelTest from '@/pages/LevelTest'
import NotFound from '@/pages/NotFound'
import PodcastDetail from '@/pages/PodcastDetail'
import Podcasts from '@/pages/Podcasts'
import Progress from '@/pages/Progress'
import SessionView from '@/pages/SessionView'
import Settings from '@/pages/Settings'
import SongDetail from '@/pages/SongDetail'
import Songs from '@/pages/Songs'
import Speak from '@/pages/Speak'
import Vocabulary from '@/pages/Vocabulary'
import Write from '@/pages/Write'

export default function App() {
  const { signedIn, loading } = useAuth()

  // Only ever true when the build has cloud credentials; local mode is instant.
  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner />
      </div>
    )
  }

  if (!signedIn) return <Auth />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/write" element={<Write />} />
        <Route path="/speak" element={<Speak />} />
        <Route path="/level" element={<LevelTest />} />
        <Route path="/session/:id" element={<SessionView />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/lessons/:id" element={<LessonDetail />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/songs" element={<Songs />} />
        <Route path="/songs/:id" element={<SongDetail />} />
        <Route path="/podcasts" element={<Podcasts />} />
        <Route path="/podcasts/:id" element={<PodcastDetail />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
