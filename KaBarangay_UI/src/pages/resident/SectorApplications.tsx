/**
 * Resident portal — sector memberships and self-service applications.
 *
 * `Resident\SectorApplicationController::index()` renders
 * `resources/js/pages/Resident/SectorApplications/Index.tsx`; the props, status
 * tones and the resubmit CTA here come from that page, and every filing rule is
 * the one `App\Services\SectorApplicationService` enforces server-side.
 *
 * UI-only: applications land in `@/mock/resident/sector-applications`.
 */
import { useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  AlertTriangle,
  ChevronRight,
  FileText,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import EmptyState from "@/components/EmptyState"
import StatusBadge, { type Tone } from "@/components/StatusBadge"
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/Panel"
import { sessionResident, type SectorSlug } from "@/mock/resident/session"
import {
  accreditations,
  applications,
  applyableSectors,
  isAccredited,
  submitSelfService,
  submittedFlash,
} from "@/mock/resident/sector-applications"

const STATUS_TONES: Record<string, Tone> = {
  approved: "success",
  under_admin_review: "info",
  rejected: "danger",
  pending_staff_review: "warning",
  requires_correction: "warning",
}

const DESK_LABELS: Record<SectorSlug, string> = {
  senior: "Senior Desk",
  pwd: "PWD Desk",
}

const ACCREDITED_TILES: Record<SectorSlug, string> = {
  senior: "border-warning/30 bg-warning-soft/60",
  pwd: "border-info/30 bg-info-soft/60",
}

const ACCREDITED_LABEL_TEXT: Record<SectorSlug, string> = {
  senior: "text-warning",
  pwd: "text-info",
}

export default function SectorApplications() {
  const location = useLocation()
  const resident = sessionResident()
  const [items, setItems] = useState(applications)
  const [tiles, setTiles] = useState(accreditations)

  const [open, setOpen] = useState(false)
  const [sector, setSector] = useState<SectorSlug>("senior")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [flash, setFlash] = useState<string | null>(
    () => (location.state as { flash?: string } | null)?.flash ?? null,
  )
  const fileInput = useRef<HTMLInputElement>(null)

  const refresh = () => {
    setItems(applications())
    setTiles(accreditations())
  }

  const closeDialog = () => {
    setOpen(false)
    setSector("senior")
    setNotes("")
    setFile(null)
    setErrors([])
    setSubmitting(false)
    if (fileInput.current) fileInput.current.value = ""
  }

  const handleSubmit = () => {
    setSubmitting(true)
    const outcome = submitSelfService({
      sector,
      notes,
      files: file ? [{ name: file.name, size: file.size }] : [],
    })

    setSubmitting(false)

    if (outcome.ok) {
      setFlash(submittedFlash(outcome.trackingNumber))
      refresh()
      closeDialog()
      return
    }

    setErrors(outcome.message.split("\n"))
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-strong">
            Sector Memberships &amp; Services
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            View accredited sector privileges, access welfare programs, or submit an application.
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Apply for Sector Membership
        </Button>
      </div>

      {flash && (
        <p
          role="status"
          className="rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
        >
          {flash}
        </p>
      )}

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Your Active Accreditations</PanelTitle>
            <PanelDescription>
              The sector desks whose privileges are already open on your account.
            </PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 rounded-xl border border-success/30 bg-success-soft/60 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-success">
                Primary Status
              </p>
              <p className="text-sm font-semibold text-ink-strong">General Resident</p>
              <p className="text-xs leading-relaxed text-ink-muted">
                Active citizen in {resident.barangay.name} ({resident.residentNumber})
              </p>
            </div>

            {tiles.map((tile) => (
              <div
                key={tile.slug}
                className={`space-y-1 rounded-xl border p-4 ${
                  tile.accredited
                    ? ACCREDITED_TILES[tile.slug]
                    : "border-line-soft bg-canvas text-ink-faint"
                }`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    tile.accredited ? ACCREDITED_LABEL_TEXT[tile.slug] : "text-ink-faint"
                  }`}
                >
                  {DESK_LABELS[tile.slug]}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    tile.accredited ? "text-ink-strong" : "text-ink-faint"
                  }`}
                >
                  {tile.label}
                </p>
                <p className="text-xs leading-relaxed">{tile.caption}</p>
              </div>
            ))}
          </div>

          <p className="rounded-lg border border-line-soft bg-canvas px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
            <ShieldCheck className="mr-1 inline size-3.5 text-success" />
            <strong className="font-semibold text-ink">Baseline Access Safeguard:</strong>{" "}
            Applying for or awaiting approval for sector accreditation never alters or
            restricts your active General Resident portal privileges or document request
            services.
          </p>
        </PanelContent>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>My Sector Applications &amp; Review Status</PanelTitle>
            <PanelDescription>
              Every filing you have made, with the desk note attached to it.
            </PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent>
          {items.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No pending sector applications"
              description="You do not currently have any active or pending sector membership applications."
              action={
                <Button size="sm" className="mt-1" onClick={() => setOpen(true)}>
                  <Plus className="size-4" /> Apply for Sector Membership
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="space-y-2 rounded-xl border border-line-soft bg-canvas p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-block rounded-md border border-line-soft bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-muted">
                        {item.trackingNumber}
                      </span>
                      <p className="mt-1.5 text-sm font-semibold text-ink-strong">
                        Application for {item.sectorName}
                      </p>
                    </div>
                    <StatusBadge
                      status={item.statusLabel}
                      tone={STATUS_TONES[item.status] ?? "neutral"}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
                    <span>
                      Submitted: <span className="text-ink tnum">{item.submittedAt}</span>
                    </span>
                    <span>
                      Mode: <span className="text-ink">{item.submissionLabel}</span>
                    </span>
                  </div>

                  {item.staffReviewNotes && (
                    <p className="mt-2 rounded-lg border border-line-soft bg-surface p-2.5 text-xs leading-relaxed text-ink-muted">
                      <strong className="font-semibold text-ink">Staff Review Note:</strong>{" "}
                      {item.staffReviewNotes}
                    </p>
                  )}

                  {item.canCorrect && (
                    <Button asChild size="sm" variant="outline" className="mt-3">
                      <Link to={`/resident/sector-applications/${item.id}/edit`}>
                        Correct &amp; Resubmit <ChevronRight className="size-3.5" />
                      </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </PanelContent>
      </Panel>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : closeDialog())}>
        <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              Self-Service Sector Membership Application
            </DialogTitle>
            <DialogDescription className="text-xs">
              Submit your sector classification and supporting proof for desk review.
            </DialogDescription>
          </DialogHeader>

          {errors.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-danger-soft px-3 py-2.5">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
              <div className="min-w-0">
                {errors.map((error) => (
                  <p
                    key={error}
                    className="text-xs leading-relaxed whitespace-pre-line text-destructive"
                  >
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="sector">Select Sector Classification</Label>
              <Select value={sector} onValueChange={(value) => setSector(value as SectorSlug)}>
                <SelectTrigger id="sector" className="w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {applyableSectors.map((option) => (
                    <SelectItem
                      key={option.slug}
                      value={option.slug}
                      disabled={isAccredited(option.slug)}
                    >
                      {option.name}
                      {isAccredited(option.slug) ? " (Already Accredited)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="documents">Upload Supporting Proof (Photo / PDF)</Label>
              <Input
                id="documents"
                ref={fileInput}
                type="file"
                accept="image/*,.pdf"
                className="h-10 bg-surface text-sm"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs leading-relaxed text-ink-faint">
                Accepts birth certificate, government ID, or medical evaluation certificate.
              </p>
              {file && (
                <Badge variant="secondary" className="max-w-48 truncate self-start text-[11px]">
                  {file.name}
                </Badge>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="remarks">Applicant Remarks / Special Accommodations</Label>
              <Textarea
                id="remarks"
                className="min-h-24 bg-surface text-sm"
                placeholder="Provide any additional details for the desk staff..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              <X className="size-4" /> Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
