import type { ComponentProps, ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** White surface with a soft hairline border — the base panel of the whole system. */
export function Panel({ className, ...props }: ComponentProps<typeof Card>) {
  return <Card className={cn("gap-0 overflow-hidden py-0", className)} {...props} />
}

export function PanelHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4",
        className,
      )}
      {...props}
    />
  )
}

export function PanelTitle({ className, children, ...props }: ComponentProps<"h2">) {
  return (
    <h2 className={cn("text-sm font-semibold tracking-tight text-ink-strong", className)} {...props}>
      {children}
    </h2>
  )
}

export function PanelDescription({ className, children, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("mt-0.5 text-xs text-ink-muted", className)} {...props}>
      {children}
    </p>
  )
}

export function PanelContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex-1 p-5", className)} {...props} />
}

export function PanelFooter({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 border-t border-line-soft px-5 py-3", className)}
      {...props}
    >
      {children}
    </div>
  )
}

/** Small inline label used above values inside panels. */
export function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">{label}</p>
      <div className="mt-1 text-sm text-ink">{children}</div>
    </div>
  )
}
