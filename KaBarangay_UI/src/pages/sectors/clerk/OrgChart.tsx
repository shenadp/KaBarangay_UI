import OrgChartManagement from "@/components/org-chart/OrgChartManagement"

/** The Clerk half of the backend's one `OrgChart/Management` page. */
export default function ClerkOrgChart() {
  return <OrgChartManagement portal="clerk" />
}
