import { ScrollArea } from "@/components/ui/scroll-area";
import { Quote } from "lucide-react";
import { CombinedAnalysis } from "@/types/analysis";

interface SpeechAnalysisProps {
  speech: CombinedAnalysis['speech'];
}

export const SpeechAnalysis = ({ speech }: SpeechAnalysisProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Speech Analysis</h3>
      
      {speech.expressionQuotes && speech.expressionQuotes.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Notable Expressions</h4>
          <ScrollArea className="h-48 rounded-md border p-4">
            {speech.expressionQuotes.map((quote, index) => (
              <div key={index} className="flex gap-2 mb-4">
                <Quote className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{quote}</p>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      {speech.rephrasingSuggestions && Object.keys(speech.rephrasingSuggestions).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Rephrasing Suggestions</h4>
          <ScrollArea className="h-48 rounded-md border p-4">
            {Object.entries(speech.rephrasingSuggestions).map(([original, suggestion], index) => (
              <div key={index} className="mb-4 p-2 bg-muted rounded-lg">
                <p className="text-sm font-medium">Original:</p>
                <p className="text-sm text-muted-foreground mb-2">{original}</p>
                <p className="text-sm font-medium">Suggested:</p>
                <p className="text-sm text-primary">{suggestion}</p>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Speech Suggestions</h4>
        <ul className="list-disc pl-5 space-y-1">
          {speech.suggestions.map((suggestion, index) => (
            <li key={index} className="text-sm text-muted-foreground">
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};