import { supabase } from "@/integrations/supabase/client";

export const generateInterviewQuestions = async (jobType: string, industry: string) => {
  try {
    console.log('Generating interview questions for:', { jobType, industry });
    const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
      body: { jobType, industry },
    });

    if (error) {
      console.error('Error from edge function:', error);
      throw error;
    }
    
    console.log('Generated questions:', data);
    return data.questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};