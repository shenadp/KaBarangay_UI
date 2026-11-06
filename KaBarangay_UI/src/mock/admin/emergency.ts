/**
 * Admin Emergency Numbers — the read model of `Admin/EmergencyContactController`.
 *
 * The page is two directories that live in different tables:
 *
 * - `barangayHotlines` are the rows of `emergency_contacts` whose category is
 *   `barangay_hotline` and whose `barangay_id` is the signed-in administrator's
 *   own. This is the only half the portal can write.
 * - `sharedEmergencyContacts` are `shared_emergency_contacts` scoped by
 *   `active()->verified()` — a city-wide directory reviewed centrally, so the
 *   controller exposes it read-only and rejects any write with
 *   "Shared emergency directory records are managed centrally."
 *
 * Both lists order by `display_order` then `id`, and every phone number is
 * normalised to digits (plus an optional leading `+`) before it becomes a
 * `tel:` or `sms:` URI.
 */

import { auditTrail } from "@/mock/admin/auditLog"

/* ------------------------------------------------------------------ */
/* Phone normalisation — `App\Support\PhoneNumber`                     */
/* ------------------------------------------------------------------ */

/** Digits only, keeping a single leading `+`. */
export function normalizePhone(phone: string): string {
  const cleaned = phone.trim()
  const hasPlus = cleaned.startsWith("+")
  const digitsOnly = cleaned.replace(/[^\d]/g, "")

  return hasPlus ? `+${digitsOnly}` : digitsOnly
}

/** A normalised number is valid when it is 3–15 digits with an optional `+`. */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone)

  return normalized !== "" && /^\+?\d{3,15}$/.test(normalized)
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

/** `EmergencyContact::CATEGORIES`. */
export type HotlineCategory = "barangay_hotline" | "emergency_hotline"

/** `EmergencyContact::EMERGENCY_SUBCATEGORIES` / `SharedEmergencyContact::SERVICE_TYPES`. */
export const emergencyServiceTypes = [
  "City Emergency",
  "Ambulance",
  "Fire",
  "Police",
  "Hospital",
  "Disaster",
] as const

/**
 * The prop the controller hands the page. Shared rows arrive with
 * `serviceType` copied into `subCategory` and carry `coverageArea`; hotline
 * rows have neither.
 */
export type ContactItem = {
  id: number
  category: HotlineCategory
  subCategory: string | null
  serviceType?: string | null
  coverageArea?: string | null
  name: string
  label: string | null
  phoneNumber: string
  canCall: boolean
  canSms: boolean
  displayOrder: number
  isActive: boolean
  telUri: string
  smsUri: string
}

/** The payload the modal posts — `category` is fixed server-side. */
export type HotlineInput = {
  subCategory: string
  name: string
  label: string
  phoneNumber: string
  canCall: boolean
  canSms: boolean
  displayOrder: number
  isActive: boolean
}

type HotlineRecord = {
  id: number
} & HotlineDraft

/** A posted row before it is given an id. */
type HotlineDraft = {
  barangayId: number
  subCategory: string | null
  name: string
  label: string | null
  phoneNumber: string
  canCall: boolean
  canSms: boolean
  displayOrder: number
  isActive: boolean
}

type SharedRecord = {
  id: number
  serviceType: string
  name: string
  label: string | null
  phoneNumber: string
  coverageArea: string | null
  canCall: boolean
  canSms: boolean
  displayOrder: number
  isActive: boolean
  /** `scopeVerified` needs both of these to be non-null. */
  verifiedAt: string | null
  verificationSource: string | null
}

/* ------------------------------------------------------------------ */
/* Validation — `hotlineRules()` plus the per-barangay uniqueness      */
/* ------------------------------------------------------------------ */

export const PHONE_INVALID_MESSAGE =
  "The phone number must normalize to a valid 3–15 digit number with an optional leading +."

export const PHONE_DUPLICATE_MESSAGE = "This phone number is already listed for your barangay."

const FIELD_LABELS = {
  subCategory: "sub category",
  name: "name",
  label: "label",
  phoneNumber: "phone number",
} as const

type FieldName = keyof typeof FIELD_LABELS

function requiredMessage(field: FieldName): string {
  return `The ${FIELD_LABELS[field]} field is required.`
}

function maxMessage(field: FieldName, limit: number): string {
  return `The ${FIELD_LABELS[field]} field must not be greater than ${limit} characters.`
}

/**
 * The controller validates before it checks for a duplicate, so a malformed
 * number never reaches the uniqueness query.
 */
function validateHotline(input: HotlineInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (input.name.trim() === "") errors.name = requiredMessage("name")
  else if (input.name.trim().length > 255) errors.name = maxMessage("name", 255)

  if (input.subCategory.trim().length > 100) errors.subCategory = maxMessage("subCategory", 100)
  if (input.label.trim().length > 255) errors.label = maxMessage("label", 255)

  if (input.phoneNumber.trim() === "") errors.phoneNumber = requiredMessage("phoneNumber")
  else if (input.phoneNumber.trim().length > 50) errors.phoneNumber = maxMessage("phoneNumber", 50)
  else if (!isValidPhone(input.phoneNumber)) errors.phoneNumber = PHONE_INVALID_MESSAGE

  return errors
}

