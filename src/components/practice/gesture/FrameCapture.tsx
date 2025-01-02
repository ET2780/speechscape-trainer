import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { BodyTracker } from '@/utils/bodyTracking';
import { PoseEstimator } from '@/utils/poseEstimation';

interface FrameCaptureProps {
  stream: MediaStream | null;
  error: string | null;
  onFrame: (blob: Blob) => void;
  captureInterval?: number;
}

export const FrameCapture = ({ 
  stream, 
  error, 
  onFrame,
  captureInterval = 2000
}: FrameCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<BodyTracker | null>(null);
  const poseEstimatorRef = useRef<PoseEstimator | null>(null);

  useEffect(() => {
    if (!stream || !videoRef.current || !canvasRef.current || !poseCanvasRef.current) {
      console.log('Missing required refs or stream for frame capture');
      return;
    }
    
    console.log('Setting up frame capture with body tracking and pose estimation...');
    videoRef.current.srcObject = stream;
    
    const initializePoseEstimation = async () => {
      try {
        poseEstimatorRef.current = new PoseEstimator(poseCanvasRef.current!);
        await poseEstimatorRef.current.initialize();
        console.log('Pose estimation initialized successfully');
      } catch (error) {
        console.error('Failed to initialize pose estimation:', error);
      }
    };

    videoRef.current.onloadedmetadata = async () => {
      console.log('Video metadata loaded, dimensions:', {
        width: videoRef.current?.videoWidth,
        height: videoRef.current?.videoHeight
      });
      
      if (!videoRef.current || !canvasRef.current || !poseCanvasRef.current) return;
      
      // Initialize body tracker
      console.log('Initializing body tracker...');
      trackerRef.current = new BodyTracker(videoRef.current, canvasRef.current);
      await trackerRef.current.start();
      console.log('Body tracker initialized and started');

      // Initialize pose estimation
      await initializePoseEstimation();
    };

    const processFrame = async () => {
      if (!trackerRef.current || !poseEstimatorRef.current || !videoRef.current) {
        console.log('Required references not initialized yet');
        return;
      }

      try {
        // Capture frame
        console.log('Capturing frame...');
        const blob = await trackerRef.current.captureFrame();
        
        // Estimate pose
        const pose = await poseEstimatorRef.current.estimatePose(videoRef.current);
        if (pose) {
          poseEstimatorRef.current.drawPose(pose);
          const gestures = poseEstimatorRef.current.detectGestures(pose);
          console.log('Detected gestures:', gestures);
        }

        if (blob.size > 0) {
          console.log('Valid frame captured, sending for processing');
          onFrame(blob);
        } else {
          console.warn('Invalid frame captured (size: 0)');
        }
      } catch (error) {
        console.error('Error processing frame:', error);
      }
    };

    const intervalId = setInterval(processFrame, captureInterval);

    return () => {
      console.log('Cleaning up frame capture...');
      clearInterval(intervalId);
      if (trackerRef.current) {
        trackerRef.current.stop();
        console.log('Body tracker stopped');
      }
      if (poseEstimatorRef.current) {
        poseEstimatorRef.current.stop();
        console.log('Pose estimator stopped');
      }
    };
  }, [stream, onFrame, captureInterval]);

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
    <Card className="mt-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-video object-cover rounded-lg"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        <canvas
          ref={poseCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
          Pose Tracking Active
        </div>
      </div>
    </Card>
  );
};