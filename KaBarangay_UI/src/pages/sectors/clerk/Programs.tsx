import DeskPostsBoard from "@/components/sectors/desk/DeskPostsBoard"
import { clerkDesk } from "@/config/sectorDesks"

export default function ClerkPrograms() {
  return <DeskPostsBoard desk={clerkDesk} kind="program" />
}
