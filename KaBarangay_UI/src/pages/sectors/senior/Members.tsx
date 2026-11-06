import DeskMembers from "@/components/sectors/desk/DeskMembers"
import { seniorDesk } from "@/config/sectorDesks"

export default function SeniorMembers() {
  return <DeskMembers desk={seniorDesk} />
}
