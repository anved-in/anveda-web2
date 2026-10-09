import type { Metadata } from "next";
import ChatRedirect from "@/components/ChatRedirect";

export const metadata: Metadata = {
  title: "Message us on WhatsApp",
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return <ChatRedirect />;
}
