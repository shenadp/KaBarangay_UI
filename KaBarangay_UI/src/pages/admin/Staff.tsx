import { useMemo, useState } from "react"
import { UserRoundPlus } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatusBadge from "@/components/StatusBadge"
import { Panel } from "@/components/Panel"
import { SearchInput, TablePagination } from "@/components/TableTools"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AssignStaffDialog from "@/components/admin/staff/AssignStaffDialog"
import { staffAssignments, staffPageSize, type StaffAssignment } from "@/mock/admin/staff"

/* ------------------------------------------------------------------ */
/* Row styling                                                         */
/* ------------------------------------------------------------------ */

const linkButton =
  "text-xs font-semibold text-brand transition-colors hover:text-ink-strong hover:underline"

const dangerLink =
  "text-xs font-semibold text-destructive transition-colors hover:text-destructive/80 hover:underline"

/** A staff row is an assignment, not an account — the table has no account columns. */
function AssignmentRow({
  assignment,
  onEdit,
  onDeactivate,
}: {
  assignment: StaffAssignment
  onEdit: () => void
  onDeactivate: () => void
}) {
  return (
    <TableRow>
      <TableCell className="pl-5">
        <p className="text-sm font-semibold text-ink-strong">{assignment.residentName}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{assignment.userEmail}</p>
        <p className="text-xs text-ink-faint tnum">{assignment.residentNumber}</p>
      </TableCell>
      <TableCell className="text-sm font-medium text-ink">{assignment.position}</TableCell>
      <TableCell className="text-sm text-ink-muted">
        {assignment.departmentLabel || assignment.department}
      </TableCell>
      <TableCell>
        <StatusBadge
          status={assignment.isActive ? "Active" : "Inactive"}
          tone={assignment.isActive ? "success" : "neutral"}
        />
      </TableCell>
      <TableCell className="pr-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 whitespace-nowrap">
          <button type="button" className={linkButton} onClick={onEdit}>
            Edit
          </button>
          {/* One-way: the backend has no reactivate route, so the link is gone. */}
          {assignment.isActive && (
            <button type="button" className={dangerLink} onClick={onDeactivate}>
              Deactivate
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                              */
/* ------------------------------------------------------------------ */

export default function AdminStaff() {
  /** Bumping the revision re-reads the store, the way a partial reload does. */
  const [revision, setRevision] = useState(0)
  const sync = () => setRevision((current) => current + 1)

  /** The search only runs when the form is submitted, and it resets the page. */
  const [query, setQuery] = useState("")
  const [needle, setNeedle] = useState("")
  const [page, setPage] = useState(1)

  /** The page prints its own confirmation; it never shows the server flash. */
  const [success, setSuccess] = useState("")
  const [lockout, setLockout] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<StaffAssignment | null>(null)

  /** Reads are re-derived on submit and after every write, like a partial reload. */
  const rows = useMemo(() => staffAssignments.search(needle), [needle, revision])

  const lastPage = Math.max(1, Math.ceil(rows.length / staffPageSize))
  const currentPage = Math.min(page, lastPage)
  const start = (currentPage - 1) * staffPageSize
  const pageRows = rows.slice(start, start + staffPageSize)

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (assignment: StaffAssignment) => {
    setEditing(assignment)
    setDialogOpen(true)
  }

  const deactivate = (assignment: StaffAssignment) => {
    const result = staffAssignments.deactivate(assignment.id)
    sync()

    // The reference flashes nothing the page reads, but revoking the
    // assignment that carries your own role is worth saying out loud.
    if (result.selfAccessRevoked)
      setLockout(
        "You deactivated the Barangay Administration assignment that grants this account its admin role. There is no route to reactivate a staff assignment — access returns only when the department is assigned again.",
      )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Barangay Staff"
        description="Staff members, positions, and department assignments in your barangay."
        actions={
          <Button size="sm" className="h-9" onClick={openCreate}>
            <UserRoundPlus className="size-4" /> Assign new staff
          </Button>
        }
      />

      {success && (
        <p role="status" className="rounded-xl border border-line-soft bg-success-soft px-4 py-3 text-sm text-success">
          {success}
        </p>
      )}

      {lockout && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-canvas/60 px-4 py-3 text-sm text-destructive">
          {lockout}
        </p>
      )}

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          setNeedle(query.trim())
          setPage(1)
        }}
      >
        <SearchInput
          className="min-w-0 flex-1 sm:max-w-md"
          value={query}
          onChange={setQuery}
          placeholder="Search staff, position, or department…"
        />
        <Button type="submit" size="sm" variant="outline" className="h-9 bg-surface font-semibold">
          Search
        </Button>
      </form>

      <Panel>
        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Staff member</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  onEdit={() => openEdit(assignment)}
                  onDeactivate={() => deactivate(assignment)}
                />
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-ink-muted">
                    No staff assignments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {rows.length === 0 ? (
          <div className="border-t border-line-soft px-5 py-3 text-xs text-ink-muted">0 assignments</div>
        ) : (
          <TablePagination
            page={currentPage}
            pageSize={staffPageSize}
            total={rows.length}
            label="assignments"
            onPageChange={setPage}
          />
        )}
      </Panel>

      <AssignStaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assignment={editing}
        onSaved={(message) => {
          setSuccess(message)
          sync()
        }}
      />
    </div>
  )
}
