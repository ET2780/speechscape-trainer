import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto animate-fadeIn">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Master Your Presentations
          </h1>
          <p className="text-xl text-gray-600">
            Practice, analyze, and improve your speaking skills with AI-powered feedback
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Practice Session</h2>
            <p className="text-gray-600 mb-6">
              Start a new practice session and get instant feedback on your presentation
            </p>
            <Button
              className="w-full"
              onClick={() => navigate("/practice")}
            >
              Start Practice
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Session History</h2>
            <p className="text-gray-600 mb-6">
              Review your past sessions and track your improvement over time
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/history")}
            >
              View History
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;