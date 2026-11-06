import { useParams } from "react-router-dom"
import { CheckCircle2, XCircle } from "lucide-react"

import AuthLayout from "@/layouts/AuthLayout"
import { Panel } from "@/components/Panel"
import { verifyQrToken } from "@/mock/admin/residents"

/**
 * Public resident verification — `Resident/VerifyResident`.
 *
 * Anyone who scans a resident QR lands here, so the answer is deliberately the
 * validity result and nothing else: no name, no resident number, no barangay.
 * The controller returns `barangay: null` even on success for exactly that
 * reason, and the page keeps the slot it would fill.
 */
export default function VerifyResident() {
  const { token } = useParams()

  const verification = verifyQrToken(token ?? "")

  return (
    <AuthLayout variant="resident">
      <Panel className="overflow-hidden">
        <div className="bg-brand px-6 py-7 text-center text-white">
          <span className="mx-auto mb-3 grid size-16 place-items-center rounded-full bg-surface text-brand">
            {verification.valid ? (
              <CheckCircle2 className="size-8" />
            ) : (
              <XCircle className="size-8" />
            )}
          </span>

          <h1 className="text-xl font-bold tracking-tight">
            {verification.valid ? "Resident Verified" : "Verification Failed"}
          </h1>

          <p className="mt-2 text-sm text-brand-soft">KaBarangay Resident Verification</p>
        </div>

        <div className="px-6 py-7">
          {verification.valid ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-line-soft bg-success-soft p-4 text-center">
                <p className="text-sm font-medium text-success">{verification.message}</p>
                <p className="mt-1 text-xs text-success/80">
                  This QR code is associated with an active resident record.
                </p>
              </div>

              <p className="text-center text-xs leading-relaxed text-ink-muted">
                For privacy, personal details are not displayed on this public verification page.
              </p>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5">
                <p className="text-sm font-semibold text-destructive">{verification.message}</p>
                <p className="mt-2 text-xs leading-relaxed text-destructive/90">
                  The QR code may be invalid, revoked, inactive, or no longer associated with an
                  active resident.
                </p>
              </div>

              <p className="text-sm text-ink-muted">
                Please contact the Barangay Office if you believe this verification result is
                incorrect.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-line-soft bg-canvas px-6 py-4 text-center">
          <p className="text-xs text-ink-muted">KaBarangay • Resident Verification System</p>
        </div>
      </Panel>
    </AuthLayout>
  )
}
