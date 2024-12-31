// Types for gesture data
export type RawGestureData = {
  timestamp: number;
  landmarks: Array<{ x: number; y: number; z: number }>;
  handedness: 'Left' | 'Right';
};

export type ProcessedGestureMetrics = {
  gesturesPerMinute: number;
  gestureTypes: {
    pointing: number;
    waving: number;
    openPalm: number;
    other: number;
  };
  smoothnessScore: number;
  gestureToSpeechRatio: number;
};

// Helper functions for gesture processing
const calculateVelocity = (current: RawGestureData, previous: RawGestureData): number => {
  if (!previous) return 0;
  
  const timeDiff = current.timestamp - previous.timestamp;
  if (timeDiff === 0) return 0;

  // Calculate average movement of landmarks
  let totalDistance = 0;
  current.landmarks.forEach((currentLandmark, index) => {
    const prevLandmark = previous.landmarks[index];
    const distance = Math.sqrt(
      Math.pow(currentLandmark.x - prevLandmark.x, 2) +
      Math.pow(currentLandmark.y - prevLandmark.y, 2) +
      Math.pow(currentLandmark.z - prevLandmark.z, 2)
    );
    totalDistance += distance;
  });

  return totalDistance / timeDiff;
};

const identifyGestureType = (landmarks: Array<{ x: number; y: number; z: number }>): keyof ProcessedGestureMetrics['gestureTypes'] => {
  // Simplified gesture recognition logic
  // This can be expanded with more sophisticated recognition algorithms
  const palmCenter = landmarks[0];
  const fingerTips = landmarks.slice(4, 9);
  
  // Check for pointing gesture
  const extendedFingers = fingerTips.filter(tip => tip.y < palmCenter.y);
  if (extendedFingers.length === 1) return 'pointing';
  
  // Check for waving gesture
  const horizontalMovement = Math.abs(fingerTips[0].x - fingerTips[4].x);
  if (horizontalMovement > 0.3) return 'waving';
  
  // Check for open palm
  if (extendedFingers.length >= 4) return 'openPalm';
  
  return 'other';
};

export const processGestureData = (
  rawData: RawGestureData[],
  durationMs: number,
  speechEvents: Array<{ timestamp: number; isSpeaking: boolean }> = []
): ProcessedGestureMetrics => {
  console.log('Processing gesture data:', { dataPoints: rawData.length, durationMs });
  
  // Initialize metrics
  const gestureTypes = {
    pointing: 0,
    waving: 0,
    openPalm: 0,
    other: 0
  };
  
  let totalVelocity = 0;
  let velocityReadings = 0;
  let gesturesAlignedWithSpeech = 0;
  let totalGestures = 0;

  // Process each gesture data point
  rawData.forEach((data, index) => {
    // Calculate velocity
    if (index > 0) {
      const velocity = calculateVelocity(data, rawData[index - 1]);
      totalVelocity += velocity;
      velocityReadings++;
    }

    // Identify and count gesture types
    const gestureType = identifyGestureType(data.landmarks);
    gestureTypes[gestureType]++;
    totalGestures++;

    // Check if gesture aligns with speech
    const nearestSpeechEvent = speechEvents.find(event => 
      Math.abs(event.timestamp - data.timestamp) < 500 && event.isSpeaking
    );
    if (nearestSpeechEvent) {
      gesturesAlignedWithSpeech++;
    }
  });

  // Calculate final metrics
  const durationMinutes = durationMs / (1000 * 60);
  const gesturesPerMinute = totalGestures / durationMinutes;
  
  const averageVelocity = velocityReadings > 0 ? totalVelocity / velocityReadings : 0;
  const smoothnessScore = Math.min(10, Math.max(1, 10 * (1 - (averageVelocity / 100))));
  
  const gestureToSpeechRatio = speechEvents.length > 0
    ? (gesturesAlignedWithSpeech / totalGestures) * 100
    : 0;

  console.log('Processed metrics:', {
    gesturesPerMinute,
    gestureTypes,
    smoothnessScore,
    gestureToSpeechRatio
  });

  return {
    gesturesPerMinute,
    gestureTypes,
    smoothnessScore,
    gestureToSpeechRatio
  };
};