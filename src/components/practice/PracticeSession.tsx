import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PresentationEnvironment } from "./PresentationEnvironment";
import { InterviewEnvironment } from "./InterviewEnvironment";
import { VideoPreview } from "./VideoPreview";
import { GestureMetrics } from "./GestureMetrics";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PerformanceReport } from "./PerformanceReport";
import { useCamera } from "@/hooks/useCamera";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useGesture } from "@/contexts/GestureContext";

type PracticeSessionProps = {
  practiceType: 'presentation' | 'interview';
  slideUrl?: string | null;
  jobType?: string;
  industry?: string;
};

export const PracticeSession: React.FC<PracticeSessionProps> = ({
  practiceType,
  slideUrl,
  jobType,
  industry
}) => {
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { videoRef, error: cameraError, startCamera, stopCamera } = useCamera();
  const { isRecording, audioChunks, startRecording, stopRecording } = useAudioRecording();
  const { startTracking, stopTracking } = useGesture();

  // Start session setup
  React.useEffect(() => {
    if (!isSessionActive) return;

    const setupSession = async () => {
      try {
        await startCamera();
        await startRecording();
        startTracking();
      } catch (error) {
        console.error('Error setting up session:', error);
        toast({
          title: "Setup Error",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    setupSession();

    return () => {
      stopCamera();
      stopRecording();
      stopTracking();
    };
  }, [isSessionActive]);

  const handleEndSession = async () => {
    console.log('Ending session...');
    setIsSessionActive(false);
    setIsAnalyzing(true);

    stopRecording();
    stopCamera();
    stopTracking();

    try {
      // Create audio file from chunks
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('sessionId', crypto.randomUUID());
      
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
    } catch (error) {
      console.error('Error analyzing session:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze your practice session",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="w-full aspect-video bg-gray-50 rounded-lg shadow-lg overflow-hidden">
        {practiceType === 'presentation' ? (
          <PresentationEnvironment slideUrl={slideUrl} />
        ) : (
          <InterviewEnvironment jobType={jobType} industry={industry} />
        )}
      </div>
      
      {isSessionActive && (
        <>
          <VideoPreview videoRef={videoRef} error={cameraError} />
          <GestureMetrics />
          
          <div className="flex justify-center mt-4">
            <Button 
              variant="destructive" 
              onClick={handleEndSession}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "End Practice Session"}
            </Button>
          </div>
        </>
      )}

      {!isSessionActive && analysis && (
        <PerformanceReport 
          analysis={analysis}
          gestureAnalysis={{
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
          }}
        />
      )}

      {!isSessionActive && !analysis && (
        <div className="text-center">
          <p className="text-gray-500">Analyzing your performance...</p>
        </div>
      )}
    </div>
  );
};