import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PerformanceReportProps {
  analysis: {
    wordsPerMinute: number;
    fillerWordCount: number;
    toneConfidence: number;
    toneEnergy: number;
    overallScore: number;
    suggestions: string[];
  };
  gestureAnalysis: {
    gesturesPerMinute: number;
    gestureTypes: {
      pointing: number;
      waving: number;
      openPalm: number;
      other: number;
    };
    smoothnessScore: number;
    gestureToSpeechRatio: number;
    aiFeedback: string | null;
  };
}

export const PerformanceReport = ({ analysis, gestureAnalysis }: PerformanceReportProps) => {
  const gestureTypeData = Object.entries(gestureAnalysis.gestureTypes).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count,
  }));

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

          {/* Gesture Analysis Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Gesture Analysis</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">Gestures per Minute</p>
                <p className="text-2xl font-bold">{gestureAnalysis.gesturesPerMinute.toFixed(1)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Smoothness Score</p>
                <p className="text-2xl font-bold">{gestureAnalysis.smoothnessScore.toFixed(1)}/10</p>
              </div>
            </div>

            <div className="h-64 mb-6">
              <ChartContainer
                className="h-full"
                config={{
                  count: {
                    theme: {
                      light: "hsl(var(--primary))",
                      dark: "hsl(var(--primary))",
                    },
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gestureTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {gestureAnalysis.aiFeedback && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="mt-2">
                  {gestureAnalysis.aiFeedback}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};