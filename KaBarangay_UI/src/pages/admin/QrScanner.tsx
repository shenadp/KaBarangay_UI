import { useRef, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ScanLine } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import { Panel, PanelContent, PanelFooter } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** The page only ever hands the visitor to this path — nothing is shown here. */
const VERIFICATION_PREFIX = "/verify/resident/"

const INVALID_SCAN_MESSAGE = "This is not a valid KaBarangay resident QR code."

/**
 * The two payloads a KaBarangay sticker can carry: a printed `KBQR-…` token, or
 * a whole verification URL pointing at this same app. Anything else is rejected
 * before the browser is asked to go anywhere, which is also why a relative link
 * rather than `window.location.assign` is used here.
 */
function resolveScan(decoded: string, origin: string): string | null {
  try {
    const scanned = new URL(decoded, origin)

    if (scanned.origin === origin && scanned.pathname.startsWith(VERIFICATION_PREFIX))
      return scanned.pathname + scanned.search + scanned.hash
  } catch {
    // Not a URL — fall through to the raw token branch, as the scanner does.
  }

  if (!decoded.startsWith("KBQR-")) return null

  return `${VERIFICATION_PREFIX}${encodeURIComponent(decoded)}`
}

export default function AdminQrScanner() {
  const navigate = useNavigate()

  /** Camera decoding is simulated, so the operator reads the printed credential. */
  const [credential, setCredential] = useState("")
  const [error, setError] = useState<string | null>(null)

  /** One scan is handled at a time, the way `hasScannedRef` guards the reference. */
  const pending = useRef(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (pending.current) return

    const decoded = credential.trim()

    // The reference resolves against the live origin; the demo has no server, so
    // the current location plays the same part.
    const path = decoded === "" ? null : resolveScan(decoded, window.location.origin)

    if (!path) {
      setError(INVALID_SCAN_MESSAGE)
      return
    }

    pending.current = true
    setError(null)
    navigate(path)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Resident QR Scanner"
        description="Scan a KaBarangay resident QR code to verify the resident."
      />

      <div className="mx-auto w-full max-w-2xl space-y-5">
        <Panel>
          <PanelContent>
            <div className="relative mx-auto flex h-56 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas">
              <span className="absolute left-3 top-3 size-6 rounded-tl border-l-2 border-t-2 border-brand" />
              <span className="absolute right-3 top-3 size-6 rounded-tr border-r-2 border-t-2 border-brand" />
              <span className="absolute bottom-3 left-3 size-6 rounded-bl border-b-2 border-l-2 border-brand" />
              <span className="absolute right-3 bottom-3 size-6 rounded-br border-r-2 border-b-2 border-brand" />
              <span className="absolute left-10 right-10 top-1/2 h-px animate-pulse bg-brand/60" />

              <span className="flex items-center gap-2 text-xs text-ink-muted">
                <ScanLine className="size-4 text-brand" />
                Camera decoding is simulated in this demo
              </span>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="qr-scan-credential">Credential under the QR code</Label>
                <div className="flex gap-2">
                  <Input
                    id="qr-scan-credential"
                    name="credential"
                    autoComplete="off"
                    placeholder="KBQR-000142-2026 or a full verification link"
                    className="font-mono"
                    value={credential}
                    onChange={(event) => {
                      setCredential(event.target.value)
                      if (error) setError(null)
                    }}
                  />
                  <Button type="submit" className="shrink-0">
                    Verify
                  </Button>
                </div>
              </div>
            </form>
          </PanelContent>

          <PanelFooter className="block py-5 text-center">
            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-left">
                <p className="text-sm font-semibold text-destructive">{error}</p>
                <p className="mt-2 text-xs text-destructive/90">
                  Make sure you are scanning a valid KaBarangay resident QR code and that camera
                  permission is enabled.
                </p>
              </div>
            ) : (
              <>
                <span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-success-soft">
                  <span className="size-3 animate-pulse rounded-full bg-success" />
                </span>

                <p className="text-sm font-semibold text-ink-strong">Scanner is ready</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Point the camera at the resident&apos;s QR code.
                </p>
              </>
            )}
          </PanelFooter>
        </Panel>

        <div className="rounded-xl border border-info/30 bg-info-soft p-4">
          <p className="text-sm font-semibold text-info">Verification Information</p>
          <p className="mt-1 text-sm leading-relaxed text-info/90">
            Only active KaBarangay resident QR codes will proceed to the resident verification page.
          </p>
        </div>

        <p className="text-center text-xs leading-relaxed text-ink-muted">
          Do not share or photograph resident information unnecessarily. Use resident verification
          only for authorized barangay purposes.
        </p>
      </div>
    </div>
  )
}
