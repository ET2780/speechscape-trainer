import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGesture } from '@/contexts/GestureContext';

export const GestureMetrics = () => {
  const { gestureMetrics, isTracking } = useGesture();

  if (!isTracking) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Gesture Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Hand Presence</span>
            <span className="text-sm text-muted-foreground">
              {gestureMetrics.handPresence}%
            </span>
          </div>
          <Progress value={gestureMetrics.handPresence} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Movement Speed</span>
            <span className="text-sm text-muted-foreground">
              {gestureMetrics.movementSpeed}%
            </span>
          </div>
          <Progress value={gestureMetrics.movementSpeed} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Gesture Variety</span>
            <span className="text-sm text-muted-foreground">
              {gestureMetrics.gestureVariety}%
            </span>
          </div>
          <Progress value={gestureMetrics.gestureVariety} />
        </div>
      </CardContent>
    </Card>
  );
};