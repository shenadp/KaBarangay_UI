import type { ReactNode } from "react"

import StatusBadge, { type Tone } from "@/components/StatusBadge"
import { cn } from "@/lib/utils"
import {
  clerkDisbursementStatusLabels,
  disbursementFileKind,
  type ClerkDisbursementDocument,
  type ClerkDisbursementStatus,
} from "@/mock/clerk/disbursements"

const statusTone: Record<ClerkDisbursementStatus, Tone> = {
  draft: "warning",
  published: "success",
  archived: "neutral",
}

/** The lifecycle pill the backend renders ahead of every document title. */
export function DisbursementStatusPill({
  status,
  className,
}: {
  status: ClerkDisbursementStatus
  className?: string
}) {
  return (
    <StatusBadge
      status={clerkDisbursementStatusLabels[status]}
      tone={statusTone[status]}
      className={className}
    />
  )
}

/** PDF / CSV / File marker — the backend derives it from the stored extension. */
export function DisbursementFileChip({ document }: { document: ClerkDisbursementDocument }) {
  return (
    <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink-muted uppercase ring-1 ring-line-soft ring-inset">
      {disbursementFileKind(document)}
    </span>
  )
}

const noticeTone: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  danger: "text-destructive",
  neutral: "bg-canvas text-ink-muted",
  brand: "bg-brand-soft text-brand",
}

/** Flash strip for the store's server-side messages. */
export function DisbursementNotice({
  text,
  tone = "success",
  className,
}: {
  text: string
  tone?: Tone
  className?: string
}) {
  return (
    <p className={cn("px-5 py-2.5 text-xs leading-relaxed", noticeTone[tone], className)}>{text}</p>
  )
}

/** Label/value pair used by the mock voucher sheet. */
export function DisbursementSheetField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium tracking-wider text-ink-faint uppercase">{label}</p>
      <p className="mt-0.5 truncate text-xs text-ink">{value}</p>
    </div>
  )
}
