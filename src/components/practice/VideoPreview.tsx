import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  error: string | null;
}

export const VideoPreview = ({ videoRef, error }: VideoPreviewProps) => {
  if (error) {
    return (
      <Card className="mt-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="mt-4 overflow-hidden">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
          Camera Active
        </div>
      </div>
    </Card>
  );
};