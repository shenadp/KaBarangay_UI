import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, QrCode, ScanLine, X } from "lucide-react"

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
import {
  staffAssignments,
  staffDepartments,
  type EligibleResident,
  type StaffAssignment,
} from "@/mock/admin/staff"

/** The two fields the backend validates; the resident arrives through the picker. */
const staffFormSchema = z.object({
  residentId: z.string(),
  department: z.string().min(1, "Select a department"),
  position: z
    .string()
    .trim()
    .min(1, "Position is required")
    .max(100, "Use at most 100 characters"),
})

type FormValues = z.infer<typeof staffFormSchema>

const emptyValues: FormValues = { residentId: "", department: "", position: "" }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `null` opens the dialog in create mode. */
  assignment: StaffAssignment | null
  onSaved: (message: string) => void
}

/**
 * The simulated camera. No decoding happens here — the operator reads the
 * credential printed under the QR sticker and hands it to the same resolver
 * the scan endpoint uses, which also accepts a whole verification URL.
 */
function ScannerPanel({ onToken }: { onToken: (token: string) => void }) {
  const [token, setToken] = useState("")

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-line-soft bg-canvas/60 p-3.5">
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-lg border border-line-soft bg-surface">
        <span className="absolute left-3 top-3 size-5 rounded-tl border-l-2 border-t-2 border-brand" />
        <span className="absolute right-3 top-3 size-5 rounded-tr border-r-2 border-t-2 border-brand" />
        <span className="absolute bottom-3 left-3 size-5 rounded-bl border-b-2 border-l-2 border-brand" />
        <span className="absolute right-3 bottom-3 size-5 rounded-br border-r-2 border-b-2 border-brand" />
        <span className="absolute left-8 right-8 top-1/2 h-px animate-pulse bg-brand/60" />
        <span className="flex items-center gap-2 text-xs text-ink-muted">
          <ScanLine className="size-4 text-brand" />
          Camera decoding is simulated in this demo
        </span>
      </div>

      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor="staff-qr-token" className="text-[11px] font-medium text-ink-muted">
            Credential under the QR code
          </label>
          <Input
            id="staff-qr-token"
            className="bg-surface"
            placeholder="KBQR-000171-2026 or BSI-RES-000171"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="h-9 shrink-0"
          disabled={token.trim().length === 0}
          onClick={() => onToken(token)}
        >
          Read credential
        </Button>
      </div>
    </div>
  )
}

