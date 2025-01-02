import { supabase } from '@/integrations/supabase/client';
import { processGestureData } from '@/utils/gestureProcessing';

export const analyzeGestureFrames = async (frames: Blob[]): Promise<any> => {
  try {
    console.log('Analyzing gesture frames:', frames.length);
    
    // Validate frames
    const validFrames = frames.filter(frame => frame && frame.size > 0);
    if (validFrames.length === 0) {
      console.error('No valid frames to analyze');
      throw new Error('No valid frames to analyze');
    }
    
    console.log('Valid frames for analysis:', validFrames.length);
    
    // Convert frames to base64
    const framePromises = validFrames.map(async frame => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          console.log('Frame converted to base64, length:', base64.length);
          resolve(base64);
        };
        reader.onerror = () => {
          console.error('Error reading frame:', reader.error);
          reject(reader.error);
        };
        reader.readAsDataURL(frame);
      });
    });

    const frameData = await Promise.all(framePromises);
    console.log('All frames converted to base64');

    // Call edge function for analysis
    const { data, error } = await supabase.functions.invoke('analyze-gestures', {
      body: { frames: frameData }
    });

    if (error) {
      console.error('Error from analyze-gestures function:', error);
      throw error;
    }

    console.log('Received analysis from edge function:', data);
    
    // Process the analysis results
    if (!data || !data.gestureTypes) {
      console.error('Invalid analysis data received:', data);
      throw new Error('Invalid analysis data received');
    }

    return data;
  } catch (error) {
    console.error('Error in analyzeGestureFrames:', error);
    throw error;
  }
};