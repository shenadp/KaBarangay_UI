/**
 * Page-local mock content for the Resident portal.
 *
 * `src/mock/data.ts` is shared by every area and must not be edited, so the
 * extra copy the resident pages need (announcement bodies, charter details,
 * barangay officials, fund records, assistant replies) lives here.
 */

import { certificateTypes } from "@/mock/data"

/* ------------------------------------------------------------------ */
/* Certificates                                                        */
/* ------------------------------------------------------------------ */

export const certificateSteps = [
  { step: 1, title: "Request", caption: "File online" },
  { step: 2, title: "Review", caption: "Clerk verifies" },
  { step: 3, title: "Claim", caption: "Pick up or deliver" },
]

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export type AnnouncementDetail = {
  venue: string
  schedule: string
  body: string[]
}

export const announcementDetails: Record<number, AnnouncementDetail> = {
  1: {
    venue: "Covered Court, Barangay San Isidro",
    schedule: "9:00 AM – 11:30 AM",
    body: [
      "Lubos po naming inaanyayahan ang ating mga senior citizens sa quarterly assembly ng ika-apat na quarter. Ito po ang huling assembly ng taon kung saan ihahatid ang tungkol sa quarterly pension release at sa mga bagong patakaran ng DISC.",
      "Kasama rin sa agenda ang medical mission sa Oktubre 24, ang rehistro ng mga bagong senior ID, at ang pagpapahayag ng inyong mga hinaing sa purok. Inaanyayahan po ang bawat senior na dalhin ang inyong senior citizen book o valid ID para sa mabilis na verification.",
      "Mangyaring dumating bago mag-9:00 AM upang makuha ang inyong numero para sa pila ng pension release. Kung hindi kayo makakadalo, maaari pong magpasa ng paunalam sa opisina ng barangay o magpadala ng kahalili na may authorization letter.",
    ],
  },
  2: {
    venue: "Riverside Road and Barangay Covered Court",
    schedule: "6:30 AM – 9:00 AM",
    body: [
      "Magkakasa po tayo ng lingguhang clean-up drive sa Riverside Road at sa paligid ng covered court. Ang mga basura sa kanal at mga dagta sa daan ay lilinisin natin nang sama-sama bago pa man tumaas ang tubig sa tag-ulan.",
      "Naglalaan po ang barangay ng basurahan, guwantes at walis para sa mga boluntaryo. Maaari rin pong magdala ng sariling walis o pana. Ang mga kabataan na nangangailangan ng community service hours ay maaaring magparehistro sa SK booth.",
      "Pagkatapos ng programa, mayroon pong masaganang almusal na inihanda ng ating mga kagawad. Ipagbigay-alam lang po sa purok captain kung kayo ay sasama upang maihanda ang sapat na kagamitan.",
    ],
  },
  3: {
    venue: "Barangay Health Center, San Isidro Road",
    schedule: "8:00 AM – 3:00 PM",
    body: [
      "Ibibigay na po ang mga assistive device na nakalaan para sa ating mga kapwa-PWD: wheelchair, walker, crutches at hearing aid. Ang distribusyon ay isinasagawa sa barangay health center sa mga nakalistang beneficiario.",
      "Mangyaring dalhin ang inyong PWD ID, ang acknowledgement receipt na ibinigay noong rehistro, at kung kailangan, ang certification ng doktor na tumutukoy sa uri ng kagamitan. Kung kayo ay hindi makakapunta, maaaring magpadalang kahalili na may authorization letter at kopya ng inyong ID.",
      "Sasamahan po kayo ng ating PWD desk sa pagsasaayos at pagsasanay kung paano gamitin ang kagamitan. Para sa karagdagang tanong, tumawag sa PWD desk sa numerong nakalista sa Citizen Charter.",
    ],
  },
  4: {
    venue: "Barangay Health Center, San Isidro Road",
    schedule: "7:00 AM – 12:00 NN",
    body: [
      "Libre po ang blood pressure at diabetes screening para sa lahat ng residente ng Barangay San Isidro. Kasama sa serbisyo ang blood sugar test at payo sa tamang pagkain mula sa ating barangay health worker.",
      "Idala lamang ang inyong barangay ID o resident QR para sa mabilis na rehistro. Ang mga may resultang lampas sa normal ay kaagad na ire-refer sa rural health unit para sa mas malalim na pagsusuri.",
      "Pinapayuhan po ang mga residenteng sumailalim sa screening na huwag kumain ng 8 oras bago ang pagsusulit, at magdala ng maliit na tubig. Walang bayad ang serbisyong ito.",
    ],
  },
  5: {
    venue: "Barangay Covered Court",
    schedule: "4:00 PM – 6:00 PM",
    body: [
      "Bubuksan na po ang mga sign-up para sa basketball at volleyball league para sa mga kabataang edad 15 hanggang 30. Ang orientasyon ay para sa lahat ng gustong sumali, kasama ang mga patakaran sa liga at ang kalendaryo ng mga laro.",
      "Bawat koponan ay mayroong limang miyembro sa minimum at labimpituo sa maximum, kasama ang isang kapitan na nakatalaga. Kailangan pong magparehistro sa SK booth at magpasa ng kopya ng barangay ID ng bawat miyembro.",
      "Sa orientasyon din ipapaliwanag ang mga pagsasanay na gagawin tuwing katapusan ng linggo, ang mga premyo, at ang paraan ng pagpipili ng mga opisyal ng liga. Malugod po naming inaanyayahan ang lahat ng kabataan ng barangay.",
    ],
  },
  6: {
    venue: "Barangay Session Hall",
    schedule: "2:00 PM – 5:00 PM",
    body: [
      "Magkakaroon ng espesyal na sesyon ang sangguniang barangay upang talakayin ang panukalang badyet para sa 2027 barangay development fund. Bukas po ang sesyon para sa mga residenteng nais magbigay ng panukala.",
      "Tatalakayin ang mga prayoridad tulad ng pagsasaayos ng mga kalsada, dagdag na ilaw sa mga purok, pagsasaayos ng kanal, at dagdag na pondo sa health at scholarship programs. Malugod po naming tinatanggap ang inyong mga suhestiyon bago ang sesyon.",
      "Ang mga nais magsalita ay maaaring magparehistro sa barangay secretariat hanggang isang araw bago ang sesyon. Ang kabuuan ng badyet at ang mga pagbabago ay iaalisnila sa website ng barangay pagkatapos ng pagsang-ayon.",
    ],
  },
}

