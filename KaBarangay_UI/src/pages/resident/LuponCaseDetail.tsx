/**
 * Resident portal — Lupon case proceedings.
 *
 * The UI of `resources/js/pages/Resident/LuponCaseShow.tsx` plus the two shared
 * Lupon components it renders (`CaseTimeline`, `Evidence`). One page serves both
 * sides of a docket: `viewerRole` decides the back link, and the read model
 * decides whether the intake narrative is printable.
 *
 * A docket the session resident is not a named, verified party on reads as
 * missing — the same answer the server's 403 gives.
 */
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, CalendarDays, FileText, Gavel, MapPin, Scale } from "lucide-react"

import EmptyState from "@/components/EmptyState"
import StatusBadge from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Panel, PanelContent } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { formatFileSize } from "@/mock/luponIntake"
import { caseDetail, type ResidentCaseDetail } from "@/mock/resident/lupon"

/** `luponStatusClasses()` — the same colour map the desk uses for a status pill. */
function caseTone(status: string) {
  if (/(settled|executed)/i.test(status)) return "success" as const
  if (/(repudiat|dismiss|reject)/i.test(status)) return "danger" as const
  if (/(certified_to_file_action|cfa issued)/i.test(status)) return "brand" as const
  if (/(summon|mediation|conciliation|pangkat)/i.test(status)) return "info" as const

  return "warning" as const
}

function FileRow({ name, meta }: { name: string; meta: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line-soft bg-canvas p-3 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <FileText className="size-4 shrink-0 text-ink-faint" />
        <span className="min-w-0 break-words font-medium text-ink">{name}</span>
      </span>
      <span className="text-xs text-ink-muted">{meta}</span>
    </li>
  )
}

