/**
 * Resident portal — Updates.
 *
 * The same board as `/resident/announcements`; the controller hands this route
 * `kind = updates`, which narrows the table to the informational notices and
 * splits them into current and past on `completed_at`.
 */
import { AnnouncementsBoard } from "./Announcements"

export default function Updates() {
  return <AnnouncementsBoard kind="updates" />
}
