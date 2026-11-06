/**
 * Resident portal — about.
 *
 * `resources/js/pages/Resident/About.tsx` takes no props at all: every line here
 * is static. The barangay identity comes from the same mock the rest of the
 * portal is demoed against, so the page cannot drift from the records behind it.
 */
import type { ReactNode } from "react"
import {
  Building2,
  Check,
  CircleHelp,
  FileText,
  MapPin,
  Megaphone,
  MessageCircle,
  Scale,
  Shield,
  UserRound,
} from "lucide-react"

import { Meta, Panel, PanelContent } from "@/components/Panel"
import { barangay } from "@/mock/data"

const SERVICES: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <FileText className="size-[18px]" />,
    title: "Request Certificates",
    description: "Request barangay certificates and track their status.",
  },
  {
    icon: <Scale className="size-[18px]" />,
    title: "File a Complaint",
    description: "Submit a Lupon complaint and monitor case progress.",
  },
  {
    icon: <Megaphone className="size-[18px]" />,
    title: "View Announcements",
    description: "Stay updated with barangay news, advisories, and events.",
  },
  {
    icon: <span className="text-base leading-none font-semibold">₱</span>,
    title: "Track Disbursement",
    description: "View assistance or benefits assigned to your account.",
  },
  {
    icon: <UserRound className="size-[18px]" />,
    title: "Access My Profile",
    description: "View resident information and your digital QR code.",
  },
  {
    icon: <MessageCircle className="size-[18px]" />,
    title: "KaBarangay Assistant",
    description: "Get guided help with supported resident services.",
  },
]

/** The cards that open with an icon tile beside the heading, like the reference. */
function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: typeof MapPin
  title: string
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
        <Icon className="size-[18px]" />
      </span>
      <h2 className="text-sm font-semibold tracking-tight text-ink-strong">{title}</h2>
    </div>
  )
}

export default function About() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink-strong">About KaBarangay</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Learn more about KaBarangay and the services available through the Resident Portal.
        </p>
      </header>

      <Panel>
        <PanelContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Building2 className="size-7" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-ink-strong">
              KaBarangay Resident Portal
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink">
              KaBarangay is a digital resident portal designed to make barangay services easier,
              faster, and more accessible. Residents can access selected barangay services, monitor
              requests, receive updates, and manage their resident account in one place.
            </p>
          </div>
        </PanelContent>
      </Panel>

      <Panel>
        <div className="px-5 pt-5">
          <h2 className="text-sm font-semibold tracking-tight text-ink-strong">What You Can Do</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Services currently available in the Resident Portal.
          </p>
        </div>
        <PanelContent className="grid gap-3 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="flex items-start gap-3 rounded-xl border border-line-soft bg-canvas p-4"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line-soft bg-surface text-brand shadow-card">
                {service.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-strong">{service.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{service.description}</p>
              </div>
            </div>
          ))}
        </PanelContent>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionHeading icon={MapPin} title="Barangay Information" />
          <PanelContent className="grid gap-4 sm:grid-cols-2">
            <Meta label="Barangay">{barangay.name}</Meta>
            <Meta label="City / Municipality">{barangay.city}</Meta>
            <Meta label="Province">{barangay.province}</Meta>
          </PanelContent>
        </Panel>

        <Panel>
          <SectionHeading icon={Shield} title="Privacy & Security" />
          <PanelContent className="space-y-3">
            <p className="text-sm leading-relaxed text-ink">
              Resident information is intended only for authorized barangay services, verification,
              and official transactions. Access to personal records should be limited to authorized
              users.
            </p>
            <div className="flex items-start gap-2 rounded-xl border border-brand-muted bg-brand-soft p-3">
              <Check className="mt-0.5 size-4 shrink-0 text-brand" />
              <p className="text-xs leading-relaxed text-ink">
                Your QR code should use a secure resident identifier instead of directly storing
                sensitive personal details.
              </p>
            </div>
          </PanelContent>
        </Panel>
      </div>

      <Panel>
        <PanelContent className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <CircleHelp className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-ink-strong">Need Help?</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-muted">
              You may visit the barangay office for assistance or use KaBarangay Assistant while
              using the Resident Portal.
            </p>
          </div>
        </PanelContent>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-2 px-4 py-3 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>KaBarangay Resident Portal</p>
          <p>Version 1.0</p>
        </div>
      </Panel>
    </div>
  )
}
