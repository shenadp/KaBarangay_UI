/**
 * Resident portal — Certificates.
 *
 * The page is the `Resident/Certificates` component of commit b6030a08: a
 * `request | requests` tab pair, a `form → review → success` wizard, the
 * request tracker that only prints the steps a request actually reached, and
 * the details dialog. Every state, guard and message comes from
 * `Resident\CertificateRequestController` and `App\Support\CertificateRequestDetails`
 * through `@/mock/resident/certificates`; nothing is fetched at runtime.
 */

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Check,
  CircleCheck,
  Clock,
  FileText,
  LoaderCircle,
  X,
} from "lucide-react"

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
import SegmentedTabs from "@/components/SegmentedTabs"
import StatusBadge, { type Tone } from "@/components/StatusBadge"
import { TablePagination } from "@/components/TableTools"
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import type { CertificateStatus } from "@/mock/clerk/certificates"
import { residentIdentity } from "@/mock/resident/session"
import {
  certificateCatalog,
  clearCertificateFlow,
  defaultDetails,
  findCertificate,
  listDrafts,
  myRequests,
  OTHER_PURPOSE,
  purposeOptions,
  readCertificateFlow,
  removeDraft,
  REQUESTS_PER_PAGE,
  saveDraft,
  statusMessage,
  submitCertificateRequest,
  friendlyStatusTitle,
  trackerSteps,
  validateForm,
  type CertificateFormState,
  type OfflineDraft,
  type ResidentCertificate,
  type ResidentRequestRow,
} from "@/mock/resident/certificates"

type Tab = "request" | "requests"
type Step = "form" | "review" | "success"

const emptyForm: CertificateFormState = {
  certificateId: "",
  purpose: "",
  otherPurpose: "",
  businessName: "",
  businessAddress: "",
  additionalDetails: "",
  details: {},
}

/** The status colours the reference page uses, expressed with our tokens. */
const statusTones: Record<CertificateStatus, Tone> = {
  Pending: "warning",
  "Needs Action": "warning",
  "For Payment": "brand",
  Processing: "info",
  "Ready for Claim": "success",
  Released: "neutral",
  Rejected: "danger",
}

function peso(fee: number): string {
  return fee > 0 ? `₱${fee.toLocaleString()}` : "Free"
}

