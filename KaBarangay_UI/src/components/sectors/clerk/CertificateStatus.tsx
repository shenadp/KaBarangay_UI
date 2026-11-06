import { X } from "lucide-react"

import StatusBadge, { type Tone } from "@/components/StatusBadge"
import { cn } from "@/lib/utils"
import type { CertificateStatus } from "@/mock/clerk/certificates"

/** The desk's status colours, mapped onto the kit tokens. */
const statusTone: Record<CertificateStatus, Tone> = {
  Pending: "warning",
  "Needs Action": "warning",
  "For Payment": "info",
  Processing: "info",
  "Ready for Claim": "brand",
  Released: "success",
  Rejected: "danger",
}

/** Issuances carry the constant `Issued` status instead of a workflow status. */
export function certificateStatusTone(status: string): Tone {
  if (status === "Issued") return "success"
  return statusTone[status as CertificateStatus] ?? "neutral"
}

export function CertificateStatusBadge({
  status,
  tone,
  className,
}: {
  status: string
  /** Overrides the status colour, e.g. the record-type chip on the All tab. */
  tone?: Tone
  className?: string
}) {
  return (
    <StatusBadge status={status} tone={tone ?? certificateStatusTone(status)} className={className} />
  )
}

export type CertificateFlashTone = "success" | "info" | "error"

export type CertificateFlash = { text: string; tone: CertificateFlashTone }

const flashClasses: Record<CertificateFlashTone, string> = {
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  // The kit has no danger-soft token, so failures sit on a neutral surface.
  error: "border border-line-soft bg-canvas text-destructive",
}

/** Action feedback for the workflow — the desk's version of a backend flash. */
export function CertificateFlashBanner({
  flash,
  onDismiss,
  className,
}: {
  flash: CertificateFlash
  onDismiss?: () => void
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium",
        flashClasses[flash.tone],
        className,
      )}
    >
      <span>{flash.text}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notice"
          className="opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
