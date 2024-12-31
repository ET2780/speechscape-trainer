import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateInterviewQuestions } from "@/utils/openai";
import { PracticeTypeSelector } from "@/components/practice/PracticeTypeSelector";
import { SlideUpload } from "@/components/practice/SlideUpload";
import { InterviewSetup } from "@/components/practice/InterviewSetup";
import { PresentationEnvironment } from "@/components/practice/PresentationEnvironment";
import { InterviewEnvironment } from "@/components/practice/InterviewEnvironment";
import { GestureProvider } from "@/contexts/GestureContext";
import { GestureTracker } from "@/components/practice/GestureTracker";
import { GestureMetrics } from "@/components/practice/GestureMetrics";

const Practice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [practiceType, setPracticeType] = useState<'presentation' | 'interview'>('presentation');
  const [file, setFile] = useState<File | null>(null);
  const [jobType, setJobType] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slideUrl, setSlideUrl] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.includes('pdf') && !selectedFile.type.includes('powerpoint')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or PPTX file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleStartPractice = async () => {
    try {
      setIsLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to continue",
          variant: "destructive",
        });
        return;
      }

      let uploadedSlideUrl = '';
      if (practiceType === 'presentation' && file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('slides')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('slides')
          .getPublicUrl(filePath);
          
        uploadedSlideUrl = publicUrl;
        setSlideUrl(uploadedSlideUrl);
      }

      let questions = [];
      if (practiceType === 'interview') {
        questions = await generateInterviewQuestions(jobType, industry);
      }

      const { error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          practice_type: practiceType,
          job_type: jobType || null,
          industry: industry || null,
          slide_url: uploadedSlideUrl || null,
        });

      if (error) throw error;

      toast({
        title: "Session started",
        description: "Your practice environment is ready",
      });

      setSessionStarted(true);
    } catch (error) {
      console.error('Error setting up practice:', error);
      toast({
        title: "Error",
        description: "Failed to set up practice session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GestureProvider>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Practice Session</h1>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>

          {!sessionStarted ? (
            <div className="max-w-4xl mx-auto">
              <PracticeTypeSelector value={practiceType} onChange={setPracticeType} />

              {practiceType === 'presentation' && (
                <SlideUpload onFileChange={handleFileUpload} file={file} />
              )}

              {practiceType === 'interview' && (
                <InterviewSetup
                  jobType={jobType}
                  industry={industry}
                  onJobTypeChange={setJobType}
                  onIndustryChange={setIndustry}
                />
              )}

              <Button
                onClick={handleStartPractice}
                disabled={isLoading || (practiceType === 'presentation' && !file) || (practiceType === 'interview' && (!jobType || !industry))}
                className="w-full mt-6"
              >
                {isLoading ? "Setting up..." : "Start Practice"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-full aspect-video bg-gray-50 rounded-lg shadow-lg overflow-hidden">
                {practiceType === 'presentation' ? (
                  <PresentationEnvironment slideUrl={slideUrl} />
                ) : (
                  <InterviewEnvironment />
                )}
              </div>
              <GestureTracker />
              <GestureMetrics />
            </div>
          )}
        </div>
      </div>
    </GestureProvider>
  );
};

export default Practice;