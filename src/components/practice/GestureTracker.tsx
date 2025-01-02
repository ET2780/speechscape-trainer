import { useState, useEffect } from 'react';
import { useGesture } from '@/contexts/GestureContext';
import { useMediaStream } from '@/hooks/useMediaStream';
import { FrameCapture } from './gesture/FrameCapture';
import { analyzeGestureFrames } from '@/services/gestureService';
import { useToast } from '@/hooks/use-toast';

export const GestureTracker = () => {
  const { isTracking, updateGestureData } = useGesture();
  const { stream, error, startStream, stopStream } = useMediaStream();
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [frameBuffer, setFrameBuffer] = useState<Blob[]>([]);
  const { toast } = useToast();

  // Start/stop stream based on tracking state
  useEffect(() => {
    if (isTracking) {
      console.log('Starting gesture tracking...');
      startStream();
    } else {
      console.log('Stopping gesture tracking...');
      stopStream();
    }
  }, [isTracking]);

  // Process frames when buffer reaches threshold
  useEffect(() => {
    const processFrames = async () => {
      if (frameBuffer.length >= 3) { // Process after collecting 3 frames (15 seconds)
        try {
          console.log('Processing frame buffer:', frameBuffer.length, 'frames');
          const metrics = await analyzeGestureFrames(frameBuffer);
          console.log('Received gesture metrics:', metrics);
          updateGestureData(metrics);
          setFrameBuffer([]); // Clear buffer after processing
          
          toast({
            title: "Gesture Analysis",
            description: "Successfully analyzed your gestures",
          });
        } catch (err) {
          console.error('Error analyzing frames:', err);
          setAnalysisError('Failed to analyze gestures');
          toast({
            title: "Analysis Error",
            description: "Failed to analyze gestures. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    processFrames();
  }, [frameBuffer]);

  const handleFrame = (blob: Blob) => {
    console.log('Received frame:', blob.size, 'bytes');
    setFrameBuffer(prev => [...prev, blob]);
  };

  if (!isTracking) return null;

  return (
    <FrameCapture
      stream={stream}
      error={error || analysisError}
      onFrame={handleFrame}
    />
  );
};