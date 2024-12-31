export type GestureType = 'pointing' | 'waving' | 'openPalm' | 'other';

export type GestureAnalysis = {
  timestamp: string;
  description: string;
  confidence: number;
  impact: 'positive' | 'negative' | 'neutral';
  suggestions: string[];
};

export type GestureMetrics = {
  gesturesPerMinute: number;
  gestureTypes: Record<GestureType, number>;
  smoothnessScore: number;
  gestureToSpeechRatio: number;
  aiFeedback: string | null;
  screenshots?: string[];
  analysis?: Record<number, GestureAnalysis>;
};

export type SpeechAnalysis = {
  wordsPerMinute: number;
  fillerWordCount: number;
  toneConfidence: number;
  toneEnergy: number;
  overallScore: number;
  suggestions: string[];
  expressionQuotes?: string[];
  rephrasingSuggestions?: Record<string, string>;
};

export type CombinedAnalysis = {
  speech: SpeechAnalysis;
  gesture: GestureMetrics;
};