import { supabase } from "@/integrations/supabase/client";
import { GestureMetrics } from "@/types/analysis";

export const analyzeGestureFrames = async (frames: Blob[]): Promise<GestureMetrics> => {
  console.log('Starting gesture analysis with', frames.length, 'frames');
  
  try {
    const formData = new FormData();
    frames.forEach((frame, index) => {
      if (!frame || frame.size === 0) {
        throw new Error(`Invalid frame at index ${index}`);
      }
      formData.append(`images`, frame, `frame${index}.jpg`);
      console.log(`Added frame ${index} to form data, size:`, frame.size);
    });

    console.log('Calling analyze-gestures function with', frames.length, 'frames');
    const { data, error } = await supabase.functions.invoke('analyze-gestures', {
      body: formData,
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
    console.error('Error analyzing gestures:', error);
    throw error;
  }
};