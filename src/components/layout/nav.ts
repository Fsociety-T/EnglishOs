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
import type { StringKey } from '@/i18n/strings'

export interface NavItem {
  to: string
  /** Translated at render time, so the menu follows the chosen language. */
  labelKey: StringKey
  icon: LucideIcon
  /** Shown in the mobile bottom bar. The rest live in the drawer. */
  primary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, primary: true },
  { to: '/write', labelKey: 'nav.write', icon: PenLine, primary: true },
  { to: '/speak', labelKey: 'nav.speak', icon: Mic, primary: true },
  { to: '/lessons', labelKey: 'nav.lessons', icon: GraduationCap, primary: true },
  { to: '/vocabulary', labelKey: 'nav.vocabulary', icon: BookMarked, primary: true },
  { to: '/podcasts', labelKey: 'nav.podcasts', icon: Headphones },
  { to: '/progress', labelKey: 'nav.progress', icon: TrendingUp },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]

export const PRIMARY_NAV = NAV_ITEMS.filter((item) => item.primary)