/* ------------------------------------------------------------------ */
/* Seeds                                                               */
/* ------------------------------------------------------------------ */

const BARANGAY_ID = 1

const hotlineSeed: HotlineRecord[] = [
  {
    id: 1,
    barangayId: BARANGAY_ID,
    subCategory: "Official",
    name: "Barangay Malusob Hotline",
    label: "24/4 Desk",
    phoneNumber: "09394596081",
    canCall: true,
    canSms: false,
    displayOrder: 0,
    isActive: true,
  },
  {
    id: 2,
    barangayId: BARANGAY_ID,
    subCategory: "Tanod",
    name: "Cenon Mabutin Bocacao",
    label: "Chief Tanod",
    phoneNumber: "0917 224 8810",
    canCall: true,
    canSms: true,
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 3,
    barangayId: BARANGAY_ID,
    subCategory: "Tanod",
    name: "Barangay Tanod Night Patrol",
    label: "Floor 2, Tanod Outpost",
    phoneNumber: "(034) 435-1188",
    canCall: true,
    canSms: false,
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 4,
    barangayId: BARANGAY_ID,
    subCategory: "Desk",
    name: "Barangay Secretary Desk",
    label: "Records Desk",
    phoneNumber: "09281143377",
    canCall: true,
    canSms: true,
    displayOrder: 3,
    isActive: false,
  },
]

const sharedSeed: SharedRecord[] = [
  {
    id: 11,
    serviceType: "City Emergency",
    name: "City Emergency Hotlines",
    label: "Cenon City 911",
    phoneNumber: "09394596081",
    coverageArea: "Cenon City",
    canCall: true,
    canSms: false,
    displayOrder: 0,
    isActive: true,
    verifiedAt: "2026-08-14 09:05:00",
    verificationSource: "Cenon City DRRMO",
  },
  {
    id: 12,
    serviceType: "Ambulance",
    name: "Cenon City Ambulance Response",
    label: "Emergency Medical Services",
    phoneNumber: "(034) 435-2000",
    coverageArea: "Cenon City and neighbouring barangays",
    canCall: true,
    canSms: false,
    displayOrder: 1,
    isActive: true,
    verifiedAt: "2026-08-14 09:12:00",
    verificationSource: "Cenon City DRRMO",
  },
  {
    id: 13,
    serviceType: "Fire",
    name: "BFP Fire District — Naga",
    label: "Fire suppression and rescue",
    phoneNumber: "0917 553 0911",
    coverageArea: "Metro Naga",
    canCall: true,
    canSms: true,
    displayOrder: 2,
    isActive: true,
    verifiedAt: "2026-07-02 15:40:00",
    verificationSource: "Provincial DSWD roster",
  },
  {
    id: 14,
    serviceType: "Police",
    name: "City Police Station 5",
    label: "Investigation desk",
    phoneNumber: "(034) 435-9111",
    coverageArea: "Cenon City East",
    canCall: true,
    canSms: false,
    displayOrder: 3,
    isActive: true,
    verifiedAt: "2026-07-02 15:52:00",
    verificationSource: "PNP 505 directory",
  },
  {
    id: 15,
    serviceType: "Hospital",
    name: "Cenon City Provincial Hospital",
    label: "Emergency room",
    phoneNumber: "0928 771 4402",
    coverageArea: "Cenon City",
    canCall: true,
    canSms: false,
    displayOrder: 4,
    isActive: true,
    verifiedAt: "2026-06-18 08:20:00",
    verificationSource: "DOH Region V list",
  },
  {
    id: 16,
    serviceType: "Disaster",
    name: "City Rescue and Disaster Response",
    label: "Operations centre",
    phoneNumber: "0961 330 2288",
    coverageArea: "Cenon City",
    canCall: true,
    canSms: true,
    displayOrder: 5,
    isActive: false,
    verifiedAt: "2026-06-18 08:34:00",
    verificationSource: "City DRRMO",
  },
  {
    id: 17,
    serviceType: "Disaster",
    name: "Red Cross — Bulwagan Sub-Branch",
    label: "Awaiting verification",
    phoneNumber: "0906 118 7744",
    coverageArea: "Metro Naga",
    canCall: true,
    canSms: false,
    displayOrder: 6,
    isActive: true,
    verifiedAt: null,
    verificationSource: null,
  },
]

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export type HotlineMutation =
  | { ok: true; message: string }
  | { ok: false; errors: Record<string, string> }

/** `display_order`, then `id` — the order both queries use. */
function byDisplayOrder<T extends { displayOrder: number; id: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
}

