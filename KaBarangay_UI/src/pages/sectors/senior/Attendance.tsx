import DeskAttendance from "@/components/sectors/desk/DeskAttendance"
import { seniorDesk } from "@/config/sectorDesks"

export default function SeniorAttendance() {
  return <DeskAttendance desk={seniorDesk} />
}
