import { useState, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000 // Optimize for speech
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log(`Recorded chunk: ${e.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, processing chunks...');
        setAudioChunks(chunks);
      };

      // Request data every 5 seconds to handle longer recordings
      mediaRecorder.start(5000);
      setIsRecording(true);
      console.log('Recording started with optimized settings');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Recording Error",
        description: "Please allow microphone access to use this feature",
        variant: "destructive",
      });
      throw new Error('Please allow microphone access to use this feature');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    isRecording,
    audioChunks,
    startRecording,
    stopRecording
  };
};