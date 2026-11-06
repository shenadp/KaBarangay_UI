import DeskApplicationDetail from "@/components/sectors/desk/DeskApplicationDetail"
import { seniorDesk } from "@/config/sectorDesks"

export default function SeniorApplicationDetail() {
  return <DeskApplicationDetail desk={seniorDesk} />
}
