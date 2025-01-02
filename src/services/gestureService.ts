import { supabase } from '@/integrations/supabase/client';
import { processGestureData } from '@/utils/gestureProcessing';

export const analyzeGestureFrames = async (frames: Blob[]): Promise<any> => {
  try {
    console.log('Analyzing gesture frames:', frames.length);
    
    // Convert frames to base64 for sending to edge function
    const framePromises = frames.map(frame => 
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(frame);
      })
    );

    const frameData = await Promise.all(framePromises);
    console.log('Converted frames to base64');

    const { data, error } = await supabase.functions.invoke('analyze-gestures', {
      body: { frames: frameData }
    });

    if (error) {
      console.error('Error from analyze-gestures function:', error);
      throw error;
    }

    console.log('Received analysis from edge function:', data);
    return data;
  } catch (error) {
    console.error('Error in analyzeGestureFrames:', error);
    throw error;
  }
};