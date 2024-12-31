import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useGesture } from '@/contexts/GestureContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const GestureTracker = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isTracking } = useGesture();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTracking || !videoRef.current) return;

    const startVideo = async () => {
      try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          } 
        });
        
        if (videoRef.current) {
          console.log('Camera access granted, setting up video stream');
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setError('Unable to access camera. Please ensure you have granted camera permissions.');
      }
    };

    startVideo();

    return () => {
      console.log('Cleaning up video stream');
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped video track:', track.label);
      });
    };
  }, [isTracking]);

  if (!isTracking) return null;

  return (
    <Card className="mt-4">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden" // Hide video but keep it running for gesture analysis
          />
          <div className="p-4 text-center text-sm text-muted-foreground">
            Gesture tracking active
          </div>
        </div>
      )}
    </Card>
  );
};