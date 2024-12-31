import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CombinedAnalysis } from "@/types/analysis";

export const useSessionAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CombinedAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const analyzeSession = async (audioChunks: Blob[], sessionId: string) => {
    console.log('Starting session analysis...', { chunksCount: audioChunks.length });
    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Combine all audio chunks into a single blob
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      console.log('Combined audio blob size:', audioBlob.size);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('sessionId', sessionId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      formData.append('userId', user.id);

      console.log('Sending audio for transcription and analysis');
      const { data, error } = await supabase.functions.invoke('analyze-speech', {
        body: formData,
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data received from analysis');
      }

      console.log('Analysis results:', data);
      
      // Create combined analysis with default gesture metrics
      const combinedAnalysis: CombinedAnalysis = {
        speech: data,
        gesture: {
          gesturesPerMinute: 0,
          gestureTypes: {
            pointing: 0,
            waving: 0,
            openPalm: 0,
            other: 0
          },
          smoothnessScore: 0,
          gestureToSpeechRatio: 0,
          aiFeedback: null
        }
      };

      setAnalysis(combinedAnalysis);
      setProgress(100);

      toast({
        title: "Analysis Complete",
        description: "Your practice session has been analyzed",
      });

      return combinedAnalysis;
    } catch (error) {
      console.error('Error analyzing session:', error);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze your practice session",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analysis,
    analyzeSession,
    progress
  };
};