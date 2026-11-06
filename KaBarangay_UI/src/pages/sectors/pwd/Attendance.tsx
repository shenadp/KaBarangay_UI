import DeskAttendance from "@/components/sectors/desk/DeskAttendance"
import { pwdDesk } from "@/config/sectorDesks"

export default function PwdAttendance() {
  return <DeskAttendance desk={pwdDesk} />
}
