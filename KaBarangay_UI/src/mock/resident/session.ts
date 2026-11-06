/**
 * Resident portal session — the UI stand-in for `ResidentContext::get()`.
 *
 * The signed-in resident is Maria Lacsag Santos, the same official record the
 * Admin Residents page manages (`BSI-RES-000142`). Identity therefore reads
 * live from `residentRegistry`, so a QR the admin revokes disappears from this
 * portal, and a status change is the status the portal reports.
 *
 * Only the two fields the resident herself owns — mobile and email — are held
 * here as an overlay, because the registry has no writer for them.
 */

import { barangay } from "@/mock/data"
import { ageFromBirthdate, purokName, residentRegistry } from "@/mock/admin/residents"

/** Registry id of the account the portal is demoed from. */
export const SESSION_RESIDENT_ID = 142

export type SectorSlug = "senior" | "pwd"

/** `Resident/Dashboard`'s `resident` prop. */
export type SessionResident = {
  id: number
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  fullName: string
  residentNumber: string
  barangay: {
    id: number | null
    name: string | null
    code: string | null
    cityMunicipality: string | null
    province: string | null
  }
  sectors: { id: number; name: string; slug: SectorSlug }[]
}

const record = () => {
  const resident = residentRegistry.residentById(SESSION_RESIDENT_ID)
  if (!resident) throw new Error("Resident portal session has no backing record.")

  return resident
}

/** `full_name` is every part joined by a space — the middle name is never abbreviated. */
export function fullNameOf(parts: {
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
}): string {
  return [parts.firstName, parts.middleName, parts.lastName, parts.suffix].filter(Boolean).join(" ")
}

export function sessionResident(): SessionResident {
  const resident = record()

  return {
    id: resident.id,
    firstName: resident.firstName,
    middleName: resident.middleName,
    lastName: resident.lastName,
    suffix: resident.suffix,
    fullName: fullNameOf(resident),
    residentNumber: resident.residentNumber,
    barangay: {
      id: 1,
      name: barangay.name,
      code: barangay.code,
      cityMunicipality: barangay.city,
      province: barangay.province,
    },
    sectors: resident.sectors.map((sector) => ({
      id: sector.id,
      name: sector.name,
      slug: sector.slug as SectorSlug,
    })),
  }
}

export function sectorSlugsOf(resident: SessionResident): SectorSlug[] {
  return resident.sectors.map((sector) => sector.slug)
}

/** The two fields the resident owns; `null` means "whatever the record says". */
let contactEdits: { mobile: string | null; email: string | null } = { mobile: null, email: null }

export function mobileOf(): string {
  return contactEdits.mobile ?? record().mobile ?? ""
}

export function emailOf(): string {
  return contactEdits.email ?? record().email ?? ""
}

export function emailVerified(): boolean {
  return verificationOverlay ?? record().emailVerified
}

/** A changed email is unverified again until the resident follows the new link. */
let verificationOverlay: boolean | null = null

const digitsOnly = (value: string) => value.replace(/\D/g, "")
const normaliseEmail = (value: string) => value.trim().toLowerCase()

/** Someone else in this barangay already owns the value. */
function ownedByAnother(column: "mobile" | "email", value: string): boolean {
  return residentRegistry
    .residents()
    .some(
      (other) =>
        other.id !== SESSION_RESIDENT_ID &&
        (column === "mobile"
          ? digitsOnly(other.mobile ?? "") === digitsOnly(value)
          : normaliseEmail(other.email ?? "") === normaliseEmail(value)),
    )
}

export type ContactUpdate =
  | { ok: true; emailChanged: boolean }
  | { ok: false; field: "mobileNumber" | "email"; message: string }

/** `Resident\ProfileUpdateRequest` — the only two columns this form may write. */
export function saveContactDetails(input: { mobileNumber: string; email: string }): ContactUpdate {
  const mobile = input.mobileNumber.trim()

  if (!mobile)
    return { ok: false, field: "mobileNumber", message: "A mobile number is required." }
  if (mobile.length > 20)
    return {
      ok: false,
      field: "mobileNumber",
      message: "The mobile number may not be greater than 20 characters.",
    }
  if (ownedByAnother("mobile", mobile))
    return {
      ok: false,
      field: "mobileNumber",
      message: "This mobile number is already registered in your barangay.",
    }

  const email = input.email.trim()

  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, field: "email", message: "The email must be a valid email address." }
  if (email.length > 255)
    return {
      ok: false,
      field: "email",
      message: "The email may not be greater than 255 characters.",
    }
  if (email && ownedByAnother("email", email))
    return {
      ok: false,
      field: "email",
      message: "This email address is already registered in your barangay.",
    }

  const emailChanged = normaliseEmail(email) !== normaliseEmail(emailOf())

  contactEdits = { mobile, email }
  if (emailChanged) verificationOverlay = false

  return { ok: true, emailChanged }
}

