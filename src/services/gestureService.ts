import { supabase } from '@/integrations/supabase/client';

export const analyzeGestureFrames = async (frames: Blob[]) => {
  try {
    console.log('Analyzing gesture frames:', frames.length);
    
    // Call the analyze-gestures edge function
    const { data, error } = await supabase.functions.invoke('analyze-gestures', {
      body: {
        frames: frames.map(frame => ({
          size: frame.size,
          type: frame.type
        }))
      }
    });

    if (error) {
      console.error('Error analyzing gestures:', error);
      throw error;
    }

    console.log('Gesture analysis results:', data);
    return data;
  } catch (err) {
    console.error('Failed to analyze gesture frames:', err);
    throw err;
  }
};