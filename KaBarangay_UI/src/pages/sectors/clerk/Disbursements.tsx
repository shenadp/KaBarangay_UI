import { useState, type FormEvent } from "react"
import { Archive, Files, Globe, PenLine, Plus, Upload } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import type { Tone } from "@/components/StatusBadge"
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { SearchInput, TablePagination, TableToolbar } from "@/components/TableTools"
import { Button } from "@/components/ui/button"
import DisbursementArchiveDialog from "@/components/sectors/clerk/DisbursementArchiveDialog"
import DisbursementCard from "@/components/sectors/clerk/DisbursementCard"
import { DisbursementNotice } from "@/components/sectors/clerk/DisbursementIndicators"
import DisbursementUploadDialog from "@/components/sectors/clerk/DisbursementUploadDialog"
import {
  clerkDisbursementStatus,
  clerkDisbursementStore,
  type ClerkDisbursementDocument,
  type ClerkDisbursementStats,
  type DisbursementUploadInput,
} from "@/mock/clerk/disbursements"

/** The backend pages at 15; this seed is smaller, so a second page stays reachable. */
const PAGE_SIZE = 15

const statusTabs = [
  { label: "All documents", value: "all" },
  { label: "Drafts", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
] as const

type Feedback = { text: string; tone: Tone }

export default function ClerkDisbursements() {
  const [documents, setDocuments] = useState<ClerkDisbursementDocument[]>(() =>
    clerkDisbursementStore.documents(),
  )
  const [stats, setStats] = useState<ClerkDisbursementStats>(() => clerkDisbursementStore.stats())
  const [tab, setTab] = useState<string>("all")
  const [query, setQuery] = useState("")
  /** The committed term — search applies on submit, the way the backend filter does. */
  const [term, setTerm] = useState("")
  const [page, setPage] = useState(1)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<ClerkDisbursementDocument | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const refresh = () => {
    setDocuments(clerkDisbursementStore.documents())
    setStats(clerkDisbursementStore.stats())
  }

  const filtered = documents.filter((document) => {
    if (tab !== "all" && clerkDisbursementStatus(document) !== tab) return false
    if (!term) return true
    const needle = term.toLowerCase()
    return (
      document.title.toLowerCase().includes(needle) ||
      document.originalName.toLowerCase().includes(needle)
    )
  })

  const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, lastPage)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    // The backend clips the search term at 100 characters.
    setTerm(query.trim().slice(0, 100))
    setPage(1)
  }

  const clearFilters = () => {
    setQuery("")
    setTerm("")
    setTab("all")
    setPage(1)
  }

  const openUpload = () => {
    setFeedback(null)
    setUploadOpen(true)
  }

  const handleUpload = (input: DisbursementUploadInput) => {
    setSubmitting(true)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      clerkDisbursementStore.upload(input)

      // A fresh draft would be invisible on the Published or Archived tab the
      // clerk may be sitting on, so the view follows the upload to the drafts.
      setTab("draft")
      setQuery("")
      setTerm("")
      setPage(1)
      refresh()
      setSubmitting(false)
      setUploadOpen(false)
      setFeedback({ text: "Disbursement document uploaded as a draft.", tone: "success" })
    }, 600)
  }

  const publishDocument = (document: ClerkDisbursementDocument) => {
    setActionId(document.id)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      const outcome = clerkDisbursementStore.publish(document.id)
      setActionId(null)
      refresh()
      setFeedback({ text: outcome.message, tone: outcome.rejected ? "warning" : "success" })
    }, 450)
  }

  const confirmArchive = () => {
    const target = archiveTarget
    if (!target) return

    setActionId(target.id)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      const outcome = clerkDisbursementStore.archive(target.id)
      setActionId(null)
      setArchiveTarget(null)
      refresh()
      setFeedback({ text: outcome.message, tone: outcome.rejected ? "warning" : "success" })
    }, 450)
  }

  const downloadDocument = (document: ClerkDisbursementDocument) => {
    setFeedback({
      text: `${document.originalName} is simulated in this demo — only its name and size are on file, so there is nothing to download.`,
      tone: "info",
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financial transparency"
        title="Disbursement Documents"
        description="Upload PDF and CSV records, review them privately, and publish selected documents to residents."
        actions={
          <Button size="sm" className="h-9" onClick={openUpload}>
            <Upload className="size-4" /> Upload document
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Files} label="All documents" value={stats.total} tone="neutral" />
        <StatCard
          icon={PenLine}
          label="Drafts"
          value={stats.draft}
          hint="Not visible to residents yet"
          tone="neutral"
        />
        <StatCard
          icon={Globe}
          label="Published"
          value={stats.published}
          hint="Live on the resident portal"
        />
        <StatCard
          icon={Archive}
          label="Archived"
          value={stats.archived}
          hint="Withdrawn — cannot be republished"
          tone="neutral"
        />
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Uploaded records</PanelTitle>
            <PanelDescription>Every document held by this office, newest first</PanelDescription>
          </div>
          <SegmentedTabs
            value={tab}
            onChange={(value) => {
              setTab(value)
              setPage(1)
            }}
            segments={statusTabs.map((entry) => ({
              label: entry.label,
              value: entry.value,
              count:
                entry.value === "all"
                  ? stats.total
                  : stats[entry.value as keyof Omit<ClerkDisbursementStats, "total">],
            }))}
          />
        </PanelHeader>

        <TableToolbar>
          <form onSubmit={submitSearch} className="flex w-full flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value)
                // Emptying the box also clears the applied term, so the list
                // never stays filtered behind a blank input.
                if (value === "") setTerm("")
              }}
              placeholder="Search by title or file name"
              className="w-full sm:max-w-xs"
            />
            <Button type="submit" variant="outline" size="sm" className="h-9 bg-surface">
              Search
            </Button>
            {(query !== "" || tab !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-ink-muted hover:text-ink-strong"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
            <p className="ml-auto text-xs text-ink-muted tnum">
              {filtered.length} of {documents.length} documents
            </p>
          </form>
        </TableToolbar>

        {feedback && (
          <DisbursementNotice
            text={feedback.text}
            tone={feedback.tone}
            className="border-b border-line-soft"
          />
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={Files}
            title="No disbursement documents found"
            description="Upload a PDF or CSV document, or adjust the current filters."
            action={
              <Button size="sm" className="mt-1" onClick={openUpload}>
                <Plus className="size-4" /> Upload document
              </Button>
            }
          />
        ) : (
          <>
            <div className="divide-y divide-line-soft">
              {visible.map((document) => (
                <DisbursementCard
                  key={document.id}
                  document={document}
                  busy={actionId === document.id}
                  onDownload={downloadDocument}
                  onPublish={publishDocument}
                  onArchive={setArchiveTarget}
                />
              ))}
            </div>
            {filtered.length > PAGE_SIZE && (
              <TablePagination
                page={safePage}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Panel>

      <DisbursementUploadDialog
        open={uploadOpen}
        submitting={submitting}
        onOpenChange={setUploadOpen}
        onUpload={handleUpload}
      />

      <DisbursementArchiveDialog
        document={archiveTarget}
        busy={actionId === archiveTarget?.id}
        onConfirm={confirmArchive}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null)
        }}
      />
    </div>
  )
}
