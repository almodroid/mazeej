import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import VideoCall from './video-call';
import { Loader2 } from 'lucide-react';

interface VideoCallDialogProps {
  open: boolean;
  onClose: () => void;
  callType: 'audio' | 'video' | null;
  contact: any;
}

export default function VideoCallDialog({ 
  open, 
  onClose, 
  callType, 
  contact 
}: VideoCallDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset loading state when the dialog opens
    if (open) {
      setLoading(true);
      // Simulate a delay for connecting (in a real app, this would be the time to initialize the Zoom SDK)
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open || !user || !contact) return null;

  const callTitle = callType === 'audio' ? t('chat.audioCall') : t('chat.videoCall');
  const participantName = contact.fullName || contact.username;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[800px] h-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <DialogTitle>{callTitle}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {loading ? t('videoCall.connecting') : t('videoCall.callWith', { name: participantName })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p>{t('videoCall.connecting')}</p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <VideoCall 
              user={user} 
              participantId={contact.id} 
              participantName={participantName}
              onEndCall={onClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}