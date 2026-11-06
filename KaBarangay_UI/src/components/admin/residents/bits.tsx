/**
 * Small building blocks shared by the Residents surfaces.
 *
 * The residents page is one page with six tabs, a review dialog and four
 * record-level dialogs, so the repeated pieces — sector chips, the private
 * document list, the purok filter, the read-only info grid — live here instead
 * of being re-typed in every file.
 */

import { useState, type ReactNode } from "react"
import { FileImage, FileText } from "lucide-react"

import StatusBadge, { type Tone } from "@/components/StatusBadge"
import { Meta } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { purokName, type AdminPurok, type RegistrationDocument, type AdminSector } from "@/mock/admin/residents"
import { formatIsoDate } from "@/mock/sectors"

/** Queue dates arrive as `Y-m-d`; the desk renders `Oct 28, 2026`. */
export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return formatIsoDate(iso.slice(0, 10))
}

/** The backend shows the stored MIME size; nothing is ever downloaded here. */
export function formatDocumentSize(bytes: number | null): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const sectorChip: Record<string, { label: string; tone: Tone }> = {
  senior: { label: "Senior", tone: "success" },
  pwd: { label: "PWD", tone: "info" },
}

export function SectorChips({ sectors }: { sectors: AdminSector[] }) {
  if (sectors.length === 0) return <span className="text-xs text-ink-faint">—</span>

  return (
    <div className="flex flex-wrap gap-1.5">
      {sectors.map((sector) => {
        const known = sectorChip[sector.slug]
        return (
          <StatusBadge
            key={sector.id}
            status={known ? known.label : sector.name}
            tone={known?.tone ?? "neutral"}
          />
        )
      })}
    </div>
  )
}

const documentTone: Record<RegistrationDocument["verificationStatus"], Tone> = {
  Verified: "success",
  Pending: "warning",
  Rejected: "danger",
}

/**
 * Identity documents stay on the shelf — the desk gets the metadata and a
 * preview surface, never the bytes. The lightbox mirrors the reference's
 * "View Full Image" step so the reviewer sees the same affordance.
 */
export function RegistrationDocuments({ documents }: { documents: RegistrationDocument[] }) {
  const [preview, setPreview] = useState<RegistrationDocument | null>(null)

  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-line-soft bg-canvas/60 px-3.5 py-3 text-sm text-ink-muted">
        No registration documents found.
      </p>
    )
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {documents.map((document) => (
          <div
            key={document.id}
            className="overflow-hidden rounded-xl border border-line-soft bg-surface"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line-soft bg-canvas/60 px-3.5 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink-strong">{document.label}</p>
                <p className="mt-0.5 text-[11px] text-ink-faint tnum">
                  {document.mimeType ?? "Document"}
                  {document.fileSize ? ` • ${formatDocumentSize(document.fileSize)}` : ""}
                </p>
                {document.isSuperseded && (
                  <p className="mt-1 text-[11px] font-medium text-warning">Superseded</p>
                )}
              </div>
              <StatusBadge
                status={document.verificationStatus}
                tone={documentTone[document.verificationStatus]}
              />
            </div>

            <div className="flex h-40 items-center justify-center bg-canvas/40 px-4 text-center">
              {document.isImage ? (
                <span className="flex flex-col items-center gap-2 text-ink-faint">
                  <FileImage className="size-8" />
                  <span className="text-xs">Image preview</span>
                </span>
              ) : (
                <div>
                  <p className="text-sm font-medium text-ink-muted">Document preview</p>
                  <p className="mt-1 text-xs text-ink-faint">Open the file to review it securely.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end px-3.5 py-3">
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="bg-surface"
                onClick={() => setPreview(document)}
              >
                {document.isImage ? "View Full Image" : "Open Document"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{preview?.label}</DialogTitle>
            <DialogDescription>
              {preview?.mimeType ?? "Document"}
              {preview?.fileSize ? ` • ${formatDocumentSize(preview.fileSize)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex h-64 items-center justify-center rounded-lg border border-line-soft bg-canvas/60">
            <span className="flex flex-col items-center gap-2 text-ink-faint">
              {preview?.isImage ? (
                <FileImage className="size-12" />
              ) : (
                <FileText className="size-12" />
              )}
              <span className="text-xs">
                The stored file opens from the document store once the portal is connected.
              </span>
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function InfoGrid({ items, columns = 2 }: { items: Array<{ label: string; value: ReactNode }>; columns?: 2 | 3 }) {
  return (
    <div className={cn("grid gap-4", columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
      {items.map((item) => (
        <Meta key={item.label} label={item.label}>
          <span className={cn(item.value === "—" && "text-ink-faint")}>{item.value}</span>
        </Meta>
      ))}
    </div>
  )
}

type PurokWithCounts = AdminPurok & { resident_count: number; household_count: number }

/** The chip row under the header — one filter shared by every tab. */
export function PurokFilterChips({
  puroks,
  selected,
  onSelect,
}: {
  puroks: PurokWithCounts[]
  selected: number | null
  onSelect: (purokId: number | null) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Filter by Purok</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
            selected === null
              ? "border-brand bg-brand text-white hover:bg-brand/90"
              : "border-line-soft bg-surface text-ink-muted hover:text-ink-strong",
          )}
        >
          All Puroks
        </button>
        {puroks.map((purok) => (
          <button
            key={purok.id}
            type="button"
            onClick={() => onSelect(purok.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              selected === purok.id
                ? "border-brand bg-brand text-white hover:bg-brand/90"
                : "border-line-soft bg-surface text-ink-muted hover:text-ink-strong",
            )}
          >
            {purok.name}
            <span className="ml-1 tnum opacity-70">
              ({purok.resident_count} residents, {purok.household_count} households)
            </span>
          </button>
        ))}
        {puroks.length === 0 && (
          <span className="text-xs text-ink-faint">No puroks are configured for this barangay.</span>
        )}
      </div>
    </div>
  )
}

/** Purok label used everywhere a registration or resident is listed. */
export const purokLabel = (purokId: number | null): string =>
  purokId === null ? "—" : purokName(purokId)
