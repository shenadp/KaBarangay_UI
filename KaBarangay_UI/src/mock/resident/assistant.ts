/**
 * Resident portal — Kabarangay AI.
 *
 * The reference posts every message to `ChatbotController::sendMessage()`, which
 * takes one of two branches. A tracking question is answered straight from
 * `AssistantResidentRecords` — no model involved — and everything else is handed
 * to a hosted model whose only facts are `AssistantSystemKnowledge` plus the
 * same record snapshot.
 *
 * This portal keeps both branches but runs them locally: the tracking branch is
 * ported verbatim against the mock stores the rest of the portal already reads,
 * and the model branch is replaced by a deterministic responder written from
 * that guide. Nothing is fetched and the assistant never submits, approves,
 * pays or edits anything — exactly the scope the guide states.
 */

import { peso } from "@/mock/resident"
import { clerkCertificateStore } from "@/mock/clerk/certificates"
import {
  SESSION_RESIDENT_ID,
} from "./session"
import { formatShortDate } from "./announcements"
import { certificateCatalog } from "./certificates"
import { applications } from "./sector-applications"
import { charterServicesPage } from "./charter"
import {
  caseOfComplaint,
  caseStatusLabel,
  casesAgainstResident,
  complaintsOfResident,
  nextHearingOf,
  phaseOf,
} from "@/mock/luponIntake"

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

/** The `message` rule on the controller — the textarea is capped at the same number. */
export const CHATBOT_MAX_MESSAGE_LENGTH = 1000

/** One line of the record snapshot, in the column order the controller returns it. */
export type TrackingRecord = {
  category: "certificate" | "complaint" | "case" | "sector"
  reference: string
  label: string
  status: string
  detail: string
  url: string
  updatedAt?: string
}

export type AssistantAnswer = {
  reply: string
  records?: TrackingRecord[]
  source?: string
  checkedAt?: string
}

/**
 * `HandleInertiaRequests` builds this as
 * `kabarangay_assistant_state:hmac(resident id)`, so two accounts on one device
 * never share a transcript. The demo has no app key to sign with, so the digest
 * below is a stable stand-in with the same property — it is not the raw id.
 */
export function chatbotStorageKey(): string {
  return `kabarangay_assistant_state:${digest(`resident:${SESSION_RESIDENT_ID}`)}`
}

