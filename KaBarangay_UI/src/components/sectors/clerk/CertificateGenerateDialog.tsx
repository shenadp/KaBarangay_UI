import { useEffect, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { QrCode, RefreshCw, ScanLine, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import SegmentedTabs from "@/components/SegmentedTabs"
import {
  DetailFieldInputs,
  SectionLabel,
  validateDetailValues,
} from "@/components/sectors/clerk/CertificateDetailFields"
import CertificatePreview, {
  downloadCertificateDocument,
  type CertificatePreviewData,
} from "@/components/sectors/clerk/CertificatePreview"
import type { CertificateFlash } from "@/components/sectors/clerk/CertificateStatus"
import {
  actingCaptainOptions,
  certificateCopy,
  certificateNameFor,
  certificateSignatories,
  certificateTypeOption,
  certificateTypes,
  clerkCertificateStore,
  defaultPunongBarangay,
  detailFieldsForType,
  detailRowsFor,
  feeForType,
  blankDetailValues,
  residentById,
  residentByQrToken,
  certificateResidents,
  delayedPsaType,
  marriageType,
  residencyType,
  signatoryLabel,
  type CertificateRequestRecord,
  type CertificateSignatory,
} from "@/mock/clerk/certificates"
import { clerkOfficer, clerkTodayIso } from "@/mock/clerkDesk"
import { peso } from "@/mock/resident"

const CONTROL_PATTERN = /^CTRL-\d{4}-\d{4}$/

const detailSectionHeadings: Record<string, string> = {
  [delayedPsaType]: "Delayed PSA Registration Details",
  [marriageType]: "Partner Details",
}

/**
 * Validation mirrors the backend's `CertificateController::rulesFor`, including
 * the per-type detail rules resolved from the chosen type at submit time, so a
 * schema built once stays correct while the clerk edits the certificate type.
 */
const issuanceSchema = z
  .object({
    mode: z.enum(["qr", "manual"]),
    qrToken: z.string(),
    residentId: z.string(),
    residentName: z.string().min(1, "Resident name is required."),
    certificateType: z.string().min(1, "Choose a certificate to issue."),
    controlNo: z.string(),
    purok: z.string(),
    purpose: z.string(),
    signatory: z.string().min(1, "Select a signatory."),
    actingCaptain: z.string(),
    detailsConfirmed: z.boolean(),
    details: z.record(z.string(), z.string()),
  })
  .superRefine((values, ctx) => {
    const option = certificateTypeOption(values.certificateType)

    if (option && !option.available) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["certificateType"],
        message: `The ${option.certificate} is not available yet. Please choose another certificate type.`,
      })
    }

    if (values.mode === "qr" && values.residentId === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qrToken"],
        message: "Scan the resident’s KaBarangay QR code before issuing.",
      })
    }

    if ((values.certificateType === marriageType || values.certificateType === residencyType) && values.residentId === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["residentId"],
        message: "Link a register record — this template prints the resident’s own details.",
      })
    }

    // The control number is an issuance identifier: always required and unique.
    if (!values.controlNo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["controlNo"],
        message: "Wait for the control number to load.",
      })
    } else if (!CONTROL_PATTERN.test(values.controlNo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["controlNo"],
        message: "The control number must follow CTRL-YYYY-0000.",
      })
    } else if (clerkCertificateStore.controlNumberTaken(values.controlNo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["controlNo"],
        message: certificateCopy.controlInUse,
      })
    }

    if (!option?.fixedPurpose && values.purpose.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purpose"],
        message: "Purpose is required.",
      })
    }

    const detailErrors = validateDetailValues(detailFieldsForType(values.certificateType), values.details)
    for (const [key, message] of Object.entries(detailErrors)) {
      if (message) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["details", key], message })
      }
    }

    if (values.certificateType === delayedPsaType && !values.detailsConfirmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["detailsConfirmed"],
        message: "Confirm the reviewed details before issuing this certificate.",
      })
    }
  })