const fallbackDetail: AnnouncementDetail = {
  venue: "Barangay San Isidro Hall",
  schedule: "9:00 AM – 12:00 NN",
  body: [
    "Ipinababatid po ng Barangay San Isidro ang detalye ng paparating na aktibidad para sa lahat ng mga apektadong residente. Mangyaring basahin ang buong abiso upang malaman ang iskedyul, lugar at mga kailangang dalhin.",
    "Ang mga opisyal ng barangay at mga volunteer ay magiging presente upang tulungan kayo sa rehistrasyon at sa inyong mga katanungan. Dalhin ang inyong barangay ID o resident QR para sa mas mabilis na proseso.",
    "Para sa karagdagang tanong, maaari po kayong pumunta sa barangay hall tuwing opisyal na oras o tumawag sa numerong nakalista sa Citizen Charter. Salamat po sa inyong pakikiisa.",
  ],
}

export function announcementDetail(id: number): AnnouncementDetail {
  return announcementDetails[id] ?? fallbackDetail
}

/* ------------------------------------------------------------------ */
/* Barangay contact & office hours                                     */
/* ------------------------------------------------------------------ */

export const barangayContacts = [
  { label: "Barangay hall", value: "(049) 555 2140" },
  { label: "Peace and order hotline", value: "0917 555 0142" },
  { label: "Email", value: "sanisidro@barangay.gov.ph" },
  { label: "Address", value: "San Isidro Road, City of Santa Rosa, Laguna" },
]

export const officeHours = [
  { label: "Monday – Friday", value: "8:00 AM – 5:00 PM" },
  { label: "Saturday", value: "8:00 AM – 12:00 NN" },
  { label: "Sunday and holidays", value: "Closed" },
]

/* ------------------------------------------------------------------ */
/* Citizen's charter                                                    */
/* ------------------------------------------------------------------ */

export type CharterService = {
  name: string
  fee: string
  turnaround: string
  requirements: string[]
}

const serviceDetails: Record<string, Omit<CharterService, "name">> = {
  "Barangay Clearance": {
    fee: "₱50",
    turnaround: "1 working day",
    requirements: ["Barangay ID or resident QR", "Proof of residence (utility bill or lease)", "Stated purpose of the request"],
  },
  "Certificate of Residency": {
    fee: "₱30",
    turnaround: "1 working day",
    requirements: ["Barangay ID or resident QR", "Any proof of address dated within 3 months", "Completed request form"],
  },
  "Certificate of Indigency": {
    fee: "₱20",
    turnaround: "2 working days",
    requirements: ["Barangay ID or resident QR", "Case reference (medical, scholarship or funeral)", "Household assessment from the purok captain"],
  },
  "Business Permit": {
    fee: "₱300 and up",
    turnaround: "3 working days",
    requirements: ["Barangay ID of the owner", "Mayor's permit application", "Proof of business address", "Tax declaration, if applicable"],
  },
  "Certificate of Good Moral Character": {
    fee: "₱50",
    turnaround: "2 working days",
    requirements: ["Barangay ID or resident QR", "Endorsement from the purok captain", "Police clearance, when required for employment"],
  },
  "Certificate of Low Income": {
    fee: "₱20",
    turnaround: "3 working days",
    requirements: ["Barangay ID or resident QR", "Household assessment by the barangay", "Payslip or declaration of no income"],
  },
  "Barangay ID Endorsement": {
    fee: "₱150",
    turnaround: "5 working days",
    requirements: ["PSA birth certificate", "Two 1x1 ID photos", "Proof of residence", "Barangay clearance"],
  },
  "Delayed PSA Registration": {
    fee: "₱200",
    turnaround: "10 working days",
    requirements: ["Affidavit of delayed registration", "Barangay clearance", "Two witness statements", "Valid ID of the registrant"],
  },
  "Scholarship Endorsement": {
    fee: "₱20",
    turnaround: "3 working days",
    requirements: ["Certificate of enrolment", "Report card or Form 138", "Barangay ID or resident QR"],
  },
  "Marriage / Cohabitation Certificate": {
    fee: "₱50",
    turnaround: "2 working days",
    requirements: ["Barangay IDs of both parties", "Declaration of two witnesses", "PSA marriage certificate, if available"],
  },
  "Blotter Report": {
    fee: "No fee",
    turnaround: "Same day (entry)",
    requirements: ["Valid ID of the complainant", "Narration of the incident", "Names of parties and witnesses"],
  },
}

export const charterServices: CharterService[] = [
  ...certificateTypes.map<CharterService>((name) => ({
    name,
    ...(serviceDetails[name] ?? serviceDetails["Barangay Clearance"]),
  })),
  { name: "Blotter Report", ...serviceDetails["Blotter Report"] },
]

export function peso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`
}