/* ------------------------------------------------------------------ */
/* Email verification                                                  */
/* ------------------------------------------------------------------ */

/** `throttle:3,1` on the resend route. */
const RESEND_LIMIT = 3
const RESEND_WINDOW_MS = 60_000

let resendAttempts: number[] = []

export function resendEmailVerification(): { ok: boolean; link: string | null } {
  const now = Date.now()
  resendAttempts = resendAttempts.filter((at) => now - at < RESEND_WINDOW_MS)

  if (resendAttempts.length >= RESEND_LIMIT) return { ok: false, link: null }

  resendAttempts.push(now)

  return { ok: true, link: issueEmailVerificationLink() }
}

/**
 * `ResidentEmailVerificationService::send()`. UI-only — the link the service
 * would email is handed back to the page instead, so the flow stays walkable
 * without a mailer.
 */
const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

let emailToken: { token: string; email: string; issuedAt: number; used: boolean } | null = null

/** A link answers the same way every time it is opened. */
const emailVerdicts = new Map<string, EmailVerificationStatus>()

export function issueEmailVerificationLink(): string | null {
  if (emailVerified()) return null

  const token = `ev-${Math.random().toString(36).slice(2, 10)}`
  emailToken = { token, email: normaliseEmail(emailOf()), issuedAt: Date.now(), used: false }

  return `/resident/email/verify/${token}`
}

export type EmailVerificationStatus = "verified" | "expired" | "email_changed" | "invalid"

/** `ResidentEmailVerificationController::verify()` — the same four answers. */
export function resolveEmailVerification(token: string): EmailVerificationStatus {
  const remembered = emailVerdicts.get(token)
  if (remembered) return remembered

  const verdict = ((): EmailVerificationStatus => {
    if (emailToken === null || emailToken.token !== token || emailToken.used) return "invalid"

    if (Date.now() - emailToken.issuedAt > EMAIL_TOKEN_TTL_MS) return "expired"

    if (emailToken.email !== normaliseEmail(emailOf())) return "email_changed"

    emailToken = { ...emailToken, used: true }
    verificationOverlay = true

    return "verified"
  })()

  emailVerdicts.set(token, verdict)

  return verdict
}

/* ------------------------------------------------------------------ */
/* Password                                                            */
/* ------------------------------------------------------------------ */

/**
 * The portal account's credential. UI-only — the demo login accepts it, and
 * `Hash::check` compares the same field server-side.
 */
let accountPassword = "resident1234"

export type PasswordUpdate = { ok: true } | { ok: false; field: "current_password" | "password"; message: string }

/** `Resident\SettingsController::updatePassword()`. */
export function changePassword(input: {
  currentPassword: string
  password: string
  confirmPassword: string
}): PasswordUpdate {
  if (!input.currentPassword)
    return {
      ok: false,
      field: "current_password",
      message: "The current password field is required.",
    }

  if (!input.password)
    return { ok: false, field: "password", message: "The password field is required." }

  if (input.password.length < 8)
    return {
      ok: false,
      field: "password",
      message: "The password field must be at least 8 characters.",
    }

  if (input.password !== input.confirmPassword)
    return {
      ok: false,
      field: "password",
      message: "The password field confirmation does not match.",
    }

  if (input.currentPassword !== accountPassword)
    return {
      ok: false,
      field: "current_password",
      message: "The current password is incorrect.",
    }

  accountPassword = input.password

  return { ok: true }
}

export function passwordAccepts(candidate: string): boolean {
  return candidate === accountPassword
}

/** What the sign-in page's demo panel prints — a reset replaces the credential. */
export function currentAccountPassword(): string {
  return accountPassword
}

/* ------------------------------------------------------------------ */
/* Password reset                                                      */
/* ------------------------------------------------------------------ */

/** `PasswordResetController::TOKEN_TTL_MINUTES`. */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

/** The one answer `sendResetLink()` gives, whatever it found. */
export const RESET_LINK_FLASH =
  "If an active account uses that email address, a password reset link will arrive shortly. Please check your inbox and spam folder."

/** `reset()`'s single failure, reported on the `email` key. */
export const RESET_LINK_INVALID = "This password reset link is invalid or has expired."

/** Flashed on the sign-in page once the new password is saved. */
export const RESET_PASSWORD_FLASH = "Your password has been reset. You can now log in."

const resetTokens = new Map<string, { email: string; issuedAt: number }>()

/**
 * `sendResetLink()` — a distinct single-use token per active account on the
 * address. The page never reads the return value; it exists so the UI can hand
 * the link out in place of a mailer.
 */
