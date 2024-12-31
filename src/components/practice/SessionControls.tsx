import { Button } from "@/components/ui/button";

interface SessionControlsProps {
  isSessionActive: boolean;
  isAnalyzing: boolean;
  onEndSession: () => void;
}

export const SessionControls = ({ 
  isSessionActive, 
  isAnalyzing, 
  onEndSession 
}: SessionControlsProps) => {
  if (!isSessionActive) return null;

  return (
    <div className="flex justify-center mt-4">
      <Button 
        variant="destructive" 
        onClick={onEndSession}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? "Analyzing..." : "End Practice Session"}
      </Button>
    </div>
  );
};