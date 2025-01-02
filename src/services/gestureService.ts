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

    // Convert blobs to base64 strings
    console.log('Converting frames to base64...');
    const base64Frames = await Promise.all(
      frames.map(async (frame) => {
        const buffer = await frame.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        return base64;
      })
    );

    console.log('Successfully converted', base64Frames.length, 'frames to base64');
    console.log('First frame length:', base64Frames[0]?.length || 0);

    console.log('Calling analyze-gestures function...');
    const { data, error } = await supabase.functions.invoke('analyze-gestures', {
      body: { frames: base64Frames }
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