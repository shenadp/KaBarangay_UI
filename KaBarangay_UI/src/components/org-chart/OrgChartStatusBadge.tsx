import StatusBadge, { type Tone } from "@/components/StatusBadge"
import { orgChartStatusLabel, type OrgChartStatus } from "@/mock/orgChart"

/**
 * The three stored statuses keep one colour language everywhere they appear —
 * the chart nodes, the structure rows and the confirm dialog.
 */
export const orgChartStatusTone: Record<OrgChartStatus, Tone> = {
  draft: "warning",
  published: "success",
  archived: "neutral",
}

export default function OrgChartStatusBadge({
  status,
  className,
}: {
  status: OrgChartStatus
  className?: string
}) {
  return (
    <StatusBadge
      status={orgChartStatusLabel[status]}
      tone={orgChartStatusTone[status]}
      className={className}
    />
  )
}
