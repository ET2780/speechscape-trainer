import { useState } from 'react';
import { useSessionAnalysis } from "@/hooks/useSessionAnalysis";
import { PerformanceReport } from "./PerformanceReport";
import { useToast } from "@/hooks/use-toast";

interface SessionAnalysisProps {
  audioChunks: Blob[];
}

export const SessionAnalysis = ({ audioChunks }: SessionAnalysisProps) => {
  const [showReport, setShowReport] = useState(false);
  const { isAnalyzing, analysis, analyzeSession } = useSessionAnalysis();
  const { toast } = useToast();

  const startAnalysis = async () => {
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

  if (isAnalyzing) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Analyzing your performance...</p>
      </div>
    );
  }

  return null;
};