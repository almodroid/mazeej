import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Check, X, AlertCircle } from 'lucide-react';
import ZoomVideoComponent from './zoom-video-component';
import { check_secrets } from '@/lib/utils';

interface VideoCallDialogProps {
  open: boolean;
  onClose: () => void;
  callType: 'audio' | 'video' | null;
  contact: any | null;
}

export default function VideoCallDialog({ 
  open, 
  onClose, 
  callType, 
  contact 
}: VideoCallDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [hasZoomCredentials, setHasZoomCredentials] = useState<boolean | null>(null);
  
  // Check if Zoom credentials are available
  useEffect(() => {
    if (open) {
      const checkCredentials = async () => {
        try {
          const response = await check_secrets(['ZOOM_SDK_KEY', 'ZOOM_SDK_SECRET']);
          setHasZoomCredentials(response);
        } catch (err) {
          console.error('Error checking Zoom credentials:', err);
          setHasZoomCredentials(false);
        }
      };
      
      checkCredentials();
    }
  }, [open]);
  
  if (!open || !contact) return null;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 h-[600px] flex flex-col">
        {hasZoomCredentials === false ? (
          <div className="flex flex-col items-center justify-center p-6 h-full">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {t('chat.zoomNotConfigured')}
            </h3>
            <p className="text-center text-muted-foreground mb-6">
              {t('chat.zoomCredentialsMissing')}
            </p>
            <div className="bg-muted p-3 rounded-md mb-6 w-full max-w-md">
              <p className="text-sm font-mono mb-1">ZOOM_SDK_KEY</p>
              <p className="text-sm font-mono">ZOOM_SDK_SECRET</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          user && contact && (
            <ZoomVideoComponent
              receiverId={contact.id}
              onCallEnd={onClose}
              userName={user.fullName || user.username}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}