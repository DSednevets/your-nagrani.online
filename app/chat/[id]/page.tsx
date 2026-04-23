import ChatInterface from "@/components/ChatInterface";
import Header from "@/components/Header";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header className="shrink-0" />
      <div className="flex-1 overflow-hidden">
        <ChatInterface conversationId={id} />
      </div>
    </div>
  );
}
