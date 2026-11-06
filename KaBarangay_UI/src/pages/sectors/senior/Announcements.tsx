import DeskPostsBoard from "@/components/sectors/desk/DeskPostsBoard"
import { seniorDesk } from "@/config/sectorDesks"

/** The desk’s merged board — notices (`auto`) and updates listed together. */
export default function SeniorAnnouncements() {
  return <DeskPostsBoard desk={seniorDesk} kind={["auto", "update"]} />
}
