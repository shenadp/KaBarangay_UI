/**
 * Lupon intake and dockets — the tables behind `Resident\LuponComplaintController`
 * and `Resident\LuponCaseController`, kept in the shape the backend keeps them.
 *
 * A complaint is the resident's filing; it only becomes a case once staff records
 * the barangay payment and the first hearing. From there the docket walks
 * `LuponCaseWorkflow`'s states — `filed → mediation_active → pangkat_formed →
 * conciliation_active → settled | dismissed | certified_to_file_action`, with
 * `repudiated` hanging off a settlement — and every move appends an event, which
 * is the only history the parties are allowed to read.
 *
 * The desk owns these rows; the resident portal only ever reads them (plus the
 * one write a resident is entitled to: filing a complaint).
 */

import { barangay } from "@/mock/data"
import { purokName, residentRegistry } from "@/mock/admin/residents"
import { SESSION_RESIDENT_ID, sessionResident } from "@/mock/resident/session"

/* ------------------------------------------------------------------ */
/* Clock                                                               */
/* ------------------------------------------------------------------ */

/** `LuponCaseWorkflow::today()` — every guard and deadline answers to this date. */
export function luponToday(): string {
  const now = new Date()

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

/** `Carbon::addDays($n)` in either direction; the seeds are written relative to today. */
export function shiftDays(iso: string, days: number): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}

