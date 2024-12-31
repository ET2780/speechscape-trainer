import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CombinedAnalysis } from "@/types/analysis";
import { OverallMetrics } from "./performance/OverallMetrics";
import { SpeechAnalysis } from "./performance/SpeechAnalysis";
import { GestureAnalysis } from "./performance/GestureAnalysis";

interface PerformanceReportProps {
  analysis: CombinedAnalysis;
}

export const PerformanceReport = ({ analysis }: PerformanceReportProps) => {
  const { speech, gesture } = analysis;
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Performance Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <OverallMetrics speech={speech} />
        <SpeechAnalysis speech={speech} />
        <GestureAnalysis gesture={gesture} />
      </CardContent>
    </Card>
  );
};