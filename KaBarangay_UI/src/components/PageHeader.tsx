import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type Props = {
  title: string
  eyebrow?: string
  description?: string
  actions?: ReactNode
  className?: string
}

export default function PageHeader({ title, eyebrow, description, actions, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink-strong">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
