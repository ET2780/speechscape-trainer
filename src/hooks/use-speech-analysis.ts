import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SpeechAnalysis {
  wordsPerMinute: number;
  fillerWordCount: number;
  toneConfidence: number;
  toneEnergy: number;
  overallScore: number;
  suggestions: string[];
}

export const useSpeechAnalysis = () => {
  return useMutation({
    mutationFn: async ({ 
      transcription, 
      sessionId 
    }: { 
      transcription: string; 
      sessionId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const response = await fetch('/functions/v1/analyze-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          transcription,
          sessionId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze speech');
      }

      return response.json() as Promise<SpeechAnalysis>;
    },
  });
};