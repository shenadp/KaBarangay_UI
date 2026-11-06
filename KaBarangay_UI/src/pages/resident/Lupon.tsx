/**
 * Resident portal — Lupon Assistance.
 *
 * The UI of `resources/js/pages/Resident/Lupon.tsx`. Three boards share one
 * surface — the intake form (`form → review → success`), the resident's own
 * complaints (detail view, payment card and tracking view), and the dockets
 * where staff verified the resident as a respondent.
 *
 * Every state, guard and sentence follows the reference page; the rows come
 * from `@/mock/luponIntake`, the same table the Lupon desk reads and writes, so
 * a staff review or a recorded OR moves what this page shows. Nothing here
 * reaches a server — filing a complaint writes to the in-memory store only.
 */
import { useState, type FormEvent, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  Check,
  ClipboardList,
  FileText,
  NotebookPen,
  Scale,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
import SegmentedTabs from "@/components/SegmentedTabs"
import StatusBadge from "@/components/StatusBadge"
import { Panel, PanelContent } from "@/components/Panel"
import { TablePagination } from "@/components/TableTools"
import type { Tone } from "@/components/StatusBadge"
import { cn } from "@/lib/utils"
import {
  canContinueComplaint,
  complainantDetails,
  complaintTypes,
  emptyComplaintForm,
  fileComplaint,
  formatFileSize,
  formatFilingFee,
  type ComplaintField,
  type ComplaintFormValues,
} from "@/mock/luponIntake"
import { formatLongDate } from "@/mock/resident/session"
import {
  COMPLAINTS_PER_PAGE,
  complaintStatusLabel,
  complaintsAgainstMe,
  myComplaints,
  statusDescription,
  trackingSteps,
  type ResidentComplaint,
  type TrackingStep,
} from "@/mock/resident/lupon"

type Tab = "file" | "complaints" | "against"
type Step = "form" | "review" | "success"

/** `StatusBadge` in the reference page. */
const COMPLAINT_TONES: Record<ResidentComplaint["status"], Tone> = {
  Submitted: "info",
  "Under Review": "warning",
  "For Payment": "warning",
  Accepted: "success",
  Rejected: "danger",
}

/** `luponStatusClasses()` — keyed for the raw slugs and the printed labels alike. */
function caseTone(status: string): Tone {
  if (/(settled|executed)/i.test(status)) return "success"
  if (/(repudiat|dismiss|reject)/i.test(status)) return "danger"
  if (/(certified_to_file_action|cfa issued)/i.test(status)) return "brand"
  if (/(summon|mediation|conciliation|pangkat)/i.test(status)) return "info"

  return "warning"
}

function ComplaintBadge({ complaint }: { complaint: ResidentComplaint }) {
  return (
    <StatusBadge
      status={complaintStatusLabel(complaint.status)}
      tone={COMPLAINT_TONES[complaint.status]}
    />
  )
}

export default function Lupon() {
  const [tab, setTab] = useState<Tab>("file")
  const [step, setStep] = useState<Step>("form")
  const [values, setValues] = useState<ComplaintFormValues>(emptyComplaintForm)
  const [errors, setErrors] = useState<Partial<Record<ComplaintField, string>>>({})
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showTracking, setShowTracking] = useState(false)
  const [complaintsPage, setComplaintsPage] = useState(1)
  const [againstPage, setAgainstPage] = useState(1)

  const resident = complainantDetails()
  const complaints = myComplaints()
  const against = complaintsAgainstMe()
  const selected = complaints.find((complaint) => complaint.id === selectedId) ?? null

  /* The receipt reads the newest filing, exactly as `complaints.data[0]` does. */
  const justSubmitted = step === "success" ? (complaints[0] ?? null) : null

  const update = (field: keyof ComplaintFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const openComplaints = () => {
    setSelectedId(null)
    setShowTracking(false)
    setComplaintsPage(1)
    setStep("form")
    setTab("complaints")
  }

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canContinueComplaint(values)) return

    setErrors({})
    setStep("review")
  }

  /** `store()` — a rejected filing sends the resident back to the form with the messages. */
  const handleSubmitComplaint = () => {
    const outcome = fileComplaint(values)

    if (!outcome.ok) {
      setErrors(outcome.errors)
      setStep("form")

      return
    }

    setValues(emptyComplaintForm)
    setSelectedId(null)
    setShowTracking(false)
    setStep("success")
  }

  const newComplaint = () => {
    setValues(emptyComplaintForm)
    setErrors({})
    setSelectedId(null)
    setShowTracking(false)
    setStep("form")
    setTab("file")
  }

  const paged = <T extends { id: number }>(rows: T[], page: number) =>
    rows.slice((page - 1) * COMPLAINTS_PER_PAGE, page * COMPLAINTS_PER_PAGE)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-ink-strong sm:text-2xl">Lupon Assistance</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
          File a complaint and keep track of your complaint with the Lupong Tagapamayapa.
        </p>
      </section>

      {justSubmitted && (
        <p className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          Your complaint has been submitted for review by the Lupong Tagapamayapa.
        </p>
      )}

      <SegmentedTabs
        aria-label="Lupon assistance"
        segments={[
          { value: "file", label: "File a Complaint" },
          { value: "complaints", label: "My Complaints", count: complaints.length },
          { value: "against", label: "Complaints Against Me", count: against.length },
        ]}
        value={tab}
        onChange={(value) => {
          setSelectedId(null)
          setShowTracking(false)
          /* Only a receipt hands the blank form back; a draft survives a tab visit. */
          if (step === "success") setStep("form")
          setTab(value as Tab)
        }}
      />

      {tab === "file" && step === "form" && (
        <form onSubmit={handleContinue} className="space-y-5">
          <Section
            number="1"
            title="Your Information"
            description="Your verified resident information will be used as the complainant."
          >
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-brand-muted bg-brand-soft p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-brand">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink-strong">{resident.fullName}</p>
                  <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
                    Verified
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted tnum">{resident.residentNumber}</p>
                <p className="mt-1 text-sm leading-5 text-ink">{resident.address}</p>
              </div>
            </div>
          </Section>

          <Section number="2" title="Respondent Information" description="Tell us who the complaint is against.">
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field
                label="Respondent Full Name"
                required
                error={errors.respondentName}
                htmlFor="respondentName"
              >
                <Input
                  id="respondentName"
                  value={values.respondentName}
                  maxLength={255}
                  onChange={(event) => update("respondentName", event.target.value)}
                  placeholder="Enter full name"
                />
              </Field>

              <Field
                label="Is the respondent a resident of this barangay?"
                required
                error={errors.respondentResidentStatus}
                htmlFor="respondentResidentStatus"
              >
                <Select
                  value={values.respondentResidentStatus === "" ? "all" : values.respondentResidentStatus}
                  onValueChange={(value) => update("respondentResidentStatus", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="respondentResidentStatus" className="bg-surface">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Unknown">I don&apos;t know</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Respondent Address" error={errors.respondentAddress} htmlFor="respondentAddress">
                <Input
                  id="respondentAddress"
                  value={values.respondentAddress}
                  maxLength={1000}
                  onChange={(event) => update("respondentAddress", event.target.value)}
                  placeholder="Enter address if known"
                />
              </Field>

              <Field
                label="Contact Number"
                optional
                error={errors.respondentContact}
                htmlFor="respondentContact"
              >
                <Input
                  id="respondentContact"
                  value={values.respondentContact}
                  maxLength={50}
                  onChange={(event) => update("respondentContact", event.target.value)}
                  placeholder="09XX XXX XXXX"
                />
              </Field>
            </div>
          </Section>

          <Section
            number="3"
            title="Complaint Details"
            description="Provide the important details about what happened."
          >
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nature of Complaint" required error={errors.complaintType} htmlFor="complaintType">
                <Select
                  value={values.complaintType === "" ? "all" : values.complaintType}
                  onValueChange={(value) => update("complaintType", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="complaintType" className="bg-surface">
                    <SelectValue placeholder="Select complaint type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select complaint type</SelectItem>
                    {complaintTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Date of Incident" required error={errors.incidentDate} htmlFor="incidentDate">
                <Input
                  id="incidentDate"
                  type="date"
                  value={values.incidentDate}
                  onChange={(event) => update("incidentDate", event.target.value)}
                />
              </Field>

              <Field label="Time of Incident" optional error={errors.incidentTime} htmlFor="incidentTime">
                <Input
                  id="incidentTime"
                  type="time"
                  value={values.incidentTime}
                  onChange={(event) => update("incidentTime", event.target.value)}
                />
              </Field>

              <Field
                label="Place of Incident"
                required
                error={errors.incidentLocation}
                htmlFor="incidentLocation"
              >
                <Input
                  id="incidentLocation"
                  value={values.incidentLocation}
                  maxLength={500}
                  onChange={(event) => update("incidentLocation", event.target.value)}
                  placeholder="Where did it happen?"
                />
              </Field>
            </div>

            <div className="mt-4 space-y-4">
              <Field
                label="Complaint Details / Narrative"
                required
                error={errors.narrative}
                htmlFor="narrative"
                hint="Include only information that is relevant to the complaint."
              >
                <Textarea
                  id="narrative"
                  rows={5}
                  value={values.narrative}
                  maxLength={5000}
                  onChange={(event) => update("narrative", event.target.value)}
                  placeholder="Describe what happened clearly and briefly..."
                />
              </Field>

              <Field
                label="Requested Action"
                required
                error={errors.requestedAction}
                htmlFor="requestedAction"
              >
                <Textarea
                  id="requestedAction"
                  rows={3}
                  value={values.requestedAction}
                  maxLength={2000}
                  onChange={(event) => update("requestedAction", event.target.value)}
                  placeholder="What assistance or resolution are you requesting?"
                />
              </Field>
            </div>
          </Section>

          <Panel>
            <PanelContent>
              <EvidenceInput
                files={values.evidence}
                error={errors.evidence}
                onChange={(files) => setValues((current) => ({ ...current, evidence: files }))}
              />
            </PanelContent>
          </Panel>

          <div className="flex justify-end pb-3">
            <Button
              type="submit"
              size="lg"
              disabled={!canContinueComplaint(values)}
              className="w-full sm:w-auto sm:min-w-36"
            >
              Continue
            </Button>
          </div>
        </form>
      )}

      {tab === "file" && step === "review" && (
        <div className="space-y-5">
          <Panel>
            <PanelContent>
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <ClipboardList className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-ink-strong sm:text-lg">
                    Review Your Complaint
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">
                    Please make sure the information below is correct before submitting.
                  </p>
                </div>
              </div>
            </PanelContent>
          </Panel>

          <Panel>
            <PanelContent>
              <Review
                title="Complainant"
                items={[
                  ["Name", resident.fullName],
                  ["Resident Number", resident.residentNumber],
                  ["Address", resident.address],
                ]}
              />
              <Divider />
              <Review
                title="Respondent"
                items={[
                  ["Full Name", values.respondentName],
                  ["Barangay Resident", values.respondentResidentStatus],
                  ["Address", values.respondentAddress || "Not provided"],
                  ["Contact Number", values.respondentContact || "Not provided"],
                ]}
              />
              <Divider />
              <Review
                title="Complaint"
                items={[
                  ["Nature of Complaint", values.complaintType],
                  ["Date of Incident", formatLongDate(values.incidentDate)],
                  ["Time of Incident", values.incidentTime || "Not provided"],
                  ["Place of Incident", values.incidentLocation],
                ]}
              />
              <Divider />
              <Text title="Complaint Details" body={values.narrative} />
              <Divider />
              <Text title="Requested Action" body={values.requestedAction} />
            </PanelContent>
          </Panel>

          <div className="flex flex-col-reverse gap-3 pb-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="lg" onClick={() => setStep("form")}>
              Back
            </Button>
            <Button type="button" size="lg" onClick={handleSubmitComplaint}>
              Submit Complaint
            </Button>
          </div>
        </div>
      )}

      {tab === "file" && step === "success" && justSubmitted && (
        <div className="mx-auto max-w-2xl">
          <Panel>
            <PanelContent className="py-10 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success">
                <Check className="size-8" />
              </span>

              <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink-strong sm:text-2xl">
                Complaint Submitted
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink-muted">
                Your complaint has been sent to the Lupong Tagapamayapa for review.
              </p>

              <div className="mx-auto mt-6 max-w-md rounded-xl border border-line-soft bg-canvas p-4 text-left">
                <p className="text-[11px] font-medium tracking-wider text-ink-faint uppercase">Case Reference</p>
                <p className="mt-1 text-lg font-semibold text-brand tnum">{justSubmitted.reference}</p>

                <div className="my-4 border-t border-line-soft" />

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-ink-faint">Current Status</p>
                    <p className="mt-1 text-sm font-medium text-ink">{justSubmitted.status}</p>
                  </div>
                  <ComplaintBadge complaint={justSubmitted} />
                </div>
              </div>

              <p className="mx-auto mt-5 max-w-lg text-xs leading-5 text-ink-faint">
                Keep your case reference number. You can view future updates under My Complaints. Open the docketed
                case to see hearing schedules and released documents.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button type="button" onClick={openComplaints}>
                  View My Complaints
                </Button>
                <Button type="button" variant="outline" onClick={newComplaint}>
                  File Another Complaint
                </Button>
              </div>
            </PanelContent>
          </Panel>
        </div>
      )}

      {tab === "complaints" && !selected && (
        <div className="space-y-4">
          <section>
            <h2 className="text-base font-semibold tracking-tight text-ink-strong sm:text-lg">My Complaints</h2>
            <p className="mt-1 text-sm text-ink-muted">View your submitted complaints and their current status.</p>
          </section>

          {complaints.length === 0 ? (
            <Panel className="p-0">
              <EmptyState
                icon={NotebookPen}
                title="No complaints yet"
                description="Complaints you submit will appear here together with their current status."
                action={
                  <Button size="sm" className="mt-1" onClick={() => setTab("file")}>
                    File a Complaint
                  </Button>
                }
              />
            </Panel>
          ) : (
            <>
              <ul className="space-y-3">
                {paged(complaints, complaintsPage).map((complaint) => (
                  <li key={complaint.id}>
                    <Panel>
                      <PanelContent>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-ink-strong tnum">{complaint.reference}</p>
                              <ComplaintBadge complaint={complaint} />
                            </div>

                            <p className="mt-2 text-sm font-medium text-ink">{complaint.complaintType}</p>

                            <div className="mt-3 grid gap-2 text-sm text-ink-muted sm:grid-cols-2 sm:gap-x-8">
                              <p>
                                <span className="text-ink-faint">Respondent:</span> {complaint.respondent}
                              </p>
                              <p>
                                <span className="text-ink-faint">Submitted:</span> {complaint.submittedDate}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => {
                              setSelectedId(complaint.id)
                              setShowTracking(false)
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </PanelContent>
                    </Panel>
                  </li>
                ))}
              </ul>

              <TablePagination
                page={complaintsPage}
                pageSize={COMPLAINTS_PER_PAGE}
                total={complaints.length}
                label={complaints.length === 1 ? "complaint" : "complaints"}
                onPageChange={setComplaintsPage}
              />
            </>
          )}
        </div>
      )}

      {tab === "complaints" && selected && !showTracking && (
        <div className="space-y-5">
          <BackLink onClick={() => setSelectedId(null)}>Back to My Complaints</BackLink>

          <Panel>
            <PanelContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-medium tracking-wider text-ink-faint uppercase">Case Reference</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink-strong tnum">
                    {selected.reference}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">Submitted {selected.submittedDate}</p>
                </div>
                <ComplaintBadge complaint={selected} />
              </div>
            </PanelContent>
          </Panel>

          {!selected.case && (
            <p className="rounded-xl border border-line-soft bg-surface p-4 text-sm text-ink-muted">
              Lupon staff will review your complaint before docketing it and scheduling a hearing.
            </p>
          )}

          <Panel>
            <PanelContent>
              <Review
                title="Case Information"
                items={[
                  ["Respondent", selected.respondent],
                  ["Barangay Resident", selected.respondentResidentStatus],
                  ["Nature of Complaint", selected.complaintType],
                  ["Incident Date", selected.incidentDate],
                  ["Incident Time", selected.incidentTime || "Not provided"],
                  ["Incident Location", selected.incidentLocation],
                ]}
              />
              <Divider />
              <Text title="Complaint Details" body={selected.narrative} />
              <Divider />
              <Text title="Requested Action" body={selected.requestedAction} />
              <Divider />
              <EvidenceList files={selected.evidence} />

              {selected.luponNote && (
                <>
                  <Divider />
                  <Text title="Note from Lupon" body={selected.luponNote} />
                </>
              )}
            </PanelContent>
          </Panel>

          <PaymentCard complaint={selected} />

          <div className="flex justify-end">
            <Button type="button" onClick={() => setShowTracking(true)}>
              Track Complaint Status
            </Button>
          </div>
        </div>
      )}

      {tab === "complaints" && selected && showTracking && (
        <TrackingView complaint={selected} onBack={() => setShowTracking(false)} />
      )}

      {tab === "against" && (
        <div className="space-y-4">
          <section>
            <h2 className="text-base font-semibold tracking-tight text-ink-strong sm:text-lg">
              Complaints Against Me
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Official Lupon cases where you have been named and staff-verified as a respondent.
            </p>
          </section>

          {against.length === 0 ? (
            <Panel className="p-0">
              <EmptyState
                icon={ShieldCheck}
                title="No complaints against you"
                description="You have no active cases where you are named and verified as a respondent. If a case is filed and staff verifies your account, it will appear here."
              />
            </Panel>
          ) : (
            <>
              <ul className="space-y-3">
                {paged(against, againstPage).map((item) => (
                  <li key={item.id}>
                    <Panel>
                      <PanelContent>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-ink-strong tnum">{item.caseNumber}</span>
                              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand">
                                {item.phase} Phase
                              </span>
                              <StatusBadge status={item.trackingStatus} tone={caseTone(item.trackingStatus)} />
                            </div>

                            <p className="text-sm font-medium text-ink">Nature of Dispute: {item.caseType}</p>

                            <div className="mt-2 grid gap-1 text-xs text-ink-muted sm:grid-cols-2 sm:gap-x-8">
                              <p>
                                <span className="text-ink-faint">Complainant:</span> {item.complainantName}
                              </p>
                              <p>
                                <span className="text-ink-faint">Filed Date:</span> {item.filedDate}
                              </p>
                              {item.nextHearing ? (
                                <p className="font-medium text-brand sm:col-span-2">
                                  Next Hearing: {item.nextHearing.date}
                                  {item.nextHearing.time && ` at ${item.nextHearing.time}`} ({item.nextHearing.venue})
                                </p>
                              ) : (
                                <p className="text-ink-faint italic">No hearing scheduled yet</p>
                              )}
                            </div>
                          </div>

                          <Button asChild className="shrink-0">
                            <Link to={`/resident/lupon/cases/${item.id}`}>View Proceedings →</Link>
                          </Button>
                        </div>
                      </PanelContent>
                    </Panel>
                  </li>
                ))}
              </ul>

              <TablePagination
                page={againstPage}
                pageSize={COMPLAINTS_PER_PAGE}
                total={against.length}
                label={against.length === 1 ? "case" : "cases"}
                onPageChange={setAgainstPage}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tracking                                                            */
/* ------------------------------------------------------------------ */

function TrackingView({ complaint, onBack }: { complaint: ResidentComplaint; onBack: () => void }) {
  const steps = trackingSteps(complaint.status, Boolean(complaint.case))

  return (
    <div className="space-y-5">
      <BackLink onClick={onBack}>Back to Complaint Details</BackLink>

      <Panel>
        <PanelContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-medium tracking-wider text-ink-faint uppercase">Complaint Tracking</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink-strong tnum">{complaint.reference}</h2>
              <p className="mt-1 text-sm text-ink-muted">{complaint.complaintType}</p>
            </div>
            <ComplaintBadge complaint={complaint} />
          </div>
        </PanelContent>
      </Panel>

      <div className="rounded-xl border border-brand-muted bg-brand-soft p-4 sm:p-5">
        <p className="text-[11px] font-medium tracking-wider text-brand-deep uppercase">Current Status</p>
        <p className="mt-1 text-lg font-semibold text-brand-deep">{complaint.trackingStatus}</p>
        <p className="mt-2 text-sm leading-6 text-ink">{statusDescription(complaint.status)}</p>
      </div>

      <PaymentCard complaint={complaint} />

      {complaint.luponNote && (
        <Panel>
          <PanelContent>
            <Text title="Note from Lupon" body={complaint.luponNote} />
          </PanelContent>
        </Panel>
      )}

      {complaint.case && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-brand-muted bg-brand-soft p-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="size-5 shrink-0 text-brand-deep" />
              <span className="text-sm font-semibold text-ink-strong">
                Case Created: {complaint.case.caseNumber}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              This complaint has been docketed.{" "}
              <Link
                to={`/resident/lupon/cases/${complaint.case.id}`}
                className="font-semibold text-brand underline underline-offset-2 hover:text-brand-hover"
              >
                Open case tracking, hearings and released documents →
              </Link>
            </p>
          </div>

          <Button asChild size="sm" className="shrink-0">
            <Link to={`/resident/lupon/cases/${complaint.case.id}`}>View Case Proceedings →</Link>
          </Button>
        </div>
      )}

      <Panel>
        <PanelContent>
          <h3 className="text-sm font-semibold tracking-tight text-ink-strong">Complaint Progress</h3>
          <p className="mt-1 text-sm text-ink-muted">Follow the progress of your complaint.</p>

          <ol className="mx-auto mt-6 max-w-2xl">
            {steps.map((item, index) => (
              <ProgressStep key={item.label} step={item} isLast={index === steps.length - 1} />
            ))}
          </ol>
        </PanelContent>
      </Panel>

      {!complaint.case && (
        <p className="rounded-xl border border-line-soft bg-surface p-4 text-sm text-ink-muted">
          A case and its first Kapitan hearing are created only after staff records the barangay payment and
          official receipt.
        </p>
      )}
    </div>
  )
}

function ProgressStep({ step, isLast }: { step: TrackingStep; isLast: boolean }) {
  return (
    <li className="relative flex gap-4">
      {!isLast && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-9 left-[17px] h-[calc(100%-12px)] w-0.5",
            step.state === "completed" ? "bg-brand" : "bg-line",
          )}
        />
      )}

      <span className="relative z-10 shrink-0">
        {step.state === "completed" && (
          <span className="grid size-9 place-items-center rounded-full bg-brand text-white">
            <Check className="size-4" />
          </span>
        )}
        {step.state === "current" && (
          <span className="grid size-9 place-items-center rounded-full border-[3px] border-brand bg-surface">
            <span className="size-3 rounded-full bg-brand" />
          </span>
        )}
        {step.state === "future" && (
          <span className="grid size-9 place-items-center rounded-full border-2 border-line bg-surface">
            <span className="size-2.5 rounded-full bg-line" />
          </span>
        )}
      </span>

      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-6")}>
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium",
              step.state === "future" ? "text-ink-faint" : "text-ink-strong",
            )}
          >
            {step.label}
          </p>
          {step.state === "current" && (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold tracking-wider text-brand uppercase">
              Current
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-1 text-xs leading-5",
            step.state === "future" ? "text-ink-faint" : "text-ink-muted",
          )}
        >
          {step.description}
        </p>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Payment                                                             */
/* ------------------------------------------------------------------ */

/** `ComplaintPayment()` — nothing is paid online; the OR is what staff records. */
function PaymentCard({ complaint }: { complaint: ResidentComplaint }) {
  if (complaint.status !== "For Payment" && !complaint.case) return null

  const paid = complaint.case?.paymentStatus === "paid"

  return (
    <div role="status" className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-ink">
      <h3 className="text-sm font-semibold text-ink-strong">
        {paid ? "Filing fee recorded" : complaint.case ? "Filing fee" : "For Payment — pay at the barangay office"}
      </h3>

      <p className="mt-2">Filing fee: ₱{formatFilingFee(complaint.case?.feeAmount ?? complaint.assessedFee ?? 0)}</p>

      {complaint.case?.orNumber && <p className="mt-1">OR / reference: {complaint.case.orNumber}</p>}

      {!complaint.case && (
        <p className="mt-2 leading-6">
          Dalhin ang reference na <strong>{complaint.reference}</strong> sa barangay office at bayaran ang assessed
          filing fee. Kunin ang official receipt. Itatala ng staff ang OR number at unang hearing schedule bago
          malikha ang case. Walang online payment sa form na ito.
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Evidence                                                            */
/* ------------------------------------------------------------------ */

const EVIDENCE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.docx"

/** `EvidenceInput` — the browser hands over names and sizes; nothing is uploaded. */
function EvidenceInput({
  files,
  error,
  onChange,
}: {
  files: { name: string; size: number }[]
  error?: string
  onChange: (files: { name: string; size: number }[]) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="evidence" className="block">
        Supporting evidence (optional)
        <input
          id="evidence"
          type="file"
          multiple
          accept={EVIDENCE_ACCEPT}
          className="mt-2 block w-full rounded-lg border border-line bg-surface p-2 text-xs text-ink file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-brand"
          onChange={(event) =>
            onChange(Array.from(event.target.files ?? []).map((file) => ({ name: file.name, size: file.size })))
          }
        />
      </Label>

      <p className="text-xs text-ink-muted">
        Up to 5 files, 5MB each. PDF, photos, or DOCX. Files are stored privately.
      </p>

      {files.length > 0 && (
        <ul className="space-y-1 text-xs text-ink-muted">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`}>
              {file.name} · {formatFileSize(file.size)}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/** `EvidenceList` — the mock store keeps no file bytes, so evidence reads as a name. */
function EvidenceList({ files }: { files: { id: number; name: string; size: number; shared: boolean }[] }) {
  if (files.length === 0) return <p className="text-sm text-ink-muted">No evidence attached.</p>

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink-strong">Supporting evidence</p>
      <ul className="space-y-2">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line-soft bg-canvas p-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-ink-faint" />
              <span className="min-w-0 break-words font-medium text-ink">{file.name}</span>
            </span>
            <span className="text-xs text-ink-muted">
              {formatFileSize(file.size)}
              {file.shared ? " · Shared with parties" : " · Private"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Layout pieces                                                       */
/* ------------------------------------------------------------------ */

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Panel>
      <PanelContent>
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand tnum">
            {number}
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-ink-strong">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-ink-muted">{description}</p>
          </div>
        </div>
        {children}
      </PanelContent>
    </Panel>
  )
}

function Field({
  label,
  required = false,
  optional = false,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  hint?: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-1.5 block">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
        {optional && <span className="ml-1 text-xs font-normal text-ink-faint">(Optional)</span>}
      </Label>

      {children}

      {hint && <p className="mt-1.5 text-xs leading-5 text-ink-faint">{hint}</p>}

      {error && (
        <p role="alert" className="mt-1.5 text-xs leading-5 text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function Review({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-strong">{title}</h3>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-ink-faint">{label}</p>
            <p className="mt-1 text-sm leading-5 break-words font-medium text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Text({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink-strong">{title}</p>
      <p className="mt-2 text-sm leading-6 whitespace-pre-line text-ink-muted">{body}</p>
    </div>
  )
}

function Divider() {
  return <div className="my-5 border-t border-line-soft" />
}

function BackLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink-strong"
    >
      <ArrowLeft className="size-4" />
      {children}
    </button>
  )
}
