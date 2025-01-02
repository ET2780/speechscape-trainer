import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { GestureMetrics } from "./GestureMetrics";
import { PerformanceReport } from "./PerformanceReport";
import { PracticeEnvironment } from "./PracticeEnvironment";
import { SessionControls } from "./SessionControls";
import { useCamera } from "@/hooks/useCamera";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useSessionAnalysis } from "@/hooks/useSessionAnalysis";
import { useGesture } from "@/contexts/GestureContext";
import { GestureTracker } from "./GestureTracker";
import { useToast } from "@/hooks/use-toast";

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
  const [showReport, setShowReport] = useState(false);
  const [resourcesInitialized, setResourcesInitialized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { videoRef, error: cameraError, startCamera, stopCamera } = useCamera();
  const { isRecording, audioChunks, startRecording, stopRecording } = useAudioRecording();
  const { isAnalyzing, analysis, analyzeSession } = useSessionAnalysis();
  const { startTracking, stopTracking } = useGesture();

  useEffect(() => {
    if (!isSessionActive) return;

    const setupSession = async () => {
      console.log('Setting up practice session...');
      try {
        console.log('Starting camera...');
        await startCamera();
        
        console.log('Starting audio recording...');
        await startRecording();
        
        console.log('Starting gesture tracking...');
        startTracking();
        
        setResourcesInitialized(true);
        
        toast({
          title: "Session Started",
          description: "Recording and analysis have begun",
        });
      } catch (error) {
        console.error('Error setting up session:', error);
        setResourcesInitialized(false);
        toast({
          title: "Setup Error",
          description: "Failed to start recording session. Please check your camera and microphone permissions.",
          variant: "destructive",
        });
      }
    };

    setupSession();

    return () => {
      console.log('Cleaning up session...', { resourcesInitialized, isRecording });
      if (resourcesInitialized) {
        if (isRecording) {
          console.log('Stopping recording...');
          stopRecording();
        }
        if (videoRef.current) {
          console.log('Stopping camera...');
          stopCamera();
        }
        console.log('Stopping gesture tracking...');
        stopTracking();
      }
    };
  }, [isSessionActive]);

  const handleEndSession = async () => {
    console.log('Ending session...', { audioChunksCount: audioChunks.length });
    setIsSessionActive(false);
    
    if (resourcesInitialized) {
      stopRecording();
      stopCamera();
      stopTracking();
    }

    try {
      const sessionId = crypto.randomUUID();
      console.log('Analyzing session with ID:', sessionId);
      await analyzeSession(audioChunks, sessionId);
      setShowReport(true);
      
      toast({
        title: "Analysis Complete",
        description: "Your practice session has been analyzed",
      });
    } catch (error) {
      console.error('Failed to analyze session:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze your practice session",
        variant: "destructive",
      });
    }
  };

  if (showReport && analysis) {
    return (
      <div className="container mx-auto py-8">
        <PerformanceReport analysis={analysis} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PracticeEnvironment
        practiceType={practiceType}
        slideUrl={slideUrl}
        jobType={jobType}
        industry={industry}
      />
      
      {isSessionActive && (
        <>
          <GestureTracker />
          <GestureMetrics />
          <SessionControls
            isSessionActive={isSessionActive}
            isAnalyzing={isAnalyzing}
            onEndSession={handleEndSession}
          />
        </>
      )}

      {!isSessionActive && !analysis && (
        <div className="text-center">
          <p className="text-gray-500">Analyzing your performance...</p>
        </div>
      )}
    </div>
  );
};