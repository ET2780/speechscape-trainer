import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Hands } from '@mediapipe/hands';
import { RawGestureData, ProcessedGestureMetrics, processGestureData } from '@/utils/gestureProcessing';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type GestureContextType = {
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  gestureMetrics: ProcessedGestureMetrics;
  rawGestureData: RawGestureData[];
  aiFeedback: string | null;
  generateFeedback: () => Promise<void>;
};

const defaultMetrics: ProcessedGestureMetrics = {
  gesturesPerMinute: 0,
  gestureTypes: {
    pointing: 0,
    waving: 0,
    openPalm: 0,
    other: 0
  },
  smoothnessScore: 0,
  gestureToSpeechRatio: 0
};

const GestureContext = createContext<GestureContextType | undefined>(undefined);

export const GestureProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [gestureMetrics, setGestureMetrics] = useState<ProcessedGestureMetrics>(defaultMetrics);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const rawDataRef = useRef<RawGestureData[]>([]);
  const startTimeRef = useRef<number>(0);
  const { toast } = useToast();

  const processCurrentData = useCallback(() => {
    const currentTime = Date.now();
    const duration = currentTime - startTimeRef.current;
    
    const metrics = processGestureData(rawDataRef.current, duration);
    setGestureMetrics(metrics);
  }, []);

  const generateFeedback = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-gesture-feedback', {
        body: { metrics: gestureMetrics },
      });

      if (error) throw error;

      setAiFeedback(data.feedback);
      toast({
        title: "Feedback Generated",
        description: "AI analysis of your gestures is ready",
      });
    } catch (error) {
      console.error('Error generating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to generate gesture feedback",
        variant: "destructive",
      });
    }
  };

  const startTracking = useCallback(() => {
    setIsTracking(true);
    startTimeRef.current = Date.now();
    rawDataRef.current = [];
    setAiFeedback(null);
    console.log('Starting gesture tracking');
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    processCurrentData();
    console.log('Stopping gesture tracking');
  }, [processCurrentData]);

  return (
    <GestureContext.Provider
      value={{
        isTracking,
        startTracking,
        stopTracking,
        gestureMetrics,
        rawGestureData: rawDataRef.current,
        aiFeedback,
        generateFeedback,
      }}
    >
      {children}
    </GestureContext.Provider>
  );
};

export const useGesture = () => {
  const context = useContext(GestureContext);
  if (context === undefined) {
    throw new Error('useGesture must be used within a GestureProvider');
  }
  return context;
};