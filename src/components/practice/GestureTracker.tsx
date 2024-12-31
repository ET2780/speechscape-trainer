import { useState } from 'react';
import { useGesture } from '@/contexts/GestureContext';
import { useMediaStream } from '@/hooks/useMediaStream';
import { FrameCapture } from './gesture/FrameCapture';
import { GestureAnalyzer } from './gesture/GestureAnalyzer';

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

  return (
    <>
      <FrameCapture
        stream={stream}
        error={error || analysisError}
        onFrame={(blob) => {
          const analyzer = new GestureAnalyzer({
            onAnalysis: updateGestureData,
            onError: setAnalysisError
          });
          analyzer.processFrame(blob);
        }}
      />
    </>
  );
};