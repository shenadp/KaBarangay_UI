import DeskDashboard from "@/components/sectors/desk/DeskDashboard"
import { seniorDesk } from "@/config/sectorDesks"

export default function SeniorDashboard() {
  return <DeskDashboard desk={seniorDesk} />
}
