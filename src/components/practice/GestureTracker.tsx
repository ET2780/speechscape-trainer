import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useGesture } from '@/contexts/GestureContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

export const GestureTracker = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isTracking, updateGestureData } = useGesture();
  const [error, setError] = useState<string | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const frameBufferRef = useRef<Blob[]>([]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and store
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      console.log('Captured frame:', blob.size, 'bytes');
      
      frameBufferRef.current.push(blob);
      
      // When we have enough frames (every 30 seconds), analyze them
      if (frameBufferRef.current.length >= 6) { // 6 frames = 30 seconds
        try {
          const formData = new FormData();
          frameBufferRef.current.forEach((frameBlob, index) => {
            formData.append('images', frameBlob, `frame${index}.jpg`);
          });

          const { data, error } = await supabase.functions.invoke('analyze-gestures', {
            body: formData,
          });

          if (error) throw error;
          console.log('Gesture analysis received:', data);
          
          if (data.metrics) {
            updateGestureData(data.metrics);
          }
          
          // Clear the buffer after analysis
          frameBufferRef.current = [];
        } catch (error) {
          console.error('Error analyzing frames:', error);
        }
      }
    }, 'image/jpeg', 0.8);
  };

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
          
          // Start capturing frames every 5 seconds
          captureIntervalRef.current = setInterval(captureFrame, 5000);
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
      stream?.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped video track:', track.label);
      });
      // Clear any remaining frames
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
            Gesture analysis active - capturing frames every 5 seconds
          </div>
        </div>
      )}
    </Card>
  );
};