export function issuePasswordResetTokens(email: string): string[] {
  const resident = record()
  const target = normaliseEmail(email)

  if (
    target === "" ||
    target !== normaliseEmail(emailOf()) ||
    resident.status !== "active" ||
    !resident.accountActive
  )
    return []

  const token = `rp-${Math.random().toString(36).slice(2, 10)}`
  resetTokens.set(token, { email: target, issuedAt: Date.now() })

  return [token]
}

/** The token issued for that address, if the UI still has one to offer. */
export function latestResetLink(email: string): string | null {
  const target = normaliseEmail(email)
  const token = [...resetTokens].reverse().find(([, entry]) => entry.email === target)?.[0]

  return token ? `/resident/reset-password/${token}?email=${encodeURIComponent(target)}` : null
}

export type ResetOutcome = { ok: true } | { ok: false; message: string }

/** `reset()` — the request that consumes the token is the one allowed to write. */
export function completePasswordReset(input: {
  token: string
  email: string
  password: string
  passwordConfirmation: string
}): ResetOutcome {
  const target = normaliseEmail(input.email)
  const entry = input.token ? resetTokens.get(input.token) : undefined

  if (!entry || entry.email !== target) return { ok: false, message: RESET_LINK_INVALID }

  resetTokens.delete(input.token)

  if (Date.now() - entry.issuedAt > RESET_TOKEN_TTL_MS)
    return { ok: false, message: RESET_LINK_INVALID }

  accountPassword = input.password

  return { ok: true }
}


/* ------------------------------------------------------------------ */
/* QR credential                                                       */
/* ------------------------------------------------------------------ */

/**
 * `resident.qr.verify` for the resident's own active credential — the URL a
 * counter scan resolves. A revoked or never-issued credential answers `null`.
 */
export function qrVerifyUrl(): string | null {
  return residentRegistry.qrCredential(SESSION_RESIDENT_ID)?.verifyUrl ?? null
}

export function qrToken(): string | null {
  return qrVerifyUrl() === null ? null : record().qrToken
}

/**
 * The raw `birthdate`. The certificate form only ever shows the long format,
 * but the delayed-PSA residency guard compares years, so it needs the column.
 */
export function sessionBirthdate(): string | null {
  return record().birthdate ?? null
}

/* ------------------------------------------------------------------ */
/* Profile page                                                        */
/* ------------------------------------------------------------------ */

/** `"F j, Y"`, the format both the profile and the dashboard render dates with. */
export function formatLongDate(iso: string | null): string {
  if (!iso) return ""

  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return iso

  return `${MONTHS[month - 1]} ${day}, ${year}`
}

export const NOT_PROVIDED = "Not provided"

/** The props of the `/resident/profile` closure in `routes/web.php`. */
export function profileDetails() {
  const resident = record()
  const sectors = resident.sectors
  const credential = residentRegistry.qrCredential(SESSION_RESIDENT_ID)

  return {
    fullName: fullNameOf(resident),
    residentId: resident.residentNumber,
    birthdate: resident.birthdate ? formatLongDate(resident.birthdate) : NOT_PROVIDED,
    age: resident.birthdate ? (ageFromBirthdate(resident.birthdate) ?? 0) : 0,
    sex: resident.sex ?? NOT_PROVIDED,
    civilStatus: resident.civilStatus ?? NOT_PROVIDED,
    mobileNumber: mobileOf(),
    email: emailOf(),
    emailVerified: emailVerified(),
    purok: purokName(resident.purokId) === "Purok not recorded" ? NOT_PROVIDED : purokName(resident.purokId),
    barangay: barangay.name,
    city: barangay.city,
    province: barangay.province,
    // The closure only ever answers "Verified" or "Inactive".
    accountStatus: resident.accountActive ? "Verified" : "Inactive",
    registeredDate: formatLongDate(resident.approvedAt ?? "2026-01-12"),
    classification:
      sectors.length === 0 ? "Regular Resident" : sectors.map((sector) => sector.name).join(" • "),
    qrToken: credential?.token ?? null,
  }
}

export type ProfileDetails = ReturnType<typeof profileDetails>

/**
 * The read-only identity the certificate and complaint forms print. Missing
 * answers come back as empty strings because the reference page hides those
 * rows entirely rather than showing a placeholder.
 */
export function residentIdentity() {
  const resident = sessionResident()
  const profile = profileDetails()
  const shown = (value: string) => (value === NOT_PROVIDED ? "" : value)

  return {
    fullName: resident.fullName,
    residentNumber: resident.residentNumber,
    purok: shown(profile.purok),
    birthdate: shown(profile.birthdate),
    sex: shown(profile.sex),
    barangay: resident.barangay.name ?? "",
    city: resident.barangay.cityMunicipality ?? "",
  }
}

export type ResidentIdentity = ReturnType<typeof residentIdentity>