function createEmergencyDirectoryStore() {
  let hotlines = hotlineSeed.map((record) => ({ ...record }))
  let shared = sharedSeed.map((record) => ({ ...record }))

  let sequence = 100

  const nextId = () => ++sequence

  /** `assertUniqueHotlinePhone` compares normalised numbers within the barangay. */
  const isDuplicatePhone = (phone: string, ignoreId?: number) => {
    const normalized = normalizePhone(phone)

    return hotlines.some(
      (record) =>
        record.barangayId === BARANGAY_ID &&
        record.id !== ignoreId &&
        normalizePhone(record.phoneNumber) === normalized,
    )
  }

  const transformHotline = (record: HotlineRecord): ContactItem => {
    const normalized = normalizePhone(record.phoneNumber)

    return {
      id: record.id,
      category: "barangay_hotline",
      subCategory: record.subCategory,
      name: record.name,
      label: record.label,
      phoneNumber: record.phoneNumber,
      canCall: record.canCall,
      canSms: record.canSms,
      displayOrder: record.displayOrder,
      isActive: record.isActive,
      telUri: `tel:${normalized}`,
      smsUri: `sms:${normalized}`,
    }
  }

  const transformShared = (record: SharedRecord): ContactItem => {
    const normalized = normalizePhone(record.phoneNumber)

    return {
      id: record.id,
      category: "emergency_hotline",
      serviceType: record.serviceType,
      /* The controller feeds the shared service type into the subcategory chip. */
      subCategory: record.serviceType,
      name: record.name,
      label: record.label,
      phoneNumber: record.phoneNumber,
      coverageArea: record.coverageArea,
      canCall: record.canCall,
      canSms: record.canSms,
      displayOrder: record.displayOrder,
      isActive: record.isActive,
      telUri: `tel:${normalized}`,
      smsUri: `sms:${normalized}`,
    }
  }

  const toDraft = (input: HotlineInput, barangayId: number): HotlineDraft => ({
    barangayId,
    subCategory: input.subCategory.trim() === "" ? null : input.subCategory.trim(),
    name: input.name.trim(),
    label: input.label.trim() === "" ? null : input.label.trim(),
    phoneNumber: input.phoneNumber.trim(),
    canCall: input.canCall,
    canSms: input.canSms,
    displayOrder: Number.isFinite(input.displayOrder) ? Math.trunc(input.displayOrder) : 0,
    isActive: input.isActive,
  })

  return {
    hotlines(): ContactItem[] {
      return byDisplayOrder(hotlines.map(transformHotline))
    },

    /** `active()->verified()` — an unverified or retired service never reaches the page. */
    sharedContacts(): ContactItem[] {
      return byDisplayOrder(
        shared.filter((record) => record.isActive && record.verifiedAt !== null).map(
          transformShared,
        ),
      )
    },

    /** The reference pre-fills the group so a new Tanod line needs one keystroke less. */
    blankInput(): HotlineInput {
      return {
        subCategory: "Tanod",
        name: "",
        label: "",
        phoneNumber: "",
        canCall: true,
        canSms: false,
        displayOrder: 0,
        isActive: true,
      }
    },

    inputFor(contact: ContactItem): HotlineInput {
      return {
        subCategory: contact.subCategory ?? "",
        name: contact.name,
        label: contact.label ?? "",
        phoneNumber: contact.phoneNumber,
        canCall: contact.canCall,
        canSms: contact.canSms,
        displayOrder: contact.displayOrder,
        isActive: contact.isActive,
      }
    },

    create(input: HotlineInput): HotlineMutation {
      const errors = validateHotline(input)

      if (Object.keys(errors).length > 0) return { ok: false, errors }
      if (isDuplicatePhone(input.phoneNumber))
        return { ok: false, errors: { phoneNumber: PHONE_DUPLICATE_MESSAGE } }

      const record = toDraft(input, BARANGAY_ID)

      hotlines = [...hotlines, { ...record, id: nextId() }]
      auditTrail.record("emergency_contact_created")

      return { ok: true, message: "Barangay hotline added successfully." }
    },

    /**
     * `authorizeHotline` and `authorizeBarangay` mean only this barangay's own
     * hotline rows are addressable, so a shared-directory id simply is not
     * found here — those records are managed centrally.
     */
    update(id: number, input: HotlineInput): HotlineMutation {
      const current = hotlines.find((record) => record.id === id)
      if (!current) return { ok: false, errors: {} }

      const errors = validateHotline(input)

      if (Object.keys(errors).length > 0) return { ok: false, errors }
      if (isDuplicatePhone(input.phoneNumber, id))
        return { ok: false, errors: { phoneNumber: PHONE_DUPLICATE_MESSAGE } }

      const next = toDraft(input, current.barangayId)

      hotlines = hotlines.map((record) => (record.id === id ? { ...next, id } : record))
      auditTrail.record("emergency_contact_updated")

      return { ok: true, message: "Barangay hotline updated successfully." }
    },

    destroy(id: number): HotlineMutation {
      const current = hotlines.find((record) => record.id === id)
      if (!current) return { ok: false, errors: {} }

      hotlines = hotlines.filter((record) => record.id !== id)
      auditTrail.record("emergency_contact_deleted")

      return { ok: true, message: "Barangay hotline deleted successfully." }
    },
  }
}

/** One directory for the session, the way one `barangay_id` scopes one chart. */
export const emergencyDirectory = createEmergencyDirectoryStore()
