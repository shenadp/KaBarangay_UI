import DeskApplicationCreate from "@/components/sectors/desk/DeskApplicationCreate"
import { seniorDesk } from "@/config/sectorDesks"

export default function SeniorApplicationCreate() {
  return <DeskApplicationCreate desk={seniorDesk} />
}
