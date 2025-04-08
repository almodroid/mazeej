import { useState, useEffect, useRef } from 'react';
import { ZoomVideo } from '@zoom/videosdk';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface VideoCallProps {
  user: User;
  participantId: number;
  participantName: string;
  onEndCall: () => void;
}

export default function VideoCall({ user, participantId, participantName, onEndCall }: VideoCallProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [client, setClient] = useState<any>(null);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const selfVideoRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const initializeVideoSDK = async () => {
      try {
        setLoading(true);
        
        // Fetch a Zoom token from our backend
        const response = await apiRequest('POST', '/api/video/token', {
          userId: user.id,
          name: user.full_name || user.username,
          targetUserId: participantId,
        });
        
        const { token, meetingId } = await response.json();
        
        // Initialize Zoom Video SDK
        const zoomClient = ZoomVideo.createClient();
        await zoomClient.init('en-US', 'Global');
        
        // Set up event listeners
        zoomClient.on('connection-change', (status: any) => {
          console.log('Connection status changed to:', status);
        });
        
        // Join the meeting
        await zoomClient.join(meetingId, token, user.full_name || user.username);
        
        // Create the video elements
        const stream = zoomClient.getMediaStream();
        
        // Start video
        await stream.startVideo();
        
        // Start audio
        await stream.startAudio();
        
        // Mount self video
        if (selfVideoRef.current) {
          stream.renderVideo(
            selfVideoRef.current,
            zoomClient.getCurrentUserInfo().userId,
            176, 
            100, 
            0, 
            0, 
            3
          );
        }
        
        // Set up remote participant's video (when they join)
        zoomClient.on('peer-video-state-change', (payload: any) => {
          const { userId, state } = payload;
          if (state === 'Start' && videoContainerRef.current) {
            stream.renderVideo(
              videoContainerRef.current,
              userId,
              1280,
              720,
              0,
              0,
              1
            );
          }
        });
        
        setClient(zoomClient);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to initialize video call:', err);
        setError(err.message || 'Failed to initialize video call');
        setLoading(false);
      }
    };
    
    initializeVideoSDK();
    
    // Clean up when component unmounts
    return () => {
      if (client) {
        const stream = client.getMediaStream();
        if (stream) {
          stream.stopVideo();
          stream.stopAudio();
        }
        client.leave();
      }
    };
  }, [user, participantId]);
  
  const toggleMute = async () => {
    if (!client) return;
    
    const stream = client.getMediaStream();
    if (isMuted) {
      await stream.unmuteAudio();
    } else {
      await stream.muteAudio();
    }
    setIsMuted(!isMuted);
  };
  
  const toggleVideo = async () => {
    if (!client) return;
    
    const stream = client.getMediaStream();
    if (isVideoOff) {
      await stream.startVideo();
    } else {
      await stream.stopVideo();
    }
    setIsVideoOff(!isVideoOff);
  };
  
  const endCall = async () => {
    if (client) {
      const stream = client.getMediaStream();
      if (stream) {
        stream.stopVideo();
        stream.stopAudio();
      }
      await client.leave();
    }
    onEndCall();
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p>{t('videoCall.connecting')}</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={onEndCall}>{t('videoCall.backToChat')}</Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
        {/* Main video container for remote participant */}
        <div ref={videoContainerRef} className="w-full h-full">
          {/* Placeholder when no remote video */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white">{t('videoCall.waitingForParticipant', { name: participantName })}</p>
          </div>
        </div>
        
        {/* Self video (picture-in-picture) */}
        <div 
          ref={selfVideoRef}
          className="absolute bottom-4 right-4 w-44 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-background"
        />
      </div>
      
      {/* Controls */}
      <div className="flex justify-center items-center gap-4 py-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleMute}
          className={isMuted ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={toggleVideo}
          className={isVideoOff ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
        >
          {isVideoOff ? <VideoOff /> : <Video />}
        </Button>
        
        <Button 
          variant="destructive" 
          size="icon"
          onClick={endCall}
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}