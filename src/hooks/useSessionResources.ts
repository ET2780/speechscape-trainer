import { useState, useEffect } from 'react';
import { useCamera } from "@/hooks/useCamera";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useGesture } from "@/contexts/GestureContext";
import { toast } from "@/hooks/use-toast";

export const useSessionResources = (isSessionActive: boolean) => {
  const [resourcesInitialized, setResourcesInitialized] = useState(false);
  const { videoRef, error: cameraError, startCamera, stopCamera } = useCamera();
  const { isRecording, audioChunks, startRecording, stopRecording } = useAudioRecording();
  const { startTracking, stopTracking } = useGesture();

  useEffect(() => {
    if (!isSessionActive) return;

    const setupSession = async () => {
      console.log('Setting up practice session...');
      try {
        console.log('Starting camera...');
        await startCamera();
        
        console.log('Starting audio recording...');
        await startRecording();
        
        console.log('Starting gesture tracking...');
        startTracking();
        
        setResourcesInitialized(true);
        
        toast('Recording and analysis have begun');
      } catch (error) {
        console.error('Error setting up session:', error);
        setResourcesInitialized(false);
        toast('Setup Error', {
          description: "Failed to start recording session. Please check your camera and microphone permissions.",
        });
      }
    };

    setupSession();

    return () => {
      console.log('Cleaning up session...', { resourcesInitialized, isRecording });
      if (resourcesInitialized) {
        if (isRecording) {
          console.log('Stopping recording...');
          stopRecording();
        }
        if (videoRef.current) {
          console.log('Stopping camera...');
          stopCamera();
        }
        console.log('Stopping gesture tracking...');
        stopTracking();
      }
    };
  }, [isSessionActive]);

  return {
    resourcesInitialized,
    videoRef,
    cameraError,
    isRecording,
    audioChunks,
    stopRecording,
    stopCamera,
    stopTracking
  };
};
