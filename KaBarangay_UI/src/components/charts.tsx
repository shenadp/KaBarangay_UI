import { cn } from "@/lib/utils"

export type BarDatum = { label: string; value: number }

/**
 * Dependency-free column chart drawn with divs so the build ships no chart
 * library. Values are scaled against the tallest bar.
 */
export function BarChart({
  data,
  height = 180,
  className,
  accent = "bg-brand",
}: {
  data: BarDatum[]
  height?: number
  className?: string
  accent?: string
}) {
  const max = Math.max(...data.map((datum) => datum.value), 1)

  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      <div
        className="flex flex-1 items-end gap-3"
        style={{ minHeight: height }}
      >
        {data.map((datum) => (
          <div key={datum.label} className="flex h-full flex-1 flex-col justify-end gap-2">
            <span className="text-center text-[11px] font-medium text-ink tnum">
              {datum.value}
            </span>
            <div
              className={cn(
                "w-full rounded-t-md transition-all duration-500",
                datum.value === max ? accent : "bg-brand-muted",
              )}
              style={{ height: `${Math.max((datum.value / max) * 100, 4)}%` }}
              title={`${datum.label}: ${datum.value}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 border-t border-line-soft pt-2">
        {data.map((datum) => (
          <span key={datum.label} className="flex-1 text-center text-[11px] text-ink-muted">
            {datum.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Horizontal ranked bars — used for "requests by type" style breakdowns. */
export function BarList({
  data,
  className,
  suffix = "",
}: {
  data: BarDatum[]
  className?: string
  suffix?: string
}) {
  const max = Math.max(...data.map((datum) => datum.value), 1)

  return (
    <ul className={cn("space-y-3.5", className)}>
      {data.map((datum) => (
        <li key={datum.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[13px] text-ink">{datum.label}</span>
            <span className="text-[13px] font-medium text-ink-strong tnum">
              {datum.value}
              {suffix}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${(datum.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
