import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PerformanceReportProps {
  analysis: {
    wordsPerMinute: number;
    fillerWordCount: number;
    toneConfidence: number;
    toneEnergy: number;
    overallScore: number;
    suggestions: string[];
  };
}

export const PerformanceReport = ({ analysis }: PerformanceReportProps) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Performance Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-sm font-medium">{analysis.overallScore}%</span>
            </div>
            <Progress value={analysis.overallScore} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Words per Minute</p>
              <p className="text-2xl font-bold">{analysis.wordsPerMinute}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Filler Words</p>
              <p className="text-2xl font-bold">{analysis.fillerWordCount}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Confidence Score</p>
              <p className="text-2xl font-bold">{analysis.toneConfidence}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Energy Level</p>
              <p className="text-2xl font-bold">{analysis.toneEnergy}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Suggestions for Improvement</h3>
            <ul className="list-disc pl-5 space-y-1">
              {analysis.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};