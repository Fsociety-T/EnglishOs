import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'

/*
 * Every chart here is single-series on purpose.
 *
 * Three score dimensions on one axis needed a 3-colour categorical palette,
 * and the closest pair failed both the colour-blind and the normal-vision
 * separation checks. Small multiples say the same thing with one hue, so the
 * problem disappears instead of being worked around.
 */

const AXIS_STYLE = { fill: 'var(--color-fg-faint)', fontSize: 11 }
const GRID_COLOR = 'rgb(255 255 255 / 0.06)'

interface TooltipPayloadEntry {
  value?: number | string
  payload?: Record<string, unknown>
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string | number
  unit?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl border border-white/15 bg-ink-850/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="text-fg-faint">{label}</p>
      <p className="mt-0.5 font-semibold text-fg">
        {payload[0].value}
        {unit && <span className="ml-1 font-normal text-fg-faint">{unit}</span>}
      </p>
    </div>
  )
}

export function ChartFrame({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="rounded-glass glass p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-fg">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-fg-faint">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/** Change over time, one measure. */
export function TrendArea({
  data,
  dataKey,
  unit,
  height = 220,
  color = 'var(--color-violet)',
}: {
  data: { label: string; [key: string]: string | number }[]
  dataKey: string
  unit?: string
  height?: number
  color?: string
}) {
  const gradientId = `grad-${dataKey}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          content={<ChartTooltip unit={unit} />}
          cursor={{ stroke: 'rgb(255 255 255 / 0.2)', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/**
 * Magnitude by category. One hue, stepped by value, so the darkest bar is the
 * biggest problem - the colour carries the same message as the length.
 */
export function MagnitudeBars({
  data,
  height = 260,
}: {
  data: { label: string; value: number }[]
  height?: number
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
        <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(255 255 255 / 0.05)' }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
          {data.map((entry) => (
            <Cell
              key={entry.label}
              fill="var(--color-violet)"
              fillOpacity={0.35 + (entry.value / max) * 0.65}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** A small single-measure line, used in a row of three. */
export function Sparkline({
  data,
  dataKey,
  title,
  latest,
}: {
  data: { label: string; [key: string]: string | number }[]
  dataKey: string
  title: string
  latest: number
}) {
  return (
    <div className="rounded-glass glass p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-fg-muted">{title}</span>
        <span className="text-lg font-bold text-fg">{latest}</span>
      </div>
      <div className="mt-2">
        <ResponsiveContainer width="100%" height={64}>
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-violet)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-violet)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<ChartTooltip />} cursor={false} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="var(--color-violet)"
              strokeWidth={2}
              fill={`url(#spark-${dataKey})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/**
 * Activity calendar. A sequential single-hue ramp built from opacity, which is
 * monotonic by construction - darker always means more.
 */
export function ActivityHeatmap({
  days,
  weeks = 18,
}: {
  days: Map<string, number>
  weeks?: number
}) {
  const today = new Date()
  // Start on the Sunday that begins the earliest visible week.
  const start = new Date(today)
  start.setDate(start.getDate() - (weeks * 7 - 1) - today.getDay())

  const max = Math.max(1, ...days.values())
  const columns: { date: Date; key: string; value: number }[][] = []

  for (let w = 0; w < weeks; w++) {
    const column: { date: Date; key: string; value: number }[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`
      column.push({ date, key, value: days.get(key) ?? 0 })
    }
    columns.push(column)
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {columns.map((column, i) => (
          <div key={i} className="flex flex-col gap-1">
            {column.map((cell) => {
              const future = cell.date > today
              const intensity = cell.value > 0 ? 0.2 + (cell.value / max) * 0.8 : 0
              return (
                <div
                  key={cell.key}
                  title={
                    future
                      ? ''
                      : `${cell.key}: ${cell.value} ${cell.value === 1 ? 'minute' : 'minutes'}`
                  }
                  className={cn(
                    'size-3 rounded-[3px]',
                    future ? 'opacity-0' : cell.value === 0 ? 'bg-white/5' : '',
                  )}
                  style={
                    !future && cell.value > 0
                      ? { backgroundColor: `color-mix(in oklab, var(--color-violet) ${intensity * 100}%, transparent)` }
                      : undefined
                  }
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-fg-faint">
        <span>Less</span>
        {[0, 0.3, 0.55, 0.8, 1].map((step) => (
          <span
            key={step}
            className="size-3 rounded-[3px] bg-white/5"
            style={
              step > 0
                ? { backgroundColor: `color-mix(in oklab, var(--color-violet) ${step * 100}%, transparent)` }
                : undefined
            }
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
