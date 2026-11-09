import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type Segment = {
  label: string
  value: string
  count?: number
  icon?: LucideIcon
}

type Props = {
  segments: Segment[]
  value: string
  onChange: (value: string) => void
  className?: string
}

/** Minimal segmented control used for status filters and tabs. */
export default function SegmentedTabs({ segments, value, onChange, className }: Props) {
  return (
    <div
      className={cn(
        "scrollbar-slim inline-flex max-w-full flex-nowrap gap-1 overflow-x-auto rounded-lg border border-line-soft bg-canvas p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      role="tablist"
    >
      {segments.map((segment) => {
        const active = segment.value === value
        return (
          <button
            key={segment.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(segment.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-surface text-ink-strong shadow-card"
                : "text-ink-muted hover:text-ink-strong",
            )}
          >
            {segment.icon && <segment.icon className="size-3.5" />}
            {segment.label}
            {segment.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] leading-none tnum",
                  active ? "bg-brand-soft text-brand" : "bg-surface text-ink-faint",
                )}
              >
                {segment.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