export default function LuponCaseDetail() {
  const { id } = useParams()
  const detail = caseDetail(id)

  if (!detail) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Panel className="p-0">
          <EmptyState
            icon={Scale}
            title="Case not available"
            description="This docket is not linked to your verified resident record."
            action={
              <Button asChild size="sm" variant="outline" className="mt-1 h-9 bg-surface">
                <Link to="/resident/lupon">Back to Lupon Assistance</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  const { viewerRole, caseData } = detail

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/resident/lupon"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink-strong"
        >
          <ArrowLeft className="size-4" />
          {viewerRole === "respondent" ? "Back to Complaints Against Me" : "Back to My Complaints"}
        </Link>

        {caseData.complaintReference && (
          <p className="text-xs text-ink-muted">
            Complaint: <span className="font-medium text-ink tnum">{caseData.complaintReference}</span>
          </p>
        )}
      </div>

      {/* Case banner */}
      <Panel>
        <PanelContent>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ink-strong tnum">{caseData.caseNumber}</h1>
            <span className="rounded-full bg-brand-soft px-3 py-0.5 text-xs font-medium text-brand">
              {caseData.phase} Phase
            </span>
            <StatusBadge status={caseData.statusLabel} tone={caseTone(caseData.status)} />
          </div>

          <p className="mt-2 text-sm font-medium text-ink-strong">{caseData.title}</p>
          <p className="mt-1 text-xs text-ink-muted">Filed on {caseData.filedDate}</p>
        </PanelContent>
      </Panel>

      <Timeline caseData={caseData} />

      <Panel>
        <PanelContent>
          <h2 className="text-sm font-semibold tracking-tight text-ink-strong">Case documents</h2>

          {caseData.documents.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Released documents will appear here.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {caseData.documents.map((document) => (
                <FileRow
                  key={document.id}
                  name={document.label}
                  meta={document.servedAt ? `Served ${document.servedAt}` : "Not yet served"}
                />
              ))}
            </ul>
          )}
        </PanelContent>
      </Panel>

      <Panel>
        <PanelContent>
          <h2 className="text-sm font-semibold tracking-tight text-ink-strong">Evidence available to you</h2>

          {caseData.evidence.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No evidence attached.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {caseData.evidence.map((file) => (
                <FileRow
                  key={file.id}
                  name={file.name}
                  meta={`${formatFileSize(file.size)}${file.shared ? " · Shared with parties" : " · Private"}`}
                />
              ))}
            </ul>
          )}
        </PanelContent>
      </Panel>

      {/* Case information */}
      <Panel>
        <PanelContent>
          <h2 className="text-sm font-semibold tracking-tight text-ink-strong">Case Information</h2>

          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium tracking-wider text-ink-faint uppercase">Nature of Dispute</p>
              <p className="mt-1 font-medium text-ink">{caseData.caseType}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-ink-faint uppercase">Respondent</p>
              <p className="mt-1 font-medium text-ink">{caseData.respondentName}</p>
            </div>
          </div>

          {caseData.narrative && (
            <div className="mt-4">
              <p className="text-[11px] font-medium tracking-wider text-ink-faint uppercase">Complaint Narrative</p>
              <p className="mt-1 rounded-lg border border-line-soft bg-canvas p-3 text-xs leading-5 whitespace-pre-line text-ink">
                {caseData.narrative}
              </p>
            </div>
          )}
        </PanelContent>
      </Panel>

      {/* Proceedings */}
      <Panel>
        <PanelContent>
          <h2 className="text-sm font-semibold tracking-tight text-ink-strong">Proceedings &amp; Hearings</h2>

          {caseData.hearings.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              No hearings have been scheduled yet. You will be notified when a schedule is posted.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {caseData.hearings.map((hearing) => (
                <li key={hearing.id} className="rounded-xl border border-line-soft bg-canvas p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink-strong">
                      Hearing #{hearing.number} ({hearing.phase} Phase)
                    </span>
                    <StatusBadge status={hearing.status} />
                  </div>

                  <div className="mt-2 space-y-1.5 text-xs text-ink-muted">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="size-3.5 shrink-0 text-brand" />
                      <span>
                        <strong className="font-medium text-ink">Date:</strong> {hearing.date}
                        {hearing.time && ` at ${hearing.time}`}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="size-3.5 shrink-0 text-brand" />
                      <span>
                        <strong className="font-medium text-ink">Venue:</strong> {hearing.venue}
                      </span>
                    </p>
                    {hearing.outcome && (
                      <p className="flex items-start gap-2">
                        <Gavel className="mt-0.5 size-3.5 shrink-0 text-brand" />
                        <span>
                          <strong className="font-medium text-ink">Outcome:</strong> {hearing.outcome}
                        </span>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PanelContent>
      </Panel>

      {caseData.settlement && (
        <Panel className="border-success/30 bg-success-soft/60">
          <PanelContent>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-tight text-success">
                Official Settlement / Resolution
              </h2>
              <StatusBadge status={caseData.settlement.status} tone="success" />
            </div>

            <p className="mt-1 text-xs text-ink-muted">
              Type: {caseData.settlement.type} on {caseData.settlement.date}
            </p>

            <p className="mt-3 rounded-lg border border-line-soft bg-surface p-4 text-xs leading-5 whitespace-pre-line text-ink">
              {caseData.settlement.terms}
            </p>
          </PanelContent>
        </Panel>
      )}
    </div>
  )
}

/** `CaseTimeline.tsx` — recorded history plus the workflow deadlines, parties' view. */
function Timeline({ caseData }: { caseData: ResidentCaseDetail }) {
  return (
    <Panel>
      <PanelContent>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-ink-strong">
            Recorded history &amp; deadlines
          </h2>
          <StatusBadge status={caseData.trackingStatus} tone={caseTone(caseData.trackingStatus)} />
        </div>

        <p className="mt-2 text-xs text-ink-muted">
          Meeting-based deadlines are tracked separately. Expiry does not automatically issue a CFA.
        </p>

        {caseData.deadlines.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {caseData.deadlines.map((deadline) => {
              const overdue = deadline.active && deadline.daysRemaining < 0

              return (
                <div
                  key={deadline.label}
                  className={cn(
                    "rounded-lg border p-3",
                    overdue ? "border-warning/40 bg-warning-soft" : "border-line-soft bg-canvas",
                  )}
                >
                  <p className="text-xs font-medium text-ink-muted">{deadline.label}</p>
                  <p className="mt-1 text-sm font-semibold text-ink-strong tnum">{deadline.date}</p>
                  <p className={cn("text-xs", overdue ? "text-warning" : "text-ink-muted")}>
                    {!deadline.active
                      ? "Recorded deadline"
                      : deadline.daysRemaining < 0
                        ? `${-deadline.daysRemaining} days overdue`
                        : deadline.daysRemaining === 0
                          ? "Due today"
                          : `${deadline.daysRemaining} days remaining`}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {caseData.events.length > 0 ? (
          <ol className="mt-4 space-y-4 border-l border-brand-muted pl-4">
            {caseData.events.map((event) => (
              <li key={event.id} className="relative">
                <span aria-hidden="true" className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-brand" />
                <p className="text-sm font-medium text-ink-strong">{event.label}</p>
                <p className="text-xs text-ink-muted tnum">{event.date}</p>
                <p className="text-xs text-ink-faint">Responsible staff: not supplied in this event record</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-xs text-ink-muted">
            No case events supplied. History is not inferred from the current status.
          </p>
        )}
      </PanelContent>
    </Panel>
  )
}
