import { MessageSquare, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ContactItem } from "@/mock/admin/emergency"

/** The reference keeps the raw string but prints an 11-digit `09…` mobile in blocks. */
export function formatPhoneNumber(phone: string): string {
  return phone.length === 11 && phone.startsWith("09")
    ? `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`
    : phone
}

const chipByTheme = {
  hotline: "bg-brand-soft text-brand",
  service: "bg-destructive/10 text-destructive",
} as const

const phoneByTheme = {
  hotline: "text-brand",
  service: "text-destructive",
} as const

/**
 * One row of either directory. The columns are identical — the shared
 * half merely never receives the action callbacks, so it prints "Read-only".
 */
export default function ContactRow({
  contact,
  theme,
  onEdit,
  onDelete,
}: {
  contact: ContactItem
  theme: keyof typeof chipByTheme
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-soft bg-surface p-3.5 transition-colors hover:border-line sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink-strong">{contact.name}</p>

          {contact.subCategory && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${chipByTheme[theme]}`}
            >
              {contact.subCategory}
            </span>
          )}

          {/* A shared row is already filtered to active ones; this is the hotline flag. */}
          {!contact.isActive && (
            <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold tracking-wider text-ink-faint uppercase">
              Inactive
            </span>
          )}
        </div>

        {contact.label && <p className="text-xs text-ink-muted">{contact.label}</p>}
        {contact.coverageArea && (
          <p className="text-xs text-ink-muted">Coverage: {contact.coverageArea}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={`font-mono text-sm font-semibold tnum ${phoneByTheme[theme]}`}>
            {formatPhoneNumber(contact.phoneNumber)}
          </span>

          {/* The reference marks what the number accepts; the dialling itself is a resident action. */}
          <div className="flex items-center gap-2 text-[11px] text-ink-faint">
            {contact.canCall && (
              <span className="inline-flex items-center gap-1" title="Call action enabled">
                <Phone className="size-3" />
                Call
              </span>
            )}
            {contact.canSms && (
              <span className="inline-flex items-center gap-1" title="SMS action enabled">
                <MessageSquare className="size-3" />
                SMS
              </span>
            )}
          </div>
        </div>
      </div>

      {onEdit && onDelete ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-line-soft pt-2 sm:border-t-0 sm:pt-0">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      ) : (
        <span className="shrink-0 text-[11px] font-medium text-ink-faint uppercase">Read-only</span>
      )}
    </div>
  )
}
