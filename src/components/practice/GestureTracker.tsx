import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useGesture } from '@/contexts/GestureContext';

export const GestureTracker = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isTracking } = useGesture();

  useEffect(() => {
    if (!isTracking || !videoRef.current) return;

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startVideo();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [isTracking]);

  if (!isTracking) return null;

  return (
    <Card className="mt-4 overflow-hidden">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
          Gesture Tracking Active
        </div>
      </div>
    </Card>
  );
};