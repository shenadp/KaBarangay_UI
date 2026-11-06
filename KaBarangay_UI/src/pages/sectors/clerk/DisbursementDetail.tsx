import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Archive, ArrowLeft, Download, FileText, Globe } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import { Meta, Panel, PanelContent } from "@/components/Panel"
import type { Tone } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import DisbursementArchiveDialog from "@/components/sectors/clerk/DisbursementArchiveDialog"
import DisbursementPreview from "@/components/sectors/clerk/DisbursementPreview"
import {
  DisbursementFileChip,
  DisbursementNotice,
  DisbursementStatusPill,
} from "@/components/sectors/clerk/DisbursementIndicators"
import {
  clerkDisbursementStatus,
  clerkDisbursementStore,
  formatDisbursementDateTime,
  formatFileSize,
  type ClerkDisbursementDocument,
} from "@/mock/clerk/disbursements"

export default function ClerkDisbursementDetail() {
  const { id } = useParams()
  // Moving between two documents only changes the route param, so the previous
  // document's busy flag and flash would otherwise be carried over.
  return <DisbursementDetail key={id ?? "missing"} id={id} />
}

function DisbursementDetail({ id }: { id: string | undefined }) {
  const numericId = id === undefined ? Number.NaN : Number(id)
  const initial = Number.isInteger(numericId)
    ? clerkDisbursementStore.documentById(numericId)
    : undefined

  const [document, setDocument] = useState<ClerkDisbursementDocument | undefined>(initial)
  const [busy, setBusy] = useState<"publish" | "archive" | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; tone: Tone } | null>(null)

  if (!document) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Panel>
          <EmptyState
            icon={FileText}
            title="Disbursement document not found"
            description="This document is no longer on file. Pick another one from the disbursement list."
            action={
              <Button variant="outline" size="sm" className="h-9 bg-surface" asChild>
                <Link to="/clerk/disbursements">
                  <ArrowLeft className="size-4" /> Back to disbursement documents
                </Link>
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  const status = clerkDisbursementStatus(document)

  const downloadOriginal = () => {
    setFeedback({
      text: `${document.originalName} is simulated in this demo — only its name and size are on file, so there is nothing to download.`,
      tone: "info",
    })
  }

  const publishDocument = () => {
    setBusy("publish")
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      const outcome = clerkDisbursementStore.publish(document.id)
      setDocument(clerkDisbursementStore.documentById(document.id))
      setBusy(null)
      setFeedback({ text: outcome.message, tone: outcome.rejected ? "warning" : "success" })
    }, 450)
  }

  const confirmArchive = () => {
    setBusy("archive")
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      const outcome = clerkDisbursementStore.archive(document.id)
      setDocument(clerkDisbursementStore.documentById(document.id))
      setBusy(null)
      setArchiveOpen(false)
      setFeedback({ text: outcome.message, tone: outcome.rejected ? "warning" : "success" })
    }, 450)
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <Panel>
        <PanelContent className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DisbursementStatusPill status={status} />
                <DisbursementFileChip document={document} />
                <span className="text-xs text-ink-faint tnum">{formatFileSize(document.fileSize)}</span>
              </div>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight break-words text-ink-strong">
                {document.title}
              </h1>

              {document.description && (
                <p className="mt-2 max-w-3xl text-sm leading-relaxed whitespace-pre-wrap text-ink-muted">
                  {document.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" size="sm" className="h-9 bg-surface" onClick={downloadOriginal}>
                <Download className="size-4" /> Download original
              </Button>

              {status === "draft" && (
                <Button size="sm" className="h-9" disabled={busy !== null} onClick={publishDocument}>
                  <Globe className="size-4" /> {busy === "publish" ? "Publishing…" : "Publish"}
                </Button>
              )}

              {status !== "archived" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 bg-surface text-warning hover:text-warning"
                  disabled={busy !== null}
                  onClick={() => setArchiveOpen(true)}
                >
                  <Archive className="size-4" /> {busy === "archive" ? "Updating…" : "Archive"}
                </Button>
              )}
            </div>
          </div>

          <dl className="grid gap-4 border-t border-line-soft pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="Original file">
              <span className="break-words">{document.originalName}</span>
            </Meta>
            <Meta label="Uploaded">
              <span className="tnum">{formatDisbursementDateTime(document.uploadedAt)}</span>
            </Meta>
            <Meta label="Uploaded by">{document.uploadedBy || "Not available"}</Meta>
            <Meta label="Published">
              <span className="tnum">
                {document.publishedAt ? formatDisbursementDateTime(document.publishedAt) : "Not published"}
              </span>
            </Meta>
          </dl>

          {status === "draft" && (
            <DisbursementNotice
              className="rounded-lg border border-line-soft"
              tone="warning"
              text="This document is a draft and is not visible to residents until it is published."
            />
          )}

          {status === "archived" && (
            <DisbursementNotice
              className="rounded-lg border border-line-soft"
              tone="neutral"
              text={`Archived on ${formatDisbursementDateTime(document.archivedAt)}. Archived documents cannot be republished.`}
            />
          )}
        </PanelContent>
      </Panel>

      {feedback && (
        <DisbursementNotice
          className="rounded-xl border border-line-soft"
          text={feedback.text}
          tone={feedback.tone}
        />
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink-strong">Private preview</h2>
          <p className="text-xs text-ink-muted">Staff-only view of the uploaded original</p>
        </div>

        <DisbursementPreview document={document} onDownload={downloadOriginal} />
      </section>

      <DisbursementArchiveDialog
        document={archiveOpen ? document : null}
        busy={busy === "archive"}
        onConfirm={confirmArchive}
        onOpenChange={(open) => {
          if (!open) setArchiveOpen(false)
        }}
      />
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/clerk/disbursements"
      className="inline-flex h-9 items-center gap-1.5 text-sm font-medium text-brand hover:underline"
    >
      <ArrowLeft className="size-4" /> Back to disbursement documents
    </Link>
  )
}
