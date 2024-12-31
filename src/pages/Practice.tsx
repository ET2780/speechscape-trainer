import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Practice = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // We'll implement actual recording functionality after Supabase integration
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </Button>

        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">Practice Session</h1>
          
          <div className="text-center py-12">
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="px-8"
              onClick={toggleRecording}
            >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            
            {isRecording && (
              <p className="mt-4 text-red-500 animate-pulse">
                Recording in progress...
              </p>
            )}
          </div>

          <div className="mt-6 text-gray-600">
            <h2 className="font-semibold mb-2">Tips:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Find a quiet space with good lighting</li>
              <li>Speak clearly and at a moderate pace</li>
              <li>Practice your presentation multiple times</li>
              <li>Review your recordings to identify areas for improvement</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Practice;