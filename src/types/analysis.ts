export type GestureType = 'pointing' | 'waving' | 'openPalm' | 'other';

export type GestureMetrics = {
  gesturesPerMinute: number;
  gestureTypes: Record<GestureType, number>;
  smoothnessScore: number;
  gestureToSpeechRatio: number;
  aiFeedback: string | null;
};

export type SpeechAnalysis = {
  wordsPerMinute: number;
  fillerWordCount: number;
  toneConfidence: number;
  toneEnergy: number;
  overallScore: number;
  suggestions: string[];
};

export type CombinedAnalysis = {
  speech: SpeechAnalysis;
  gesture: GestureMetrics;
};