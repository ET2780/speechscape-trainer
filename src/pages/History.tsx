import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();

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

        <h1 className="text-3xl font-bold mb-6">Session History</h1>

        <div className="space-y-4">
          <Card className="p-6">
            <p className="text-gray-600 text-center">
              Connect to Supabase to view your session history
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default History;