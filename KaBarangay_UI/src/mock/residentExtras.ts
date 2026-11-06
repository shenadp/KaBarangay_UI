/**
 * Page-local mock content for the resident detail pages: Updates, Org Chart,
 * Lupon case, Disbursement and Citizen's Charter.
 *
 * `src/mock/data.ts` and `src/mock/resident.ts` are shared by every area and
 * must not be edited, so the extra records these pages need live here.
 */

import { announcements } from "@/mock/data"

/** Route params may already be decoded; decode again without throwing on a stray "%". */
function safeDecode(value: string | undefined): string {
  try {
    return decodeURIComponent(value ?? "")
  } catch {
    return value ?? ""
  }
}

/* ------------------------------------------------------------------ */
/* Updates feed                                                        */
/* ------------------------------------------------------------------ */

export type UpdateKind = "urgent" | "services" | "advisory"

export type ResidentUpdate = {
  /** Announcement id — the card links to `/resident/announcements/:id`. */
  id: number
  kind: UpdateKind
  label: string
  title: string
  summary: string
  date: string
  source: string
}

const updateMeta: Record<number, { kind: UpdateKind; source: string }> = {
  1: { kind: "services", source: "Senior Citizens Desk" },
  2: { kind: "advisory", source: "Committee on Agriculture and Environment" },
  3: { kind: "urgent", source: "PWD Desk" },
  4: { kind: "urgent", source: "Barangay Health Worker" },
  5: { kind: "services", source: "SK Council" },
  6: { kind: "advisory", source: "Office of the Barangay Secretary" },
}

const updateLabels: Record<UpdateKind, string> = {
  urgent: "Urgent",
  services: "Services",
  advisory: "Advisory",
}

function toEpoch(date: string): number {
  const value = Date.parse(date)
  return Number.isNaN(value) ? 0 : value
}

/** Short advisories a resident can scan — newest first. */
export const residentUpdates: ResidentUpdate[] = announcements
  .filter((item) => item.status === "Published" || item.status === "Scheduled")
  .map<ResidentUpdate>((item) => {
    const meta = updateMeta[item.id]
    const kind = meta ? meta.kind : "advisory"
    return {
      id: item.id,
      kind,
      label: updateLabels[kind],
      title: item.title,
      summary: item.summary,
      date: item.date,
      source: meta ? meta.source : "Barangay Office",
    }
  })
  .sort((a, b) => toEpoch(b.date) - toEpoch(a.date))

/* ------------------------------------------------------------------ */
/* Disbursement documents                                              */
/* ------------------------------------------------------------------ */

export type DisbursementLine = { particulars: string; amount: number }

export type DisbursementDoc = {
  /** Disbursement voucher no — the route param is `/resident/disbursement/:id`. */
  id: string
  item: string
  category: string
  period: string
  date: string
  status: "Posted" | "For Review" | "Pending"
  payee: string
  fund: string
  file: { name: string; size: string; format: string; pages: number }
  lines: DisbursementLine[]
  related: string[]
}

export const disbursementDocs: DisbursementDoc[] = [
  {
    id: "DV-2026-0418",
    item: "Health station medicines and vaccines",
    category: "Health",
    period: "Oct 1 – Oct 18, 2026",
    date: "Oct 18, 2026",
    status: "Posted",
    payee: "Laguna Medical Supplies Inc.",
    fund: "Barangay Development Fund 2026",
    file: { name: "DV-2026-0418.pdf", size: "248 KB", format: "PDF", pages: 2 },
    lines: [
      { particulars: "Paracetamol 500 mg — 60 boxes", amount: 14_400 },
      { particulars: "Amoxicillin 500 mg — 40 boxes", amount: 11_200 },
      { particulars: "Syringes and needles — 1,000 pcs", amount: 8_900 },
      { particulars: "Antiseptic solution, gloves and gauze", amount: 7_600 },
      { particulars: "Cold chain delivery of routine vaccines", amount: 24_300 },
      { particulars: "Nebulizer maintenance and consumables", amount: 20_000 },
    ],
    related: ["DV-2026-0417", "DV-2026-0416"],
  },
  {
    id: "DV-2026-0417",
    item: "Streetlight repair along Riverside Road",
    category: "Infrastructure",
    period: "Oct 6 – Oct 15, 2026",
    date: "Oct 15, 2026",
    status: "Posted",
    payee: "R. Bautista Electrical Works",
    fund: "Barangay Development Fund 2026",
    file: { name: "DV-2026-0417.pdf", size: "196 KB", format: "PDF", pages: 2 },
    lines: [
      { particulars: "LED streetlight fixtures — 18 units", amount: 25_200 },
      { particulars: "Poles, brackets and hardware replacement", amount: 9_600 },
      { particulars: "Labor, wiring and testing", amount: 7_500 },
    ],
    related: ["DV-2026-0418", "DV-2026-0416"],
  },
  {
    id: "DV-2026-0416",
    item: "Drainage desilting in Purok 3",
    category: "Infrastructure",
    period: "Sep 29 – Oct 12, 2026",
    date: "Oct 12, 2026",
    status: "Posted",
    payee: "Santa Rosa Hauling Services",
    fund: "Barangay Development Fund 2026",
    file: { name: "DV-2026-0416.pdf", size: "312 KB", format: "PDF", pages: 3 },
    lines: [
      { particulars: "Desilting of canal — 420 lin. m", amount: 63_000 },
      { particulars: "Hauling and disposal of silt — 14 truckloads", amount: 37_800 },
      { particulars: "Protective gear, shovels and hauling tools", amount: 6_450 },
      { particulars: "Community labor honoraria — 12 workers", amount: 11_500 },
    ],
    related: ["DV-2026-0418", "DV-2026-0417"],
  },
]

/** Sum of the voucher line items — the document total. */
export function disbursementTotal(doc: DisbursementDoc): number {
  return doc.lines.reduce((sum, line) => sum + line.amount, 0)
}

/** Find a voucher; unknown or missing ids fall back to the first one. */
export function findDisbursementDoc(id?: string): DisbursementDoc {
  const value = safeDecode(id).trim().toLowerCase()
  const match = disbursementDocs.find((item) => item.id.toLowerCase() === value)
  if (match) return match
  if (/^\d+$/.test(value)) {
    const byIndex = disbursementDocs[Number(value) - 1]
    if (byIndex) return byIndex
  }
  return disbursementDocs[0]
}

