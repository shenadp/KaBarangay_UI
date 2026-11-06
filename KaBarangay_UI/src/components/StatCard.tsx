import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

type Props = {
  icon: LucideIcon
  label: string
  value: string | number
  /** Small caption under the value, e.g. "+38 this month". */
  hint?: string
  trend?: "up" | "down"
  tone?: "brand" | "neutral"
  className?: string
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  tone = "brand",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line-soft bg-surface p-4 shadow-card transition-shadow hover:shadow-raised",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-lg",
            tone === "brand" ? "bg-brand-soft text-brand" : "bg-canvas text-ink-muted",
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-medium",
              trend === "up" ? "text-success" : "text-danger",
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {hint}
          </span>
        )}
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight text-ink-strong tnum">{value}</p>
      <p className="mt-0.5 text-[13px] text-ink-muted">{label}</p>
      {!trend && hint && <p className="mt-2 text-xs text-ink-faint">{hint}</p>}
    </div>
  )
}
