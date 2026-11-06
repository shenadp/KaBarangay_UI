/**
 * Resident portal — one published disbursement record.
 *
 * Mirrors `Resident/DisbursementShow` of commit b6030a08: the document header
 * with its original-file facts, the shared preview pane (embedded PDF or parsed
 * CSV under its truncation notice), and the closing invitation to contact the
 * office. A document the index would not list — a draft or an archived voucher —
 * is what the backend's 404 looks like here.
 */

import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, FileQuestion } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import { Panel, PanelContent } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import DisbursementPreview, {
  disbursementFileType,
} from "@/components/resident/DisbursementPreview"
import { formatDisbursementDateTime, formatFileSize } from "@/mock/clerk/disbursements"
import { disbursementCsvPreview, disbursementDocumentById } from "@/mock/resident/disbursement"

export default function DisbursementDetail() {
  const { id } = useParams()
  const documentId = Number(id)
  const document = Number.isInteger(documentId) ? disbursementDocumentById(documentId) : null

  const [notice, setNotice] = useState<string | null>(null)

  if (!document) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <BackLink />
        <Panel className="p-0">
          <EmptyState
            icon={FileQuestion}
            title="Disbursement document not found"
            description="This record is not published for your barangay, or it has been archived. Return to the list to open another document."
            action={
              <Button asChild variant="outline" size="sm" className="h-9 bg-surface">
                <Link to="/resident/disbursement">Back to disbursement documents</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  const csvPreview = disbursementCsvPreview(document)

  const simulate = (action: string) =>
    setNotice(
      `${action} — ${document.original_name} is simulated in this demo. Only its name, type and size are on file, so there is nothing to fetch.`,
    )

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <BackLink />

      <Panel className="p-0">
        <PanelContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-brand-muted bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-deep">
              {disbursementFileType(document)}
            </span>
            <span className="text-[11px] text-ink-faint tnum">
              {formatFileSize(document.file_size)}
            </span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight break-words text-ink-strong sm:text-2xl">
            {document.title}
          </h1>

          {document.description && (
            <p className="max-w-3xl text-sm leading-relaxed whitespace-pre-wrap text-ink-muted">
              {document.description}
            </p>
          )}

          <dl className="grid gap-3 border-t border-line-soft pt-4 text-xs sm:grid-cols-3">
            <div>
              <dt className="font-medium text-ink-faint">Original file</dt>
              <dd className="mt-1 break-words text-ink">{document.original_name}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-faint">Published</dt>
              <dd className="mt-1 text-ink tnum">
                {formatDisbursementDateTime(document.published_at)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink-faint">Format</dt>
              <dd className="mt-1 text-ink">{disbursementFileType(document)}</dd>
            </div>
          </dl>
        </PanelContent>
      </Panel>

      {notice && (
        <p
          role="status"
          className="rounded-xl border border-line-soft bg-canvas px-4 py-3 text-xs leading-relaxed text-ink-muted"
        >
          {notice}
        </p>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-ink-strong">Document preview</h2>
          <p className="text-[11px] text-ink-muted">Download the original for the complete file</p>
        </div>

        <DisbursementPreview document={document} csvPreview={csvPreview} onSelect={simulate} />
      </section>

      <p className="rounded-xl border border-line-soft bg-surface px-4 py-3 text-xs leading-relaxed text-ink-muted shadow-card">
        For questions about a disbursement record, please contact the barangay office and provide
        the document title.
      </p>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/resident/disbursement"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-brand"
    >
      <ArrowLeft className="size-3.5" /> Back to disbursement documents
    </Link>
  )
}

