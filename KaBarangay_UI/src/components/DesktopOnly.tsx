import { MonitorSmartphone } from "lucide-react"

/**
 * Admin and sector desks are desktop-only by requirement. Below `lg` we show
 * this honest notice instead of a broken half-layout.
 */
export default function DesktopOnly() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <MonitorSmartphone className="size-7" />
      </span>
      <div className="max-w-sm space-y-1.5">
        <h1 className="text-lg font-semibold">This portal is desktop-only</h1>
        <p className="text-sm text-ink-muted">
          The KaBarangay admin and sector desks are designed for larger screens. Please open this
          page on a desktop computer, or continue to the resident portal which works on mobile.
        </p>
      </div>
      <a
        href="/resident"
        className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
      >
        Go to resident portal
      </a>
    </div>
  )
}
