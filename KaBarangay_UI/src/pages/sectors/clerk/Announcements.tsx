import DeskPostsBoard from "@/components/sectors/desk/DeskPostsBoard"
import { clerkDesk } from "@/config/sectorDesks"

/** The clerk’s merged board — notices (`auto`) and updates listed together. */
export default function ClerkAnnouncements() {
  return <DeskPostsBoard desk={clerkDesk} kind={["auto", "update"]} />
}
