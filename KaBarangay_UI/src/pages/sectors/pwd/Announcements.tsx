import DeskPostsBoard from "@/components/sectors/desk/DeskPostsBoard"
import { pwdDesk } from "@/config/sectorDesks"

/** The desk’s merged board — notices (`auto`) and updates listed together. */
export default function PwdAnnouncements() {
  return <DeskPostsBoard desk={pwdDesk} kind={["auto", "update"]} />
}
