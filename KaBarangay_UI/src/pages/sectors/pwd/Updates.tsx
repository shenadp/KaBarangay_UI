import DeskPostsBoard from "@/components/sectors/desk/DeskPostsBoard"
import { pwdDesk } from "@/config/sectorDesks"

export default function PwdUpdates() {
  return <DeskPostsBoard desk={pwdDesk} kind="update" />
}
