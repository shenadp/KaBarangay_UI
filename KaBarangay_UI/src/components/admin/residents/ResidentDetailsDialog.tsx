import { useState } from "react"
import { Loader2, QrCode, RotateCcw, ShieldCheck } from "lucide-react"

import StatusBadge from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  fullNameOf,
  purokName,
  adminBarangay,
  residentRegistry,
  type AdminResident,
  type ResidentRegistration,
} from "@/mock/admin/residents"
import { InfoGrid, RegistrationDocuments, SectorChips, formatAdminDate } from "./bits"

/** Either record can be opened from any tab; the dialog reads it live from the registry. */
export type DetailsTarget =
  | { type: "resident"; id: number }
  | { type: "registration"; id: number }
  | null

/**
 * The credential is only ever handed over in person, so the backend loads it on
 * demand instead of shipping it with the row. The wait here is cosmetic.
 */
function ResidentQrPanel({ resident }: { resident: AdminResident }) {
  const [loading, setLoading] = useState(false)
  const [credential, setCredential] = useState<ReturnType<typeof residentRegistry.qrCredential>>(null)

  const reveal = () => {
    setLoading(true)
    window.setTimeout(() => {
      setCredential(residentRegistry.qrCredential(resident.id))
      setLoading(false)
    }, 500)
  }

  return (
    <div className="rounded-xl border border-line-soft bg-canvas/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
            QR Credential Delivery
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Reveal only when handing the credential to the Resident in person or through an approved
            secure channel. This action is audited.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 bg-surface"
          disabled={loading}
          onClick={reveal}
        >
          {loading ? <Loader2 className="animate-spin" /> : <QrCode />}
          {loading ? "Loading…" : credential ? "Refresh QR" : "Reveal QR"}
        </Button>
      </div>

      {resident.qrStatus !== "active" && !credential && (
        <p className="mt-3 text-xs text-ink-faint">
          {resident.qrStatus === "revoked"
            ? "This credential was revoked — reissue one from the Added by Admin tab before delivering a new code."
            : "No QR credential has been issued for this resident."}
        </p>
      )}

      {credential && (
        <div className="mt-4 flex flex-col items-center gap-4 rounded-lg border border-line-soft bg-surface p-4 sm:flex-row sm:items-center">
          <span className="grid size-[132px] shrink-0 place-items-center rounded-lg border border-line bg-canvas text-brand">
            <QrCode className="size-14" />
          </span>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-sm font-semibold text-ink-strong">{fullNameOf(resident)}</p>
            <p className="mt-1 font-mono text-xs text-ink-muted">{credential.residentNumber}</p>
            <p className="mt-2 break-all text-[11px] leading-relaxed text-ink-faint">
              {credential.verifyUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function ResidentDetailsBody({
  resident,
  onRetryNotification,
}: {
  resident: AdminResident
  onRetryNotification: (registrationId: number) => void
}) {
  const household =
    resident.householdId === null
      ? null
      : residentRegistry.households().find((item) => item.id === resident.householdId) ?? null

  // The block reflects the email sent when this record was linked, not a resident-level field.
  const linked = residentRegistry.latestMatchedRegistration(resident.id)
  const notification = linked?.decisionNotification ?? null

  return (
    <div className="space-y-5">
      <InfoGrid
        items={[
          { label: "Resident ID", value: resident.residentNumber },
          { label: "Full Name", value: fullNameOf(resident) },
          { label: "Birthdate", value: formatAdminDate(resident.birthdate) },
          { label: "Sex", value: resident.sex ?? "—" },
          { label: "Civil Status", value: resident.civilStatus ?? "—" },
          { label: "Mobile", value: resident.mobile ?? "—" },
          { label: "Email", value: resident.email ?? "—" },
          { label: "Email Verification", value: resident.emailVerified ? "Verified" : "Unverified" },
          { label: "Address", value: resident.addressLine ?? "—" },
          { label: "Barangay", value: adminBarangay },
          { label: "Purok", value: resident.purokId ? purokName(resident.purokId) : "—" },
          { label: "Resident Status", value: <StatusBadge status={resident.status} /> },
          {
            label: "Source",
            value:
              resident.source === "admin"
                ? "Admin-created"
                : resident.source === "imported"
                  ? "Imported register"
                  : "Registration",
          },
          { label: "Approved At", value: formatAdminDate(resident.approvedAt) },
          {
            label: "Portal Account",
            value: resident.accountExists ? (resident.accountActive ? "Active" : "Inactive") : "No account yet",
          },
        ]}
      />

      {notification && linked && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-soft px-3.5 py-2.5">
          <p className="text-xs text-ink-muted">
            Registration email: {notification.status} · {notification.attempts} attempt(s)
          </p>
          {notification.status === "failed" && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="border-warning/40 bg-surface text-warning"
              onClick={() => onRetryNotification(linked.id)}
            >
              <RotateCcw className="size-3" /> Retry email
            </Button>
          )}
        </div>
      )}

      <ResidentQrPanel resident={resident} />

      <div className="rounded-xl border border-line-soft p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
          Family / Household
        </p>
        {household ? (
          <>
            <div className="mt-3">
              <InfoGrid
                columns={3}
                items={[
                  { label: "Household code", value: household.code },
                  { label: "Family head", value: household.head || "Not assigned" },
                  { label: "Relationship", value: resident.householdRelationship ?? "Not recorded" },
                ]}
              />
            </div>
            <div className="mt-4 border-t border-line-soft pt-3">
              <p className="text-xs font-medium text-ink-muted">Members</p>
              <ul className="mt-2 space-y-1">
                {residentRegistry.householdMembers(household.id).map((member) => (
                  <li key={member.id} className="text-xs text-ink-muted">
                    {fullNameOf(member)}
                    {member.householdRelationship ? ` · ${member.householdRelationship}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">No household assignment.</p>
        )}
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Sectors</p>
        <div className="mt-2">
          <SectorChips sectors={resident.sectors} />
        </div>
      </div>
    </div>
  )
}

function RegistrationDetailsBody({ registration }: { registration: ResidentRegistration }) {
  const linked =
    registration.matchedResidentId === null
      ? null
      : residentRegistry.residentById(registration.matchedResidentId)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={registration.status.replace(/_/g, " ")} />
        <span className="font-mono text-xs text-ink-muted">{registration.reference}</span>
      </div>

      <InfoGrid
        items={[
          { label: "Full Name", value: fullNameOf(registration) },
          { label: "Birthdate", value: formatAdminDate(registration.birthdate) },
          { label: "Sex", value: registration.sex },
          { label: "Civil Status", value: registration.civilStatus },
          { label: "Mobile", value: registration.mobile },
          { label: "Email", value: registration.email ?? "—" },
          { label: "Address", value: registration.addressLine },
          { label: "Barangay", value: adminBarangay },
          { label: "Purok", value: registration.purokId ? purokName(registration.purokId) : "—" },
          { label: "Submitted At", value: formatAdminDate(registration.submittedAt) },
          { label: "Reviewed At", value: formatAdminDate(registration.reviewedAt) },
          { label: "Last Resubmitted", value: formatAdminDate(registration.lastResubmittedAt) },
        ]}
      />

      {registration.reviewNotes && (
        <div className="rounded-xl border border-line-soft bg-canvas/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
            Review Notes
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-ink">{registration.reviewNotes}</p>
        </div>
      )}

      {linked && (
        <section className="rounded-xl border border-brand/30 bg-brand-soft/60 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-brand">
            <ShieldCheck className="size-3.5" /> Linked Official Resident
          </p>
          <div className="mt-3">
            <InfoGrid
              items={[
                { label: "Resident ID", value: linked.residentNumber },
                { label: "Name", value: fullNameOf(linked) },
                { label: "Birthdate", value: formatAdminDate(linked.birthdate) },
                { label: "Purok", value: linked.purokId ? purokName(linked.purokId) : "—" },
                { label: "Resident status", value: linked.status },
                {
                  label: "Account",
                  value: linked.accountExists
                    ? linked.accountActive
                      ? "Linked and enabled"
                      : "Linked and disabled"
                    : "No account linked",
                },
              ]}
            />
          </div>
          {registration.matchedAt && (
            <p className="mt-2 text-xs text-ink-muted">
              Linked at {formatAdminDate(registration.matchedAt)}
            </p>
          )}
        </section>
      )}

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Sectors</p>
        <div className="mt-2">
          <SectorChips sectors={registration.sectors} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
          Documents
        </p>
        <RegistrationDocuments documents={registration.documents} />
      </div>

      {registration.correctionCycles.length > 0 && (
        <section className="space-y-3 rounded-xl border border-warning/30 bg-warning-soft p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-warning">
            Correction history
          </p>
          {registration.correctionCycles.map((cycle) => (
            <div key={cycle.cycleNumber} className="border-t border-warning/20 pt-3 first:border-0 first:pt-0">
              <p className="text-xs font-semibold text-ink-strong">
                Cycle {cycle.cycleNumber} · {formatAdminDate(cycle.requestedAt)}
                {cycle.resubmittedAt
                  ? ` · Resubmitted ${formatAdminDate(cycle.resubmittedAt)}`
                  : " · Awaiting applicant"}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink">{cycle.instructions}</p>
              <p className="mt-1 text-xs text-ink-muted">Reviewer: {cycle.reviewer ?? "—"}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

type Props = {
  target: DetailsTarget
  onClose: () => void
  /** Resending a decision email is a store call, so the page owns it. */
  onRetryNotification: (registrationId: number) => void
}

export default function ResidentDetailsDialog({ target, onClose, onRetryNotification }: Props) {
  /** The registry is live, so the record is re-read while the dialog is open. */
  const resident = target?.type === "resident" ? residentRegistry.residentById(target.id) : null
  const registration =
    target?.type === "registration" ? residentRegistry.registrationById(target.id) : null

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{target?.type === "resident" ? "Resident Details" : "Registration Details"}</DialogTitle>
          <DialogDescription>
            {target?.type === "resident"
              ? "Read-only summary of this resident record."
              : "Read-only summary of this registration record."}
          </DialogDescription>
        </DialogHeader>

        {resident ? (
          <ResidentDetailsBody resident={resident} onRetryNotification={onRetryNotification} />
        ) : registration ? (
          <RegistrationDetailsBody registration={registration} />
        ) : (
          <p className="text-sm text-ink-muted">No details are available for this record.</p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" className="bg-surface" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