export default function AssignStaffDialog({ open, onOpenChange, assignment, onSaved }: Props) {
  const editing = assignment

  const [residentQuery, setResidentQuery] = useState("")
  const [residents, setResidents] = useState<EligibleResident[]>([])
  const [selected, setSelected] = useState<Pick<EligibleResident, "id" | "name" | "residentNumber"> | null>(
    null,
  )
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [lookupError, setLookupError] = useState("")
  const [busy, setBusy] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: emptyValues,
  })

  /* Opening always starts from a clean form, primed from the row when editing. */
  useEffect(() => {
    if (!open) return
    setResidentQuery(editing ? editing.residentName : "")
    setResidents([])
    setSelected(
      editing
        ? {
            id: editing.residentId,
            name: editing.residentName,
            residentNumber: editing.residentNumber,
          }
        : null,
    )
    setSearching(false)
    setSearched(false)
    setScanning(false)
    setLookupError("")
    setBusy(false)
    form.reset(
      editing
        ? {
            residentId: String(editing.residentId),
            department: editing.department,
            position: editing.position,
          }
        : emptyValues,
    )
  }, [open, editing, form])

  /* Two characters and a quarter-second before the suggestion list fills. */
  useEffect(() => {
    if (!open || editing || selected || residentQuery.trim().length < 2) {
      setResidents([])
      setSearching(false)
      return
    }
    setSearching(true)
    setSearched(false)
    const timer = window.setTimeout(() => {
      setResidents(staffAssignments.searchResidents(residentQuery))
      setSearched(true)
      setSearching(false)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [open, residentQuery, selected, editing])

  const selectResident = (resident: EligibleResident) => {
    setSelected(resident)
    setResidentQuery(resident.name)
    setResidents([])
    setLookupError("")
    form.setValue("residentId", String(resident.id))
    form.clearErrors("residentId")
  }

  /**
   * A scan resolves the credential, then re-checks eligibility — a valid QR
   * alone is not enough to be given a role.
   */
  const readCredential = (token: string) => {
    const result = staffAssignments.residentFromQrToken(token)
    if (!result.ok) {
      setLookupError(result.message)
      return
    }
    selectResident(result.resident)
    setScanning(false)
  }

  const close = () => {
    if (!busy) onOpenChange(false)
  }

  const handleSubmit = (values: FormValues) => {
    if (!editing && !selected) {
      form.setError("residentId", {
        message: "Select a resident from the suggestions or scan their QR code.",
      })
      return
    }

    setBusy(true)
    window.setTimeout(() => {
      const result = editing
        ? staffAssignments.update(editing.id, values.department, values.position)
        : staffAssignments.assign(Number(values.residentId), values.department, values.position)
      setBusy(false)

      if (!result.ok) {
        // The server puts the clash under the department and everything else
        // under the resident, and the form re-displays it in place.
        form.setError(result.field === "department" ? "department" : "residentId", {
          message: result.message,
        })
        return
      }

      onSaved(result.message)
      onOpenChange(false)
    }, 500)
  }

  /** A stored department outside the fixed list stays selectable while editing. */
  const legacy =
    editing && !staffDepartments.some((item) => item.value === editing.department)
      ? { value: editing.department, label: editing.departmentLabel }
      : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onOpenChange(false)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit staff assignment" : "Assign new staff"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Change the department and position. The resident and the account behind this assignment stay the same."
              : "Give an official resident record a department, a position, and the login role that comes with it."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="residentId"
                render={() => (
                  <FormItem>
                    <FormLabel>Resident</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="off"
                        className="bg-surface"
                        disabled={!!editing}
                        placeholder="Type a name or resident number"
                        value={residentQuery}
                        onChange={(event) => {
                          setResidentQuery(event.target.value)
                          setSelected(null)
                          setResidents([])
                          setSearched(false)
                          setLookupError("")
                          form.setValue("residentId", "")
                          form.clearErrors("residentId")
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!selected && searching && (
                <p role="status" className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <Loader2 className="size-3.5 animate-spin" /> Searching residents…
                </p>
              )}

              {!selected && residents.length > 0 && (
                <div
                  aria-label="Resident suggestions"
                  className="max-h-48 overflow-y-auto rounded-lg border border-line-soft"
                >
                  {residents.map((resident) => (
                    <button
                      key={resident.id}
                      type="button"
                      onClick={() => selectResident(resident)}
                      className="block w-full border-b border-line-soft bg-surface px-3 py-2 text-left text-sm text-ink last:border-b-0 transition-colors hover:bg-brand-soft"
                    >
                      <span className="block font-medium text-ink-strong">{resident.name}</span>
                      <span className="text-xs text-ink-muted tnum">{resident.residentNumber}</span>
                    </button>
                  ))}
                </div>
              )}

              {!selected && searched && !searching && residents.length === 0 && (
                <p className="text-xs text-ink-muted">
                  No eligible resident found. An active resident account and linked user are required.
                </p>
              )}

              {selected && (
                <p className="text-xs font-medium text-success">
                  Selected: {selected.name} · {selected.residentNumber}
                </p>
              )}

              {!editing && (
                <button
                  type="button"
                  onClick={() => {
                    setScanning((current) => !current)
                    setLookupError("")
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft"
                >
                  {scanning ? <X className="size-3.5" /> : <QrCode className="size-3.5" />}
                  {scanning ? "Close scanner" : "Scan resident QR"}
                </button>
              )}

              {scanning && <ScannerPanel onToken={readCredential} />}

              {lookupError && (
                <p role="alert" className="text-xs text-destructive">
                  {lookupError}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      // The position follows the department, even mid-edit.
                      form.setValue(
                        "position",
                        staffDepartments.find((item) => item.value === value)?.position ?? "",
                      )
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-surface">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staffDepartments.map((department) => (
                        <SelectItem key={department.value} value={department.value}>
                          {department.label}
                        </SelectItem>
                      ))}
                      {legacy && <SelectItem value={legacy.value}>{legacy.label}</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-surface"
                      placeholder="e.g. Barangay Clerk"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" className="bg-surface" disabled={busy} onClick={close}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-9" disabled={busy}>
                {busy ? "Saving…" : editing ? "Save assignment" : "Assign staff"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
