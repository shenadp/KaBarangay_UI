import { useEffect, useMemo, useState } from "react"
import { Loader2, Search, ShieldAlert } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { purokName, residentRegistry, fullNameOf, type ResidentCandidate, type ResidentRegistration } from "@/mock/admin/residents"
import { InfoGrid, RegistrationDocuments, SectorChips, formatAdminDate } from "./bits"

type Props = {
  registration: ResidentRegistration
  /** The page flashes the outcome and re-reads every table. */
  onLinked: (message: string) => void
  onReject: () => void
  onRequestCorrection: () => void
  onClose: () => void
}

/**
 * Approval is a linking step, never a create step: the admin searches the
 * official Admin-added records, picks one explicitly and only then confirms.
 */
export default function ReviewRegistrationDialog({
  registration,
  onLinked,
  onReject,
  onRequestCorrection,
  onClose,
}: Props) {
  const [candidateSearch, setCandidateSearch] = useState(
    `${registration.firstName} ${registration.lastName}`.trim(),
  )
  const [candidates, setCandidates] = useState<ResidentCandidate[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [refreshToken, setRefreshToken] = useState(0)

  const [approveError, setApproveError] = useState("")
  const [busy, setBusy] = useState(false)
  /** The backend asks this through `window.confirm`; here it is a second step. */
  const [confirming, setConfirming] = useState(false)

  const query = candidateSearch.trim()

  useEffect(() => {
    if (query.length < 2) {
      setCandidates([])
      setSearching(false)
      setSearchError(
        "Enter at least two characters to search this barangay's Admin-added Resident records.",
      )
      return
    }

    setSearchError("")
    setSearching(true)
    const timer = window.setTimeout(() => {
      setCandidates(residentRegistry.candidates(registration.id, query))
      setSearching(false)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, refreshToken, registration.id])

  const selected = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) ?? null,
    [candidates, selectedId],
  )

  const isPending = registration.status === "pending"
  const canLink = selected !== null && !selected.accountExists && !busy

  const submitLink = () => {
    if (!selected) return
    setBusy(true)
    window.setTimeout(() => {
      const result = residentRegistry.approve(registration.id, selected.id)
      setBusy(false)
      setConfirming(false)
      if (!result.ok) {
        setApproveError(result.message)
        return
      }
      onLinked(result.message)
    }, 600)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review Registration</DialogTitle>
          <DialogDescription>
            Verify the resident information before taking action
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={registration.status.replace(/_/g, " ")} />
          <SectorChips sectors={registration.sectors} />
        </div>

        <InfoGrid
          items={[
            { label: "Full Name", value: fullNameOf(registration) },
            { label: "Birthdate", value: formatAdminDate(registration.birthdate) },
            { label: "Sex", value: registration.sex },
            { label: "Civil Status", value: registration.civilStatus },
            { label: "Mobile Number", value: registration.mobile },
            { label: "Email", value: registration.email ?? "Not provided" },
            { label: "Submitted", value: formatAdminDate(registration.submittedAt) },
            { label: "Application Reference", value: registration.reference },
          ]}
        />
        <InfoGrid
          columns={2}
          items={[
            { label: "Local Address", value: registration.addressLine },
            { label: "Purok", value: registration.purokId ? purokName(registration.purokId) : "—" },
          ]}
        />

        <section className="rounded-xl border border-brand/30 bg-brand-soft/40 p-4">
          <h2 className="text-sm font-semibold text-ink-strong">
            Select the official Barangay Resident
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Search suggestions do not link automatically. Review the official record and explicitly
            select one. If no correct record exists, leave this application pending; approval will
            not create a Resident.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-info">
            A QR reference, when valid, adds a suggestion only. It does not establish identity or
            select a candidate automatically.
          </p>

          <div className="mt-3 space-y-1.5">
            <Label htmlFor="resident-candidate-search">Search by Resident ID or name</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <Input
                id="resident-candidate-search"
                value={candidateSearch}
                onChange={(event) => {
                  setCandidateSearch(event.target.value)
                  setSelectedId(null)
                  setConfirming(false)
                }}
                placeholder="Resident number or name"
                className="bg-surface pl-9"
                disabled={busy}
              />
            </div>
          </div>

          {searching && <p className="mt-3 text-xs text-ink-muted">Searching this barangay…</p>}
          {!searching && searchError && <p className="mt-3 text-xs text-destructive">{searchError}</p>}

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs leading-relaxed text-ink-muted">
              Bagong Admin-added residents ay inactive muna hanggang ma-link at ma-approve ang
              account.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 shrink-0 bg-surface"
              disabled={searching || busy}
              onClick={() => setRefreshToken((value) => value + 1)}
            >
              {searching ? <Loader2 className="animate-spin" /> : null}
              {searching ? "Refreshing…" : "Refresh matches"}
            </Button>
          </div>

          {!searching && !searchError && candidates.length === 0 && (
            <p className="mt-3 rounded-lg border border-line-soft bg-surface p-3 text-xs leading-relaxed text-ink-muted">
              No Admin-added Resident matches this search. Add the official resident record first,
              then refresh the matches. The application remains pending.
            </p>
          )}

          {candidates.length > 0 && (
            <fieldset className="mt-3 space-y-2" disabled={busy}>
              <legend className="sr-only">Official Resident candidate</legend>
              {candidates.map((candidate) => {
                const isSelected = candidate.id === selectedId
                return (
                  <label
                    key={candidate.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-surface p-3 transition-colors ${
                      isSelected ? "border-brand ring-1 ring-brand" : "border-line-soft hover:border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="resident-candidate"
                      value={candidate.id}
                      checked={isSelected}
                      onChange={() => {
                        setSelectedId(candidate.id)
                        setConfirming(false)
                        setApproveError("")
                      }}
                      className="mt-1 accent-[var(--color-brand)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink-strong">
                        {candidate.fullName}
                      </span>
                      {candidate.qrSuggested && (
                        <span className="mt-1 inline-flex rounded-full bg-info-soft px-2 py-0.5 text-[10px] font-semibold text-info">
                          Suggested by QR reference — select explicitly to continue
                        </span>
                      )}
                      <span className="mt-0.5 block text-xs text-ink-muted tnum">
                        {candidate.residentNumber} · Born {formatAdminDate(candidate.birthdate)} ·{" "}
                        {candidate.purok ?? "Purok not recorded"}
                      </span>
                      {candidate.accountExists && (
                        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-warning">
                          <ShieldAlert className="size-3" /> An account is already linked. This
                          candidate cannot receive another account.
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </fieldset>
          )}

          {selected && (
            <div className="mt-3 rounded-lg border border-line-soft bg-surface p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                Official record selected
              </p>
              <div className="mt-2">
                <InfoGrid
                  items={[
                    { label: "Resident ID", value: selected.residentNumber },
                    { label: "Official Name", value: selected.fullName },
                    { label: "Birthdate", value: formatAdminDate(selected.birthdate) },
                    { label: "Email on record", value: selected.email ?? "—" },
                    {
                      label: "Account linkage",
                      value: selected.accountExists ? "Already linked" : "No account",
                    },
                    { label: "Resident status", value: selected.status },
                  ]}
                />
              </div>
            </div>
          )}
        </section>

        {approveError && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-canvas/60 px-3 py-2 text-sm text-destructive">
            {approveError}
          </p>
        )}

        {confirming && selected && (
          <p className="rounded-lg border border-info/30 bg-info-soft px-3 py-2 text-sm text-info">
            Link {fullNameOf(registration)} to the selected official Resident record? This will
            create portal access without changing the Resident's existing identity or QR record.
          </p>
        )}

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
            Identity Verification
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Private registration documents. Only authorized barangay administrators can open these
            files.
          </p>
          <div className="mt-3">
            <RegistrationDocuments documents={registration.documents} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="bg-surface" disabled={busy} onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={onReject}
          >
            Reject
          </Button>
          {isPending && (
            <Button
              type="button"
              variant="outline"
              className="bg-warning-soft text-warning hover:bg-warning-soft/80"
              disabled={busy}
              onClick={onRequestCorrection}
            >
              Request Correction
            </Button>
          )}
          {confirming ? (
            <>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={busy || !canLink} onClick={submitLink}>
                {busy ? "Approving…" : "Confirm link"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={!canLink}
              onClick={() => setConfirming(true)}
            >
              Confirm Resident Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
