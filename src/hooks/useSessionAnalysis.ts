import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSessionAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const analyzeSession = async (audioBlob: Blob, sessionId: string) => {
    console.log('Starting session analysis...');
    setIsAnalyzing(true);

    try {
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

      if (error) throw error;

      console.log('Analysis results:', data);
      setAnalysis(data);

      toast({
        title: "Session Completed",
        description: "Your practice session has been analyzed",
      });

      return data;
    } catch (error) {
      console.error('Error analyzing session:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze your practice session",
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
    analyzeSession
  };
};