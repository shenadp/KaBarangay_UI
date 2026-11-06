import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type DefaultValues } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, CalendarDays, LoaderCircle, NotebookPen, Scale } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatusBadge from "@/components/StatusBadge"
import { Meta, Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  TODAY,
  caseTone,
  formatDate,
  formatPeso,
  luponCases,
  nextHearingDate,
  settlementTypes,
  type CaseStatus,
  type LuponCase,
  type Settlement,
} from "@/mock/luponExtras"

type StatusAction = {
  status: CaseStatus
  label: string
  note: string
}

const statusActions: StatusAction[] = [
  {
    status: "For Mediation",
    label: "Set for mediation",
    note: "The Lupon will meet both parties to explore an amicable settlement.",
  },
  {
    status: "For Hearing",
    label: "Set for hearing",
    note: "Mediation did not resolve the dispute — a formal hearing is scheduled next.",
  },
  {
    status: "Settled",
    label: "Mark settled",
    note: "Both parties signed an amicable settlement and the case is closed.",
  },
  {
    status: "Referred",
    label: "Refer to BPATS",
    note: "The matter is endorsed outside the Lupon for action by BPATS.",
  },
]

const settlementSchema = z.object({
  type: z.string().min(1, "Select a settlement type"),
  amount: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^[0-9,]+(\.[0-9]{1,2})?$/.test(value),
      "Use digits only, e.g. 8500",
    ),
  signedOn: z
    .string()
    .min(1, "Date of signing is required")
    .refine((value) => value <= TODAY, "The signing date cannot be in the future"),
  terms: z.string().trim().min(30, "Record the agreed terms in at least 30 characters"),
})
type SettlementValues = z.infer<typeof settlementSchema>

const settlementDefaults: DefaultValues<SettlementValues> = {
  type: "Amicable Settlement",
  amount: "",
  signedOn: TODAY,
  terms: "",
}

