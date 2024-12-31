import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PresentationEnvironment } from "./PresentationEnvironment";
import { InterviewEnvironment } from "./InterviewEnvironment";
import { GestureTracker } from "./GestureTracker";
import { GestureMetrics } from "./GestureMetrics";

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

  const handleEndSession = () => {
    setIsSessionActive(false);
    // TODO: Implement session end logic, like saving performance metrics
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
          <GestureTracker />
          <GestureMetrics />
          
          <div className="flex justify-center mt-4">
            <Button 
              variant="destructive" 
              onClick={handleEndSession}
            >
              End Practice Session
            </Button>
          </div>
        </>
      )}
    </div>
  );
};