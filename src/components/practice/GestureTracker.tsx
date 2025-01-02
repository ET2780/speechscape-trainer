import { useState, useEffect } from 'react';
import { useGesture } from '@/contexts/GestureContext';
import { useMediaStream } from '@/hooks/useMediaStream';
import { FrameCapture } from './gesture/FrameCapture';
import { analyzeGestureFrames } from '@/services/gestureService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const GestureTracker = () => {
  const { isTracking, updateGestureData } = useGesture();
  const { stream, error, startStream, stopStream } = useMediaStream();
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [frameBuffer, setFrameBuffer] = useState<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isTracking) {
      console.log('Starting gesture tracking...');
      startStream();
    } else {
      console.log('Stopping gesture tracking...');
      stopStream();
    }
  }, [isTracking]);

  useEffect(() => {
    const processFrames = async () => {
      if (frameBuffer.length >= 3) {
        try {
          console.log('Processing frame buffer:', frameBuffer.length, 'frames');
          console.log('Frame sizes:', frameBuffer.map(frame => frame.size));
          
          // Validate frames before processing
          const validFrames = frameBuffer.filter(frame => frame && frame.size > 0);
          if (validFrames.length !== frameBuffer.length) {
            console.error('Some frames are invalid:', {
              total: frameBuffer.length,
              valid: validFrames.length
            });
          }

          // Upload frames to Supabase storage for later analysis
          const uploadPromises = validFrames.map(async (frame, index) => {
            const fileName = `gesture_frame_${Date.now()}_${index}.jpg`;
            const { data, error } = await supabase.storage
              .from('gesture-frames')
              .upload(fileName, frame);
            
            if (error) {
              console.error('Error uploading frame:', error);
              return null;
            }
            return data?.path;
          });

          const framePaths = await Promise.all(uploadPromises);
          const validPaths = framePaths.filter(Boolean);
          
          console.log('Uploaded frames to storage:', validPaths);
          
          const metrics = await analyzeGestureFrames(validFrames);
          console.log('Received gesture metrics:', metrics);
          
          // Update metrics with frame paths
          const metricsWithFrames = {
            ...metrics,
            framePaths: validPaths
          };
          
          updateGestureData(metricsWithFrames);
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
    if (!blob || blob.size === 0) {
      console.error('Received invalid frame:', blob);
      return;
    }
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