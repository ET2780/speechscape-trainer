import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Hands } from '@mediapipe/hands';
import { RawGestureData, ProcessedGestureMetrics, processGestureData } from '@/utils/gestureProcessing';

type GestureContextType = {
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  gestureMetrics: ProcessedGestureMetrics;
  rawGestureData: RawGestureData[];
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
  const rawDataRef = useRef<RawGestureData[]>([]);
  const startTimeRef = useRef<number>(0);

  const processCurrentData = useCallback(() => {
    const currentTime = Date.now();
    const duration = currentTime - startTimeRef.current;
    
    const metrics = processGestureData(rawDataRef.current, duration);
    setGestureMetrics(metrics);
  }, []);

  const startTracking = useCallback(() => {
    setIsTracking(true);
    startTimeRef.current = Date.now();
    rawDataRef.current = [];
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