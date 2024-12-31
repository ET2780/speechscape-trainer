import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CombinedAnalysis } from "@/types/analysis";

interface GestureAnalysisProps {
  gesture: CombinedAnalysis['gesture'];
}

export const GestureAnalysis = ({ gesture }: GestureAnalysisProps) => {
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
  );
};