export default function LuponCaseDetail() {
  const { id } = useParams<{ id: string }>()
  const [cases, setCases] = useState<LuponCase[]>(luponCases)
  const [pending, setPending] = useState<StatusAction | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(false)

  // Unknown ids fall back to the first record so the desk never hits a dead end.
  const current = cases.find((record) => record.id === id) ?? cases[0]
  const next = nextHearingDate(current)

  const applyStatus = (action: StatusAction) => {
    setConfirming(true)
    // UI-only: replaced by the case status endpoint on integration.
    window.setTimeout(() => {
      setCases((recordList) =>
        recordList.map((record) =>
          record.id === current.id
            ? {
                ...record,
                status: action.status,
                activity: [
                  {
                    id: `act-${record.id}-${record.activity.length + 1}`,
                    actor: "Felix M. Aquino",
                    action: `${action.label} — status set to ${action.status}`,
                    time: "Just now",
                  },
                  ...record.activity,
                ],
              }
            : record,
        ),
      )
      setConfirming(false)
      setPending(null)
    }, 600)
  }

  const saveSettlement = (values: SettlementValues) => {
    const settlement: Settlement = {
      type: values.type as Settlement["type"],
      terms: values.terms,
      amount: values.amount,
      signedOn: values.signedOn,
    }
    setCases((recordList) =>
      recordList.map((record) =>
        record.id === current.id
          ? {
              ...record,
              settlement,
              status: "Settled",
              activity: [
                {
                  id: `act-${record.id}-${record.activity.length + 1}`,
                  actor: "Felix M. Aquino",
                  action: `Recorded ${settlement.type.toLowerCase()} signed on ${formatDate(settlement.signedOn)}`,
                  time: "Just now",
                },
                ...record.activity,
              ],
            }
          : record,
      ),
    )
    setSettlementOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          to="/lupon/cases"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink-strong"
        >
          <ArrowLeft className="size-4" /> Back to case docket
        </Link>

        <PageHeader
          eyebrow="Lupon Tagapamayapa"
          title={current.caseNumber ?? current.complaintRef ?? "Case record"}
          description={`${current.nature} · filed ${formatDate(current.filed)} · ${current.purok}, ${current.barangay}`}
          actions={
            <>
              <StatusBadge status={current.status} tone={caseTone[current.status]} />
              {statusActions.map((action) => (
                <Button
                  key={action.status}
                  type="button"
                  size="xs"
                  variant="outline"
                  className="bg-surface"
                  disabled={current.status === action.status || confirming}
                  onClick={() => setPending(action)}
                >
                  {action.label}
                </Button>
              ))}
            </>
          }
        />
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Case summary</PanelTitle>
            <PanelDescription>
              {current.complaintRef
                ? `Promoted from complaint ${current.complaintRef}`
                : "Walk-in encoding — no originating online complaint"}
            </PanelDescription>
          </div>
          <StatusBadge status={current.status} tone={caseTone[current.status]} />
        </PanelHeader>
        <PanelContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="Case number">
              <span className="tnum">{current.caseNumber ?? "Not yet promoted"}</span>
            </Meta>
            <Meta label="Nature of dispute">{current.nature}</Meta>
            <Meta label="Date filed">
              <span className="tnum">{formatDate(current.filed)}</span>
            </Meta>
            <Meta label="Venue">{current.venue}</Meta>
            <Meta label="Purok">{current.purok}</Meta>
            <Meta label="Barangay">{current.barangay}</Meta>
            <Meta label="Next hearing">
              <span className="tnum">{next ? formatDate(next) : "To be scheduled"}</span>
            </Meta>
            <Meta label="Hearings held">
              <span className="tnum">
                {current.hearings.filter((hearing) => hearing.status === "Completed").length} of{" "}
                {current.hearings.length}
              </span>
            </Meta>
          </div>

          <div className="rounded-xl border border-line-soft bg-canvas/60 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
              Statement of the dispute
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{current.description}</p>
          </div>
        </PanelContent>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Parties to the case</PanelTitle>
                <PanelDescription>
                  Complainant and respondent as entered on the docket
                </PanelDescription>
              </div>
              <span className="text-xs text-ink-faint tnum">{current.parties.length} parties</span>
            </PanelHeader>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Role</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="pr-5">Counsel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.parties.map((party) => (
                  <TableRow key={party.id}>
                    <TableCell className="pl-5">
                      <span
                        className={
                          party.role === "Complainant"
                            ? "inline-flex rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand"
                            : "inline-flex rounded-full bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-ink-muted ring-1 ring-inset ring-line-soft"
                        }
                      >
                        {party.role}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-ink-strong">{party.name}</TableCell>
                    <TableCell className="text-ink-muted">{party.address}</TableCell>
                    <TableCell className="text-ink-muted tnum">{party.contact}</TableCell>
                    <TableCell className="pr-5 text-ink-muted">{party.counsel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Hearing history</PanelTitle>
                <PanelDescription>Mediation and conciliation proceedings on record</PanelDescription>
              </div>
              <span className="text-xs text-ink-faint tnum">{current.hearings.length} entries</span>
            </PanelHeader>
            <PanelContent>
              {current.hearings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line-soft px-6 py-10 text-center">
                  <span className="mx-auto grid size-11 place-items-center rounded-full bg-canvas text-ink-faint">
                    <CalendarDays className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink-strong">
                    No hearing scheduled yet
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-muted">
                    Schedule the first mediation session from the case docket to start the
                    15-day period.
                  </p>
                </div>
              ) : (
                <ol>
                  {current.hearings.map((hearing, index) => (
                    <li key={hearing.id} className="flex gap-3 pb-5 last:pb-0">
                      <div className="flex flex-col items-center">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand tnum">
                          {hearing.hearingNo}
                        </span>
                        {index < current.hearings.length - 1 && (
                          <span className="mt-2 w-px flex-1 bg-line-soft" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 rounded-xl border border-line-soft bg-canvas/60 p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink-strong tnum">
                            {formatDate(hearing.date)} · {hearing.time}
                          </p>
                          <StatusBadge status={hearing.status} />
                        </div>
                        <div className="mt-2.5 grid gap-2 text-xs sm:grid-cols-3">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                              Type & venue
                            </p>
                            <p className="mt-0.5 text-ink">
                              {hearing.type} · {hearing.venue}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                              Attendance
                            </p>
                            <p className="mt-0.5 text-ink">{hearing.attendance}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                              Outcome
                            </p>
                            <p className="mt-0.5 text-ink">{hearing.outcome}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </PanelContent>
          </Panel>

          {current.status === "Settled" && (
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Settlement & resolution</PanelTitle>
                  <PanelDescription>
                    Amicable settlement signed by both parties before the Lupon
                  </PanelDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 bg-surface"
                  onClick={() => setSettlementOpen(true)}
                >
                  <NotebookPen className="size-4" />
                  {current.settlement ? "Edit settlement" : "Draft settlement"}
                </Button>
              </PanelHeader>
              <PanelContent>
                {current.settlement ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Meta label="Settlement type">{current.settlement.type}</Meta>
                      <Meta label="Amount agreed">
                        <span className="tnum">{formatPeso(current.settlement.amount)}</span>
                      </Meta>
                      <Meta label="Signed on">
                        <span className="tnum">{formatDate(current.settlement.signedOn)}</span>
                      </Meta>
                    </div>
                    <div className="rounded-xl border border-line-soft bg-canvas/60 p-4">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                        Agreed terms
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink">
                        {current.settlement.terms}
                      </p>
                    </div>
                    <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
                      Signed by both parties — keep the original in the case folder.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-line-soft px-6 py-8 text-center">
                    <p className="text-sm font-semibold text-ink-strong">
                      No settlement recorded yet
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
                      The case is marked settled, but the terms are not on file. Draft the
                      settlement to record the terms, amount and date of signing.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-4"
                      onClick={() => setSettlementOpen(true)}
                    >
                      <NotebookPen className="size-4" /> Draft settlement
                    </Button>
                  </div>
                )}
              </PanelContent>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Activity log</PanelTitle>
                <PanelDescription>Everything done to this case, newest first</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent>
              <ol className="space-y-4">
                {current.activity.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                    <div className="min-w-0">
                      <p className="text-[13px] leading-snug text-ink">{entry.action}</p>
                      <p className="mt-0.5 text-[11px] text-ink-faint tnum">
                        {entry.actor} · {entry.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </PanelContent>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Where it stands</PanelTitle>
                <PanelDescription>Next step for this case</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-canvas/60 px-3 py-2.5">
                <span className="text-xs text-ink-muted">Current status</span>
                <StatusBadge status={current.status} tone={caseTone[current.status]} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-canvas/60 px-3 py-2.5">
                <span className="text-xs text-ink-muted">Next hearing</span>
                <span className="text-sm font-medium text-ink-strong tnum">
                  {next ? formatDate(next) : "None set"}
                </span>
              </div>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-faint">
                <Scale className="mt-0.5 size-3.5 shrink-0 text-brand" />
                {current.status === "Settled"
                  ? "The settlement is binding — file the original and keep a copy for each party."
                  : current.status === "Referred"
                    ? "Referred outside the Lupon — follow up with BPATS for the next action."
                    : "Parties are notified through SMS three days before each scheduled session."}
              </p>
            </PanelContent>
          </Panel>
        </div>
      </div>

      {/* Status confirmation */}
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !confirming) setPending(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>{pending.label}</DialogTitle>
                <DialogDescription>{pending.note}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 rounded-xl border border-line-soft bg-canvas/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-ink-muted">Case</span>
                  <span className="text-sm font-medium text-ink-strong tnum">
                    {current.caseNumber ?? current.complaintRef}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-ink-muted">Current status</span>
                  <StatusBadge status={current.status} tone={caseTone[current.status]} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-ink-muted">New status</span>
                  <StatusBadge status={pending.status} tone={caseTone[pending.status]} />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-surface"
                  disabled={confirming}
                  onClick={() => setPending(null)}
                >
                  Cancel
                </Button>
                <Button type="button" disabled={confirming} onClick={() => applyStatus(pending)}>
                  {confirming ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Confirm change"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Settlement drafting */}
      <SettlementDialog
        open={settlementOpen}
        existing={current.settlement}
        onOpenChange={(open) => {
          if (!open) setSettlementOpen(false)
        }}
        onSaved={saveSettlement}
      />
    </div>
  )
}

function SettlementDialog({
  open,
  existing,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  existing: Settlement | null
  onOpenChange: (open: boolean) => void
  onSaved: (values: SettlementValues) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<SettlementValues>({
    resolver: zodResolver(settlementSchema),
    defaultValues: settlementDefaults,
  })

  const handleOpen = (next: boolean) => {
    onOpenChange(next)
    if (!next) setSubmitting(false)
  }

  // Load the recorded terms whenever the sheet is opened.
  useEffect(() => {
    if (!open) return
    form.reset(
      existing
        ? {
            type: existing.type,
            amount: existing.amount,
            signedOn: existing.signedOn,
            terms: existing.terms,
          }
        : settlementDefaults,
    )
  }, [open])

  const onSubmit = (values: SettlementValues) => {
    setSubmitting(true)
    // UI-only: replaced by the settlements API on integration.
    window.setTimeout(() => {
      onSaved(values)
      setSubmitting(false)
      form.reset(settlementDefaults)
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit settlement" : "Draft settlement"}</DialogTitle>
          <DialogDescription>
            Record the amicable settlement both parties signed before the Lupon.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Settlement type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {settlementTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount agreed (₱)</FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 bg-surface tnum"
                        inputMode="numeric"
                        placeholder="Leave blank if none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="signedOn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of signing</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-10 bg-surface" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agreed terms</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-28 bg-surface text-sm"
                      placeholder="Stipulations, obligations and deadlines agreed by both parties…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="bg-surface"
                onClick={() => handleOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <NotebookPen className="size-4" /> Save settlement
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
