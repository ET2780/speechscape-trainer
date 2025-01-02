import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GestureMetrics } from '@/types/analysis';

type GestureContextType = {
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  gestureMetrics: GestureMetrics;
  updateGestureData: (metrics: GestureMetrics) => void;
  aiFeedback: string | null;
  generateFeedback: () => Promise<void>;
};

const defaultMetrics: GestureMetrics = {
  gesturesPerMinute: 0,
  gestureTypes: {
    pointing: 0,
    waving: 0,
    openPalm: 0,
    other: 0
  },
  smoothnessScore: 0,
  gestureToSpeechRatio: 0,
  aiFeedback: null
};

const GestureContext = createContext<GestureContextType | undefined>(undefined);

export const GestureProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [gestureMetrics, setGestureMetrics] = useState<GestureMetrics>(defaultMetrics);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const { toast } = useToast();

  const updateGestureData = useCallback((metrics: GestureMetrics) => {
    console.log('Updating gesture metrics:', metrics);
    setGestureMetrics(metrics);
    if (metrics.aiFeedback) {
      setAiFeedback(metrics.aiFeedback);
    }
  }, []);

  const generateFeedback = async () => {
    try {
      console.log('Generating feedback for metrics:', gestureMetrics);
      const { data, error } = await supabase.functions.invoke('generate-gesture-feedback', {
        body: { metrics: gestureMetrics }
      });

      if (error) throw error;
      if (data?.feedback) {
        setAiFeedback(data.feedback);
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI feedback",
        variant: "destructive",
      });
    }
  };

  const startTracking = useCallback(() => {
    setIsTracking(true);
    setGestureMetrics(defaultMetrics);
    setAiFeedback(null);
    console.log('Starting gesture tracking');
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    console.log('Stopping gesture tracking');
  }, []);

  return (
    <GestureContext.Provider
      value={{
        isTracking,
        startTracking,
        stopTracking,
        gestureMetrics,
        updateGestureData,
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