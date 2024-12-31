import React, { createContext, useContext, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';

type GestureContextType = {
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  gestureMetrics: {
    handPresence: number;
    movementSpeed: number;
    gestureVariety: number;
  };
};

const GestureContext = createContext<GestureContextType | undefined>(undefined);

export const GestureProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [gestureMetrics, setGestureMetrics] = useState({
    handPresence: 0,
    movementSpeed: 0,
    gestureVariety: 0,
  });

  const startTracking = useCallback(() => {
    setIsTracking(true);
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