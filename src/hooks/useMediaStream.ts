import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useMediaStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const startStream = async () => {
    try {
      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      });
      
      console.log('Camera access granted');
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      const errorMessage = 'Unable to access camera. Please ensure you have granted camera permissions.';
      setError(errorMessage);
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopStream = () => {
    if (stream) {
      console.log('Stopping media stream...');
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.label);
      });
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return {
    stream,
    error,
    startStream,
    stopStream
  };
};