/** Whole days from today to `iso`; negative once the date has passed. */
export function daysUntil(iso: string): number {
  const from = Date.parse(`${luponToday()}T00:00:00Z`)
  const to = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`)

  return Math.round((to - from) / 86_400_000)
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

/** `LuponCatalog::CASE_TYPES`, in the order the dropdown offers them. */
export const complaintTypes = [
  "Property / Boundary Dispute",
  "Noise / Disturbance",
  "Debt / Money Dispute",
  "Damage to Property",
  "Threat / Harassment",
  "Family / Neighbor Dispute",
  "Other",
] as const

/** `LuponComplaintController::RESPONDENT_STATUSES`. */
export const respondentResidentStatuses = ["Yes", "No", "Unknown"] as const

/** The intake statuses a complaint holds before and instead of a docket. */
export type LuponComplaintStatus =
  | "Submitted"
  | "Under Review"
  | "For Payment"
  | "Accepted"
  | "Rejected"

/** `LuponCaseWorkflow::LABELS`. */
export const caseStatusLabels = {
  filed: "Filed",
  mediation_active: "Mediation active",
  pangkat_formed: "Pangkat formed",
  conciliation_active: "Conciliation active",
  settled: "Settled",
  repudiated: "Repudiated",
  dismissed: "Dismissed",
  certified_to_file_action: "Certified to file action",
} as const

export type LuponCaseStatus = keyof typeof caseStatusLabels

/** `luponStatusLabel()` — an unknown token reads back as itself. */
export function caseStatusLabel(status: string): string {
  return (caseStatusLabels as Record<string, string>)[status] ?? status
}

/** `LuponCaseWorkflow::phase()` — Kapitan hears mediation, Pangkat hears conciliation. */
export function phaseOf(status: LuponCaseStatus): string {
  switch (status) {
    case "filed":
    case "mediation_active":
      return "Kapitan"
    case "pangkat_formed":
    case "conciliation_active":
      return "Lupon"
    default:
      return "Closed"
  }
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

export type LuponEvidenceRow = {
  id: number
  complaintId: number | null
  caseId: number | null
  /** Who uploaded it; `null` for a staff filing. */
  residentId: number | null
  /** `visible_to_parties` — otherwise only its owner may open it. */
  shared: boolean
  name: string
  /** Bytes, the way `Storage` reports them. */
  size: number
}

export type LuponPartyRow = {
  id: number
  type: "complainant" | "respondent"
  name: string
  residentId: number | null
  /** Only a verified respondent may open the docket from Complaints Against Me. */
  associationStatus: "pending" | "verified" | "unverified"
  isPrimary: boolean
  address: string
  contact: string
}

export type LuponHearingRow = {
  id: number
  /** `phase_number` — meetings are numbered again in each phase. */
  number: number
  phase: string
  date: string
  time: string | null
  venue: string
  status: "Scheduled" | "Rescheduled" | "Held" | "Cancelled" | "No Attendance"
  outcome: string | null
}

export type LuponDocumentRow = {
  id: number
  kind: "notice_of_hearing" | "summons" | "amicable_settlement" | "cfa"
  label: string
  status: "pending" | "ready" | "superseded"
  /** A notice or summons reaches the parties only once it has been served. */
  servedAt: string | null
}

export type LuponEventRow = {
  id: number
  to: LuponCaseStatus
  /** ISO instant of `occurred_at`. */
  date: string
  notes: string | null
}

export type LuponComplaintRow = {
  id: number
  /** `LUP-2026-00043`, allocated by `createWithReference()`. */
  reference: string
  residentId: number
  respondentName: string
  respondentResidentStatus: string
  respondentAddress: string | null
  respondentContact: string | null
  complaintType: string
  incidentDate: string
  incidentTime: string | null
  incidentLocation: string
  narrative: string
  requestedAction: string
  status: LuponComplaintStatus
  luponNote: string | null
  /** Assessed at review; the case carries the amount actually paid. */
  assessedFee: string | null
  submittedAt: string
}

export type LuponCaseRow = {
  id: number
  caseNumber: string
  title: string
  caseType: string
  status: LuponCaseStatus
  complaintId: number | null
  filedDate: string
  paymentStatus: "unpaid" | "paid" | "exempt"
  feeAmount: string | null
  orNumber: string | null
  /** Form 7 is the summons — issuing it is what changes the tracking label. */
  form7IssuedAt: string | null
  summonsDueAt: string | null
  mediationStartedAt: string | null
  mediationDeadlineAt: string | null
  pangkatFormedAt: string | null
  conciliationStartedAt: string | null
  conciliationDeadlineAt: string | null
  conciliationExtendedUntil: string | null
  settledAt: string | null
  dismissedAt: string | null
  incidentDate: string | null
  incidentLocation: string | null
  /** Intake copy for a docketed without a complaint of its own. */
  intakeNarrative: string | null
  parties: LuponPartyRow[]
  hearings: LuponHearingRow[]
  settlement: { type: string; date: string; terms: string; status: string } | null
  documents: LuponDocumentRow[]
  events: LuponEventRow[]
}

/* ------------------------------------------------------------------ */
/* The signed-in resident                                              */
/* ------------------------------------------------------------------ */

const registryRecord = () => residentRegistry.residentById(SESSION_RESIDENT_ID)

/** `ComplainantController`'s `address` — purok and barangay, nothing else. */
function residentAddress(): string {
  const record = registryRecord()

  return [record ? purokName(record.purokId ?? 0) : "", barangay.name].filter(Boolean).join(", ")
}

function residentName(): string {
  return sessionResident().fullName
}

/* ------------------------------------------------------------------ */
/* Complaints filed by this resident                                   */
/* ------------------------------------------------------------------ */

const complaints: LuponComplaintRow[] = [
  {
    id: 42,
    reference: "LUP-2026-00042",
    residentId: SESSION_RESIDENT_ID,
    respondentName: "Dante M. Rivera",
    respondentResidentStatus: "Yes",
    respondentAddress: "Purok 4, Barangay San Isidro",
    respondentContact: "0917 555 0142",
    complaintType: "Noise / Disturbance",
    incidentDate: shiftDays(luponToday(), -4),
    incidentTime: "23:15",
    incidentLocation: "Purok 4 basketball court",
    narrative:
      "Malakas po ang tunog ng stereo at videohan ng inyong kapitan tuwing gabi, madalas hanggang alas-1 ng madaling araw.\n\nNakakaapekto po ito sa pahinga ng aming pamilya, lalo na sa aming anak na grade 4.",
    requestedAction:
      "Humihiling po kami na tawagin ang nasabing kapitbahay at pagkasunduan ang oras ng pagtatapos ng ingay pagkatapos ng 10:00 PM.",
    status: "Submitted",
    luponNote: null,
    assessedFee: null,
    submittedAt: shiftDays(luponToday(), -1),
  },
  {
    id: 39,
    reference: "LUP-2026-00039",
    residentId: SESSION_RESIDENT_ID,
    respondentName: "Marisol B. Aguilar",
    respondentResidentStatus: "Yes",
    respondentAddress: "Purok 2, Barangay San Isidro",
    respondentContact: null,
    complaintType: "Debt / Money Dispute",
    incidentDate: shiftDays(luponToday(), -34),
    incidentTime: null,
    incidentLocation: "Purok 2 sari-sari store",
    narrative:
      "Nanghiram po siya ng ₱8,500 nang pangakong babayaran sa loob ng dalawang buwan.\n\nMarami na po akong mensahe ngunit walang sagot mula noong nakaraang buwan.",
    requestedAction:
      "Gusto po naming makipagkasundo sa harapan ng Lupon tungkol sa iskedyul ng pagbabayad.",
    status: "Under Review",
    luponNote:
      "Natanggap na po namin ang inyong mga ebidensya. Tinatalakay pa po ng staff ang detalye bago ito ipasa sa assessment ng filing fee.",
    assessedFee: null,
    submittedAt: shiftDays(luponToday(), -5),
  },
  {
    id: 36,
    reference: "LUP-2026-00036",
    residentId: SESSION_RESIDENT_ID,
    respondentName: "Renato O. Villanueva",
    respondentResidentStatus: "Unknown",
    respondentAddress: "Purok 7, Brgy. Sto. Niño",
    respondentContact: "0928 441 7710",
    complaintType: "Property / Boundary Dispute",
    incidentDate: shiftDays(luponToday(), -21),
    incidentTime: "08:30",
    incidentLocation: "Lot 14-B, Purok 3",
    narrative:
      "Itinayo po niya ang bakod na tumatawid ng tinatayang 1.2 metro sa aming lote, ayon po sa aming tax declaration at survey plan.\n\nHindi po siya willing makipag-usap kahit ilang beses naming binisita.",
    requestedAction:
      "Humihiling po kami ng mediation para maibalik ang tamang hangganan o makasunduan sa halagang babayaran.",
    status: "For Payment",
    luponNote:
      "Aprubado po ang inyong complaint para idocket. Bayaran po ang assessed filing fee sa barangay treasury at kunin ang official receipt.",
    assessedFee: "500.00",
    submittedAt: shiftDays(luponToday(), -9),
  },
  {
    id: 28,
    reference: "LUP-2026-00028",
    residentId: SESSION_RESIDENT_ID,
    respondentName: "Elpidio T. Mendoza",
    respondentResidentStatus: "Yes",
    respondentAddress: "Purok 3, Barangay San Isidro",
    respondentContact: "0906 220 8834",
    complaintType: "Damage to Property",
    incidentDate: shiftDays(luponToday(), -12),
    incidentTime: "17:45",
    incidentLocation: "Frontage of Purok 3 sidewalk",
    narrative:
      "Nadapa po ng kanyang tricycle ang aming gate at nasira ang mga post at kandado nang siya ay nagreverse.\n\nIniwan po niya ang lugar bago pa kami makapag-usap.",
    requestedAction: "Hinihiling po ang bayad sa pagkakaayos ng gate na tinatayang ₱6,200.",
    status: "Accepted",
    luponNote: null,
    assessedFee: "300.00",
    submittedAt: shiftDays(luponToday(), -11),
  },
  {
    id: 11,
    reference: "LUP-2026-00011",
    residentId: SESSION_RESIDENT_ID,
    respondentName: "Julius P. Salazar",
    respondentResidentStatus: "Yes",
    respondentAddress: "Purok 1, Barangay San Isidro",
    respondentContact: null,
    complaintType: "Threat / Harassment",
    incidentDate: shiftDays(luponToday(), -48),
    incidentTime: "19:05",
    incidentLocation: "Purok 1 basketball court",
    narrative:
      "Hinamon po niya ako at binantaan habang nakaramay ang iba pang kabataan sa harapan ng court.",
    requestedAction:
      "Gusto po naming pirmihan ang kasunduang hindi na niya ako lalapitan o babantaan.",
    status: "Accepted",
    luponNote: null,
    assessedFee: "200.00",
    submittedAt: shiftDays(luponToday(), -46),
  },
  {
    id: 4,
    reference: "LUP-2026-00004",
    residentId: SESSION_RESIDENT_ID,
    respondentName: "Corazon D. Reyes",
    respondentResidentStatus: "Yes",
    respondentAddress: "Purok 5, Barangay San Isidro",
    respondentContact: "0939 118 5527",
    complaintType: "Property / Boundary Dispute",
    incidentDate: shiftDays(luponToday(), -63),
    incidentTime: null,
    incidentLocation: "Alley between Purok 5 lots 9 and 10",
    narrative:
      "Iwinento po niya ang bakuran nang hindi nagpapaalam at nabara ang daan palabas ng aming lote.",
    requestedAction: "Hinihiling po ang pagbubukas muli ng easement na ginagamit namin.",
    status: "Accepted",
    luponNote: null,
    assessedFee: "200.00",
    submittedAt: shiftDays(luponToday(), -61),
  },
  {
    id: 19,
    reference: "LUP-2026-00019",
    residentId: SESSION_RESIDENT_ID,
    respondentName: "Ferdinand L. Aquino",
    respondentResidentStatus: "No",
    respondentAddress: null,
    respondentContact: null,
    complaintType: "Family / Neighbor Dispute",
    incidentDate: shiftDays(luponToday(), -16),
    incidentTime: null,
    incidentLocation: "Purok 4",
    narrative:
      "Alitan po ang tungkol sa paghahati ng bahay ng aming magulang. Naninirahan na po siya sa ibang munisipyo.",
    requestedAction: "Hinihiling po ang tulong ng Lupon sa aming pag-aasawa ng mana.",
    status: "Rejected",
    luponNote:
      "Hindi po sakop ng Katarungang Pambarangay ang paghahating mana ng pamilya; kailangan po ito ng court order. Maaari po kayong bumalik sa barangay desk para sa referral.",
    assessedFee: null,
    submittedAt: shiftDays(luponToday(), -15),
  },
]

/* ------------------------------------------------------------------ */
/* Dockets                                                             */
/* ------------------------------------------------------------------ */

type PartySeed = {
  id: number
  type: "complainant" | "respondent"
  name: string
  residentId?: number | null
  associationStatus?: "pending" | "verified" | "unverified"
  address?: string
  contact?: string
}

function party(seed: PartySeed): LuponPartyRow {
  const isSessionResident = seed.residentId === SESSION_RESIDENT_ID

  return {
    id: seed.id,
    type: seed.type,
    name: seed.name,
    residentId: seed.residentId ?? null,
    associationStatus: seed.associationStatus ?? "verified",
    isPrimary: true,
    address: seed.address ?? (isSessionResident ? residentAddress() : ""),
    contact: seed.contact ?? (isSessionResident ? (registryRecord()?.mobile ?? "") : ""),
  }
}

/** The session resident as a party, under whichever side of the docket they sit. */
function me(type: "complainant" | "respondent", id: number): LuponPartyRow {
  return party({ id, type, name: residentName(), residentId: SESSION_RESIDENT_ID })
}

/**
 * The columns a seed may leave out. `makeCase()` answers them so a docket that
 * never reached a stage reads as an empty column instead of `undefined`.
 */
type CaseDefaults = Pick<
  LuponCaseRow,
  | "paymentStatus"
  | "feeAmount"
  | "orNumber"
  | "form7IssuedAt"
  | "summonsDueAt"
  | "mediationStartedAt"
  | "mediationDeadlineAt"
  | "pangkatFormedAt"
  | "conciliationStartedAt"
  | "conciliationDeadlineAt"
  | "conciliationExtendedUntil"
  | "settledAt"
  | "dismissedAt"
  | "complaintId"
  | "incidentDate"
  | "incidentLocation"
  | "intakeNarrative"
>

type CaseSeed = Omit<LuponCaseRow, keyof CaseDefaults> & Partial<CaseDefaults>

function makeCase(seed: CaseSeed): LuponCaseRow {
  return {
    paymentStatus: "paid",
    feeAmount: null,
    orNumber: null,
    form7IssuedAt: null,
    summonsDueAt: null,
    mediationStartedAt: null,
    mediationDeadlineAt: null,
    pangkatFormedAt: null,
    conciliationStartedAt: null,
    conciliationDeadlineAt: null,
    conciliationExtendedUntil: null,
    settledAt: null,
    dismissedAt: null,
    complaintId: null,
    incidentDate: null,
    incidentLocation: null,
    intakeNarrative: null,
    ...seed,
  }
}

const today = luponToday()

const cases: LuponCaseRow[] = [
  makeCase({
    // Docketed from complaint 28 — the resident is the complainant, Form 7 served.
    id: 7,
    caseNumber: "KP-2026-007",
    title: "Gate and fence damage along Purok 3",
    caseType: "Damage to Property",
    status: "filed",
    complaintId: 28,
    filedDate: shiftDays(today, -6),
    feeAmount: "300.00",
    orNumber: "OR-2026-004417",
    form7IssuedAt: shiftDays(today, -3),
    summonsDueAt: shiftDays(today, -2),
    incidentDate: shiftDays(today, -12),
    incidentLocation: "Frontage of Purok 3 sidewalk",
    parties: [
      me("complainant", 21),
      party({
        id: 22,
        type: "respondent",
        name: "Elpidio T. Mendoza",
        address: "Purok 3, Barangay San Isidro",
        contact: "0906 220 8834",
      }),
    ],
    hearings: [
      {
        id: 31,
        number: 1,
        phase: "Kapitan",
        date: shiftDays(today, 2),
        time: "09:00 AM",
        venue: "Barangay Hall — Lupon Session Room",
        status: "Scheduled",
        outcome: null,
      },
    ],
    settlement: null,
    documents: [
      { id: 41, kind: "notice_of_hearing", label: "Notice of Hearing — 1st Kapitan meeting", status: "ready", servedAt: shiftDays(today, -3) },
      { id: 42, kind: "summons", label: "Summons (Form 7) — respondent", status: "ready", servedAt: shiftDays(today, -3) },
      { id: 43, kind: "amicable_settlement", label: "Amicable settlement", status: "pending", servedAt: null },
    ],
    events: [{ id: 51, to: "filed", date: `${shiftDays(today, -6)}T08:20:00`, notes: "Case docketed." }],
  }),

  makeCase({
    // Docketed from complaint 11 — mediation failed, the Pangkat is hearing it.
    id: 5,
    caseNumber: "KP-2026-005",
    title: "Altercation and reported threats at Purok 1",
    caseType: "Threat / Harassment",
    status: "conciliation_active",
    complaintId: 11,
    filedDate: shiftDays(today, -44),
    feeAmount: "200.00",
    orNumber: "OR-2026-004302",
    form7IssuedAt: shiftDays(today, -41),
    summonsDueAt: shiftDays(today, -40),
    mediationStartedAt: shiftDays(today, -38),
    mediationDeadlineAt: shiftDays(today, -23),
    pangkatFormedAt: shiftDays(today, -27),
    conciliationStartedAt: shiftDays(today, -20),
    conciliationDeadlineAt: shiftDays(today, 10),
    incidentDate: shiftDays(today, -48),
    incidentLocation: "Purok 1 basketball court",
    parties: [
      me("complainant", 23),
      party({ id: 24, type: "respondent", name: "Julius P. Salazar", address: "Purok 1, Barangay San Isidro" }),
    ],
    hearings: [
      {
        id: 32,
        number: 1,
        phase: "Kapitan",
        date: shiftDays(today, -38),
        time: "09:00 AM",
        venue: "Barangay Hall — Office of the Punong Barangay",
        status: "Held",
        outcome: "Continued — no agreement reached",
      },
      {
        id: 33,
        number: 2,
        phase: "Lupon",
        date: shiftDays(today, -20),
        time: "10:30 AM",
        venue: "Barangay Hall — Lupon Session Room",
        status: "Held",
        outcome: "Continued — parties to submit witnesses",
      },
      {
        id: 34,
        number: 3,
        phase: "Lupon",
        date: shiftDays(today, 6),
        time: "01:00 PM",
        venue: "Barangay Hall — Lupon Session Room",
        status: "Scheduled",
        outcome: null,
      },
    ],
    settlement: null,
    documents: [
      { id: 44, kind: "notice_of_hearing", label: "Notice of Hearing — 3rd Pangkat meeting", status: "ready", servedAt: shiftDays(today, -4) },
      { id: 45, kind: "cfa", label: "Certificate to file action", status: "pending", servedAt: null },
    ],
    events: [
      { id: 52, to: "filed", date: `${shiftDays(today, -44)}T09:05:00`, notes: "Case docketed." },
      { id: 53, to: "mediation_active", date: `${shiftDays(today, -38)}T09:40:00`, notes: "First mediation meeting held." },
      { id: 54, to: "pangkat_formed", date: `${shiftDays(today, -27)}T14:10:00`, notes: "Mediation failed; Pangkat constituted." },
      { id: 55, to: "conciliation_active", date: `${shiftDays(today, -20)}T10:55:00`, notes: "First conciliation meeting held." },
    ],
  }),

  makeCase({
    // Docketed from complaint 4 — settled, still inside the repudiation window.
    id: 2,
    caseNumber: "KP-2026-002",
    title: "Closed alley between Purok 5 lots 9 and 10",
    caseType: "Property / Boundary Dispute",
    status: "settled",
    complaintId: 4,
    filedDate: shiftDays(today, -59),
    feeAmount: "200.00",
    orNumber: "OR-2026-004188",
    form7IssuedAt: shiftDays(today, -56),
    summonsDueAt: shiftDays(today, -55),
    mediationStartedAt: shiftDays(today, -52),
    mediationDeadlineAt: shiftDays(today, -37),
    settledAt: shiftDays(today, -4),
    incidentDate: shiftDays(today, -63),
    incidentLocation: "Alley between Purok 5 lots 9 and 10",
    parties: [
      me("complainant", 25),
      party({
        id: 26,
        type: "respondent",
        name: "Corazon D. Reyes",
        address: "Purok 5, Barangay San Isidro",
        contact: "0939 118 5527",
      }),
    ],
    hearings: [
      {
        id: 35,
        number: 1,
        phase: "Kapitan",
        date: shiftDays(today, -52),
        time: "09:00 AM",
        venue: "Barangay Hall — Office of the Punong Barangay",
        status: "Held",
        outcome: "Settled — agreement reduced to writing",
      },
    ],
    settlement: {
      type: "Amicable Settlement",
      date: shiftDays(today, -4),
      terms:
        "1. Babuksan muli ni Corazon D. Reyes ang 2-metrong daluyan sa loob ng pitong (7) araw.\n2. Hindi magtatayo ang alinmang panig ng hadlang sa daluyan.\n3. Ang gastos sa pag-aalis ay hatiin ng dalawang panig.\n4. May bisa ang kasunduang ito pagkatapos pagpirmahan ng Lupon at ng mga testigo.",
      status: "Active",
    },
    documents: [
      { id: 46, kind: "amicable_settlement", label: "Amicable settlement — signed copy", status: "ready", servedAt: shiftDays(today, -4) },
    ],
    events: [
      { id: 56, to: "filed", date: `${shiftDays(today, -59)}T08:00:00`, notes: "Case docketed." },
      { id: 57, to: "mediation_active", date: `${shiftDays(today, -52)}T09:30:00`, notes: "First mediation meeting held." },
      { id: 58, to: "settled", date: `${shiftDays(today, -4)}T11:15:00`, notes: "Settlement recorded and signed by both parties." },
    ],
  }),

  makeCase({
    // The resident is a verified respondent — third tab, no summons issued yet.
    id: 9,
    caseNumber: "KP-2026-009",
    title: "Nighttime disturbance along Purok 4",
    caseType: "Noise / Disturbance",
    status: "filed",
    filedDate: shiftDays(today, -3),
    feeAmount: "150.00",
    orNumber: "OR-2026-004511",
    summonsDueAt: shiftDays(today, -1),
    incidentDate: shiftDays(today, -8),
    incidentLocation: "Purok 4, corner of Sampaguita Street",
    intakeNarrative:
      "Inatake po ng barangay tanod ang ulat matapos maulit ang ingay tuwing gabi. Hinihiling po naming pag-usapan ito sa harapan ng Kapitan.",
    parties: [
      party({
        id: 27,
        type: "complainant",
        name: "Romeo T. Dela Cruz",
        address: "Purok 4, Barangay San Isidro",
        contact: "0917 330 2211",
      }),
      me("respondent", 28),
    ],
    hearings: [
      {
        id: 36,
        number: 1,
        phase: "Kapitan",
        date: shiftDays(today, 4),
        time: "10:00 AM",
        venue: "Barangay Hall — Lupon Session Room",
        status: "Scheduled",
        outcome: null,
      },
    ],
    settlement: null,
    // Unserved notice: the respondent has not been handed it, so it stays hidden.
    documents: [
      { id: 47, kind: "notice_of_hearing", label: "Notice of Hearing — 1st Kapitan meeting", status: "ready", servedAt: null },
    ],
    events: [{ id: 59, to: "filed", date: `${shiftDays(today, -3)}T15:40:00`, notes: "Case docketed." }],
  }),

  makeCase({
    // Second case against the resident, already in mediation.
    id: 6,
    caseNumber: "KP-2026-006",
    title: "Unpaid balance for construction materials",
    caseType: "Debt / Money Dispute",
    status: "mediation_active",
    filedDate: shiftDays(today, -18),
    feeAmount: "250.00",
    orNumber: "OR-2026-004368",
    form7IssuedAt: shiftDays(today, -15),
    summonsDueAt: shiftDays(today, -14),
    mediationStartedAt: shiftDays(today, -9),
    mediationDeadlineAt: shiftDays(today, 6),
    incidentDate: shiftDays(today, -70),
    incidentLocation: "Purok 2, Barangay San Isidro",
    intakeNarrative:
      "Hinango po ng aking kasosyo ang mga materyales at hindi nabayaran sa nakasulat na termino. Handa po akong makipagkasundo sa bayad sa bahagi.",
    parties: [
      party({
        id: 29,
        type: "complainant",
        name: "Leslie B. Ocampo",
        address: "Purok 2, Barangay San Isidro",
        contact: "0995 771 0032",
      }),
      me("respondent", 30),
    ],
    hearings: [
      {
        id: 37,
        number: 1,
        phase: "Kapitan",
        date: shiftDays(today, -9),
        time: "09:30 AM",
        venue: "Barangay Hall — Office of the Punong Barangay",
        status: "Held",
        outcome: "Continued — respondent asked for time to verify receipts",
      },
      {
        id: 38,
        number: 2,
        phase: "Kapitan",
        date: shiftDays(today, 3),
        time: "02:00 PM",
        venue: "Barangay Hall — Lupon Session Room",
        status: "Rescheduled",
        outcome: null,
      },
    ],
    settlement: null,
    documents: [
      { id: 48, kind: "summons", label: "Summons (Form 7) — respondent", status: "ready", servedAt: shiftDays(today, -14) },
    ],
    events: [
      { id: 60, to: "filed", date: `${shiftDays(today, -18)}T10:10:00`, notes: "Case docketed." },
      { id: 61, to: "mediation_active", date: `${shiftDays(today, -9)}T09:45:00`, notes: "First mediation meeting held." },
    ],
  }),

  makeCase({
    // The resident is named but not yet verified, so this docket stays invisible.
    id: 12,
    caseNumber: "KP-2026-012",
    title: "Flooded backyard along Purok 3",
    caseType: "Property / Boundary Dispute",
    status: "filed",
    filedDate: shiftDays(today, -2),
    feeAmount: "150.00",
    orNumber: "OR-2026-004539",
    incidentDate: shiftDays(today, -6),
    incidentLocation: "Purok 3, block 7",
    intakeNarrative: "Ang tubig mula sa kanyang bakuran ay pumapasok sa aming bahay tuwing umuulan.",
    parties: [
      party({ id: 31, type: "complainant", name: "Nora S. Pascual", address: "Purok 3, Barangay San Isidro" }),
      party({ id: 32, type: "respondent", name: residentName(), residentId: SESSION_RESIDENT_ID, associationStatus: "pending" }),
    ],
    hearings: [],
    settlement: null,
    documents: [],
    events: [{ id: 62, to: "filed", date: `${shiftDays(today, -2)}T13:00:00`, notes: "Case docketed." }],
  }),
]

/* ------------------------------------------------------------------ */
/* Evidence                                                            */
/* ------------------------------------------------------------------ */

const evidence: LuponEvidenceRow[] = [
  { id: 101, complaintId: 42, caseId: null, residentId: SESSION_RESIDENT_ID, shared: false, name: "ingay-log-purok4.jpg", size: 486_912 },
  { id: 102, complaintId: 39, caseId: null, residentId: SESSION_RESIDENT_ID, shared: false, name: "chat-screenshot.png", size: 1_248_768 },
  { id: 103, complaintId: 39, caseId: null, residentId: SESSION_RESIDENT_ID, shared: true, name: "loan-acknowledgement.docx", size: 38_400 },
  { id: 104, complaintId: 36, caseId: null, residentId: SESSION_RESIDENT_ID, shared: false, name: "survey-plan.pdf", size: 2_306_048 },
  { id: 105, complaintId: 28, caseId: 7, residentId: SESSION_RESIDENT_ID, shared: true, name: "gate-damage.jpg", size: 892_928 },
  { id: 106, complaintId: null, caseId: 7, residentId: null, shared: true, name: "tanod-photo-attachments.pdf", size: 1_572_864 },
  { id: 107, complaintId: null, caseId: 5, residentId: null, shared: true, name: "blotter-copy.pdf", size: 623_616 },
  { id: 108, complaintId: null, caseId: 5, residentId: SESSION_RESIDENT_ID, shared: false, name: "text-logs.pdf", size: 114_688 },
  { id: 109, complaintId: null, caseId: 9, residentId: null, shared: true, name: "incident-report.pdf", size: 268_281 },
  // Another resident's private upload — never on this respondent's list.
  { id: 110, complaintId: null, caseId: 9, residentId: 88, shared: false, name: "affidavit-of-complainant.pdf", size: 145_404 },
  { id: 111, complaintId: null, caseId: 6, residentId: null, shared: true, name: "delivery-receipts.jpg", size: 704_512 },
  { id: 112, complaintId: null, caseId: 2, residentId: null, shared: true, name: "survey-sketch.png", size: 350_208 },
]

/* ------------------------------------------------------------------ */
/* Workflow timeline                                                    */
/* ------------------------------------------------------------------ */

export type LuponDeadline = {
  label: string
  date: string
  active: boolean
  daysRemaining: number
}

export type LuponTimeline = {
  status: LuponCaseStatus
  statusLabel: string
  phase: string
  trackingStatus: string
  deadlines: LuponDeadline[]
  /** Staff notes are stripped: `timeline($case, staff: false)`. */
  events: { id: number; to: LuponCaseStatus; date: string }[]
}

/** `LuponCaseWorkflow::tracking()` — the single label the parties are shown. */
export function trackingOf(record: LuponCaseRow): string {
  switch (record.status) {
    case "settled":
      return "Settled"
    case "certified_to_file_action":
      return "CFA Issued"
    case "dismissed":
      return "Dismissed"
    case "repudiated":
      return "Under Review"
    default:
      return record.form7IssuedAt ? "Summoned" : "Under Review"
  }
}

/** `LuponCaseWorkflow::timeline($case, staff: false)`. */
export function timelineOf(record: LuponCaseRow): LuponTimeline {
  const deadlines: LuponDeadline[] = []
  const push = (label: string, date: string, active: boolean) => {
    deadlines.push({ label, date, active, daysRemaining: daysUntil(date) })
  }

  if (record.summonsDueAt)
    push("Summons target (next working day)", record.summonsDueAt, record.status === "filed" && !record.form7IssuedAt)
  if (record.mediationDeadlineAt)
    push("Mediation — 15 days from first meeting", record.mediationDeadlineAt, record.status === "mediation_active")
  if (record.conciliationDeadlineAt)
    push(
      "Conciliation — initial 15 days",
      record.conciliationDeadlineAt,
      record.status === "conciliation_active" && !record.conciliationExtendedUntil,
    )
  if (record.conciliationExtendedUntil)
    push("Conciliation — approved extension", record.conciliationExtendedUntil, record.status === "conciliation_active")
  if (record.pangkatFormedAt)
    push(
      "Pangkat convening target — 3 days from constitution",
      shiftDays(record.pangkatFormedAt, 3),
      record.status === "pangkat_formed",
    )
  if (record.settledAt) {
    const until = shiftDays(record.settledAt, 10)
    push("Settlement repudiation period — 10 days", until, record.status === "settled" && daysUntil(until) >= 0)
  }

  return {
    status: record.status,
    statusLabel: caseStatusLabel(record.status),
    phase: phaseOf(record.status),
    trackingStatus: trackingOf(record),
    deadlines,
    events: record.events.map((event) => ({ id: event.id, to: event.to, date: event.date })),
  }
}

/* ------------------------------------------------------------------ */
/* Filing                                                              */
/* ------------------------------------------------------------------ */

/** A file chosen on the device — the reference page sends the same three facts. */
export type ComplaintEvidence = { name: string; size: number }

export type ComplaintFormValues = {
  respondentName: string
  respondentResidentStatus: string
  respondentAddress: string
  respondentContact: string
  complaintType: string
  incidentDate: string
  incidentTime: string
  incidentLocation: string
  narrative: string
  requestedAction: string
  evidence: ComplaintEvidence[]
}

export const emptyComplaintForm: ComplaintFormValues = {
  respondentName: "",
  respondentResidentStatus: "",
  respondentAddress: "",
  respondentContact: "",
  complaintType: "",
  incidentDate: "",
  incidentTime: "",
  incidentLocation: "",
  narrative: "",
  requestedAction: "",
  evidence: [],
}

/** The seven fields `canContinue` gates the Continue button on. */
export function canContinueComplaint(values: ComplaintFormValues): boolean {
  return (
    values.respondentName.trim() !== "" &&
    values.respondentResidentStatus !== "" &&
    values.complaintType !== "" &&
    values.incidentDate !== "" &&
    values.incidentLocation.trim() !== "" &&
    values.narrative.trim() !== "" &&
    values.requestedAction.trim() !== ""
  )
}

/** `LuponCatalog::FILE_RULES`. */
const EVIDENCE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".docx"]
const EVIDENCE_MAX_BYTES = 5120 * 1024
const EVIDENCE_MAX_FILES = 5

export type ComplaintField = keyof ComplaintFormValues

/** `LuponComplaintController::store()`'s validator, messages and all. */
export function validateComplaint(values: ComplaintFormValues): Partial<Record<ComplaintField, string>> {
  const errors: Partial<Record<ComplaintField, string>> = {}
  const text = (value: string) => value.trim()
  const required = (field: string) => `The ${field} field is required.`
  const tooLong = (field: string, max: number) => `The ${field} field must not be greater than ${max} characters.`

  if (!text(values.respondentName)) errors.respondentName = required("respondent name")
  else if (text(values.respondentName).length > 255) errors.respondentName = tooLong("respondent name", 255)

  if (!values.respondentResidentStatus) errors.respondentResidentStatus = required("respondent resident status")
  else if (!respondentResidentStatuses.includes(values.respondentResidentStatus as (typeof respondentResidentStatuses)[number]))
    errors.respondentResidentStatus = "The selected respondent resident status is invalid."

  if (text(values.respondentAddress).length > 1000) errors.respondentAddress = tooLong("respondent address", 1000)
  if (text(values.respondentContact).length > 50) errors.respondentContact = tooLong("contact", 50)

  if (!values.complaintType) errors.complaintType = required("complaint type")
  else if (!complaintTypes.includes(values.complaintType as (typeof complaintTypes)[number]))
    errors.complaintType = "The selected complaint type is invalid."

  if (!values.incidentDate) errors.incidentDate = required("incident date")
  else if (values.incidentDate > luponToday())
    errors.incidentDate = `The incident date must be a date before or equal to ${luponToday()}.`

  if (values.incidentTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.incidentTime))
    errors.incidentTime = "The incident time must be a valid time."

  if (!text(values.incidentLocation)) errors.incidentLocation = required("incident location")
  else if (text(values.incidentLocation).length > 500) errors.incidentLocation = tooLong("incident location", 500)

  if (!text(values.narrative)) errors.narrative = required("narrative")
  else if (text(values.narrative).length > 5000) errors.narrative = tooLong("narrative", 5000)

  if (!text(values.requestedAction)) errors.requestedAction = required("requested action")
  else if (text(values.requestedAction).length > 2000)
    errors.requestedAction = tooLong("requested action", 2000)

  if (values.evidence.length > EVIDENCE_MAX_FILES)
    errors.evidence = "The evidence field must not have more than 5 files."
  else {
    const rejected = values.evidence.find(
      (file) =>
        !EVIDENCE_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension)) ||
        file.size > EVIDENCE_MAX_BYTES,
    )
    if (rejected)
      errors.evidence = `The evidence must be a file of type pdf, jpg, jpeg, png, webp, docx and under 5120 KB: ${rejected.name}`
  }

  return errors
}

/** `nextReference()` — `LUP-<year>-` plus a five-digit sequence. */
function nextReference(): string {
  const prefix = `LUP-${luponToday().slice(0, 4)}-`
  const highest = complaints
    .map((row) => row.reference)
    .filter((reference) => reference.startsWith(prefix))
    .reduce((max, reference) => Math.max(max, Number(reference.slice(prefix.length)) || 0), 0)

  return `${prefix}${String(highest + 1).padStart(5, "0")}`
}

/**
 * `store()` — the reference and the `Submitted` status are the server's to give,
 * and `submitted_at` is stamped now.
 */
export function fileComplaint(values: ComplaintFormValues): {
  ok: boolean
  reference: string | null
  errors: Partial<Record<ComplaintField, string>>
} {
  const errors = validateComplaint(values)
  if (Object.keys(errors).length > 0) return { ok: false, reference: null, errors }

  const id = Math.max(...complaints.map((row) => row.id)) + 1
  const reference = nextReference()

  complaints.push({
    id,
    reference,
    residentId: SESSION_RESIDENT_ID,
    respondentName: values.respondentName.trim(),
    respondentResidentStatus: values.respondentResidentStatus,
    respondentAddress: values.respondentAddress.trim() || null,
    respondentContact: values.respondentContact.trim() || null,
    complaintType: values.complaintType,
    incidentDate: values.incidentDate,
    incidentTime: values.incidentTime || null,
    incidentLocation: values.incidentLocation.trim(),
    narrative: values.narrative.trim(),
    requestedAction: values.requestedAction.trim(),
    status: "Submitted",
    luponNote: null,
    assessedFee: null,
    submittedAt: luponToday(),
  })

  let evidenceId = Math.max(...evidence.map((row) => row.id))
  for (const file of values.evidence) {
    evidenceId += 1
    evidence.push({
      id: evidenceId,
      complaintId: id,
      caseId: null,
      residentId: SESSION_RESIDENT_ID,
      shared: false,
      name: file.name,
      size: file.size,
    })
  }

  return { ok: true, reference, errors: {} }
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/** `Resident/Lupon`'s `resident` prop. */
export function complainantDetails() {
  return {
    fullName: residentName(),
    residentNumber: sessionResident().residentNumber,
    address: residentAddress(),
  }
}

/** `->where('resident_id', $resident->id)->latest('created_at')`. */
export function complaintsOfResident(): LuponComplaintRow[] {
  return complaints
    .filter((row) => row.residentId === SESSION_RESIDENT_ID)
    .slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt) || b.id - a.id)
}

export function caseOfComplaint(complaintId: number): LuponCaseRow | null {
  return cases.find((record) => record.complaintId === complaintId) ?? null
}

export function complaintOfCase(record: LuponCaseRow): LuponComplaintRow | null {
  return record.complaintId ? (complaints.find((row) => row.id === record.complaintId) ?? null) : null
}

/** Every file on a complaint — the index eager-loads the whole relation. */
export function evidenceOfComplaint(complaintId: number): LuponEvidenceRow[] {
  return evidence.filter((row) => row.complaintId === complaintId)
}

/**
 * `whereHas('respondents', …verified)` — a respondent staff has not verified yet
 * keeps the docket off the third tab.
 */
export function casesAgainstResident(): LuponCaseRow[] {
  return cases
    .filter((record) =>
      record.parties.some(
        (row) => row.type === "respondent" && row.residentId === SESSION_RESIDENT_ID && row.associationStatus === "verified",
      ),
    )
    .slice()
    .sort((a, b) => b.filedDate.localeCompare(a.filedDate))
}

/** `complainants->where('is_primary', true)->limit(1)`, or the fallback name. */
export function primaryComplainantOf(record: LuponCaseRow): string {
  const party = record.parties.find((row) => row.type === "complainant" && row.isPrimary)

  return party ? party.name : "Complainant"
}

export function primaryRespondentOf(record: LuponCaseRow): string {
  const party = record.parties.find((row) => row.type === "respondent" && row.isPrimary)

  return party ? party.name : "Respondent"
}

/** The next meeting the parties must attend — `whereIn('status', ['Scheduled', 'Rescheduled'])`. */
export function nextHearingOf(record: LuponCaseRow): LuponHearingRow | null {
  const upcoming = record.hearings
    .filter((hearing) => hearing.status === "Scheduled" || hearing.status === "Rescheduled")
    .sort((a, b) => a.date.localeCompare(b.date))

  return upcoming[0] ?? null
}

export type CaseViewer = { record: LuponCaseRow; viewerRole: "complainant" | "respondent" }

/**
 * `LuponCaseController::show()` — the docket opens for its complainant or for a
 * respondent staff verified; anyone else gets the 403, which this portal renders
 * as a missing record.
 */
export function caseForViewer(id: string | undefined): CaseViewer | null {
  const record = cases.find((entry) => String(entry.id) === id)
  if (!record) return null

  const isComplainant =
    record.parties.some((row) => row.type === "complainant" && row.residentId === SESSION_RESIDENT_ID) ||
    complaintOfCase(record)?.residentId === SESSION_RESIDENT_ID

  const isVerifiedRespondent = record.parties.some(
    (row) => row.type === "respondent" && row.residentId === SESSION_RESIDENT_ID && row.associationStatus === "verified",
  )

  if (!isComplainant && !isVerifiedRespondent) return null

  return { record, viewerRole: isComplainant ? "complainant" : "respondent" }
}

/**
 * `LuponCasePresenter::details()` for a resident viewer: a document must be ready
 * and, for a notice or summons, actually served.
 */
export function visibleDocumentsOf(record: LuponCaseRow): LuponDocumentRow[] {
  return record.documents.filter(
    (document) =>
      document.status === "ready" &&
      (document.kind === "amicable_settlement" || document.kind === "cfa" || document.servedAt !== null),
  )
}

/** Own uploads, staff files shared with the parties, and the viewer's own complaint. */
export function visibleEvidenceOf(record: LuponCaseRow): LuponEvidenceRow[] {
  const complaint = complaintOfCase(record)

  return evidence.filter(
    (row) =>
      row.caseId === record.id &&
      (row.residentId === SESSION_RESIDENT_ID ||
        row.shared ||
        (complaint !== null && row.complaintId === complaint.id)),
  )
}

/** `formatSize` of the evidence list — kilobytes, rounded to the whole. */
export function formatFileSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`
}

/** The filing fee with the two decimals the treasury prints. */
export function formatFilingFee(amount: string | number | null | undefined): string {
  return Number(amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
