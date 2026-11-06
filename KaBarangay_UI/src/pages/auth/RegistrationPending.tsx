import { Link } from "react-router-dom"
import { Check } from "lucide-react"

import AuthLayout from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/Panel"

/**
 * `Resident/RegistrationPending.tsx` — the interstitial after a successful
 * submission. The backend page takes no props at all: nothing about the
 * application is repeated here, because the applicant has not been approved
 * yet and there is no session to read one from.
 */
export default function RegistrationPending() {
  return (
    <AuthLayout variant="resident">
      <Panel aria-labelledby="registration-submitted-title" className="px-5 py-7 sm:px-7">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-brand">
          <Check className="size-7" strokeWidth={2.5} />
        </span>

        <h1
          id="registration-submitted-title"
          className="mt-4 text-center text-xl font-semibold tracking-tight text-ink-strong"
        >
          Account is waiting for admin approval
        </h1>

        <p className="mt-2.5 text-center text-sm leading-relaxed text-ink-muted">
          Your account application was submitted successfully and is waiting for admin approval.
          Authorized barangay personnel will review your information and documents.
        </p>

        <div className="mt-5 rounded-xl border border-brand/15 bg-brand-soft/40 p-4">
          <h2 className="text-sm font-semibold tracking-tight text-ink-strong">
            Check your email for updates
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Ipapadala sa email address na inilagay mo ang approval, correction request, o desisyon
            ng admin. Tingnan din ang iyong spam folder.
          </p>
        </div>

        <p className="mt-4 text-center text-sm leading-relaxed text-ink-muted">
          You can sign in once your account has been approved. Para sa mga tanong, makipag-ugnayan
          sa administrator ng napili mong barangay.
        </p>

        <Button asChild className="mt-5 h-12 w-full">
          <Link to="/resident/login">Back to Resident Login</Link>
        </Button>
      </Panel>
    </AuthLayout>
  )
}
