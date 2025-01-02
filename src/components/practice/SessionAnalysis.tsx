import { useState } from 'react';
import { useSessionAnalysis } from "@/hooks/useSessionAnalysis";
import { PerformanceReport } from "./PerformanceReport";
import { useToast } from "@/hooks/use-toast";
import { useGesture } from '@/contexts/GestureContext';
import { Button } from "@/components/ui/button";

interface SessionAnalysisProps {
  audioChunks: Blob[];
}

export const SessionAnalysis = ({ audioChunks }: SessionAnalysisProps) => {
  const [showReport, setShowReport] = useState(false);
  const { isAnalyzing, analysis, analyzeSession } = useSessionAnalysis();
  const { gestureMetrics } = useGesture();
  const { toast } = useToast();

  const startAnalysis = async () => {
    try {
      const sessionId = crypto.randomUUID();
      console.log('Starting analysis for session:', sessionId);
      console.log('Using gesture metrics:', gestureMetrics);
      
      await analyzeSession(audioChunks, sessionId, gestureMetrics);
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
    <div className="flex flex-col items-center justify-center gap-4 mt-8">
      {isAnalyzing ? (
        <div className="text-center">
          <p className="text-gray-500">Analyzing your performance...</p>
        </div>
      ) : (
        <Button onClick={startAnalysis} className="w-48">
          Start Analysis
        </Button>
      )}
    </div>
  );
};