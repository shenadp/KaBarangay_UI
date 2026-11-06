import DeskApplications from "@/components/sectors/desk/DeskApplications"
import { seniorDesk } from "@/config/sectorDesks"

export default function SeniorApplications() {
  return <DeskApplications desk={seniorDesk} />
}
