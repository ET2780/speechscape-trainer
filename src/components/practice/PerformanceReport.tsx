import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from "@/components/ui/chart";
import { AlertCircle, Quote } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CombinedAnalysis } from "@/types/analysis";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PerformanceReportProps {
  analysis: CombinedAnalysis;
}

export const PerformanceReport = ({ analysis }: PerformanceReportProps) => {
  const { speech, gesture } = analysis;
  
  const gestureTypeData = Object.entries(gesture.gestureTypes).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count,
  }));

  const chartConfig = {
    gestures: {
      color: 'hsl(var(--primary))',
      label: 'Gesture Count'
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Performance Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Overall Metrics */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-sm font-medium">{speech.overallScore}%</span>
            </div>
            <Progress value={speech.overallScore} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Words per Minute</p>
              <p className="text-2xl font-bold">{speech.wordsPerMinute}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Filler Words</p>
              <p className="text-2xl font-bold">{speech.fillerWordCount}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Confidence Score</p>
              <p className="text-2xl font-bold">{speech.toneConfidence}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Energy Level</p>
              <p className="text-2xl font-bold">{speech.toneEnergy}%</p>
            </div>
          </div>
        </div>

        {/* Speech Analysis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Speech Analysis</h3>
          
          {speech.expressionQuotes && speech.expressionQuotes.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notable Expressions</h4>
              <ScrollArea className="h-48 rounded-md border p-4">
                {speech.expressionQuotes.map((quote, index) => (
                  <div key={index} className="flex gap-2 mb-4">
                    <Quote className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{quote}</p>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {speech.rephrasingSuggestions && Object.keys(speech.rephrasingSuggestions).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Rephrasing Suggestions</h4>
              <ScrollArea className="h-48 rounded-md border p-4">
                {Object.entries(speech.rephrasingSuggestions).map(([original, suggestion], index) => (
                  <div key={index} className="mb-4 p-2 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Original:</p>
                    <p className="text-sm text-muted-foreground mb-2">{original}</p>
                    <p className="text-sm font-medium">Suggested:</p>
                    <p className="text-sm text-primary">{suggestion}</p>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Speech Suggestions</h4>
            <ul className="list-disc pl-5 space-y-1">
              {speech.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Gesture Analysis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Gesture Analysis</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Gestures per Minute</p>
              <p className="text-2xl font-bold">{gesture.gesturesPerMinute.toFixed(1)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Smoothness Score</p>
              <p className="text-2xl font-bold">{gesture.smoothnessScore.toFixed(1)}/10</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Speech-Gesture Alignment</p>
              <p className="text-2xl font-bold">{gesture.gestureToSpeechRatio.toFixed(1)}%</p>
            </div>
          </div>

          {/* Gesture Screenshots */}
          {gesture.screenshots && gesture.screenshots.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Key Moments</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gesture.screenshots.map((screenshot, index) => (
                  <div key={index} className="space-y-2">
                    <AspectRatio ratio={16 / 9}>
                      <img
                        src={screenshot}
                        alt={`Gesture moment ${index + 1}`}
                        className="rounded-lg object-cover w-full h-full"
                      />
                    </AspectRatio>
                    {gesture.analysis && gesture.analysis[index] && (
                      <p className="text-xs text-muted-foreground">
                        {gesture.analysis[index].description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-64">
            <ChartContainer className="h-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gestureTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--color-gestures)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {gesture.aiFeedback && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="mt-2">
                {gesture.aiFeedback}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};