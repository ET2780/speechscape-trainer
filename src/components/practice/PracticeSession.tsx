import React, { useState, useEffect } from 'react';
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
  const [transcript, setTranscript] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Speech recognition setup
  useEffect(() => {
    if (!isSessionActive) return;

    console.log('Setting up speech recognition');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + ' ';
      }
      console.log('Updated transcript:', fullTranscript);
      setTranscript(fullTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: "Speech Recognition Error",
        description: `Error: ${event.error}`,
        variant: "destructive",
      });
    };

    recognition.start();
    console.log('Speech recognition started');

    return () => {
      recognition.stop();
      console.log('Speech recognition stopped');
    };
  }, [isSessionActive, toast]);

  const handleEndSession = async () => {
    console.log('Ending session...');
    setIsSessionActive(false);
    setIsAnalyzing(true);

    try {
      console.log('Sending transcript for analysis:', transcript);
      const response = await fetch('/api/analyze-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription: transcript,
          sessionId: crypto.randomUUID(),
          userId: (await supabase.auth.getUser()).data.user?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze speech');

      const analysisData = await response.json();
      console.log('Analysis results:', analysisData);
      setAnalysis(analysisData);

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