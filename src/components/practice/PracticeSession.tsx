import React, { useState } from 'react';
import { GestureMetrics } from "./GestureMetrics";
import { PracticeEnvironment } from "./PracticeEnvironment";
import { SessionControls } from "./SessionControls";
import { GestureTracker } from "./GestureTracker";
import { SessionAnalysis } from "./SessionAnalysis";
import { useSessionResources } from "@/hooks/useSessionResources";

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
  
  const {
    resourcesInitialized,
    audioChunks,
    stopRecording,
    stopCamera,
    stopTracking
  } = useSessionResources(isSessionActive);

  const handleEndSession = async () => {
    console.log('Ending session...', { audioChunksCount: audioChunks.length });
    setIsSessionActive(false);
    
    if (resourcesInitialized) {
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

      {!isSessionActive && (
        <SessionAnalysis audioChunks={audioChunks} />
      )}
    </div>
  );
};