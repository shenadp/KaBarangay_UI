import { X } from "lucide-react"

import StatusBadge, { type Tone } from "@/components/StatusBadge"
import { cn } from "@/lib/utils"
import {
  charterServiceStatusLabel,
  charterVersionStatusLabel,
  type CharterFlash,
  type CharterFlashTone,
  type CharterServiceStatus,
  type CharterVersionStatus,
} from "@/mock/clerk/charter"

const serviceTone: Record<CharterServiceStatus, Tone> = {
  draft: "warning",
  published: "success",
  archived: "neutral",
}

const versionTone: Record<CharterVersionStatus, Tone> = {
  draft: "warning",
  published: "success",
  superseded: "neutral",
  archived: "neutral",
}

export function CharterServiceStatusBadge({ status }: { status: CharterServiceStatus }) {
  return <StatusBadge status={charterServiceStatusLabel(status)} tone={serviceTone[status]} />
}

export function CharterVersionStatusBadge({ status }: { status: CharterVersionStatus }) {
  return <StatusBadge status={charterVersionStatusLabel(status)} tone={versionTone[status]} />
}

const flashClasses: Record<CharterFlashTone, string> = {
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  // No danger-soft token exists in the kit, so error notices use a neutral surface.
  error: "border border-line-soft bg-canvas text-destructive",
}

/** Page-level flash notice — mirrors the backend's `flash.success` / `flash.error`. */
export function CharterFlashBanner({
  flash,
  onDismiss,
  className,
}: {
  flash: CharterFlash
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
