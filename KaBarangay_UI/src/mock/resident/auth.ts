/**
 * Resident sign-in — the UI stand-in for `AuthController::residentLoginBarangays()`
 * and `AuthController::processResidentLogin()`.
 *
 * The registry is the only source of identity, so the accounts that can sign in
 * are exactly the accounts the Admin Residents page shows as approved: a
 * registration that is still pending, or a record whose account was deactivated,
 * answers with the same failure as an unknown credential.
 */

import { barangay, barangayOptions } from "@/mock/data"
import { residentRegistry } from "@/mock/admin/residents"
import { passwordAccepts } from "./session"

/** `AuthController` answers every failed sign-in with the same message. */
export const LOGIN_FAILED = "These credentials do not match our records."

export type LoginBarangay = {
  id: number
  name: string
  code: string
  cityMunicipality: string
  province: string
}

/** `GET /resident/login/barangays` — active barangays, ordered as the list is kept. */
export function loginBarangays(): LoginBarangay[] {
  return barangayOptions.map((name, index) => ({
    id: index + 1,
    name,
    code: name === barangay.name ? barangay.code : `BRGY-${43 + index}`,
    cityMunicipality: barangay.city,
    province: barangay.province,
  }))
}

export type LoginResult =
  | { ok: true; residentNumber: string; fullName: string; barangayName: string }
  | { ok: false; message: string }

const digits = (value: string) => value.replace(/\D/g, "")

/** The identifier is matched as a resident number, an email or a mobile number. */
function findByIdentifier(identifier: string) {
  const number = identifier.trim().toUpperCase()
  const email = identifier.trim().toLowerCase()
  const mobile = digits(identifier)

  return (
    residentRegistry
      .residents()
      .find(
        (resident) =>
          resident.residentNumber.toUpperCase() === number ||
          (resident.email ?? "").toLowerCase() === email ||
          (mobile.length > 0 && digits(resident.mobile ?? "") === mobile),
      ) ?? null
  )
}

/** `POST /resident/login` — barangay, identifier, password. */
export function attemptLogin(input: {
  barangayId: string
  identifier: string
  password: string
}): LoginResult {
  const selected = loginBarangays().find((item) => item.id === Number(input.barangayId))
  const resident = findByIdentifier(input.identifier)

  // Records live in one barangay only, so any other choice cannot match.
  if (!selected || !resident || !resident.accountActive || selected.name !== barangay.name)
    return { ok: false, message: LOGIN_FAILED }

  if (!passwordAccepts(input.password)) return { ok: false, message: LOGIN_FAILED }

  const fullName = [resident.firstName, resident.middleName, resident.lastName, resident.suffix]
    .filter(Boolean)
    .join(" ")

  return { ok: true, residentNumber: resident.residentNumber, fullName, barangayName: selected.name }
}
