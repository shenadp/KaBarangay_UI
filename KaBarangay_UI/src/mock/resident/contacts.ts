/**
 * Resident portal — the assistance contacts on the dashboard.
 *
 * Two lists, from the same query `routes/web.php` runs for the dashboard
 * closure: `sharedEmergencyContacts` is the city directory, active and
 * centrally verified; `barangayHotlines` is this barangay's own active lines.
 *
 * A hotline whose number already appears in the shared directory is dropped —
 * the barangay desk and the city roster list the same Malusob line, and the
 * resident should only ever see it once.
 */

import {
  Ambulance,
  CloudRain,
  Flame,
  HeartPulse,
  Phone,
  Shield,
  Siren,
  type LucideIcon,
} from "lucide-react"

import {
  emergencyDirectory,
  normalizePhone,
  type ContactItem,
} from "@/mock/admin/emergency"

/** Exactly the fields the page reads off each contact. */
export type ResidentContact = {
  id: number
  category: "barangay_hotline" | "emergency_hotline"
  subCategory: string | null
  name: string
  label: string | null
  phoneNumber: string
  canCall: boolean
  canSms: boolean
  telUri: string
  smsUri: string
}

function toResidentContact(contact: ContactItem): ResidentContact {
  return {
    id: contact.id,
    category: contact.category,
    subCategory: contact.subCategory,
    name: contact.name,
    label: contact.label,
    phoneNumber: contact.phoneNumber,
    canCall: contact.canCall,
    canSms: contact.canSms,
    telUri: contact.telUri,
    smsUri: contact.smsUri,
  }
}

export function sharedEmergencyContacts(): ResidentContact[] {
  return emergencyDirectory.sharedContacts().map(toResidentContact)
}

export function barangayHotlines(): ResidentContact[] {
  const sharedPhones = new Set(
    sharedEmergencyContacts()
      .map((contact) => normalizePhone(contact.phoneNumber))
      .filter((phone) => phone !== ""),
  )

  return emergencyDirectory
    .hotlines()
    .filter((contact) => contact.isActive)
    .map(toResidentContact)
    .filter((contact) => {
      const normalized = normalizePhone(contact.phoneNumber)

      return normalized === "" || !sharedPhones.has(normalized)
    })
}

/** `0939 459 6081` for an 09-prefixed mobile; anything else is left as posted. */
export function formatPhoneNumber(phone: string): string {
  if (phone.length === 11 && phone.startsWith("09"))
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`

  return phone
}

/**
 * The Tanod form is a preview in the reference page — it never reaches a
 * controller, so nothing is stored. A filing is kept here only long enough for
 * the desk to confirm it on screen.
 */
export type TanodConcernType = "noise" | "conflict" | "suspicious" | "assistance" | "other"

export const tanodConcernOptions: { value: TanodConcernType; label: string }[] = [
  { value: "noise", label: "Noise disturbance" },
  { value: "conflict", label: "Neighborhood conflict" },
  { value: "suspicious", label: "Suspicious activity" },
  { value: "assistance", label: "Assistance needed" },
  { value: "other", label: "Other concern" },
]

export const TANOD_SUBMITTED_MESSAGE = "Tanod assistance request preview submitted."

/** The hotline the panel leads with: the `Official` line, else the first posted. */
export function splitTanodContacts(hotlines: ResidentContact[]): {
  official: ResidentContact | null
  others: ResidentContact[]
} {
  const official = hotlines.find((contact) => contact.subCategory === "Official") ?? hotlines[0] ?? null

  return {
    official,
    others: official ? hotlines.filter((contact) => contact.id !== official.id) : [],
  }
}

/** The four tiles the emergency panel places first, in that order. */
export const QUICK_CALLS: { icon: LucideIcon; subCategory: string; title: string }[] = [
  { icon: Siren, subCategory: "City Emergency", title: "City Emergency" },
  { icon: Ambulance, subCategory: "Ambulance", title: "Ambulance" },
  { icon: Flame, subCategory: "Fire", title: "Fire" },
  { icon: Shield, subCategory: "Police", title: "Police" },
]

export function emergencyCategories(contacts: ResidentContact[]): string[] {
  return [...new Set(contacts.map((contact) => contact.subCategory || "General"))]
}

export function emergencyCategoryIcon(category: string): LucideIcon {
  switch (category) {
    case "City Emergency":
      return Siren
    case "Ambulance":
      return Ambulance
    case "Fire":
      return Flame
    case "Police":
      return Shield
    case "Hospital":
      return HeartPulse
    case "Disaster":
      return CloudRain
    default:
      return Phone
  }
}
