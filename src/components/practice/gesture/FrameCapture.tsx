import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    
    videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (!stream || !videoRef.current || !canvasRef.current) return;

    console.log('Setting up frame capture interval...');
    const intervalId = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.log('Video not ready for capture');
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Canvas context not available');
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert the canvas to a blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Failed to create blob from canvas');
            return;
          }
          console.log('Captured frame:', blob.size, 'bytes');
          onFrame(blob);
        },
        'image/jpeg',
        0.8
      );
    }, captureInterval);

    return () => {
      console.log('Cleaning up frame capture interval');
      clearInterval(intervalId);
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
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="p-4 text-center text-sm text-muted-foreground">
          Gesture analysis active - capturing frames every {captureInterval / 1000} seconds
        </div>
      </div>
    </Card>
  );
};