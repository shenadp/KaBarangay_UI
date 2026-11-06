import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type DefaultValues } from "react-hook-form"
import { z } from "zod"
import {
  CalendarPlus,
  Eye,
  FileUp,
  FolderOpen,
  Gavel,
  HeartHandshake,
  MoreHorizontal,
  Plus,
  Scale,
} from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import StatusBadge from "@/components/StatusBadge"
import EmptyState from "@/components/EmptyState"
import SegmentedTabs from "@/components/SegmentedTabs"
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { SearchInput, TablePagination, TableToolbar } from "@/components/TableTools"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  TODAY,
  caseNatures,
  caseTone,
  formatDate,
  luponCases,
  nextCaseNumber,
  nextHearingDate,
  puroks,
  timeSlots,
  venues,
  type HearingType,
  type LuponCase,
} from "@/mock/luponExtras"

const PAGE_SIZE = 6

const segments = [
  { label: "All", value: "all" },
  { label: "For mediation", value: "for mediation" },
  { label: "For hearing", value: "for hearing" },
  { label: "Settled", value: "settled" },
  { label: "Referred", value: "referred" },
]

const openStatuses = ["Filed", "For Mediation", "For Hearing"]

/* ------------------------------------------------------------------ */
/* Schemas                                                             */
/* ------------------------------------------------------------------ */

const scheduleSchema = z.object({
  date: z
    .string()
    .min(1, "Hearing date is required")
    .refine((value) => value >= TODAY, "Pick today or a later date"),
  time: z.string().min(1, "Select a time slot"),
  venue: z.string().min(1, "Select a venue"),
})
type ScheduleValues = z.infer<typeof scheduleSchema>

