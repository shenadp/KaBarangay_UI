import DeskAttendance from "@/components/sectors/desk/DeskAttendance"
import { clerkDesk } from "@/config/sectorDesks"

export default function ClerkAttendance() {
  return <DeskAttendance desk={clerkDesk} />
}
