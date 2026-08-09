import {
  BookMarked,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Mic,
  Music,
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
  /**
   * Shown in the mobile bottom bar. The rest live in the drawer.
   *
   * Write and Speak are deliberately not primary. The dashboard already opens
   * with both as full-width buttons, so a tab for each spent two of five slots
   * duplicating what the first screen offers - and pushed Podcasts out of the
   * bar entirely. The bottom bar is for the places nothing else links to.
   */
  primary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, primary: true },
  { to: '/write', labelKey: 'nav.write', icon: PenLine },
  { to: '/speak', labelKey: 'nav.speak', icon: Mic },
  { to: '/lessons', labelKey: 'nav.lessons', icon: GraduationCap, primary: true },
  { to: '/vocabulary', labelKey: 'nav.vocabulary', icon: BookMarked, primary: true },
  { to: '/songs', labelKey: 'nav.songs', icon: Music },
  { to: '/podcasts', labelKey: 'nav.podcasts', icon: Headphones, primary: true },
  { to: '/progress', labelKey: 'nav.progress', icon: TrendingUp },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]

export const PRIMARY_NAV = NAV_ITEMS.filter((item) => item.primary)
