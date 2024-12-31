import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { VideoPreview } from "./VideoPreview";
import { GestureMetrics } from "./GestureMetrics";
import { PerformanceReport } from "./PerformanceReport";
import { PracticeEnvironment } from "./PracticeEnvironment";
import { SessionControls } from "./SessionControls";
import { useCamera } from "@/hooks/useCamera";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useSessionAnalysis } from "@/hooks/useSessionAnalysis";
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
  const navigate = useNavigate();
  
  const { videoRef, error: cameraError, startCamera, stopCamera } = useCamera();
  const { isRecording, audioChunks, startRecording, stopRecording } = useAudioRecording();
  const { isAnalyzing, analysis, analyzeSession } = useSessionAnalysis();
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

    stopRecording();
    stopCamera();
    stopTracking();

    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await analyzeSession(audioBlob, crypto.randomUUID());
    } catch (error) {
      console.error('Failed to analyze session:', error);
    }
  };

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
          <VideoPreview videoRef={videoRef} error={cameraError} />
          <GestureMetrics />
          <SessionControls
            isSessionActive={isSessionActive}
            isAnalyzing={isAnalyzing}
            onEndSession={handleEndSession}
          />
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