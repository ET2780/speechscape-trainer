import { useRef } from 'react';
import { analyzeGestureFrames } from '@/services/gestureService';

interface GestureAnalyzerProps {
  onAnalysis: (metrics: any) => void;
  onError: (error: string) => void;
}

export const GestureAnalyzer = ({ onAnalysis, onError }: GestureAnalyzerProps) => {
  const frameBufferRef = useRef<Blob[]>([]);

  const processFrame = async (blob: Blob) => {
    frameBufferRef.current.push(blob);
    
    if (frameBufferRef.current.length >= 6) {
      console.log('Processing frame buffer of size:', frameBufferRef.current.length);
      try {
        const metrics = await analyzeGestureFrames(frameBufferRef.current);
        console.log('Received gesture metrics:', metrics);
        onAnalysis(metrics);
        frameBufferRef.current = []; // Clear the buffer after analysis
      } catch (error) {
        console.error('Error analyzing frames:', error);
        onError('Failed to analyze gestures. Please try again.');
      }
    }
  };

  return null; // This is a logical component, no UI needed
};