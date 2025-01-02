import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CombinedAnalysis, GestureMetrics } from "@/types/analysis";

export const useSessionAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CombinedAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const analyzeSession = async (audioChunks: Blob[], sessionId: string, gestureMetrics: GestureMetrics) => {
    console.log('Starting session analysis...', { 
      chunksCount: audioChunks.length,
      sessionId,
      gestureMetrics 
    });
    
    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && !user) {
        throw new Error('User not authenticated');
      }
      if (userError) {
        console.error('Auth error:', userError);
        throw userError;
      }

      // First create the practice session record
      const { error: sessionError } = await supabase
        .from('practice_sessions')
        .insert({
          id: sessionId,
          user_id: user.id,
          practice_type: 'presentation', // You might want to make this dynamic
        });

      if (sessionError) {
        console.error('Error creating practice session:', sessionError);
        throw sessionError;
      }

      // Combine audio chunks into a single blob
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      console.log('Combined audio blob size:', audioBlob.size);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('sessionId', sessionId);
      formData.append('userId', user.id);

      console.log('Sending audio for transcription and analysis');
      const { data: speechData, error: speechError } = await supabase.functions.invoke('analyze-speech', {
        body: formData,
      });

      if (speechError) {
        console.error('Error from speech analysis:', speechError);
        throw speechError;
      }

      if (!speechData) {
        throw new Error('No data received from speech analysis');
      }

      console.log('Speech analysis results:', speechData);
      
      // Store the complete analysis including gesture data
      const { error: storageError } = await supabase
        .from('performance_reports')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          speech_analysis: speechData,
          gesture_analysis: {
            metrics: gestureMetrics,
            timestamp: new Date().toISOString()
          }
        });

      if (storageError) {
        console.error('Error storing analysis:', storageError);
        throw storageError;
      }

      // Create combined analysis
      const combinedAnalysis: CombinedAnalysis = {
        speech: speechData,
        gesture: gestureMetrics
      };

      setAnalysis(combinedAnalysis);
      setProgress(100);

      toast({
        title: "Analysis Complete",
        description: "Your practice session has been analyzed and saved",
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