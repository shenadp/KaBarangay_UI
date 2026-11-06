import { useEffect, useState } from "react"
import { ChevronRight, Copy, Megaphone, Phone, ShieldCheck, Siren } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Panel } from "@/components/Panel"
import { cn } from "@/lib/utils"
import {
  barangayHotlines,
  emergencyCategories,
  emergencyCategoryIcon,
  formatPhoneNumber,
  QUICK_CALLS,
  sharedEmergencyContacts,
  splitTanodContacts,
  tanodConcernOptions,
  TANOD_SUBMITTED_MESSAGE,
  type ResidentContact,
} from "@/mock/resident/contacts"

/**
 * The dashboard's assistance block — the two modals `Resident/Dashboard` opens
 * over it. Neither half writes anywhere: the hotlines come from the directory
 * the barangay maintains, and the Tanod form is a preview that only ever
 * confirms itself on screen.
 */

type Tone = "brand" | "urgent"

const TONE = {
  brand: {
    chip: "bg-brand-soft text-brand",
    icon: "bg-brand-soft text-brand",
    phone: "text-brand-deep",
    primary: "bg-brand text-white hover:bg-brand-hover",
    surface: "border-line-soft bg-surface",
    footer: "border-line-soft bg-canvas text-ink-muted",
  },
  urgent: {
    chip: "bg-destructive/10 text-destructive",
    icon: "bg-destructive/10 text-destructive",
    phone: "text-destructive",
    primary: "bg-destructive text-white hover:bg-destructive/90",
    surface: "border-destructive/25 bg-surface",
    footer: "border-destructive/20 bg-destructive/5 text-destructive",
  },
} as const

function ContactActions({ contact, tone }: { contact: ResidentContact; tone: Tone }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)

    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    setCopied(false)
    setCopyError(false)
    try {
      await navigator.clipboard.writeText(contact.phoneNumber)
      setCopied(true)
    } catch {
      setCopyError(true)
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      {contact.canCall && (
        <a
          href={contact.telUri}
          aria-label={`Call ${contact.name} at ${contact.phoneNumber}`}
          title="Open your phone dialer"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
            TONE[tone].primary,
          )}
        >
          <Phone className="size-3.5" />
          Call
        </a>
      )}

      {contact.canSms && (
        <a
          href={contact.smsUri}
          aria-label={`Text ${contact.name} at ${contact.phoneNumber}`}
          title="Open your SMS app; send the message there"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
        >
          Text
        </a>
      )}

      <button
        type="button"
        onClick={handleCopy}
        title="Copy phone number to clipboard"
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-line-soft bg-canvas px-2.5 text-xs font-medium text-ink-muted transition-colors hover:bg-line-soft"
      >
        <Copy className="size-3.5" />
        {copied ? "Copied" : "Copy"}
      </button>

      {copyError && (
        <p role="status" className="w-full text-xs text-destructive">
          Could not copy. Dial or enter {contact.phoneNumber} manually.
        </p>
      )}
    </div>
  )
}