type IssuanceFormValues = z.infer<typeof issuanceSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Null for a walk-in issuance filed straight at the desk. */
  request: CertificateRequestRecord | null
  onFeedback: (flash: CertificateFlash) => void
  onCommitted: () => void
}

export default function CertificateGenerateDialog({
  open,
  onOpenChange,
  request,
  onFeedback,
  onCommitted,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [scanError, setScanError] = useState<string | null>(null)
  const [controlLoading, setControlLoading] = useState(false)
  const [committing, setCommitting] = useState<"print" | "download" | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const form = useForm<IssuanceFormValues>({
    resolver: zodResolver(issuanceSchema),
    defaultValues: blankIssuanceForm(request),
  })

  const watched = form.watch()
  const fields = useMemo(
    () => detailFieldsForType(watched.certificateType),
    [watched.certificateType],
  )
  const option = certificateTypeOption(watched.certificateType)
  const linkedResident = residentById(watched.residentId === "" ? null : Number(watched.residentId))
  const purposeCollected = !option?.fixedPurpose
  const detailErrors = toDetailErrors(form.formState.errors.details)

  // Any edit to a reviewed detail invalidates the clerk's confirmation. `watch()`
  // hands back a fresh copy of the values on every render, so the details are
  // compared by value — comparing by identity would clear the box forever.
  const detailsSignature = JSON.stringify(watched.details)
  const previousDetailsSignature = useRef(detailsSignature)
  useEffect(() => {
    if (previousDetailsSignature.current === detailsSignature) return
    previousDetailsSignature.current = detailsSignature
    if (watched.certificateType === delayedPsaType && watched.detailsConfirmed) {
      form.setValue("detailsConfirmed", false)
    }
  }, [detailsSignature, watched.certificateType, watched.detailsConfirmed, form])

  useEffect(() => {
    if (!open) return
    form.reset(blankIssuanceForm(request))
    setStep(1)
    setScanError(null)
    setGenerationError(null)
  }, [open, request, form])

  // The next control number is derived from the store, not fetched.
  useEffect(() => {
    if (!open) return
    setControlLoading(true)
    // UI-only: the backend integration replaces this handler.
    const timer = window.setTimeout(() => {
      form.setValue("controlNo", clerkCertificateStore.nextControlNumber(), { shouldDirty: false })
      setControlLoading(false)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [open, request, form])

  const applyResident = (residentId: string) => {
    const resident = residentById(residentId === "" ? null : Number(residentId))
    form.setValue("residentId", residentId)
    if (!resident) return

    form.setValue("residentName", resident.fullName)
    form.setValue("purok", resident.purok)

    // The register is authoritative for the details it carries.
    const type = form.getValues("certificateType")
    if (type === delayedPsaType) {
      form.setValue("details", {
        ...form.getValues("details"),
        date_of_birth: resident.birthdate ?? "",
        sex: resident.sex.toUpperCase(),
        purok: resident.purok,
      })
    }
  }

  const scan = (token: string) => {
    setScanError(null)
    form.setValue("qrToken", token)
    const resident = residentByQrToken(token)
    if (!resident) {
      setScanError("No register record matches that QR code.")
      return
    }
    form.setValue("mode", "qr")
    applyResident(String(resident.id))
  }

  const chooseType = (type: string) => {
    form.setValue("certificateType", type, { shouldValidate: true })
    form.setValue("details", blankDetailValues(type), { shouldValidate: false })
    form.setValue("detailsConfirmed", false)
    const fixed = certificateTypeOption(type)?.fixedPurpose
    if (fixed) form.setValue("purpose", fixed)
  }

  const signatoryFor = (name: string): CertificateSignatory =>
    certificateSignatories.find((entry) => entry.name === name) ?? defaultPunongBarangay

  const effectiveSignatory = watched.actingCaptain
    ? signatoryFor(watched.actingCaptain)
    : signatoryFor(watched.signatory)

  const previewData: CertificatePreviewData = {
    certificate: certificateNameFor(watched.certificateType),
    residentName: watched.residentName,
    residentNumber: linkedResident?.residentNumber ?? null,
    purok: watched.purok,
    purpose: option?.fixedPurpose ?? watched.purpose,
    controlNo: watched.controlNo,
    fee: feeForType(watched.certificateType),
    signatoryName: effectiveSignatory.name,
    signatoryTitle: effectiveSignatory.title,
    issuedBy: clerkOfficer,
    issuedAt: clerkTodayIso,
    detailRows: detailRowsFor(watched.certificateType, watched.details),
  }

  const proceedToPreview = () => {
    setGenerationError(null)
    setStep(2)
  }

  const commit = (mode: "print" | "download") => {
    setCommitting(mode)
    // UI-only: the backend integration replaces this handler.
    window.setTimeout(() => {
      const result = clerkCertificateStore.attachIssuance({
        certificateType: watched.certificateType,
        controlNo: watched.controlNo,
        residentId: watched.residentId === "" ? null : Number(watched.residentId),
        residentName: watched.residentName,
        purok: watched.purok || null,
        purpose: watched.purpose,
        signatory: effectiveSignatory,
        detailValues: watched.details,
        businessName: watched.details.business_name ?? null,
        businessAddress: watched.details.business_address ?? null,
        requestId: request?.id ?? null,
      })

      setCommitting(null)

      if (!result.ok || !result.issuance) {
        setGenerationError(result.message)
        setStep(1)
        return
      }

      if (mode === "download") {
        downloadCertificateDocument({ ...previewData, controlNo: result.issuance.controlNo })
      }

      onCommitted()
      onFeedback({
        text:
          mode === "print"
            ? `Certificate ${result.issuance.controlNo} sent to the desk printer. ${result.message}`
            : result.message,
        tone: "success",
      })
      form.reset(blankIssuanceForm(null))
      setStep(1)
      onOpenChange(false)
    }, 700)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Issue New Certificate" : "Full-Design Certificate Preview"}
          </DialogTitle>
          <DialogDescription>
            {request
              ? `Issuing against request ${request.reference}.`
              : "Walk-in issuance filed directly at the clerk’s desk."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(proceedToPreview)}
              className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]"
            >
              <div className="space-y-5">
                <SegmentedTabs
                  value={watched.mode}
                  onChange={(value) => {
                    const mode: "qr" | "manual" = value === "qr" ? "qr" : "manual"
                    form.setValue("mode", mode)
                    if (mode === "manual") {
                      form.setValue("residentId", "")
                      form.setValue("qrToken", "")
                      setScanError(null)
                    }
                  }}
                  segments={[
                    { label: "Scan QR", value: "qr" },
                    { label: "Manual Entry", value: "manual" },
                  ]}
                />

                {watched.mode === "qr" ? (
                  <div className="space-y-3 rounded-xl border border-line-soft bg-canvas/60 p-4">
                    <p className="text-xs leading-relaxed text-ink-muted">
                      Point the handheld 2D QR scanner at the resident’s KaBarangay QR code. The
                      scanner enters the code automatically.
                    </p>

                    <FormField
                      control={form.control}
                      name="qrToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>QR scan</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="Scan the QR code — do not type or paste into this field."
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className="shrink-0 bg-surface"
                              onClick={() => scan(field.value)}
                            >
                              <ScanLine className="size-4" /> Read scan
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                        Desk scanner simulation
                      </label>
                      <Select onValueChange={(token) => scan(token)}>
                        <SelectTrigger className="w-full bg-surface" aria-label="Simulate a QR scan">
                          <SelectValue placeholder="Read a register resident’s code" />
                        </SelectTrigger>
                        <SelectContent>
                          {certificateResidents.map((resident) => (
                            <SelectItem key={resident.id} value={resident.residentNumber}>
                              {resident.fullName} — {resident.residentNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-[11px] text-ink-faint">
                        UI-only: the scanner is emulated by the register list.
                      </p>
                    </div>

                    {scanError && (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-surface px-3 py-2 text-xs text-destructive" role="alert">
                        <span>{scanError}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="bg-surface"
                          onClick={() => {
                            setScanError(null)
                            form.setValue("qrToken", "")
                          }}
                        >
                          Try again
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="residentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resident Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Dela Cruz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {linkedResident && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
                    <p className="text-xs font-medium text-success">
                      {watched.mode === "qr" ? "QR VERIFIED" : "REGISTER RECORD LINKED"} ·{" "}
                      {linkedResident.fullName} — {linkedResident.residentNumber}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="bg-surface"
                      onClick={() => {
                        applyResident("")
                        form.setValue("qrToken", "")
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                )}

                {watched.mode === "manual" && (
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                      Link register record (optional)
                    </label>
                    <Select onValueChange={applyResident}>
                      <SelectTrigger className="w-full bg-surface" aria-label="Link a resident record">
                        <SelectValue placeholder="Type the name only, or link a record" />
                      </SelectTrigger>
                      <SelectContent>
                        {certificateResidents.map((resident) => (
                          <SelectItem key={resident.id} value={String(resident.id)}>
                            {resident.fullName} — {resident.residentNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.residentId && (
                      <p className="mt-1 text-[11px] font-medium text-destructive">
                        {form.formState.errors.residentId.message}
                      </p>
                    )}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="certificateType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate Type</FormLabel>
                      <Select value={field.value} onValueChange={chooseType}>
                        <FormControl>
                          <SelectTrigger className="w-full bg-surface">
                            <SelectValue placeholder="Select a certificate…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {certificateTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.certificate}
                              {type.available ? "" : " … (Coming Soon)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="controlNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Control No.</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              readOnly
                              placeholder={controlLoading ? "Generating…" : "CTRL-YYYY-0000"}
                              className="bg-canvas font-mono tnum read-only:text-ink-muted"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 bg-surface"
                            disabled={controlLoading}
                            onClick={() => {
                              setControlLoading(true)
                              // UI-only: the backend integration replaces this handler.
                              window.setTimeout(() => {
                                form.setValue("controlNo", clerkCertificateStore.nextControlNumber())
                                setControlLoading(false)
                              }, 400)
                            }}
                          >
                            <RefreshCw className="size-4" /> Generate
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Fee (₱)</FormLabel>
                    <Input
                      readOnly
                      value={peso(feeForType(watched.certificateType))}
                      className="bg-canvas tnum read-only:text-ink-muted"
                    />
                    <p className="text-[11px] text-ink-faint">
                      The fee comes from the certificate type, never per copy.
                    </p>
                  </FormItem>
                </div>

                {purposeCollected && (
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Scholarship requirement" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watched.certificateType !== delayedPsaType && (
                  <FormField
                    control={form.control}
                    name="purok"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purok</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Purok Bagong Pag-asa"
                            readOnly={Boolean(linkedResident)}
                            className={linkedResident ? "bg-canvas read-only:text-ink-muted" : undefined}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="space-y-3 rounded-xl border border-info/30 bg-info-soft p-4">
                  <FormField
                    control={form.control}
                    name="signatory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signatory</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full bg-surface">
                              <SelectValue placeholder="Select Signatory…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {certificateSignatories.map((signatory) => (
                              <SelectItem key={signatory.name} value={signatory.name}>
                                {signatoryLabel(signatory)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                      OIC when the Punong Barangay is on leave (optional)
                    </label>
                    <Select
                      value={watched.actingCaptain || "default"}
                      onValueChange={(value) =>
                        form.setValue("actingCaptain", value === "default" ? "" : value)
                      }
                    >
                      <SelectTrigger className="w-full bg-surface" aria-label="Acting captain">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Use default Punong Barangay</SelectItem>
                        {actingCaptainOptions.map((signatory) => (
                          <SelectItem key={signatory.name} value={signatory.name}>
                            {signatoryLabel(signatory)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-[11px] text-ink-muted">
                      Select the signatory for this certificate from the published Barangay
                      Organizational Chart.
                    </p>
                  </div>
                </div>

                {fields.length > 0 && (
                  <section>
                    <SectionLabel>
                      {detailSectionHeadings[watched.certificateType] ?? "Certificate Details"}
                    </SectionLabel>
                    <div className="rounded-xl border border-line-soft bg-surface p-4">
                      <DetailFieldInputs
                        fields={fields}
                        values={watched.details}
                        errors={toDetailErrors(detailErrors)}
                        onChange={(key, value) =>
                          form.setValue(
                            "details",
                            { ...watched.details, [key]: value },
                            { shouldValidate: true },
                          )
                        }
                      />
                      {watched.certificateType === delayedPsaType && (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto px-0 text-xs font-semibold text-brand"
                          onClick={() =>
                            form.setValue(
                              "details",
                              { ...watched.details, parents_marriage_details: "Not married" },
                              { shouldValidate: true },
                            )
                          }
                        >
                          Use “Not married”
                        </Button>
                      )}
                    </div>
                  </section>
                )}

                {watched.certificateType === delayedPsaType && (
                  <FormField
                    control={form.control}
                    name="detailsConfirmed"
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-3 rounded-xl border border-line-soft bg-canvas/60 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-ink">
                          I have reviewed the resident details above and confirm that they are
                          correct.
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end border-t border-line-soft pt-4">
                  <Button type="submit" className="h-9" disabled={controlLoading || !watched.controlNo}>
                    Preview Certificate Design →
                  </Button>
                </div>
              </div>

              <aside className="space-y-2 lg:sticky lg:top-0 lg:self-start">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-strong">Live Certificate Preview</p>
                  <p className="text-xs text-ink-muted">Updates as you edit</p>
                </div>
                <CertificatePreview data={previewData} />
              </aside>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto max-w-lg">
              {watched.mode === "qr" ? (
                <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs text-success">
                  <QrCode className="size-4" />
                  <span className="font-semibold">QR VERIFIED</span> Resident identity was confirmed
                  by scanning a KaBarangay QR code.
                </p>
              ) : (
                <p className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-xs text-warning">
                  <UserRound className="size-4" />
                  <span className="font-semibold">MANUAL ENTRY</span> Resident details were entered
                  manually and are not QR-verified.
                </p>
              )}
            </div>

            <CertificatePreview data={previewData} />

            {generationError && (
              <p role="alert" className="rounded-lg border border-line-soft bg-canvas px-3 py-2 text-sm text-destructive">
                {generationError}
              </p>
            )}

            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="bg-surface"
                disabled={committing !== null}
                onClick={() => setStep(1)}
              >
                ← Back to Edit
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-surface"
                  disabled={committing !== null || controlLoading}
                  onClick={() => commit("print")}
                >
                  Print Certificate
                </Button>
                <Button
                  type="button"
                  disabled={committing !== null || controlLoading || !watched.controlNo}
                  onClick={() => commit("download")}
                >
                  {committing === "download" ? "Generating & downloading…" : "Confirm & Download PDF"}
                </Button>
              </div>
            </DialogFooter>

            <p className="text-[11px] leading-relaxed text-ink-faint">
              The download is produced locally from this preview — a text copy of the certificate,
              no file is fetched from a server.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Fresh form state for the dialog, prefilled from the request when issuing one. */
function blankIssuanceForm(request: CertificateRequestRecord | null): IssuanceFormValues {
  const type = request?.certificateType ?? ""

  return {
    mode: "manual",
    qrToken: "",
    residentId: request?.residentId ? String(request.residentId) : "",
    residentName: request?.residentName ?? "",
    certificateType: type,
    controlNo: "",
    purok: request?.purok ?? "",
    purpose: request?.purpose ?? "",
    signatory: defaultPunongBarangay.name,
    actingCaptain: "",
    detailsConfirmed: false,
    details: blankDetailValues(type),
  }
}

/** Maps the nested zod issues back onto the detail field keys. */
function toDetailErrors(errors: unknown): Record<string, string | undefined> {
  if (!errors || typeof errors !== "object") return {}
  const mapped: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    if (key === "root") continue
    const message = (value as { message?: unknown } | undefined)?.message
    mapped[key] = typeof message === "string" ? message : undefined
  }
  return mapped
}
