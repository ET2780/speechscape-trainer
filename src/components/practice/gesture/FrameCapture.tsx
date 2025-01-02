import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { BodyTracker } from '@/utils/bodyTracking';

interface FrameCaptureProps {
  stream: MediaStream | null;
  error: string | null;
  onFrame: (blob: Blob) => void;
  captureInterval?: number;
}

export const FrameCapture = ({ 
  stream, 
  error, 
  onFrame,
  captureInterval = 5000 // Capture every 5 seconds
}: FrameCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<BodyTracker | null>(null);

  useEffect(() => {
    if (!stream || !videoRef.current || !canvasRef.current) {
      console.log('Missing required refs or stream for frame capture');
      return;
    }
    
    console.log('Setting up frame capture with body tracking...');
    videoRef.current.srcObject = stream;
    
    // Wait for video to be ready before initializing tracker
    videoRef.current.onloadedmetadata = () => {
      console.log('Video metadata loaded, dimensions:', {
        width: videoRef.current?.videoWidth,
        height: videoRef.current?.videoHeight
      });
      
      if (!videoRef.current || !canvasRef.current) return;
      
      trackerRef.current = new BodyTracker(videoRef.current, canvasRef.current);
      trackerRef.current.start();
    };

    const intervalId = setInterval(async () => {
      if (!trackerRef.current) {
        console.log('Tracker not initialized yet');
        return;
      }

      try {
        const blob = await trackerRef.current.captureFrame();
        console.log('Captured frame with body tracking:', blob.size, 'bytes');
        onFrame(blob);
      } catch (error) {
        console.error('Error capturing frame:', error);
      }
    }, captureInterval);

    return () => {
      console.log('Cleaning up frame capture and body tracking...');
      clearInterval(intervalId);
      trackerRef.current?.stop();
    };
  }, [stream, onFrame, captureInterval]);

  if (error) {
    return (
      <Card className="mt-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-video object-cover rounded-lg"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
          Body Tracking Active
        </div>
      </div>
    </Card>
  );
};