function ContactRow({ contact, tone }: { contact: ResidentContact; tone: Tone }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line-soft bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-strong">{contact.name}</p>
        {contact.label && <p className="mt-0.5 text-xs text-ink-muted">{contact.label}</p>}
        <p className={cn("mt-1 text-sm font-semibold tnum", TONE[tone].phone)}>
          {formatPhoneNumber(contact.phoneNumber)}
        </p>
      </div>
      <ContactActions contact={contact} tone={tone} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tanod                                                               */
/* ------------------------------------------------------------------ */

function TanodDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [showOtherContacts, setShowOtherContacts] = useState(false)
  const [concernType, setConcernType] = useState("")
  const [location, setLocation] = useState("")
  const [details, setDetails] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const hotlines = barangayHotlines()
  const { official, others } = splitTanodContacts(hotlines)

  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md rounded-xl border-line-soft p-0 gap-0">
        <div className="flex items-start gap-3 border-b border-line-soft p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <DialogTitle className="text-base">Request Tanod Assistance</DialogTitle>
            <DialogDescription className="mt-1 text-sm">
              Tell us what happened so the barangay can review your concern.
            </DialogDescription>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {hotlines.length === 0 ? (
            <div className="rounded-xl border border-line-soft bg-canvas p-5 text-center">
              <p className="text-sm font-semibold text-ink-strong">No Tanod hotlines configured</p>
              <p className="mt-1 text-sm text-ink-muted">
                Your barangay has not added Tanod contacts yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line-soft">
              <div className="flex items-start gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Phone className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                    Official Hotline
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-ink-strong">{official?.name}</h3>
                  <p className="mt-1 text-lg font-semibold tnum text-brand-deep">
                    {official ? formatPhoneNumber(official.phoneNumber) : ""}
                  </p>
                </div>
                {official && <ContactActions contact={official} tone="brand" />}
              </div>

              <button
                type="button"
                onClick={() => setShowOtherContacts((current) => !current)}
                aria-expanded={showOtherContacts}
                className="flex min-h-11 w-full items-center justify-between gap-3 border-t border-line-soft bg-canvas px-4 text-left text-sm font-semibold text-brand-deep transition-colors hover:bg-line-soft"
              >
                <span>
                  {showOtherContacts ? "Hide other Tanod contacts" : "View other Tanod contacts"}
                </span>
                <ChevronRight
                  className={cn("size-4 text-ink-faint transition-transform", showOtherContacts && "rotate-90")}
                />
              </button>
            </div>
          )}

          {showOtherContacts && hotlines.length > 0 && (
            <section className="mt-5">
              <h3 className="text-sm font-semibold text-ink-strong">Other Tanod Contacts</h3>
              <p className="mt-1 text-xs text-ink-muted">
                These are backup contacts for key Tanod personnel.
              </p>
              <div className="mt-3 space-y-2">
                {others.length === 0 ? (
                  <p className="text-xs text-ink-muted">No additional Tanod contacts listed.</p>
                ) : (
                  others.map((contact) => (
                    <ContactRow key={contact.id} contact={contact} tone="brand" />
                  ))
                )}
              </div>
            </section>
          )}

          <div className="mt-5 border-t border-line-soft pt-5">
            <h3 className="text-sm font-semibold text-ink-strong">
              Send a Tanod Assistance Request
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              For non-urgent concerns, you can also send a request through KaBarangay.
            </p>
          </div>

          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmitted(true)
            }}
          >
            <div>
              <Label htmlFor="tanod-concern">Concern Type</Label>
              <select
                id="tanod-concern"
                value={concernType}
                onChange={(event) => setConcernType(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand"
              >
                <option value="">Select concern</option>
                {tanodConcernOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="tanod-location">Where is it happening?</Label>
              <Input
                id="tanod-location"
                className="mt-1.5 h-11"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Enter purok, street, or nearby landmark"
              />
            </div>

            <div>
              <Label htmlFor="tanod-details">Tell us what happened</Label>
              <textarea
                id="tanod-details"
                rows={4}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Describe the concern clearly..."
                className="mt-1.5 w-full resize-y rounded-lg border border-line bg-surface p-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand"
              />
            </div>

            {submitted && (
              <p role="status" className="rounded-lg bg-success-soft px-3 py-2 text-xs text-success">
                {TANOD_SUBMITTED_MESSAGE}
              </p>
            )}

            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" className="h-10" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" className="h-10">
                Send Request
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Emergency                                                           */
/* ------------------------------------------------------------------ */

function EmergencyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const contacts = sharedEmergencyContacts()
  const categories = emergencyCategories(contacts)
  const [expanded, setExpanded] = useState(categories[0] ?? "")

  const quickCalls = QUICK_CALLS.flatMap((call) => {
    const contact = contacts.find((item) => item.subCategory === call.subCategory)

    return contact && contact.canCall
      ? [{ key: call.title, icon: call.icon, title: call.title, contact }]
      : []
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md rounded-xl border-line-soft p-0 gap-0">
        <div className="flex items-start gap-3 border-b border-line-soft p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <Siren className="size-5" />
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <DialogTitle className="text-base">Emergency Help</DialogTitle>
            <DialogDescription className="mt-1 text-sm">
              Use this option only for urgent situations that need immediate attention.
            </DialogDescription>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {contacts.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-line-soft bg-canvas p-5 text-center">
                <p className="text-sm font-semibold text-ink-strong">
                  No verified emergency contacts available
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  Verified emergency service contacts have not been added yet.
                </p>
              </div>
              <Button variant="outline" className="h-10 w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div
                role="alert"
                className="rounded-xl border border-destructive/25 bg-destructive/5 p-4"
              >
                <p className="text-sm font-semibold text-destructive">Need urgent help?</p>
                <p className="mt-1 text-xs leading-relaxed text-ink">
                  Call opens your phone dialer. Text opens your SMS app. Complete the call or send
                  the message there. This app cannot confirm an answer or message delivery. If
                  nothing opens, copy the number and dial manually. If unreachable, try another
                  listed contact.
                </p>
              </div>

              {quickCalls.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-ink-strong">Quick Call</h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    Common emergency contacts are placed first.
                  </p>
                  <div className="mt-3 space-y-2">
                    {quickCalls.map((call) => (
                      <a
                        key={call.key}
                        href={call.contact.telUri}
                        className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 transition-colors hover:border-destructive/30"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface text-lg shadow-card">
                          {call.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink-strong">
                            {call.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-ink-muted">
                            {call.contact.label || call.contact.name}
                          </span>
                          <span className="mt-1 block text-sm font-semibold tnum text-destructive">
                            {formatPhoneNumber(call.contact.phoneNumber)}
                          </span>
                        </span>
                        <Phone className="size-4 shrink-0 text-destructive" />
                      </a>
                    ))}
                  </div>
                </section>
              )}

              <section className="border-t border-line-soft pt-5">
                <h3 className="text-sm font-semibold text-ink-strong">All Emergency Contacts</h3>
                <div className="mt-3 space-y-2">
                  {categories.map((category) => {
                    const group = contacts.filter(
                      (contact) => (contact.subCategory || "General") === category,
                    )
                    const isOpen = expanded === category

                    return (
                      <div key={category} className="overflow-hidden rounded-xl border border-line-soft">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? "" : category)}
                          aria-expanded={isOpen}
                          className="flex min-h-11 w-full items-center justify-between gap-3 bg-surface px-4 text-left transition-colors hover:bg-canvas"
                        >
                          <span className="flex items-center gap-3">
                            <span className="text-lg">{emergencyCategoryIcon(category)}</span>
                            <span>
                              <span className="block text-sm font-semibold text-ink-strong">
                                {category}
                              </span>
                              <span className="block text-xs text-ink-muted">
                                {group.length} contact{group.length > 1 ? "s" : ""}
                              </span>
                            </span>
                          </span>
                          <ChevronRight
                            className={cn(
                              "size-4 text-ink-faint transition-transform",
                              isOpen && "rotate-90",
                            )}
                          />
                        </button>

                        {isOpen && (
                          <div className="space-y-2 border-t border-line-soft bg-canvas p-2">
                            {group.map((contact) => (
                              <ContactRow key={contact.id} contact={contact} tone="urgent" />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              <Button variant="outline" className="h-10 w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

function AssistanceCard({
  tone,
  chip,
  title,
  description,
  footer,
  icon: Icon,
  onClick,
}: {
  tone: Tone
  chip: string
  title: string
  description: string
  footer: string
  icon: typeof ShieldCheck
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border text-left transition-colors",
        tone === "urgent" ? "border-destructive/25 bg-surface" : "border-line-soft bg-surface",
      )}
    >
      <span className="flex items-start gap-3 p-4">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", TONE[tone].icon)}>
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              TONE[tone].chip,
            )}
          >
            {chip}
          </span>
          <span className="mt-1.5 block text-sm font-semibold text-ink-strong">{title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{description}</span>
        </span>
      </span>
      <span className={cn("border-t px-4 py-2 text-[11px] font-medium", TONE[tone].footer)}>
        {footer}
      </span>
    </button>
  )
}

export default function AssistancePanel() {
  const [dialog, setDialog] = useState<"tanod" | "emergency" | null>(null)

  return (
    <Panel className="p-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-ink-strong">
          Need barangay assistance?
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          For concerns that need help from the barangay or Barangay Tanod.
        </p>
      </div>

      <div className="mt-3 space-y-3">
        <AssistanceCard
          tone="brand"
          chip="Non-emergency"
          title="Tanod Assistance"
          description="For disturbances, suspicious activity, neighborhood concerns, or barangay help."
          footer="Barangay Tanod contacts available inside"
          icon={ShieldCheck}
          onClick={() => setDialog("tanod")}
        />
        <AssistanceCard
          tone="urgent"
          chip="Urgent"
          title="Emergency Help"
          description="Quickly find ambulance, police, fire, hospital, and disaster hotlines."
          footer="Verified emergency service contacts available inside"
          icon={Siren}
          onClick={() => setDialog("emergency")}
        />
      </div>

      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-ink-faint">
        <Megaphone className="mt-0.5 size-3.5 shrink-0" />
        For life-threatening emergencies, contact the appropriate emergency service directly.
      </p>

      <TanodDialog open={dialog === "tanod"} onOpenChange={(open) => setDialog(open ? "tanod" : null)} />
      <EmergencyDialog
        open={dialog === "emergency"}
        onOpenChange={(open) => setDialog(open ? "emergency" : null)}
      />
    </Panel>
  )
}
