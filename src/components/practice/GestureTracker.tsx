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
      if (frameBuffer.length > 0) {
        console.log('Processing remaining frames before stopping...');
        processFrames(frameBuffer);
      }
      stopStream();
    }
  }, [isTracking]);

  const processFrames = async (frames: Blob[]) => {
    try {
      console.log('Processing frame buffer:', frames.length, 'frames');
      
      // Validate frames before processing
      const validFrames = frames.filter(frame => frame && frame.size > 0);
      if (validFrames.length === 0) {
        throw new Error('No valid frames to process');
      }

      console.log('Valid frames for processing:', validFrames.length);

      // Convert frames to base64
      const base64Frames = await Promise.all(
        validFrames.map(async (frame) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              resolve(base64);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(frame);
          });
        })
      );

      console.log('Converted frames to base64, preparing for analysis');

      // Upload frames to Supabase storage for reference
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
      
      // Prepare analysis payload
      const analysisPayload = {
        frames: base64Frames,
        metadata: {
          frameCount: validFrames.length,
          timestamp: Date.now(),
          framePaths: validPaths
        }
      };

      console.log('Sending frames for analysis:', {
        frameCount: analysisPayload.metadata.frameCount,
        timestamp: analysisPayload.metadata.timestamp
      });
      
      // Analyze frames
      const metrics = await analyzeGestureFrames(validFrames);
      console.log('Received gesture metrics:', metrics);
      
      // Update metrics with frame paths
      const metricsWithFrames = {
        ...metrics,
        framePaths: validPaths
      };
      
      updateGestureData(metricsWithFrames);
      
      toast({
        title: "Gesture Analysis",
        description: `Successfully analyzed ${validFrames.length} frames`,
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
  };

  useEffect(() => {
    if (frameBuffer.length >= 3) {
      processFrames(frameBuffer);
      setFrameBuffer([]); // Clear buffer after processing
    }
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