const digest = (value: string): string => {
  let out = ""
  for (let block = 0; block < 2; block++) {
    let hash = 0x811c9dc5 ^ (block * 0x01000193)
    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    out += hash.toString(16).padStart(8, "0")
    for (let round = 0; round < 3; round++) {
      hash = Math.imul(hash ^ (hash >>> 15), 0x2545f491) >>> 0
      out += hash.toString(16).padStart(8, "0")
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Record snapshot — AssistantResidentRecords::snapshot()               */
/* ------------------------------------------------------------------ */

/** `latest('updated_at')->limit(5)` per category, then the whole list newest first. */
export function assistantSnapshot(reference?: string): TrackingRecord[] {
  const records: TrackingRecord[] = []
  const matches = (value: string) => (reference ? value.toUpperCase() === reference : true)

  for (const item of clerkCertificateStore
    .queue()
    .filter((request) => request.residentId === SESSION_RESIDENT_ID && matches(request.reference))
    .sort(bySubmittedDesc)
    .slice(0, 5)) {
    records.push({
      category: "certificate",
      reference: item.reference,
      label: item.certificate || "Certificate request",
      status: item.status,
      detail: `Isinumite: ${formatShortDate(item.submittedAt)}`,
      url: "/resident/certificates",
      updatedAt: item.submittedAt,
    })
  }

  for (const item of complaintsOfResident()
    .filter((complaint) => matches(complaint.reference))
    .slice(0, 5)) {
    records.push({
      category: "complaint",
      reference: item.reference,
      label: "Lupon complaint",
      status: item.status,
      detail: `Isinumite: ${formatShortDate(item.submittedAt)}`,
      url: "/resident/lupon",
      updatedAt: item.submittedAt,
    })
  }

  const docketed = [
    ...complaintsOfResident().map((complaint) => caseOfComplaint(complaint.id)),
    ...casesAgainstResident(),
  ].filter((record, index, all): record is NonNullable<typeof record> =>
    Boolean(record) && all.findIndex((other) => other?.id === record?.id) === index,
  )

  for (const item of docketed
    .filter((record) => matches(record.caseNumber))
    .sort(byFiledDesc)
    .slice(0, 5)) {
    const hearing = nextHearingOf(item)

    records.push({
      category: "case",
      reference: item.caseNumber,
      label: "Lupon case",
      status: caseStatusLabel(item.status),
      detail:
        `Phase: ${phaseOf(item.status)}` +
        (hearing ? ` · Hearing: ${formatShortDate(hearing.date)} ${hearing.time ?? ""} · ${hearing.venue}` : ""),
      url: `/resident/lupon/cases/${item.id}`,
      updatedAt: item.filedDate,
    })
  }

  for (const item of applications()
    .filter((application) => matches(application.trackingNumber))
    .slice(0, 5)) {
    records.push({
      category: "sector",
      reference: item.trackingNumber,
      label: `${item.sectorName} application`,
      status: item.statusLabel,
      detail: `Isinumite: ${item.submittedAt}`,
      url: "/resident/sector-applications",
      updatedAt: item.submittedAt,
    })
  }

  return records.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
}

const bySubmittedDesc = (a: { submittedAt: string }, b: { submittedAt: string }) =>
  b.submittedAt.localeCompare(a.submittedAt)

const byFiledDesc = (a: { filedDate: string }, b: { filedDate: string }) =>
  b.filedDate.localeCompare(a.filedDate)

/* ------------------------------------------------------------------ */
/* Tracking branch                                                     */
/* ------------------------------------------------------------------ */

/** A "paano/proseso/steps" question is a guide question, never a status question. */
export function isTrackingQuestion(message: string): boolean {
  if (/\b(paano|how|proseso|process|steps)\b/i.test(message)) return false

  return /\b(track(?:ing)?|status|update|progress|reference|nasaan|kumusta|kamusta)\b|request ko|kaso ko|reklamo ko|application ko|approved na|ready na|naaprubahan/i.test(
    message,
  )
}

/** `trackingReply()` — the category filter, then the reference filter, then the same copy. */
export function trackingReply(message: string, records: TrackingRecord[]): AssistantAnswer {
  let matched = records

  if (/certificate|indigen|clearance|sertipiko/i.test(message))
    matched = matched.filter((record) => record.category === "certificate")
  else if (/lupon|kaso|case|reklamo|complaint/i.test(message))
    matched = matched.filter((record) => record.category === "case" || record.category === "complaint")
  else if (/sector|membership/i.test(message))
    matched = matched.filter((record) => record.category === "sector")

  const reference = message.match(/\b[A-Z]{2,12}-[A-Z0-9-]*\d[A-Z0-9-]*\b/i)?.[0]
  if (reference)
    matched = matched.filter(
      (record) => record.reference.toUpperCase() === reference.toUpperCase(),
    )

  return {
    reply:
      matched.length === 0
        ? "Wala akong nakitang matching request sa pinakahuling records ng account mo. Tingnan ang My Requests o Lupon page para sa buong listahan. Hindi ako makakapagpakita ng records ng ibang residente."
        : `Ito ang kasalukuyang status mula sa records ng account mo:\n\n${matched
            .map((record) => `${record.label} · ${record.reference}\nStatus: ${record.status}\n${record.detail}`)
            .join("\n\n")}`,
    records: matched,
    source: "resident_records",
    checkedAt: new Date().toISOString(),
  }
}

/* ------------------------------------------------------------------ */
/* Guide branch — AssistantSystemKnowledge, answered without a model    */
/* ------------------------------------------------------------------ */

const SCOPE_NOTE =
  "Gabay sa aktuwal na Resident Portal. Hindi awtomatikong nagsusumite, nag-aapprove, nagbabayad o nag-eedit ang chat."

const CATALOG_NOTE =
  "Database catalog at published descriptions lamang ang facts. Kung wala ang isang dokumento sa active catalog, hindi ko sasabihing available ito."

const CERTIFICATE_STEPS = [
  "Mag-sign in sa Resident Portal.",
  "Buksan ang Request Certificate at piliin ang Request Certificate tab.",
  "Suriin ang Your Information mula sa resident profile.",
  "Piliin ang certificate mula sa available list. Basahin ang fee at requirements na nakalagay sa napili.",
  "Ilagay ang purpose at lahat ng additional fields na hinihingi. Business details ay para lamang sa certificate na nangangailangan nito.",
  "Mag-Continue papunta sa review, suriin ang detalye, at pindutin ang Submit Request.",
  "Itabi ang reference number. Sa My Requests tab makikita ang status at tracking.",
  "Kapag For Payment o Ready for Claim, sundin ang nakasaad sa request at instruction ng barangay. Ang online submission ay hindi awtomatikong online payment, approval, release, o downloadable signed certificate.",
]

const CERTIFICATE_STATUSES = [
  "Pending — naisumite, naghihintay ng pagsusuri.",
  "For Payment — sundin ang payment instructions sa request o barangay.",
  "Processing — inihahanda ang certificate.",
  "Ready for Claim — handa nang kunin ayon sa instructions ng barangay.",
  "Released — naitalang na-release ang certificate.",
  "Rejected — hindi naaprubahan; buksan ang sariling request para sa pinapayagang detalye.",
]

const LUPON_STEPS = [
  "Buksan ang File a Complaint o Lupon.",
  "Ilagay ang respondent information, complaint type, incident details, salaysay at requested action ayon sa form.",
  "Magdagdag ng ebidensya kung mayroon, suriin at isumite.",
  "Itabi ang reference number. Sa My Complaints, For Review muna ang status.",
  "Kapag For Payment na, makikita ang assessed filing fee. Pumunta sa barangay office para magbayad at kumuha ng official receipt.",
  "Itatala ng staff ang OR number at unang hearing schedule. Saka pa lamang awtomatikong malilikha ang case sa Kapitan phase.",
  "Buksan ang linked case para sa hearing details at resulta. Hanggang tatlong hearings bawat phase; ang Kapitan hearing dates ay nasa 15-day period. Hindi online payment ang complaint submission.",
]

const SECTOR_STEPS = [
  "Buksan ang Sector Services o sector applications.",
  "Piliin ang available sector at kumpletuhin ang hinihinging detalye at proof.",
  "Suriin at isumite. Subaybayan ang application status at tugunan ang correction request kung mayroon.",
]

const REGISTRATION_STEPS = [
  "Piliin ang barangay at purok, at kumpletuhin ang personal at sector information.",
  "Ibigay ang required identity documents at live identity photo ayon sa form.",
  "Maglagay ng required mobile number at gumawa ng password. Optional ang email; unverified pa ang mobile.",
  "Suriin at isumite para sa admin review.",
  "Ipapadala sa inilagay na email ang approval, correction o rejection decision.",
]

const OTHER_PAGES: [RegExp, string, string][] = [
  [/announcement|balita|anuncio|notice/i, "Announcements", "/resident/announcements"],
  [/program|activity|kaganan/i, "Programs", "/resident/programs"],
  [/charter|serbisyo|service list/i, "Citizen's Charter", "/resident/citizen-charter"],
  [/official|namumuno|org chart|structure|kapitan/i, "Organizational chart", "/resident/org-chart"],
  [/profile|personal na detalye|identity|qr/i, "Profile", "/resident/profile"],
  [/settings|preperens|password/i, "Settings", "/resident/settings"],
  [/disbursement|gastos|payout|transparency/i, "Disbursement documents", "/resident/disbursement"],
]

/** The catalog entry the question is about, when the wording names one. */
function namedCertificate(message: string) {
  const catalog = certificateCatalog()
  const probes: [RegExp, RegExp][] = [
    [/indigen|indigency|mahirap/i, /indigency/i],
    [/clearance/i, /clearance/i],
    [/good moral|karakter/i, /good moral/i],
    [/scholarship|pagaaral/i, /scholarship/i],
    [/tricycle|trip/i, /tricycle/i],
    [/sari.?sari|store|tindahan/i, /sari-sari/i],
    [/delayed|psa|birth record|kapanganakan/i, /delayed psa/i],
    [/marriage|cohabitation|kasal/i, /marriage/i],
    [/residency|naninirahan|residence/i, /residency/i],
  ]

  for (const [question, entry] of probes) {
    if (!question.test(message)) continue
    const found = catalog.find((certificate) => entry.test(certificate.name))
    if (found) return found
  }

  return null
}

function numbered(steps: string[]): string {
  return steps.map((step, index) => `${index + 1}. ${step}`).join("\n")
}

function certificateGuide(message: string): string {
  const lines = [`Ganito ang proseso sa Resident Portal:\n\n${numbered(CERTIFICATE_STEPS)}`]
  const certificate = namedCertificate(message)

  if (certificate) {
    lines.push(
      `\nSa catalog ngayang "${certificate.name}":\nFee: ${peso(certificate.fee)}\nRequirements:\n${certificate.requirements
        .map((requirement) => `* ${requirement}`)
        .join("\n")}`,
    )
    if (certificate.description) lines.push(certificate.description)
    if (certificate.detailsFields.length > 0) {
      lines.push(
        `Karagdagang fields para rito: ${certificate.detailsFields.map((field) => field.label).join(", ")}.`,
      )
    }
    if (certificate.requiresBusinessDetails)
      lines.push("Kailangan din ang business name at business address para sa certificate na ito.")
  } else {
    lines.push(
      `\nAng mga available na certificate sa catalog ngayon ay ${catalogTitles()}.`,
    )
  }

  lines.push(`\nMga status na makikita sa My Requests:\n${CERTIFICATE_STATUSES.map((status) => `* ${status}`).join("\n")}`)
  lines.push("\nLink: /resident/certificates")

  return lines.join("\n")
}

function catalogTitles(): string {
  return certificateCatalog()
    .map((certificate) => `"${certificate.name}"`)
    .join(", ")
}

function serviceGuide(): string {
  const services = charterServicesPage({ page: 1 }).data.slice(0, 6)

  if (services.length === 0)
    return `Wala pang naka-publish na serbisyo sa Citizen's Charter ng barangay. ${CATALOG_NOTE}\n\nLink: /resident/citizen-charter`

  return `Narito ang mga published na serbisyo sa Citizen's Charter ngayon:\n\n${services
    .map((service) => `* ${service.title}${service.category ? ` (${service.category})` : ""} — /resident/citizen-charter/${service.id}`)
    .join("\n")}\n\n${CATALOG_NOTE}\n\nBuong listahan: /resident/citizen-charter`
}

function pageGuide(message: string): string | null {
  const found = OTHER_PAGES.find(([pattern]) => pattern.test(message))
  if (!found) return null

  const [, label, path] = found

  return `Makikita mo ito sa ${label} page ng portal mo: ${path}\n\nSa page na iyon ay direktang nababasa ng residente ang opisyal na record; walang isinusumite o binabago ang chat.`
}

const HELP_LIST = `Maitinong ko:\n* status ng iyong mga request, reklamo at application (tracking)\n* paano mag-request ng certificate\n* proseso ng Lupon Tagapamayapa\n* sector application at registration\n* kung saan makikita ang announcements, programs, Citizen's Charter, officials, disbursement documents`

/** The deterministic stand-in for the model branch, written from the portal guide. */
export function knowledgeReply(message: string): AssistantAnswer {
  let reply: string

  if (/lupon|kaso|reklamo|complaint|mediation|conciliation|hearing|pangkat|kapitan|barangay justice/i.test(message))
    reply = `Ganito ang proseso ng Lupon Tagapamayapa sa portal:\n\n${numbered(LUPON_STEPS)}\n\nLink: /resident/lupon`
  else if (/certificate|sertipiko|indigen|clearance|good moral|residency|scholarship|tricycle|sari|psa|marriage|fee|requirement/i.test(message))
    reply = certificateGuide(message)
  else if (/sector|senior|pwd|disability|membership|accredit/i.test(message))
    reply = `Ganito ang sector application sa portal:\n\n${numbered(SECTOR_STEPS)}\n\nLink: /resident/sector-applications`
  else if (/register|registration|patali|sign ?in|login|password|account|email verification/i.test(message))
    reply = `Ganito ang registration at pag-access ng portal:\n\n${numbered(REGISTRATION_STEPS)}\n\nLink: /resident/register`
  else if (/charter|serbisyo|service list|listahan ng serbisyo/i.test(message))
    reply = serviceGuide()
  else if (/kumusta|kamusta|hello|^hi\b|magandang (araw|umaga|hapon|gabi)/i.test(message))
    reply = `Magandang araw! Ako si Kabarangay AI, gabay mo sa Resident Portal.\n\n${HELP_LIST}`
  else if (/salamat|thank|ok\b|okay|sige/i.test(message))
    reply = "Walang anuman! Nandito ako kapag may gusto ka pang itanong tungkol sa serbisyo ng barangay."
  else
    reply =
      pageGuide(message) ??
      `Wala sa gabay na nasa portal ang tanong na iyon, kaya hindi ako mag-iimbento ng sagot.\n\n${SCOPE_NOTE}\n\n${HELP_LIST}`

  return { reply }
}

/* ------------------------------------------------------------------ */
/* The send flow                                                       */
/* ------------------------------------------------------------------ */

/** `sendMessage()` without the HTTP hop: tracking first, guide second. */
export function assistantAnswer(message: string): AssistantAnswer {
  const trimmed = message.trim()

  if (trimmed.length > CHATBOT_MAX_MESSAGE_LENGTH)
    return { reply: "Hanggang 1,000 characters lamang ang mensahe." }

  if (isTrackingQuestion(trimmed))
    return trackingReply(trimmed, assistantSnapshot(referenceIn(trimmed)))

  return knowledgeReply(trimmed)
}

/** The controller uppercases the matched reference before it filters the snapshot. */
export function referenceIn(message: string): string | undefined {
  return message.match(/\b[A-Z]{2,12}-[A-Z0-9-]*\d[A-Z0-9-]*\b/i)?.[0].toUpperCase()
}
