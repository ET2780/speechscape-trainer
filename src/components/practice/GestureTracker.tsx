import { useState, useEffect } from 'react';
import { useGesture } from '@/contexts/GestureContext';
import { useMediaStream } from '@/hooks/useMediaStream';
import { FrameCapture } from './gesture/FrameCapture';
import { analyzeGestureFrames } from '@/services/gestureService';

export const GestureTracker = () => {
  const { isTracking, updateGestureData } = useGesture();
  const { stream, error, startStream, stopStream } = useMediaStream();
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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

  if (!isTracking) return null;

  // Create an analyzer instance
  const analyzer = {
    processFrame: async (blob: Blob) => {
      try {
        console.log('Processing frame, size:', blob.size);
        const metrics = await analyzeGestureFrames([blob]);
        console.log('Received gesture metrics:', metrics);
        updateGestureData(metrics);
      } catch (err) {
        console.error('Error analyzing frame:', err);
        setAnalysisError('Failed to analyze gestures');
      }
    }
  };

  return (
    <>
      <FrameCapture
        stream={stream}
        error={error || analysisError}
        onFrame={analyzer.processFrame}
      />
    </>
  );
};