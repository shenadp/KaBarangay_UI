import DeskPostsBoard from "@/components/sectors/desk/DeskPostsBoard"
import { seniorDesk } from "@/config/sectorDesks"

export default function SeniorPrograms() {
  return <DeskPostsBoard desk={seniorDesk} kind="program" />
}
