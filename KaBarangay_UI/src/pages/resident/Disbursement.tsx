/**
 * Resident portal — published disbursement documents.
 *
 * Mirrors `Resident/Disbursement` of commit b6030a08: a transparency hero, the
 * count of published records, one row per document with its file kind, size,
 * publish date and original filename, and a twelve-per-page window. The query has
 * no filters at all — it only ever narrows to documents that are published and
 * not archived, newest publication first. Downloads are simulated here, as they
 * are across this demo: no bytes are served.
 */

import { useState } from "react"
import { Link } from "react-router-dom"
import { Download, FileText } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import { Panel } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { TablePagination } from "@/components/TableTools"
import { disbursementFileType } from "@/components/resident/DisbursementPreview"
import { formatDisbursementDate, formatFileSize } from "@/mock/clerk/disbursements"
import {
  DISBURSEMENT_DOCUMENTS_PER_PAGE,
  disbursementDocumentsPage,
  type ResidentDisbursementDocument,
} from "@/mock/resident/disbursement"
import { sessionResident } from "@/mock/resident/session"

export default function Disbursement() {
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)

  const documents = disbursementDocumentsPage(page)
  const resident = sessionResident()

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <section className="overflow-hidden rounded-xl border border-brand-muted bg-brand p-5 text-white shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Barangay transparency
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
          Disbursement Documents
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
          View official payout records and financial documents published by your barangay.
        </p>
        <p className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs text-white/85">
          For {resident.fullName}
        </p>
      </section>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-ink-strong">
            Published documents
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted tnum">
            {documents.total} {documents.total === 1 ? "document" : "documents"} available
          </p>
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-xl border border-line-soft bg-canvas px-4 py-3 text-xs leading-relaxed text-ink-muted"
        >
          {notice}
        </p>
      )}

      {documents.data.length === 0 ? (
        <Panel className="p-0">
          <EmptyState
            icon={FileText}
            title="No disbursement documents yet"
            description="Published payout records will appear here. Please check again later or contact the barangay office for assistance."
          />
        </Panel>
      ) : (
        <section className="grid gap-3">
          {documents.data.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              onDownload={() =>
                setNotice(
                  `${document.original_name} is simulated in this demo — only its name and size are on file, so there is nothing to download.`,
                )
              }
            />
          ))}
        </section>
      )}

      {documents.last_page > 1 && (
        <TablePagination
          page={documents.current_page}
          pageSize={DISBURSEMENT_DOCUMENTS_PER_PAGE}
          total={documents.total}
          onPageChange={setPage}
          className="rounded-xl border border-line-soft bg-surface"
        />
      )}
    </div>
  )
}

function DocumentRow({
  document,
  onDownload,
}: {
  document: ResidentDisbursementDocument
  onDownload: () => void
}) {
  return (
    <article className="rounded-xl border border-line-soft bg-surface p-4 shadow-card transition-colors hover:border-brand-muted sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-brand-muted bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-deep">
              {disbursementFileType(document)}
            </span>

            <span className="text-[11px] text-ink-faint tnum">
              {formatFileSize(document.file_size)}
            </span>

            {document.published_at && (
              <span className="text-[11px] text-ink-faint">
                Published {formatDisbursementDate(document.published_at)}
              </span>
            )}
          </div>

          <h3 className="mt-2 text-sm font-semibold break-words text-ink-strong sm:text-base">
            {document.title}
          </h3>

          {document.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">
              {document.description}
            </p>
          )}

          <p className="mt-2 truncate text-[11px] text-ink-faint">{document.original_name}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild size="sm" className="h-10">
            <Link to={document.preview_url}>View document</Link>
          </Button>
          <Button variant="outline" size="sm" className="h-10 bg-surface" onClick={onDownload}>
            <Download className="size-4" /> Download
          </Button>
        </div>
      </div>
    </article>
  )
}
