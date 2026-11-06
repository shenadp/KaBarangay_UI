import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type Props = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-canvas text-ink-faint">
        <Icon className="size-5" />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="text-sm font-semibold text-ink-strong">{title}</p>
        {description && <p className="text-xs leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
