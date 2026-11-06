import { useState } from "react"
import { ScrollText, ShieldAlert, Users } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import EmptyState from "@/components/EmptyState"
import StatusBadge, { type Tone } from "@/components/StatusBadge"
import { Panel, PanelHeader, PanelTitle } from "@/components/Panel"
import { TablePagination } from "@/components/TableTools"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  auditTrail,
  formatDuration,
  formatEventLabel,
  formatLabel,
  sectorForEvent,
  type AuditPaginator,
  type LoginAttempt,
  type LoginAttemptStatus,
  type SuspiciousAlert,
} from "@/mock/admin/auditLog"

/*
 * The controller still reads the allowlisted `tab` query parameter so legacy
 * `?tab=security` links resolve, but it no longer gates which datasets load:
 * the activity log and both security tables render stacked on one page.
 */

const attemptTone: Record<LoginAttemptStatus, Tone> = {
  success: "info",
  failed: "danger",
  rate_limited: "warning",
}

/** `Showing 1–15 of 26 records`, or the reference's own empty sentence. */
function sectionSummary(
  paginator: AuditPaginator<unknown>,
  unit: string,
  empty: string,
): string {
  if (paginator.total === 0) return empty
  return `Showing ${paginator.from ?? 0}–${paginator.to ?? 0} of ${paginator.total} ${unit}`
}

export default function AdminAuditLog() {
  const [event, setEvent] = useState("")
  const [logsPage, setLogsPage] = useState(1)
  const [attemptsPage, setAttemptsPage] = useState(1)
  const [alertsPage, setAlertsPage] = useState(1)

  const logs = auditTrail.auditPage(event, logsPage)
  const attempts = auditTrail.loginAttemptPage(attemptsPage)
  const alerts = auditTrail.suspiciousAlertPage(alertsPage)

  const hasFilter = event !== ""

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Audit Log"
        description="System activity and security monitoring"
      />

      {/* ---------------------------------------------------------------- */}
      {/* Activity log                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <PanelTitle>Audit Logs</PanelTitle>
            <p className="text-xs text-ink-muted" aria-live="polite">
              {sectionSummary(
                logs,
                hasFilter ? "matching records" : "records",
                hasFilter ? "No records match the current filter." : "No audit records yet.",
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="event-filter" className="text-xs text-ink-muted">
              Event
            </label>
            <Select
              value={event === "" ? "all" : event}
              onValueChange={(value) => {
                setEvent(value === "all" ? "" : value)
                // The filter narrows the audit trail alone, and starts it over.
                setLogsPage(1)
              }}
            >
              <SelectTrigger id="event-filter" size="sm" className="h-9 w-64 bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {auditTrail.events().map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {formatEventLabel(entry)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Panel>
          {logs.data.length === 0 ? (
            <EmptyState
              icon={hasFilter ? Users : ScrollText}
              title={
                hasFilter
                  ? "No audit records match the selected event filter."
                  : "No audit records found yet."
              }
              description={
                hasFilter ? undefined : "Activity will appear here as staff actions are recorded."
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Date/time</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Staff name</TableHead>
                    <TableHead className="pr-5">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.data.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="pl-5 whitespace-nowrap text-ink-muted tnum">
                        {log.createdAt}
                      </TableCell>
                      <TableCell className="text-ink-muted">{sectorForEvent(log.event)}</TableCell>
                      <TableCell>
                        {log.actor ? (
                          <div className="leading-tight">
                            <p className="text-sm font-medium text-ink-strong">{log.actor.name}</p>
                            {log.actor.position && (
                              <p className="mt-0.5 text-[11px] text-ink-faint">
                                {log.actor.position}
                                {log.actor.departmentLabel
                                  ? ` · ${log.actor.departmentLabel}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-ink-faint">System</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-5">
                        <StatusBadge status={formatEventLabel(log.event)} tone="info" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {logs.lastPage > 1 && (
                <TablePagination
                  page={logs.currentPage}
                  pageSize={logs.perPage}
                  total={logs.total}
                  label={hasFilter ? "matching records" : "records"}
                  onPageChange={setLogsPage}
                />
              )}
            </>
          )}
        </Panel>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Security logs                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <PanelTitle>Security Logs</PanelTitle>
          <p className="text-xs text-ink-muted">
            Failed login thresholds and authentication activity
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <PanelTitle>Login Attempts</PanelTitle>
                <p className="text-xs text-ink-muted" aria-live="polite">
                  {sectionSummary(attempts, "attempts", "No login attempts recorded yet.")}
                </p>
              </div>
            </PanelHeader>

            {attempts.data.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No login attempts found."
                description="Attempts will appear here as login activity is recorded."
                className="py-10"
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5">Actor</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="pr-5">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.data.map((attempt) => (
                      <AttemptRow key={attempt.id} attempt={attempt} />
                    ))}
                  </TableBody>
                </Table>

                {attempts.lastPage > 1 && (
                  <TablePagination
                    page={attempts.currentPage}
                    pageSize={attempts.perPage}
                    total={attempts.total}
                    label="attempts"
                    onPageChange={setAttemptsPage}
                  />
                )}
              </>
            )}
          </Panel>

          <Panel>
            <PanelHeader className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <PanelTitle>Suspicious Activity</PanelTitle>
                <p className="text-xs text-ink-muted" aria-live="polite">
                  {sectionSummary(alerts, "alerts", "No suspicious activity detected.")}
                </p>
              </div>
            </PanelHeader>

            {alerts.data.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="No suspicious activity found."
                description="Repeated failed logins will appear here."
                className="py-10"
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5">Detected</TableHead>
                      <TableHead>Alert</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead className="pr-5">Window</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.data.map((alert) => (
                      <AlertRow key={alert.id} alert={alert} />
                    ))}
                  </TableBody>
                </Table>

                {alerts.lastPage > 1 && (
                  <TablePagination
                    page={alerts.currentPage}
                    pageSize={alerts.perPage}
                    total={alerts.total}
                    label="alerts"
                    onPageChange={setAlertsPage}
                  />
                )}
              </>
            )}
          </Panel>
        </div>
      </section>
    </div>
  )
}

/** Staff rows name a position, resident rows never name anyone. */
function AttemptRow({ attempt }: { attempt: LoginAttempt }) {
  return (
    <TableRow>
      <TableCell className="pl-5 text-ink-strong">{attempt.actorLabel || formatLabel(attempt.actorType)}</TableCell>
      <TableCell className="text-ink-muted">{formatLabel(attempt.channel)}</TableCell>
      <TableCell className="whitespace-nowrap text-ink-muted tnum">{attempt.attemptedAt}</TableCell>
      <TableCell className="pr-5">
        <StatusBadge status={formatLabel(attempt.status)} tone={attemptTone[attempt.status]} />
      </TableCell>
    </TableRow>
  )
}

function AlertRow({ alert }: { alert: SuspiciousAlert }) {
  return (
    <TableRow>
      <TableCell className="pl-5 whitespace-nowrap text-ink-muted tnum">{alert.createdAt}</TableCell>
      <TableCell>
        <StatusBadge status={formatLabel(alert.alertType)} tone="danger" />
      </TableCell>
      <TableCell className="text-ink-muted tnum">{alert.attemptCount}</TableCell>
      <TableCell className="pr-5 text-ink-muted">{formatDuration(alert.windowSeconds)}</TableCell>
    </TableRow>
  )
}
