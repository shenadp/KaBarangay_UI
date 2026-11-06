import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  FileQuestion,
  Globe,
  Hash,
  History,
  Pencil,
  UploadCloud,
  UserRound,
} from "lucide-react"

import EmptyState from "@/components/EmptyState"
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/Panel"
import { Button } from "@/components/ui/button"
import CharterConfirmDialog from "@/components/sectors/clerk/CharterConfirmDialog"
import CharterDocumentPreview from "@/components/sectors/clerk/CharterDocumentPreview"
import CharterEditForm from "@/components/sectors/clerk/CharterEditForm"
import CharterRevisionDialog from "@/components/sectors/clerk/CharterRevisionDialog"
import CharterVersionList from "@/components/sectors/clerk/CharterVersionList"
import {
  CharterFlashBanner,
  CharterServiceStatusBadge,
} from "@/components/sectors/clerk/CharterStatus"
import {
  charterCopy,
  charterServiceStatus,
  clerkCharterStore,
  currentCharterVersion,
  formatCharterDate,
  type CharterDetailsInput,
  type CharterFlash,
  type CharterUploadedFile,
} from "@/mock/clerk/charter"

export default function ClerkCitizenCharterDetail() {
  const { id } = useParams()
  const serviceId = Number(id)

  // Reads come straight from the shared store so a publish/revision made on the
  // list page is reflected here; `tick` forces a re-render after a mutation.
  const [, setTick] = useState(0)
  const service = clerkCharterStore.byId(serviceId)

  const [isEditing, setIsEditing] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [confirmKind, setConfirmKind] = useState<null | "publish" | "archive">(null)
  const [flash, setFlash] = useState<CharterFlash | null>(null)
  const [previewId, setPreviewId] = useState<number | undefined>(undefined)

  const refresh = () => setTick((value) => value + 1)

  if (!service) {
    return (
      <div className="space-y-6">
        <Link
          to="/clerk/citizen-charter"
          className="inline-flex h-9 items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          <ArrowLeft className="size-4" /> Citizen&apos;s Charter
        </Link>
        <Panel>
          <EmptyState
            icon={FileQuestion}
            title="Citizen's Charter service not found"
            description="This service may have been archived or removed. Return to the directory to pick another service."
            action={
              <Button asChild variant="outline" size="sm" className="h-8 bg-surface">
                <Link to="/clerk/citizen-charter">Back to directory</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  const status = charterServiceStatus(service)
  const current = currentCharterVersion(service)
  const isArchived = status === "archived"

  const previewVersion =
    service.versions.find((version) => version.id === previewId) ?? current ?? service.versions[0]

  const handleSaveDetails = (values: CharterDetailsInput) => {
    setFlash(clerkCharterStore.updateDetails(service.id, values))
    setIsEditing(false)
    refresh()
  }

  const handleRevision = (file: CharterUploadedFile) => {
    setFlash(clerkCharterStore.addRevision(service.id, file))
    refresh()
  }

  const runPublish = () => {
    setFlash(clerkCharterStore.publish(service.id))
    setConfirmKind(null)
    refresh()
  }

  const runArchive = () => {
    setFlash(clerkCharterStore.archive(service.id))
    setConfirmKind(null)
    setIsEditing(false)
    refresh()
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ink-muted">
        <Link to="/clerk/citizen-charter" className="transition-colors hover:text-brand">
          Citizen&apos;s Charter
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-ink-strong">{service.title}</span>
      </nav>

      {flash && <CharterFlashBanner flash={flash} onDismiss={() => setFlash(null)} />}

      {/* Header card */}
      <Panel>
        <PanelContent className="py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CharterServiceStatusBadge status={status} />
                {service.category && (
                  <span className="inline-flex rounded-full bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-ink ring-1 ring-inset ring-line-soft">
                    {service.category}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-ink-faint tnum">
                  <Hash className="size-3" /> Display Order: {service.display_order}
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-ink-strong">
                {service.title}
              </h1>

              {service.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
                  {service.description}
                </p>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 text-ink-muted">
                  <CalendarDays className="size-3.5 text-brand" /> Created:{" "}
                  <span className="font-medium text-ink tnum">{formatCharterDate(service.created_at)}</span>
                </span>
                {service.published_at && (
                  <span className="inline-flex items-center gap-1.5 text-ink-muted">
                    <Globe className="size-3.5 text-brand" /> Published:{" "}
                    <span className="font-medium text-ink tnum">{formatCharterDate(service.published_at)}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-ink-muted">
                  <UserRound className="size-3.5 text-brand" /> Encoded By:{" "}
                  <span className="font-medium text-ink">{service.created_by_name}</span>
                </span>
              </div>
            </div>

            {!isArchived && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 bg-surface"
                  onClick={() => setIsEditing((value) => !value)}
                >
                  <Pencil className="size-4" /> {isEditing ? "Cancel Edit" : "Edit Details"}
                </Button>
                <Button variant="secondary" size="sm" className="h-9" onClick={() => setRevisionOpen(true)}>
                  <UploadCloud className="size-4" /> Upload Revision
                </Button>
                <Button size="sm" className="h-9" onClick={() => setConfirmKind("publish")}>
                  <Globe className="size-4" /> {service.is_published ? "Re-Publish" : "Publish Live"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 bg-surface text-destructive"
                  onClick={() => setConfirmKind("archive")}
                >
                  <Archive className="size-4" /> Archive
                </Button>
              </div>
            )}
          </div>

          {isEditing && !isArchived && (
            <CharterEditForm
              service={service}
              onSave={handleSaveDetails}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </PanelContent>
      </Panel>

      {/* Preview + version history */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CharterDocumentPreview serviceTitle={service.title} version={previewVersion} />
        </div>

        <div className="lg:col-span-1">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle className="flex items-center gap-2">
                  <History className="size-4 text-brand" /> Version History ({service.versions.length})
                </PanelTitle>
                <PanelDescription>Select a revision to preview it</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent>
              {service.versions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line-soft px-3 py-6 text-center text-xs text-ink-muted">
                  No document revisions yet.
                </p>
              ) : (
                <div className="max-h-[560px] overflow-y-auto pr-1">
                  <CharterVersionList
                    versions={service.versions}
                    currentVersionId={current?.id}
                    isPublished={service.is_published}
                    selectedId={previewVersion?.id}
                    onSelect={(version) => setPreviewId(version.id)}
                  />
                </div>
              )}
            </PanelContent>
          </Panel>
        </div>
      </div>

      <CharterRevisionDialog
        open={revisionOpen}
        onOpenChange={setRevisionOpen}
        onSubmit={handleRevision}
      />

      <CharterConfirmDialog
        open={confirmKind === "publish"}
        title="Publish this service?"
        description={charterCopy.confirmPublish}
        confirmLabel="Publish Live"
        onConfirm={runPublish}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null)
        }}
      />

      <CharterConfirmDialog
        open={confirmKind === "archive"}
        title="Archive this service?"
        description={charterCopy.confirmArchive}
        confirmLabel="Archive"
        onConfirm={runArchive}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null)
        }}
      />
    </div>
  )
}
