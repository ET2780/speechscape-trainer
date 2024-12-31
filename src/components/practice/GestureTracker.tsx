import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useGesture } from '@/contexts/GestureContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { analyzeGestureFrames } from '@/services/gestureService';

export const GestureTracker = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isTracking, updateGestureData } = useGesture();
  const [error, setError] = useState<string | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const frameBufferRef = useRef<Blob[]>([]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Video or canvas ref not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.log('Canvas context not available');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.log('Failed to create blob from canvas');
        return;
      }
      
      console.log('Captured frame:', blob.size, 'bytes');
      frameBufferRef.current.push(blob);
      
      // Analyze frames when we have enough
      if (frameBufferRef.current.length >= 6) {
        console.log('Processing frame buffer of size:', frameBufferRef.current.length);
        try {
          const metrics = await analyzeGestureFrames(frameBufferRef.current);
          console.log('Received gesture metrics:', metrics);
          updateGestureData(metrics);
          frameBufferRef.current = []; // Clear the buffer after analysis
        } catch (error) {
          console.error('Error analyzing frames:', error);
          setError('Failed to analyze gestures. Please try again.');
        }
      }
    }, 'image/jpeg', 0.8);
  };

  useEffect(() => {
    if (!isTracking) {
      console.log('Gesture tracking is disabled');
      return;
    }

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
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting capture interval');
            // Capture frames every 3 seconds instead of 5
            captureIntervalRef.current = setInterval(captureFrame, 3000);
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setError('Unable to access camera. Please ensure you have granted camera permissions.');
      }
    };

    startVideo();

    return () => {
      console.log('Cleaning up video stream and capture interval');
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped video track:', track.label);
        });
      }
      frameBufferRef.current = [];
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
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="p-4 text-center text-sm text-muted-foreground">
            Gesture analysis active - capturing frames every 3 seconds
          </div>
        </div>
      )}
    </Card>
  );
};