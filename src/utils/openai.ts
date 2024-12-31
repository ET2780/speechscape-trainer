import { supabase } from "@/integrations/supabase/client";

export const generateInterviewQuestions = async (jobType: string, industry: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
      body: { jobType, industry },
    });

    if (error) throw error;
    return data.questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};