export default function ResidentCertificates() {
  const [tab, setTab] = useState<Tab>("request")
  const [step, setStep] = useState<Step>("form")

  const [form, setForm] = useState<CertificateFormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [submitted, setSubmitted] = useState<ResidentRequestRow | null>(null)
  const [selected, setSelected] = useState<ResidentRequestRow | null>(null)
  const [cameFromAssistant, setCameFromAssistant] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [draftMessage, setDraftMessage] = useState("")
  const [draftsOpen, setDraftsOpen] = useState(false)
  const [drafts, setDrafts] = useState<OfflineDraft[]>([])
  const [draftId, setDraftId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const catalog = useMemo(certificateCatalog, [])
  const certificate = useMemo(() => findCertificate(form.certificateId), [form.certificateId])
  const requests = myRequests(page)
  const identity = useMemo(residentIdentity, [])

  /* The KaBarangay Assistant hands a certificate over on this key. */
  useEffect(() => {
    const flow = readCertificateFlow()
    if (!flow) return

    const handed = findCertificate(flow.certificateId)
    if (!handed?.available) {
      clearCertificateFlow()
      return
    }

    setForm((current) => ({
      ...current,
      certificateId: handed.id,
      details: defaultDetails(handed.certificateType),
    }))
    setTab("request")
    setStep("form")
    setCameFromAssistant(true)
  }, [])

  const set = <K extends keyof CertificateFormState>(key: K, value: CertificateFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const effectivePurpose =
    certificate?.fixedPurpose ??
    (form.purpose === OTHER_PURPOSE ? form.otherPurpose : form.purpose)

  function handleCertificateChange(id: string) {
    const next = findCertificate(id)
    if (!next?.available) return

    setForm((current) => ({
      ...current,
      certificateId: id,
      businessName: "",
      businessAddress: "",
      details: defaultDetails(next.certificateType),
    }))
    setDraftId(null)
    setErrors({})
  }

  function resetForm() {
    setForm(emptyForm)
    setErrors({})
    setSubmitted(null)
    setDraftId(null)
    setStep("form")
  }

  function handleContinue(event: React.FormEvent) {
    event.preventDefault()

    const nextErrors = validateForm(form, certificate)
    setErrors(nextErrors)
    if (!certificate?.available || Object.keys(nextErrors).length > 0) return

    setStep("review")
  }

  function handleSubmitRequest() {
    if (!certificate?.available || processing) return
    setProcessing(true)

    const outcome = submitCertificateRequest(form)
    setProcessing(false)

    if (!outcome.ok) {
      setErrors(outcome.errors)
      setStep("form")
      return
    }

    clearCertificateFlow()
    setCameFromAssistant(false)
    setErrors({})
    setDraftMessage("")
    // A submitted local request leaves the device — the queue owns it now.
    if (draftId !== null) removeDraft(draftId)
    setDraftId(null)
    // The controller answers with the request it just created.
    setSubmitted(outcome.request)
    setPage(1)
    setStep("success")
  }

  function handleSaveDraft() {
    if (!certificate || processing) return
    setDraftMessage(saveDraft(form))
    // Saving rewrote this certificate's slot, so follow the entry that replaced it.
    const saved = listDrafts().find((entry) => entry.certificateId === form.certificateId)
    setDraftId(saved?.id ?? null)
  }

  function openDrafts() {
    setDrafts(listDrafts())
    setDraftsOpen(true)
  }

  function reopenDraft(draft: OfflineDraft) {
    setForm(draft.form)
    setDraftId(draft.id)
    setDrafts(listDrafts())
    setDraftsOpen(false)
    setTab("request")
    setStep("form")
  }

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-ink-strong">
          Certificate Request
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Request a barangay certificate or track your submitted request.
        </p>
        <button
          type="button"
          onClick={openDrafts}
          className="mt-2 inline-block text-sm font-semibold text-brand underline underline-offset-2"
        >
          Offline drafts &amp; pending requests
        </button>
        {draftMessage && (
          <p
            role="status"
            className="mt-3 rounded-lg border border-line-soft bg-surface p-3 text-sm text-ink"
          >
            {draftMessage}
          </p>
        )}
      </section>

      <SegmentedTabs
        className="w-full max-w-xl"
        value={tab}
        onChange={(value) => setTab(value as Tab)}
        segments={[
          { value: "request", label: "Request Certificate" },
          { value: "requests", label: "My Requests", count: myRequests(1).total },
        ]}
      />

      {tab === "request" && step === "form" && (
        <div className="space-y-4">
          {cameFromAssistant && certificate && (
            <AssistantBanner
              name={certificate.name}
              onDismiss={() => {
                setCameFromAssistant(false)
                clearCertificateFlow()
              }}
            />
          )}

          <form onSubmit={handleContinue} className="space-y-4">
            <YourInformation />

            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Request Details</PanelTitle>
                  <PanelDescription>Enter only the information needed for this request.</PanelDescription>
                </div>
              </PanelHeader>
              <PanelContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="certificate">Certificate Type *</Label>
                  <Select value={form.certificateId} onValueChange={handleCertificateChange}>
                    <SelectTrigger id="certificate" className="w-full bg-surface">
                      <SelectValue placeholder="Select certificate" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog
                        .filter((entry) => entry.available)
                        .map((entry) => (
                          <SelectItem key={entry.id} value={entry.id}>
                            {entry.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.certificate_id && (
                    <p className="text-xs text-destructive">{errors.certificate_id}</p>
                  )}
                </div>

                {certificate && <CertificateInfo certificate={certificate} />}

                {certificate?.fixedPurpose && (
                  <div className="rounded-lg border border-line-soft bg-canvas p-4">
                    <p className="text-xs font-medium text-ink-muted">Purpose</p>
                    <p className="mt-1 text-sm font-semibold text-ink-strong">
                      {certificate.fixedPurpose}
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">
                      This certificate uses a fixed purpose set by the barangay.
                    </p>
                  </div>
                )}

                {certificate && !certificate.fixedPurpose && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="purpose">Purpose / Requirement For *</Label>
                      <Select value={form.purpose} onValueChange={(value) => set("purpose", value)}>
                        <SelectTrigger id="purpose" className="w-full bg-surface">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          {purposeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.purpose && <p className="text-xs text-destructive">{errors.purpose}</p>}
                    </div>

                    {form.purpose === OTHER_PURPOSE && (
                      <div className="space-y-1.5">
                        <Label htmlFor="otherPurpose">Please specify *</Label>
                        <Input
                          id="otherPurpose"
                          value={form.otherPurpose}
                          onChange={(event) => set("otherPurpose", event.target.value)}
                          placeholder="Enter purpose"
                        />
                        {errors.other_purpose && (
                          <p className="text-xs text-destructive">{errors.other_purpose}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {certificate?.requiresBusinessDetails && (
                  <BusinessInformation
                    ownerName={identity.fullName}
                    form={form}
                    errors={errors}
                    onChange={set}
                  />
                )}

                {certificate && certificate.detailsFields.length > 0 && (
                  <section className="space-y-3 border-t border-line-soft pt-4">
                    <div>
                      <h3 className="text-sm font-semibold text-ink-strong">
                        {certificate.certificateType ?? "Certificate"} Information
                      </h3>
                      <p className="mt-1 text-xs text-ink-muted">
                        These details are printed on the certificate. Please review them carefully.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {certificate.detailsFields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <Label htmlFor={`detail-${field.key}`}>
                            {field.label}
                            {field.required && " *"}
                          </Label>
                          <Input
                            id={`detail-${field.key}`}
                            type={field.type}
                            inputMode={field.kind === "text" ? undefined : "decimal"}
                            min={field.min}
                            max={field.max}
                            step={field.type === "number" ? (field.kind === "numeric" ? "0.01" : "1") : undefined}
                            value={form.details[field.key] ?? ""}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                details: { ...current.details, [field.key]: event.target.value },
                              }))
                            }
                          />
                          {errors[`details.${field.key}`] && (
                            <p className="text-xs text-destructive">
                              {errors[`details.${field.key}`]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="additionalDetails">
                    Additional Details <span className="text-xs font-normal text-ink-faint">(Optional)</span>
                  </Label>
                  <Textarea
                    id="additionalDetails"
                    rows={3}
                    value={form.additionalDetails}
                    onChange={(event) => set("additionalDetails", event.target.value)}
                    placeholder="Enter additional information if needed"
                    className="min-h-24 resize-none bg-surface"
                  />
                  {errors.additional_details && (
                    <p className="text-xs text-destructive">{errors.additional_details}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={!certificate}>
                    Continue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={processing || !certificate}
                    onClick={handleSaveDraft}
                  >
                    Save draft on this device
                  </Button>
                </div>
              </PanelContent>
            </Panel>
          </form>
        </div>
      )}

      {tab === "request" && step === "review" && certificate && (
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Review Your Request</PanelTitle>
              <PanelDescription>Check the information before submitting your request.</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent>
            <div className="divide-y divide-line-soft">
              <ReviewRows
                form={form}
                certificate={certificate}
                purpose={effectivePurpose}
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" disabled={processing} onClick={handleSaveDraft}>
                Save draft on this device
              </Button>
              <Button variant="secondary" disabled={processing} onClick={() => setStep("form")}>
                Back
              </Button>
              <Button disabled={processing} onClick={handleSubmitRequest}>
                {processing ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </PanelContent>
        </Panel>
      )}

      {tab === "request" && step === "success" && submitted && (
        <Panel className="mx-auto w-full max-w-xl text-center">
          <PanelContent className="space-y-5 py-6">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
              <CircleCheck className="size-7" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink-strong">Request Submitted</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Your certificate request has been submitted for barangay review.
              </p>
            </div>

            <div className="space-y-3 rounded-xl bg-canvas p-4 text-left">
              <InfoItem label="Request Number" value={submitted.reference} />
              <div className="border-t border-line-soft" />
              <InfoItem label="Certificate" value={submitted.certificate} />
              <div className="border-t border-line-soft" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-ink-muted">Status</span>
                <StatusBadge status={submitted.status} tone={statusTones[submitted.status]} />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={resetForm}>
                Request Another
              </Button>
              <Button
                onClick={() => {
                  setPage(1)
                  setTab("requests")
                }}
              >
                My Requests
              </Button>
            </div>
          </PanelContent>
        </Panel>
      )}

      {tab === "requests" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-strong">My Requests</h2>
            <p className="mt-1 text-sm text-ink-muted">
              View and track your submitted certificate requests.
            </p>
          </div>

          {requests.rows.length > 0 ? (
            <>
              <div className="space-y-3">
                {requests.rows.map((request) => (
                  <Panel key={request.id}>
                    <PanelContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold break-words text-ink-strong sm:text-base">
                          {request.certificate}
                        </p>
                        <p className="mt-0.5 text-xs font-medium break-all text-ink-muted">
                          {request.reference}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-faint">Submitted: {request.date}</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <StatusBadge status={request.status} tone={statusTones[request.status]} />
                        <Button variant="outline" size="sm" onClick={() => setSelected(request)}>
                          View Details
                        </Button>
                      </div>
                    </PanelContent>
                  </Panel>
                ))}
              </div>

              <TablePagination
                page={requests.page}
                pageSize={REQUESTS_PER_PAGE}
                total={requests.total}
                label="certificate requests"
                onPageChange={setPage}
              />
            </>
          ) : (
            <Panel className="p-0">
              <EmptyState
                icon={FileText}
                title="No certificate requests"
                description="Your submitted requests will appear here."
                action={
                  <Button
                    onClick={() => {
                      resetForm()
                      setTab("request")
                    }}
                  >
                    Request Certificate
                  </Button>
                }
              />
            </Panel>
          )}
        </section>
      )}

      <RequestDetailsDialog request={selected} onClose={() => setSelected(null)} />

      <DraftsDialog
        open={draftsOpen}
        drafts={drafts}
        onOpenChange={setDraftsOpen}
        onOpenDraft={reopenDraft}
        onDelete={(id) => {
          removeDraft(id)
          setDrafts(listDrafts())
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Verified information                                                */
/* ------------------------------------------------------------------ */

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold break-words text-ink-strong">{value}</p>
    </div>
  )
}

function YourInformation() {
  const profile = useMemo(residentIdentity, [])

  return (
    <Panel>
      <PanelHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div>
              <PanelTitle>Your Information</PanelTitle>
              <PanelDescription>Taken from your verified resident profile.</PanelDescription>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
            <Check className="size-3.5" />
            Verified
          </span>
        </div>
      </PanelHeader>
      <PanelContent className="grid gap-4 sm:grid-cols-2">
        <InfoItem label="Resident Name" value={profile.fullName} />
        <InfoItem label="KaBarangay ID" value={profile.residentNumber} />
        {profile.purok && <InfoItem label="Purok" value={profile.purok} />}
        {profile.birthdate && <InfoItem label="Date of Birth" value={profile.birthdate} />}
        {profile.sex && <InfoItem label="Sex" value={profile.sex} />}
        <div className="sm:col-span-2">
          <InfoItem label="Barangay" value={`${profile.barangay}, ${profile.city}`} />
        </div>
      </PanelContent>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Certificate information card                                        */
/* ------------------------------------------------------------------ */

function CertificateInfo({ certificate }: { certificate: ResidentCertificate }) {
  return (
    <div className="space-y-4 rounded-xl bg-canvas p-4">
      <div>
        <p className="text-sm font-semibold text-ink-strong">{certificate.name}</p>
        <p className="mt-1 text-sm leading-6 text-ink-muted">{certificate.description}</p>
      </div>

      {!certificate.available && (
        <p className="rounded-lg border border-warning/25 bg-warning-soft p-3 text-sm leading-6 text-warning">
          This certificate is currently unavailable. Please choose another certificate type.
        </p>
      )}
      {certificate.available && !certificate.templateAvailable && (
        <p className="rounded-lg border border-warning/25 bg-warning-soft p-3 text-sm leading-6 text-warning">
          This active service can accept requests. Certificate generation is not available yet;
          the barangay office may need to complete processing after its template is provisioned.
        </p>
      )}

      {certificate.requirements.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink-strong">Requirements</p>
          <ul className="mt-2 space-y-2">
            {certificate.requirements.map((requirement) => (
              <li key={requirement} className="flex items-start gap-2 text-sm leading-6 text-ink-muted">
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-success text-white">
                  <Check className="size-3" />
                </span>
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line-soft pt-3">
        <span className="text-sm font-medium text-ink-muted">Fee</span>
        <span className="text-base font-semibold text-brand tnum">{peso(certificate.fee)}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Business information                                                */
/* ------------------------------------------------------------------ */

function BusinessInformation({
  ownerName,
  form,
  errors,
  onChange,
}: {
  ownerName: string
  form: CertificateFormState
  errors: Record<string, string>
  onChange: <K extends keyof CertificateFormState>(key: K, value: CertificateFormState[K]) => void
}) {
  return (
    <section className="space-y-3 border-t border-line-soft pt-4">
      <div>
        <h3 className="text-sm font-semibold text-ink-strong">Business Information</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Enter the business information required for this certificate.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Business Owner</Label>
          <Input readOnly value={ownerName} className="bg-canvas text-ink-muted" />
          <p className="text-xs text-ink-faint">
            The verified Resident account holder is used as the business owner.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={form.businessName}
            onChange={(event) => onChange("businessName", event.target.value)}
          />
          {errors.business_name && (
            <p className="text-xs text-destructive">{errors.business_name}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessAddress">Business Address *</Label>
          <Input
            id="businessAddress"
            value={form.businessAddress}
            onChange={(event) => onChange("businessAddress", event.target.value)}
          />
          {errors.business_address && (
            <p className="text-xs text-destructive">{errors.business_address}</p>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Review                                                              */
/* ------------------------------------------------------------------ */

function ReviewRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6 ${
        last ? "" : "border-b border-line-soft"
      }`}
    >
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium break-words text-ink-strong sm:max-w-[65%] sm:text-right">
        {value}
      </span>
    </div>
  )
}

function ReviewRows({
  form,
  certificate,
  purpose,
}: {
  form: CertificateFormState
  certificate: ResidentCertificate
  purpose: string
}) {
  const profile = useMemo(residentIdentity, [])
  const rows: { label: string; value: string }[] = [
    { label: "Resident", value: profile.fullName },
    { label: "KaBarangay ID", value: profile.residentNumber },
    { label: "Certificate", value: certificate.name },
    { label: "Purpose", value: purpose },
  ]

  if (certificate.requiresBusinessDetails) {
    rows.push(
      { label: "Business Owner", value: profile.fullName },
      { label: "Business Name", value: form.businessName },
      { label: "Business Address", value: form.businessAddress },
    )
  }

  for (const field of certificate.detailsFields) {
    const value = (form.details[field.key] ?? "").trim()
    if (value !== "") rows.push({ label: field.label, value })
  }

  if (form.additionalDetails.trim() !== "") {
    rows.push({ label: "Additional Details", value: form.additionalDetails })
  }

  rows.push({ label: "Fee", value: peso(certificate.fee) })

  return (
    <>
      {rows.map((row, index) => (
        <ReviewRow
          key={`${row.label}-${index}`}
          label={row.label}
          value={row.value}
          last={index === rows.length - 1}
        />
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Assistant hand-off                                                  */
/* ------------------------------------------------------------------ */

function AssistantBanner({ name, onDismiss }: { name: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand/25 bg-brand-soft p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
        <FileText className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-strong">Selected by KaBarangay Assistant</p>
        <p className="mt-1 text-sm leading-6 text-ink-muted">
          {name} is already selected. Continue with the request details below.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss assistant message"
        className="grid size-8 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-surface hover:text-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tracker                                                             */
/* ------------------------------------------------------------------ */

const stepIcons: Record<string, typeof FileText> = {
  Submitted: FileText,
  "For Payment": Banknote,
  Processing: Clock,
  "Ready for Claim": BadgeCheck,
  Released: CircleCheck,
}

function TrackerStepNode({
  label,
  completed,
  current,
}: {
  label: string
  completed: boolean
  current: boolean
}) {
  const Icon = completed ? Check : (stepIcons[label] ?? FileText)

  return (
    <span
      className={
        completed
          ? "grid size-9 shrink-0 place-items-center rounded-full bg-success text-white"
          : current
            ? "grid size-9 shrink-0 place-items-center rounded-full border-2 border-success bg-success-soft text-success"
            : "grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-faint"
      }
    >
      <Icon className="size-4" />
    </span>
  )
}

export function RequestTracker({ status }: { status: CertificateStatus }) {
  if (status === "Rejected" || status === "Needs Action") {
    const rejected = status === "Rejected"

    return (
      <div
        className={
          rejected
            ? "flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-4"
            : "flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4"
        }
      >
        <span
          className={
            rejected
              ? "grid size-9 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive"
              : "grid size-9 shrink-0 place-items-center rounded-full bg-warning/15 text-warning"
          }
        >
          {rejected ? <X className="size-4" /> : <AlertTriangle className="size-4" />}
        </span>
        <div>
          <p className={rejected ? "text-sm font-semibold text-destructive" : "text-sm font-semibold text-warning"}>
            {friendlyStatusTitle(status)}
          </p>
          <p className="mt-1 text-sm leading-6 text-ink-muted">{statusMessage(status)}</p>
        </div>
      </div>
    )
  }

  const steps = trackerSteps(status)
  const currentStep = steps.length - 1

  return (
    <div className="space-y-4">
      {/* Mobile: a vertical rail, because five steps never fit across a phone. */}
      <div className="sm:hidden">
        {steps.map((label, index) => {
          const completed = index < currentStep
          const current = index === currentStep

          return (
            <div key={label} className="relative flex gap-3">
              {index !== steps.length - 1 && (
                <span
                  className={
                    completed
                      ? "absolute top-9 left-[17px] h-[calc(100%-0.25rem)] w-0.5 bg-success"
                      : "absolute top-9 left-[17px] h-[calc(100%-0.25rem)] w-0.5 bg-line"
                  }
                />
              )}
              <TrackerStepNode label={label} completed={completed} current={current} />
              <div className="min-w-0 pb-5">
                <p className="text-sm font-semibold text-ink-strong">{label}</p>
                {completed && <p className="mt-0.5 text-xs text-ink-muted">Completed</p>}
                {current && (
                  <p className="mt-0.5 text-xs font-semibold text-success">Current status</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: the same rail laid across. */}
      <div className="scrollbar-slim hidden overflow-x-auto pb-1 sm:block">
        <div className={steps.length >= 4 ? "flex min-w-[520px] items-start px-2" : "flex min-w-[420px] items-start px-2"}>
          {steps.map((label, index) => {
            const completed = index < currentStep
            const current = index === currentStep
            const reached = index <= currentStep

            return (
              <div key={label} className="relative flex flex-1 flex-col items-center">
                {index > 0 && (
                  <span
                    className={
                      reached
                        ? "absolute top-4 right-1/2 h-0.5 w-full bg-success"
                        : "absolute top-4 right-1/2 h-0.5 w-full bg-line"
                    }
                  />
                )}
                <TrackerStepNode label={label} completed={completed} current={current} />
                <p className="mt-2 max-w-[110px] text-center text-xs leading-4 font-semibold text-ink-strong">
                  {label}
                </p>
                {current && (
                  <span className="mt-1 text-[11px] font-semibold text-success">Current</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-canvas p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
          <CircleCheck className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-strong">{friendlyStatusTitle(status)}</p>
          <p className="mt-1 text-sm leading-6 text-ink-muted">{statusMessage(status)}</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Details dialog                                                      */
/* ------------------------------------------------------------------ */

function RequestDetailsDialog({
  request,
  onClose,
}: {
  request: ResidentRequestRow | null
  onClose: () => void
}) {
  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
          <DialogDescription className="break-all font-medium">
            {request?.reference}
          </DialogDescription>
        </DialogHeader>

        {request && (
          <>
            <div className="space-y-4 rounded-xl border border-line-soft bg-canvas p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="Certificate" value={request.certificate} />
                <InfoItem label="Purpose" value={request.purpose} />
                <InfoItem label="Submitted" value={request.date} />
                <InfoItem label="Fee" value={peso(request.fee)} />
                {request.businessName && (
                  <InfoItem label="Business Name" value={request.businessName} />
                )}
                {request.businessAddress && (
                  <InfoItem label="Business Address" value={request.businessAddress} />
                )}
                {request.details.map((detail) => (
                  <InfoItem key={detail.label} label={detail.label} value={detail.value} />
                ))}
              </div>

              {request.additionalDetails && (
                <>
                  <div className="border-t border-line-soft" />
                  <InfoItem label="Additional Details" value={request.additionalDetails} />
                </>
              )}

              {request.adminNote && (
                <>
                  <div className="border-t border-line-soft" />
                  <div className="rounded-lg border border-warning/25 bg-warning-soft p-3">
                    <p className="text-sm font-semibold text-warning">Barangay Note</p>
                    <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-ink">{request.adminNote}</p>
                  </div>
                </>
              )}

              <div className="border-t border-line-soft" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-ink-muted">Current Status</span>
                <StatusBadge status={request.status} tone={statusTones[request.status]} />
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-base font-semibold text-ink-strong">Track Status</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Follow the progress of your certificate request.
              </p>
              <div className="mt-4">
                <RequestTracker status={request.status} />
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Offline drafts                                                      */
/* ------------------------------------------------------------------ */

function DraftsDialog({
  open,
  drafts,
  onOpenChange,
  onOpenDraft,
  onDelete,
}: {
  open: boolean
  drafts: OfflineDraft[]
  onOpenChange: (open: boolean) => void
  onOpenDraft: (draft: OfflineDraft) => void
  onDelete: (id: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Offline drafts &amp; pending requests</DialogTitle>
          <DialogDescription>
            Drafts live on this device only. Nothing here has been submitted to the barangay yet.
          </DialogDescription>
        </DialogHeader>

        {drafts.length > 0 ? (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex flex-col gap-3 rounded-xl border border-line-soft bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-strong">{draft.certificateName}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">Saved on this device: {draft.savedAt}</p>
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <Button size="sm" onClick={() => onOpenDraft(draft)}>
                    Review
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(draft.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No drafts on this device"
            description="Use Save draft on this device to keep a request here until you are ready to submit it."
            className="py-8"
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
