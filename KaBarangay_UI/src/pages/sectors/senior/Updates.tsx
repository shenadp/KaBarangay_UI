import DeskPostsBoard from "@/components/sectors/desk/DeskPostsBoard"
import { seniorDesk } from "@/config/sectorDesks"

export default function SeniorUpdates() {
  return <DeskPostsBoard desk={seniorDesk} kind="update" />
}
