import React, { useState } from 'react';
import { GestureMetrics } from "./GestureMetrics";
import { PracticeEnvironment } from "./PracticeEnvironment";
import { SessionControls } from "./SessionControls";
import { GestureTracker } from "./GestureTracker";
import { SessionAnalysis } from "./SessionAnalysis";
import { useSessionResources } from "@/hooks/useSessionResources";
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
  const { stopTracking } = useGesture();
  
  const {
    resourcesInitialized,
    audioChunks,
    stopRecording,
    stopCamera,
  } = useSessionResources(isSessionActive);

  const handleEndSession = async () => {
    console.log('Ending session...', { audioChunksCount: audioChunks.length });
    setIsSessionActive(false);
    
    if (resourcesInitialized) {
      console.log('Stopping all resources...');
      stopRecording();
      stopCamera();
      stopTracking();
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
          <GestureTracker />
          <GestureMetrics />
          <SessionControls
            isSessionActive={isSessionActive}
            isAnalyzing={false}
            onEndSession={handleEndSession}
          />
        </>
      )}

      {!isSessionActive && audioChunks.length > 0 && (
        <SessionAnalysis audioChunks={audioChunks} />
      )}
    </div>
  );
};