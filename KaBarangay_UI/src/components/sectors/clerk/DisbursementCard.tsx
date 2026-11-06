import { Link } from "react-router-dom"
import { Archive, Download, Eye, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  formatDisbursementDate,
  formatFileSize,
  clerkDisbursementStatus,
  type ClerkDisbursementDocument,
} from "@/mock/clerk/disbursements"
import { DisbursementFileChip, DisbursementStatusPill } from "./DisbursementIndicators"

type Props = {
  document: ClerkDisbursementDocument
  /** Only one card may be in flight, mirroring the backend's per-row busy state. */
  busy: boolean
  onDownload: (document: ClerkDisbursementDocument) => void
  onPublish: (document: ClerkDisbursementDocument) => void
  onArchive: (document: ClerkDisbursementDocument) => void
}

/**
 * List row for the clerk's disbursement desk. The backend renders documents as
 * cards rather than table rows, because each one carries a file name, an upload
 * trail and up to four actions.
 */
export default function DisbursementCard({ document, busy, onDownload, onPublish, onArchive }: Props) {
  const status = clerkDisbursementStatus(document)

  return (
    <article className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <DisbursementStatusPill status={status} />
          <DisbursementFileChip document={document} />
          <span className="text-[11px] text-ink-faint tnum">{formatFileSize(document.fileSize)}</span>
        </div>

        <h3 className="mt-2 truncate text-sm font-semibold text-ink-strong">
          <Link
            to={`/clerk/disbursements/${document.id}`}
            className="transition-colors hover:text-brand"
          >
            {document.title}
          </Link>
        </h3>

        {document.description && (
          <p className="mt-1 line-clamp-2 max-w-3xl text-xs leading-relaxed text-ink-muted">
            {document.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
          <span className="max-w-full truncate text-ink-faint">{document.originalName}</span>
          <span className="tnum">Uploaded {formatDisbursementDate(document.uploadedAt)}</span>
          <span>By {document.uploadedBy}</span>
          {document.publishedAt && (
            <span className="tnum">Published {formatDisbursementDate(document.publishedAt)}</span>
          )}
          {document.archivedAt && (
            <span className="tnum">Archived {formatDisbursementDate(document.archivedAt)}</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="h-8 bg-surface">
          <Link to={`/clerk/disbursements/${document.id}`}>
            <Eye className="size-4" /> Preview
          </Link>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 bg-surface"
          onClick={() => onDownload(document)}
        >
          <Download className="size-4" /> Download
        </Button>

        {status === "draft" && (
          <Button size="sm" className="h-8" disabled={busy} onClick={() => onPublish(document)}>
            <Globe className="size-4" /> {busy ? "Publishing…" : "Publish"}
          </Button>
        )}

        {status !== "archived" && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-surface text-warning hover:text-warning"
            disabled={busy}
            onClick={() => onArchive(document)}
          >
            <Archive className="size-4" /> {busy ? "Updating…" : "Archive"}
          </Button>
        )}
      </div>
    </article>
  )
}
