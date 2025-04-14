import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface StartChatButtonProps {
  userId: number;
  username: string;
  fullName?: string;
  className?: string;
}

export function StartChatButton({ userId, username, fullName, className }: StartChatButtonProps) {
  const handleStartChat = () => {
    // Navigate to messages page with the user ID
    window.location.href = `/messages?user=${userId}`;
  };

  return (
    <Button
      onClick={handleStartChat}
      variant="secondary"
      className={className}
      size="sm"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Message
    </Button>
  );
} 