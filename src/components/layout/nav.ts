import {
  BookMarked,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Mic,
  PenLine,
  Settings,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Shown in the mobile bottom bar. The rest live in the drawer. */
  primary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, primary: true },
  { to: '/write', label: 'Write', icon: PenLine, primary: true },
  { to: '/speak', label: 'Speak', icon: Mic, primary: true },
  { to: '/lessons', label: 'Lessons', icon: GraduationCap, primary: true },
  { to: '/vocabulary', label: 'Words', icon: BookMarked, primary: true },
  { to: '/podcasts', label: 'Podcasts', icon: Headphones },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const PRIMARY_NAV = NAV_ITEMS.filter((item) => item.primary)
