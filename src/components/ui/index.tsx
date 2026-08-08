import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const interactive = Boolean(onClick)
  return (
    <div
      className={cn(
        'rounded-glass glass p-5',
        interactive && 'cursor-pointer transition hover:bg-white/10 hover:border-white/15',
        className,
      )}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}

export function SectionHeading({
  title,
  action,
  subtitle,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-fg-faint">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'danger'

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
  className,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
  title?: string
}) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-neon text-ink-950 font-semibold hover:brightness-110 shadow-lg shadow-violet/20',
    ghost: 'text-fg-muted hover:text-fg hover:bg-white/5',
    outline: 'glass text-fg hover:bg-white/10',
    danger: 'bg-bad/15 text-bad border border-bad/30 hover:bg-bad/25',
  }
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Badge                                                                       */
/* -------------------------------------------------------------------------- */

type BadgeTone = 'neutral' | 'good' | 'bad' | 'warn' | 'info' | 'violet'

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-white/10 text-fg-muted border-white/10',
    good: 'bg-good/15 text-good border-good/25',
    bad: 'bg-bad/15 text-bad border-bad/25',
    warn: 'bg-warn/15 text-warn border-warn/25',
    info: 'bg-info/15 text-info border-info/25',
    violet: 'bg-violet/15 text-violet-soft border-violet/30',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* ProgressRing                                                                */
/* -------------------------------------------------------------------------- */

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
  sublabel,
}: {
  /** 0-100 */
  value: number
  size?: number
  stroke?: number
  label?: string
  sublabel?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference
  const gradientId = `ring-${size}-${stroke}`

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-violet)" />
            <stop offset="100%" stopColor="var(--color-cyan)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(255 255 255 / 0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-fg">{label ?? Math.round(clamped)}</span>
        {sublabel && <span className="text-[0.65rem] tracking-wide text-fg-faint uppercase">{sublabel}</span>}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* StatTile                                                                    */
/* -------------------------------------------------------------------------- */

export function StatTile({
  label,
  value,
  unit,
  icon,
  tone = 'violet',
}: {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  tone?: 'violet' | 'cyan' | 'good' | 'warn'
}) {
  const tones = {
    violet: 'text-violet-soft bg-violet/10',
    cyan: 'text-cyan-soft bg-cyan/10',
    good: 'text-good bg-good/10',
    warn: 'text-warn bg-warn/10',
  } as const

  return (
    <div className="rounded-glass glass p-4">
      <div className="flex items-center gap-2">
        {icon && (
          <span className={cn('grid size-8 place-items-center rounded-lg', tones[tone])}>{icon}</span>
        )}
        <span className="text-xs font-medium text-fg-faint">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-fg">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-fg-faint">{unit}</span>}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                        */
/* -------------------------------------------------------------------------- */

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl glass p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap',
            active === tab.id
              ? 'bg-neon text-ink-950'
              : 'text-fg-muted hover:bg-white/5 hover:text-fg',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn('ml-1.5 text-xs', active === tab.id ? 'opacity-70' : 'text-fg-faint')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* EmptyState / Skeleton / Spinner                                             */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-glass glass flex flex-col items-center px-6 py-14 text-center">
      {icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-violet/10 text-violet-soft">
          {icon}
        </span>
      )}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-fg-faint">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-white/5', className)} />
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <span className="size-8 animate-spin rounded-full border-2 border-white/10 border-t-violet" />
      {label && <p className="text-sm text-fg-faint">{label}</p>}
    </div>
  )
}
