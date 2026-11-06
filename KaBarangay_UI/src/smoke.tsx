/**
 * Temporary SSR smoke test: renders every route through the real <App /> so a
 * runtime crash (undefined access, bad import, missing mock) fails the run.
 * Deleted after use — it is not part of the shipped UI.
 */
import { renderToString } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"

import App from "@/App"
import { DEMO_APPLICATION, authenticateApplication } from "@/mock/resident/registration"
import { RESET_PASSWORD_FLASH } from "@/mock/resident/session"

/**
 * `/resident/application/{reference}` only renders for the application this
 * browser session unlocked, so the pass signs in first — the other reference
 * is left unauthenticated and must still render its fallback.
 */
authenticateApplication(DEMO_APPLICATION.reference, DEMO_APPLICATION.password)

const routes: string[] = [
  // auth
  "/login",
  "/resident/login",
  "/resident/register",
  "/resident/register/submitted",
  "/resident/application/access",
  "/resident/application/REG-2026-0314",
  "/resident/application/REG-2026-1042",
  "/resident/forgot-password",
  "/resident/reset-password/demo-token",
  "/resident/email/verify/demo-token",
  "/verify/resident/KBQR-000142-2026",
  "/verify/resident/KBQR-000000-9999",
  // admin
  "/admin",
  "/admin/residents",
  "/admin/announcements/approvals",
  "/admin/sector-applications",
  "/admin/sector-applications/41",
  "/admin/sector-applications/999",
  "/admin/certificates",
  "/admin/sectors",
  "/admin/staff",
  "/admin/audit-log",
  "/admin/reports",
  "/admin/population",
  "/admin/org-chart",
  "/admin/emergency-numbers",
  "/admin/qr-scanner",
  "/admin/settings",
  "/admin/announcements", // removed upstream — must not crash (redirects)
  // clerk
  "/clerk/dashboard",
  "/clerk/certificates",
  "/clerk/certificates/1",
  "/clerk/certificates/iss-1",
  "/clerk/certificates/999",
  "/clerk/updates",
  "/clerk/updates/7",
  "/clerk/updates/999",
  "/clerk/announcements",
  "/clerk/announcements/1",
  "/clerk/announcements/999",
  "/clerk/announcements/1/attendance",
  "/clerk/programs",
  "/clerk/programs/9",
  "/clerk/programs/999",
  "/clerk/announcements/9/attendance",
  "/clerk/disbursements",
  "/clerk/disbursements/1",
  "/clerk/disbursements/999",
  "/clerk/citizen-charter",
  "/clerk/citizen-charter/1",
  "/clerk/citizen-charter/999",
  "/clerk/org-chart",
  // senior
  "/senior/dashboard",
  "/senior/residents",
  "/senior/applications",
  "/senior/applications/create",
  "/senior/applications/1",
  "/senior/applications/999",
  "/senior/announcements",
  "/senior/announcements/1",
  "/senior/announcements/1/attendance",
  "/senior/updates",
  "/senior/updates/1",
  "/senior/updates/999",
  "/senior/programs",
  "/senior/programs/9",
  "/senior/programs/999",
  // pwd
  "/pwd/dashboard",
  "/pwd/residents",
  "/pwd/applications",
  "/pwd/applications/create",
  "/pwd/applications/1",
  "/pwd/applications/999",
  "/pwd/announcements",
  "/pwd/announcements/5",
  "/pwd/announcements/9/attendance",
  "/pwd/updates",
  "/pwd/updates/1",
  "/pwd/updates/999",
  "/pwd/programs",
  "/pwd/programs/9",
  "/pwd/programs/999",
  // lupon
  "/lupon/dashboard",
  "/lupon/complaints",
  "/lupon/cases",
  "/lupon/cases/create",
  "/lupon/cases/999",
  "/lupon/hearings",
  // resident
  "/resident",
  "/resident/certificates",
  "/resident/announcements",
  "/resident/announcements/999",
  "/resident/announcements/clerk-7",
  "/resident/updates",
  "/resident/updates/1",
  "/resident/updates/clerk-13?period=past",
  "/resident/programs",
  "/resident/org-chart",
  "/resident/sector-applications",
  "/resident/sector-applications/61/edit",
  "/resident/sector-applications/54/edit",
  "/resident/sector-applications/999/edit",
  "/resident/lupon",
  "/resident/lupon/cases/7",
  "/resident/lupon/cases/5",
  "/resident/lupon/cases/2",
  "/resident/lupon/cases/9",
  "/resident/lupon/cases/999",
  "/resident/profile",
  "/resident/settings",
  "/resident/about",
  "/resident/citizen-charter",
  "/resident/citizen-charter/1",
  "/resident/citizen-charter/999",
  "/resident/disbursement",
  "/resident/disbursement/1",
  "/resident/disbursement/999",
  "/resident/chatbot",
  "/no-such-route",
]

let failed = 0
const failures: string[] = []

/**
 * Routes that only render in the state a later step hands them. `/resident/login`
 * is entered with the flash `completePasswordReset()` redirects with, so the
 * reset hand-off is rendered and not just the bare form.
 */
const stateByRoute: Record<string, unknown> = {
  "/resident/login": { flash: RESET_PASSWORD_FLASH },
}

for (const route of routes) {
  // A route may carry its own query string, which MemoryRouter keeps separate.
  const [pathname, search] = route.split("?")
  try {
    renderToString(
      <MemoryRouter initialEntries={[{ pathname, search: search ? `?${search}` : "", state: stateByRoute[route] }]}>
        <App />
      </MemoryRouter>,
    )
    console.log(`OK   ${route}`)
  } catch (error) {
    failed += 1
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    failures.push(`${route} :: ${message}`)
    console.log(`FAIL ${route} :: ${message}`)
  }
}

console.log("\n---")
console.log(`${routes.length - failed}/${routes.length} routes rendered`)
if (failed > 0) {
  console.log("FAILURES:")
  for (const failure of failures) console.log("  " + failure)
  process.exit(1)
}