const scheduleDefaults: DefaultValues<ScheduleValues> = {
  date: "",
  time: "",
  venue: "",
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LuponCases() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<LuponCase[]>(luponCases)
  const [segment, setSegment] = useState("all")
  const [query, setQuery] = useState("")
  const [purok, setPurok] = useState("all")
  const [page, setPage] = useState(1)
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const counts = segments.map((entry) => ({
    ...entry,
    count:
      entry.value === "all"
        ? cases.length
        : cases.filter((record) => record.status.toLowerCase() === entry.value).length,
  }))

  const filtered = cases.filter((record) => {
    const matchesSegment = segment === "all" || record.status.toLowerCase() === segment
    const matchesPurok = purok === "all" || record.purok === purok
    const needle = query.trim().toLowerCase()
    const matchesQuery =
      !needle ||
      [
        record.caseNumber ?? "",
        record.complaintRef ?? "",
        record.nature,
        record.purok,
        ...record.parties.map((party) => party.name),
      ].some((value) => value.toLowerCase().includes(needle))
    return matchesSegment && matchesPurok && matchesQuery
  })

  const pageStart = (page - 1) * PAGE_SIZE
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  const openCases = cases.filter((record) => openStatuses.includes(record.status)).length
  const forMediation = cases.filter((record) => record.status === "For Mediation").length
  const settledThisYear = cases.filter((record) => record.status === "Settled").length

  const scheduledCase = cases.find((record) => record.id === scheduleId) ?? null

  const promote = (id: string) => {
    const number = nextCaseNumber(cases)
    setCases((current) =>
      current.map((record) => {
        if (record.id !== id || record.caseNumber !== null) return record
        return {
          ...record,
          caseNumber: number,
          status: "Filed",
          activity: [
            {
              id: `act-${record.id}-${record.activity.length + 1}`,
              actor: "Felix M. Aquino",
              action: `Promoted complaint ${record.complaintRef ?? "—"} to case ${number}`,
              time: "Just now",
            },
            ...record.activity,
          ],
        }
      }),
    )
    setFlash(`Complaint promoted to case ${number} — it now sits on the docket.`)
  }

  const handleScheduled = (id: string, values: ScheduleValues) => {
    const target = cases.find((record) => record.id === id)
    if (!target) return
    const type: HearingType = target.status === "For Hearing" ? "Hearing" : "Mediation"
    setCases((current) =>
      current.map((record) => {
        if (record.id !== id) return record
        const hearing = {
          id: `hr-${record.id}-${record.hearings.length + 1}`,
          hearingNo: record.hearings.length + 1,
          date: values.date,
          time: values.time,
          venue: values.venue,
          type,
          status: "Scheduled" as const,
          attendance: "Awaiting parties" as const,
          outcome: "Pending" as const,
        }
        return {
          ...record,
          hearings: [...record.hearings, hearing],
          activity: [
            {
              id: `act-${record.id}-${record.activity.length + 1}`,
              actor: "Felix M. Aquino",
              action: `Scheduled ${type.toLowerCase()} hearing #${hearing.hearingNo}`,
              time: "Just now",
            },
            ...record.activity,
          ],
        }
      }),
    )
    setFlash(
      `Hearing set for ${formatDate(values.date)} at ${values.time} — ${values.venue}.`,
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lupon Tagapamayapa"
        title="Case docket"
        description="Katarungang Pambarangay cases on record — from complaint intake through mediation, hearing and settlement."
        actions={
          <Button size="sm" className="h-9" onClick={() => navigate("/lupon/cases/create")}>
            <Plus className="size-4" /> New case
          </Button>
        }
      />

      {flash && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line-soft bg-success-soft px-4 py-3">
          <p className="text-sm text-success">{flash}</p>
          <button
            type="button"
            onClick={() => setFlash(null)}
            className="text-xs font-medium text-success/80 hover:text-success"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={FolderOpen}
          label="Open cases"
          value={openCases}
          hint="Awaiting settlement or referral"
        />
        <StatCard
          icon={HeartHandshake}
          label="For mediation"
          value={forMediation}
          hint="First meeting set with the Lupon"
        />
        <StatCard
          icon={Gavel}
          label="Settled this year"
          value={settledThisYear}
          hint="Signed amicable settlements"
        />
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Cases on record</PanelTitle>
            <PanelDescription>
              Promoted complaints and walk-in encodings, newest filing first
            </PanelDescription>
          </div>
          <SegmentedTabs value={segment} onChange={setSegment} segments={counts} />
        </PanelHeader>

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Search case number, party or nature…"
            className="w-full sm:max-w-sm"
          />
          <Select
            value={purok}
            onValueChange={(value) => {
              setPurok(value)
              setPage(1)
            }}
          >
            <SelectTrigger
              className="h-9 rounded-lg bg-surface"
              aria-label="Filter by purok"
            >
              <SelectValue placeholder="All puroks" />
            </SelectTrigger>
            <SelectContent position="popper" align="start" className="min-w-40">
              <SelectItem value="all">All puroks</SelectItem>
              {puroks.map((purokName) => (
                <SelectItem key={purokName} value={purokName}>
                  {purokName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-xs text-ink-muted tnum">
            {filtered.length} of {cases.length} cases
          </p>
        </TableToolbar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No cases in this view"
            description="Nothing matches the current status tab, purok or search — try another filter."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Case</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Nature of dispute</TableHead>
                  <TableHead>Filed</TableHead>
                  <TableHead>Next hearing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((record) => {
                  const complainant = record.parties.find((party) => party.role === "Complainant")
                  const respondent = record.parties.find((party) => party.role === "Respondent")
                  const next = nextHearingDate(record)
                  return (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/lupon/cases/${record.id}`)}
                    >
                      <TableCell className="pl-5 text-ink-muted tnum">
                        {record.caseNumber ?? record.complaintRef}
                        {!record.caseNumber && (
                          <span className="mt-0.5 block text-[11px] text-ink-faint">Intake only</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="leading-tight">
                          <p className="text-sm font-medium text-ink-strong">
                            {complainant?.name ?? "—"}
                          </p>
                          <p className="text-[11px] text-ink-faint">
                            vs {respondent?.name ?? "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[16rem] truncate text-ink">
                        {record.nature}
                      </TableCell>
                      <TableCell className="text-ink-muted tnum">
                        {formatDate(record.filed)}
                      </TableCell>
                      <TableCell className="text-ink-muted tnum">
                        {next ? formatDate(next) : "To be scheduled"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} tone={caseTone[record.status]} />
                      </TableCell>
                      <TableCell
                        className="pr-5 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${record.caseNumber ?? record.complaintRef}`}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-surface">
                            <DropdownMenuLabel className="tnum text-ink-faint">
                              {record.caseNumber ?? record.complaintRef}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => navigate(`/lupon/cases/${record.id}`)}>
                              <Eye className="size-4" /> View case
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={record.caseNumber === null}
                              onSelect={() => setScheduleId(record.id)}
                            >
                              <CalendarPlus className="size-4" /> Schedule hearing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={record.caseNumber !== null}
                              onSelect={() => promote(record.id)}
                            >
                              <FileUp className="size-4" /> Promote from complaint
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPageChange={setPage}
            />
          </>
        )}
      </Panel>

      <ScheduleCaseDialog
        open={scheduleId !== null}
        caseLabel={scheduledCase?.caseNumber ?? ""}
        onOpenChange={(open) => {
          if (!open) setScheduleId(null)
        }}
        onScheduled={(values) => {
          if (scheduleId) handleScheduled(scheduleId, values)
          setScheduleId(null)
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dialogs                                                             */
/* ------------------------------------------------------------------ */


function ScheduleCaseDialog({
  open,
  caseLabel,
  onOpenChange,
  onScheduled,
}: {
  open: boolean
  caseLabel: string
  onOpenChange: (open: boolean) => void
  onScheduled: (values: ScheduleValues) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: scheduleDefaults,
  })

  useEffect(() => {
    if (open) form.reset(scheduleDefaults)
  }, [open])

  const handleOpen = (next: boolean) => {
    onOpenChange(next)
    if (!next) setSubmitting(false)
  }

  const onSubmit = (values: ScheduleValues) => {
    setSubmitting(true)
    // UI-only: replaced by the hearings API on integration.
    window.setTimeout(() => {
      onScheduled(values)
      setSubmitting(false)
      form.reset(scheduleDefaults)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule a hearing</DialogTitle>
          <DialogDescription>
            Parties are notified of the schedule, venue and time of the proceeding.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <p className="rounded-lg border border-line-soft bg-canvas/60 px-3 py-2 text-xs text-ink-muted">
              Case <span className="font-medium text-ink-strong tnum">{caseLabel}</span>
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-10 bg-surface" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a slot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue} value={venue}>
                          {venue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <CalendarPlus className="size-4 animate-pulse" /> Scheduling…
                  </>
                ) : (
                  <>
                    <CalendarPlus className="size-4" /> Schedule
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
