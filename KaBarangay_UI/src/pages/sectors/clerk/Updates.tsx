import DeskPostsBoard from "@/components/sectors/desk/DeskPostsBoard"
import { clerkDesk } from "@/config/sectorDesks"

export default function ClerkUpdates() {
  return <DeskPostsBoard desk={clerkDesk} kind="update" />
}
