import { supabase } from "@/integrations/supabase/client";
import { GestureMetrics } from "@/types/analysis";

export const analyzeGestureFrames = async (frames: Blob[]): Promise<GestureMetrics> => {
  console.log('Starting gesture analysis with', frames.length, 'frames');
  
  try {
    // Validate frames
    if (!frames || frames.length === 0) {
      console.error('No frames provided for analysis');
      throw new Error('No frames provided for analysis');
    }

    // Log frame sizes before conversion
    console.log('Frame sizes before conversion:', frames.map(frame => frame.size));

    // Convert blobs to base64 strings
    console.log('Converting frames to base64...');
    const base64Frames = await Promise.all(
      frames.map(async (frame, index) => {
        console.log(`Converting frame ${index + 1}/${frames.length}`);
        try {
          const buffer = await frame.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          console.log(`Frame ${index + 1} converted successfully, length:`, base64.length);
          return base64;
        } catch (error) {
          console.error(`Error converting frame ${index + 1}:`, error);
          throw error;
        }
      })
    );

    console.log('Successfully converted', base64Frames.length, 'frames to base64');
    console.log('First frame length:', base64Frames[0]?.length || 0);

    // Aggregate gesture data
    const gestureData = {
      frames: base64Frames,
      timestamp: Date.now(),
      metadata: {
        frameCount: frames.length,
        averageSize: frames.reduce((acc, frame) => acc + frame.size, 0) / frames.length
      }
    };

    console.log('Preparing to call analyze-gestures function...');
    console.log('Request metadata:', gestureData.metadata);
    
    const { data, error } = await supabase.functions.invoke('analyze-gestures', {
      body: gestureData
    });

    if (error) {
      console.error('Error from analyze-gestures function:', error);
      throw error;
    }

    if (!data?.metrics) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from analyze-gestures function');
    }

    console.log('Gesture analysis received:', data.metrics);
    return data.metrics;
  } catch (error) {
    console.error('Error in analyzeGestureFrames:', error);
    throw error;
  }
};