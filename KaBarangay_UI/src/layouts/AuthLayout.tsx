import type { ReactNode } from "react"

import logoUrl from "@/assets/kabarangay-logo.png"
import DesktopOnly from "@/components/DesktopOnly"
import { Logo } from "@/components/Logo"
import { cn } from "@/lib/utils"

type Props = {
  children: ReactNode
  /**
   * "staff" = split-screen brand panel + form, desktop-only (admin / staff),
   * "resident" = the same split-screen on desktop, collapsing to a compact
   * logo + card column on phones — the resident portal is the only side that
   * works on mobile.
   */
  variant: "staff" | "resident"
  maxWidth?: string
  className?: string
}

/**
 * The backdrop behind every form column: a soft brand wash at the top, a
 * hairline dot grid and two oversized rings cropped by the viewport — the same
 * arc that runs under the houses in the mark. Tokens only, no raw hex.
 */
function FormBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[30rem] bg-[linear-gradient(to_bottom,var(--color-brand-muted),var(--color-canvas)_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,var(--color-line)_1px,transparent_1px)] [background-size:22px_22px] opacity-60" />
      <div className="absolute -right-44 -top-52 size-[520px] rounded-full border border-brand/25" />
      <div className="absolute -left-56 -bottom-64 size-[620px] rounded-full border border-brand/25" />
    </div>
  )
}

export default function AuthLayout({
  children,
  variant,
  maxWidth = "max-w-md",
  className,
}: Props) {
  if (variant === "resident") {
    return (
      <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel — desktop only. Phones get the compact logo below. */}
        <div className="relative hidden overflow-hidden bg-[linear-gradient(160deg,var(--color-brand),var(--color-brand-deep))] lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10" />
            <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-white/5" />
            <div className="absolute -right-40 bottom-[-10rem] size-[28rem] rounded-full border border-white/15" />
          </div>

          <div className="relative">
            <img src={logoUrl} alt="KaBarangay" className="h-24 w-auto brightness-0 invert" />
            <p className="mt-4 text-sm text-white/75">Resident Portal</p>
          </div>

          <div className="relative max-w-md">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
              Barangay services, closer to home.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              I-track ang certificate requests, makita ang announcements at programs, at
              makipag-ugnayan sa barangay — lahat mula sa iyong phone.
            </p>
            <ul className="mt-8 space-y-2.5 text-sm text-white/80">
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-white/70" /> Certificate requests and
                tracking
              </li>
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-white/70" /> Notices, updates at programs
              </li>
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-white/70" /> Sector services at lupon
                updates
              </li>
            </ul>
          </div>

          <p className="relative text-xs text-white/55">
            © {new Date().getFullYear()} KaBarangay · Barangay Management System
          </p>
        </div>

        {/* Form side */}
        <div className="relative bg-canvas">
          <FormBackdrop />

          <div className="relative flex min-h-screen flex-col px-5 py-8 lg:items-center lg:justify-center lg:py-10">
            <div className={cn("w-full", maxWidth, className)}>
              <Logo className="mb-8 lg:hidden" />
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="hidden min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel — the one large colour block on the page. */}
        <div className="relative overflow-hidden bg-[linear-gradient(160deg,var(--color-brand),var(--color-brand-deep))] lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10" />
            <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-white/5" />
            <div className="absolute -right-40 bottom-[-10rem] size-[28rem] rounded-full border border-white/15" />
          </div>

          <div className="relative">
            <img src={logoUrl} alt="KaBarangay" className="h-24 w-auto brightness-0 invert" />
            <p className="mt-4 text-sm text-white/75">Barangay Management System</p>
          </div>

          <div className="relative max-w-md">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
              Barangay services, in one tidy place.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              KaBarangay keeps resident records, certificate requests, announcements and blotter
              cases organised for barangay staff — from the clerk's desk to the admin dashboard.
            </p>
            <ul className="mt-8 space-y-2.5 text-sm text-white/80">
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-white/70" /> Certificate request tracking
              </li>
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-white/70" /> Sector desks for clerk,
                senior, PWD and lupon
              </li>
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-white/70" /> Audit log for every action
              </li>
            </ul>
          </div>

          <p className="relative text-xs text-white/55">
            © {new Date().getFullYear()} KaBarangay · Barangay Management System
          </p>
        </div>

        {/* Form side */}
        <div className="relative bg-canvas">
          <FormBackdrop />

          <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10">
            <div className={cn("w-full", maxWidth, className)}>
              {children}

              <p className="mt-6 text-center text-xs text-ink-faint">Authorized personnel only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Below `lg` the staff/admin side is intentionally desktop-only. */}
      <div className="lg:hidden">
        <DesktopOnly />
      </div>
    </>
  )
}
