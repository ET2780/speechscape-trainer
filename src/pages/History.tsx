import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { usePerformanceHistory } from "@/hooks/use-performance-history";
import { format } from "date-fns";
import { PerformanceReport } from "@/components/practice/PerformanceReport";
import { CombinedAnalysis } from "@/types/analysis";

const History = () => {
  const navigate = useNavigate();
  const { data: reports, isLoading, error } = usePerformanceHistory();

  const createCombinedAnalysis = (report: any): CombinedAnalysis => ({
    speech: {
      wordsPerMinute: report.words_per_minute || 0,
      fillerWordCount: report.filler_word_count || 0,
      toneConfidence: report.tone_confidence || 0,
      toneEnergy: report.tone_energy || 0,
      overallScore: report.overall_score || 0,
      suggestions: report.suggestions || [],
    },
    gesture: {
      gesturesPerMinute: 0,
      gestureTypes: {
        pointing: 0,
        waving: 0,
        openPalm: 0,
        other: 0
      },
      smoothnessScore: 0,
      gestureToSpeechRatio: 0,
      aiFeedback: null
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Performance History</CardTitle>
            <CardDescription>
              View your past practice session reports and track your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4">Loading your performance history...</p>
            ) : error ? (
              <p className="text-center text-red-500 py-4">
                Error loading performance history. Please try again later.
              </p>
            ) : reports?.length === 0 ? (
              <p className="text-center py-4">
                No performance reports yet. Complete a practice session to see your results here.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Practice Type</TableHead>
                    <TableHead>Overall Score</TableHead>
                    <TableHead>Words per Minute</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {format(new Date(report.created_at), "PPP")}
                      </TableCell>
                      <TableCell className="capitalize">
                        {report.practice_sessions.practice_type}
                      </TableCell>
                      <TableCell>{report.overall_score}%</TableCell>
                      <TableCell>{report.words_per_minute}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Performance Report</DialogTitle>
                            </DialogHeader>
                            <PerformanceReport
                              analysis={createCombinedAnalysis(report)}
                            />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default History;