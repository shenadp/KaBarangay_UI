import DeskPostsBoard from "@/components/sectors/desk/DeskPostsBoard"
import { pwdDesk } from "@/config/sectorDesks"

export default function PwdPrograms() {
  return <DeskPostsBoard desk={pwdDesk} kind="program" />
}
