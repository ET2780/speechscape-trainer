import { Progress } from "@/components/ui/progress";
import { CombinedAnalysis } from "@/types/analysis";

interface OverallMetricsProps {
  speech: CombinedAnalysis['speech'];
}

export const OverallMetrics = ({ speech }: OverallMetricsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Overall Score</span>
          <span className="text-sm font-medium">{speech.overallScore}%</span>
        </div>
        <Progress value={speech.overallScore} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Words per Minute</p>
          <p className="text-2xl font-bold">{speech.wordsPerMinute}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Filler Words</p>
          <p className="text-2xl font-bold">{speech.fillerWordCount}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Confidence Score</p>
          <p className="text-2xl font-bold">{speech.toneConfidence}%</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Energy Level</p>
          <p className="text-2xl font-bold">{speech.toneEnergy}%</p>
        </div>
      </div>
    </div>
  );
};