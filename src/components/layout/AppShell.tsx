import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStreak } from '@/hooks/useStreak'
import { NAV_ITEMS, PRIMARY_NAV } from './nav'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-neon text-base font-extrabold text-ink-950">
        E
      </span>
      <span className="text-lg font-bold tracking-tight">
        <span className="text-gradient">English</span>
        <span className="text-fg">OS</span>
      </span>
    </div>
  )
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-violet/15 text-fg shadow-[inset_0_0_0_1px_rgb(139_92_246/0.3)]'
                : 'text-fg-muted hover:bg-white/5 hover:text-fg',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn('size-[18px]', isActive && 'text-violet-soft')} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function StreakPill() {
  const { current } = useStreak()
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-sm font-semibold"
      title={`${current}-day practice streak`}
    >
      <Flame className={cn('size-4', current > 0 ? 'text-warn' : 'text-fg-faint')} />
      <span className={current > 0 ? 'text-fg' : 'text-fg-faint'}>{current}</span>
    </span>
  )
}

export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  // Close the drawer on navigation, and scroll the new page to the top.
  useEffect(() => {
    setDrawerOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 border-r border-white/10 p-5 lg:flex">
        <Logo />
        <NavItems />
        <p className="mt-auto text-xs leading-relaxed text-fg-faint">
          Practice, get corrected, and turn your mistakes into lessons.
        </p>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col gap-8 bg-ink-850 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-fg-muted hover:bg-white/5 hover:text-fg"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-ink-900/70 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-1.5 text-fg-muted hover:bg-white/5 hover:text-fg lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
          </div>
          <StreakPill />
        </header>

        {/* pb-24 on mobile keeps the bottom tab bar from covering content. */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 lg:px-8 lg:pb-10">
          {/* Keyed on the path so each screen fades in rather than snapping. */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-ink-900/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium transition',
                isActive ? 'text-violet-soft' : 'text-fg-faint',
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
