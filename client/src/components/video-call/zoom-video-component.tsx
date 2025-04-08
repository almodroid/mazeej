import { useRef, useEffect, useState } from 'react';
import ZoomVideo from '@zoom/videosdk';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Mic, MicOff, Camera, CameraOff, PhoneOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ZoomVideoComponentProps {
  receiverId: number;
  onCallEnd: () => void;
  userName: string;
}

export default function ZoomVideoComponent({ receiverId, onCallEnd, userName }: ZoomVideoComponentProps) {
  const { t } = useTranslation();
  const [client, setClient] = useState<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Function to initialize Zoom
    const initZoom = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch token from our API
        const response = await apiRequest('POST', '/api/zoom/token', { receiverId });
        const { token, sdkKey, meetingId } = await response.json();
        
        if (!token || !sdkKey) {
          throw new Error('Failed to get Zoom credentials');
        }
        
        // Initialize Zoom client
        const zoomClient = ZoomVideo.createClient();
        await zoomClient.init('en-US', 'Global', {
          patchJsMedia: true
        });
        
        setClient(zoomClient);
        
        // Join session
        await zoomClient.join(meetingId, token, userName, '');
        
        // Create media stream
        const mediaStream = zoomClient.getMediaStream();
        setStream(mediaStream);
        
        // Start video
        await mediaStream.startVideo({ videoElement: selfVideoRef.current! });
        
        // Handle remote participants
        zoomClient.on('peer-video-state-change', async (payload: any) => {
          const { action, userId } = payload;
          
          if (action === 'Start') {
            await mediaStream.renderVideo(
              remoteVideoRef.current!,
              userId,
              1280,
              720,
              0,
              0,
              2
            );
          } else if (action === 'Stop') {
            await mediaStream.stopRenderVideo(
              remoteVideoRef.current!,
              userId
            );
          }
        });
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to initialize Zoom:', err);
        setError(err.message || 'Failed to initialize video call');
        setIsLoading(false);
      }
    };
    
    initZoom();
    
    // Cleanup on unmount
    return () => {
      if (client) {
        const mediaStream = client.getMediaStream();
        if (mediaStream) {
          mediaStream.stopVideo();
          mediaStream.stopAudio();
        }
        client.leave();
      }
    };
  }, [receiverId, userName]);
  
  const toggleMute = async () => {
    if (!stream) return;
    
    if (isMuted) {
      await stream.unmuteAudio();
    } else {
      await stream.muteAudio();
    }
    
    setIsMuted(!isMuted);
  };
  
  const toggleVideo = async () => {
    if (!stream) return;
    
    if (isVideoOff) {
      await stream.startVideo({ videoElement: selfVideoRef.current! });
    } else {
      await stream.stopVideo();
    }
    
    setIsVideoOff(!isVideoOff);
  };
  
  const endCall = () => {
    if (client) {
      const mediaStream = client.getMediaStream();
      if (mediaStream) {
        mediaStream.stopVideo();
        mediaStream.stopAudio();
      }
      client.leave();
    }
    
    onCallEnd();
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>{t('chat.connectingCall')}</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-96">
        <p className="text-destructive mb-4">{error}</p>
        <p className="text-sm text-muted-foreground mb-6">{t('chat.zoomConfigError')}</p>
        <Button variant="default" onClick={onCallEnd}>
          {t('chat.backToChat')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full w-full">
      <div className="relative flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Remote video takes main space */}
        <div className="w-full h-full relative bg-neutral-950">
          <video ref={remoteVideoRef} className="w-full h-full object-cover" />
          
          {/* Self video overlay */}
          <div className="absolute top-4 right-4 w-32 h-24 bg-black overflow-hidden rounded-md shadow-lg border border-gray-800">
            <video ref={selfVideoRef} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="h-16 p-2 bg-background border-t flex items-center justify-center space-x-4">
        <Button
          onClick={toggleMute}
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full h-12 w-12"
        >
          {isMuted ? <MicOff /> : <Mic />}
        </Button>
        
        <Button
          onClick={toggleVideo}
          variant={isVideoOff ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full h-12 w-12"
        >
          {isVideoOff ? <CameraOff /> : <Camera />}
        </Button>
        
        <Button
          onClick={endCall}
          variant="destructive"
          size="icon"
          className="rounded-full h-12 w-12"
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}