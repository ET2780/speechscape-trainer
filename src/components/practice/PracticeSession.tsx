import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { PresentationEnvironment } from "./PresentationEnvironment";
import { InterviewEnvironment } from "./InterviewEnvironment";
import { GestureTracker } from "./GestureTracker";
import { GestureMetrics } from "./GestureMetrics";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PerformanceReport } from "./PerformanceReport";

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
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Audio recording setup
  useEffect(() => {
    if (!isSessionActive) return;

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          setAudioChunks(chunks);
        };

        mediaRecorder.start(1000); // Collect data every second
        setIsRecording(true);
        console.log('Recording started');
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Microphone Access Error",
          description: "Please allow microphone access to use this feature",
          variant: "destructive",
        });
      }
    };

    startRecording();

    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        console.log('Recording stopped');
      }
    };
  }, [isSessionActive, toast]);

  const handleEndSession = async () => {
    console.log('Ending session...');
    setIsSessionActive(false);
    setIsAnalyzing(true);

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

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
      
      {isSessionActive ? (
        <>
          <GestureTracker />
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
      ) : analysis ? (
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
      ) : (
        <div className="text-center">
          <p className="text-gray-500">Analyzing your performance...</p>
        </div>
      )}
    </div>
  );
};