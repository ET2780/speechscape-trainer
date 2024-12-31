import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useGesture } from '@/contexts/GestureContext';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const GestureMetrics = () => {
  const { gestureMetrics, isTracking, aiFeedback, generateFeedback } = useGesture();

  if (!isTracking && !aiFeedback) return null;

  const totalGestures = Object.values(gestureMetrics.gestureTypes).reduce((a, b) => a + b, 0);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Gesture Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Gestures per Minute</span>
            <span className="text-sm text-muted-foreground">
              {gestureMetrics.gesturesPerMinute.toFixed(1)}
            </span>
          </div>
          <Progress value={Math.min(100, (gestureMetrics.gesturesPerMinute / 30) * 100)} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Smoothness Score</span>
            <span className="text-sm text-muted-foreground">
              {gestureMetrics.smoothnessScore.toFixed(1)}/10
            </span>
          </div>
          <Progress value={(gestureMetrics.smoothnessScore / 10) * 100} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Gesture-Speech Alignment</span>
            <span className="text-sm text-muted-foreground">
              {gestureMetrics.gestureToSpeechRatio.toFixed(1)}%
            </span>
          </div>
          <Progress value={gestureMetrics.gestureToSpeechRatio} />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Gesture Types</span>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(gestureMetrics.gestureTypes).map(([type, count]) => (
              <div key={type} className="bg-gray-50 p-2 rounded">
                <div className="text-xs font-medium capitalize">{type}</div>
                <div className="text-sm">{count} ({totalGestures ? ((count / totalGestures) * 100).toFixed(1) : 0}%)</div>
              </div>
            ))}
          </div>
        </div>

        {!isTracking && (
          <div className="pt-4">
            <Button 
              onClick={generateFeedback} 
              className="w-full"
              disabled={isTracking}
            >
              Generate AI Feedback
            </Button>
          </div>
        )}

        {aiFeedback && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              {aiFeedback}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};