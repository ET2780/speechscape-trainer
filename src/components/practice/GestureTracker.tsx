import { useState, useEffect } from 'react';
import { useGesture } from '@/contexts/GestureContext';
import { useMediaStream } from '@/hooks/useMediaStream';
import { FrameCapture } from './gesture/FrameCapture';
import { analyzeGestureFrames } from '@/services/gestureService';

export const GestureTracker = () => {
  const { isTracking, updateGestureData } = useGesture();
  const { stream, error, startStream, stopStream } = useMediaStream();
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [frameBuffer, setFrameBuffer] = useState<Blob[]>([]);

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
      if (frameBuffer.length >= 6) { // Process after collecting 6 frames (30 seconds)
        try {
          console.log('Processing frame buffer:', frameBuffer.length, 'frames');
          const metrics = await analyzeGestureFrames(frameBuffer);
          console.log('Received gesture metrics:', metrics);
          updateGestureData(metrics);
          setFrameBuffer([]); // Clear buffer after processing
        } catch (err) {
          console.error('Error analyzing frames:', err);
          setAnalysisError('Failed to analyze gestures');
        }
      }
    };

    processFrames();
  }, [frameBuffer]);

  const handleFrame = (blob: Blob) => {
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