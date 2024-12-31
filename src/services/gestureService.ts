import { supabase } from "@/integrations/supabase/client";
import { GestureMetrics } from "@/types/analysis";

export const analyzeGestureFrames = async (frames: Blob[]): Promise<GestureMetrics> => {
  console.log('Analyzing gesture frames:', frames.length);
  
  try {
    const formData = new FormData();
    frames.forEach((frame, index) => {
      formData.append('images', frame, `frame${index}.jpg`);
    });

    const { data, error } = await supabase.functions.invoke('analyze-gestures', {
      body: formData,
    });

    if (error) throw error;
    console.log('Gesture analysis received:', data);

    return data.metrics;
  } catch (error) {
    console.error('Error analyzing gestures:', error);
    throw error;
  }
};