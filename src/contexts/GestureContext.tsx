import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type GestureMetrics = {
  gesturesPerMinute: number;
  gestureTypes: {
    pointing: number;
    waving: number;
    openPalm: number;
    other: number;
  };
  smoothnessScore: number;
  gestureToSpeechRatio: number;
  aiFeedback: string | null;
};

type GestureContextType = {
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  gestureMetrics: GestureMetrics;
  updateGestureData: (metrics: GestureMetrics) => void;
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
  const { toast } = useToast();

  const updateGestureData = useCallback((metrics: GestureMetrics) => {
    setGestureMetrics(metrics);
  }, []);

  const startTracking = useCallback(() => {
    setIsTracking(true);
    setGestureMetrics(defaultMetrics);
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