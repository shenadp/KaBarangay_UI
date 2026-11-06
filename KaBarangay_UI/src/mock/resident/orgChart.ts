/**
 * Resident portal — the published organizational chart.
 *
 * `Resident/OrgChartController::index()` of commit b6030a08 asks for exactly one
 * slice of the staff chart: rows whose status is `published`, ordered by title,
 * assembled into the tree by the shared `chartTree` builder. Nothing is fetched
 * at runtime — the rows come from `orgChartStore`, so publishing a position at
 * the clerk desk is immediately what this portal shows (and an un-publish takes
 * it away).
 */

import { buildOrgChartTree, orgChartStore, type OrgChartNode } from "@/mock/orgChart"

/** `where('status','published')->orderBy('title')` then `chartTree()`. */
export function residentOrgChartTree(): OrgChartNode[] {
  const published = orgChartStore
    .list()
    .filter((position) => position.status === "published")
    .sort((a, b) => a.title.localeCompare(b.title))

  return buildOrgChartTree(published)
}
