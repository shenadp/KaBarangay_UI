import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand"

const toneClasses: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-destructive",
  info: "bg-info-soft text-info",
  neutral: "bg-canvas text-ink-muted ring-1 ring-inset ring-line-soft",
  brand: "bg-brand-soft text-brand",
}

const dotClasses: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  neutral: "bg-ink-faint",
  brand: "bg-brand",
}

/** Keyword lookup so any backend status string gets a sensible colour. */
export function statusTone(status: string): Tone {
  const s = status.toLowerCase()

  if (/(reject|failed|expired|revoked|suspend|deactivat|invalid|overdue)/.test(s)) return "danger"
  if (/(approv|published|active|verified|released|resolved|settled|complete|done|success|paid)/.test(s))
    return "success"
  if (/(pending|review|scheduled|draft|processing|progress|for release|submitted|awaiting)/.test(s))
    return "warning"
  if (/(open|new|escalat|urgent|dispute)/.test(s)) return "info"
  if (/(inactive|archived|closed|cancel|declined|revoked)/.test(s)) return "neutral"

  return "neutral"
}

type Props = {
  status: string
  tone?: Tone
  className?: string
  children?: ReactNode
}

export default function StatusBadge({ status, tone, className, children }: Props) {
  const resolved = tone ?? statusTone(status)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        toneClasses[resolved],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotClasses[resolved])} />
      {children ?? status}
    </span>
  )
}
