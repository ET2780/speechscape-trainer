import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { generateInterviewQuestions } from "@/utils/openai";
import { PracticeTypeSelector } from "@/components/practice/PracticeTypeSelector";
import { SlideUpload } from "@/components/practice/SlideUpload";
import { InterviewSetup } from "@/components/practice/InterviewSetup";
import { GestureProvider } from "@/contexts/GestureContext";
import { PracticeSession } from "@/components/practice/PracticeSession";

const Practice = () => {
  const navigate = useNavigate();
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
      toast("Please upload a PDF or PPTX file");
      return;
    }

    setFile(selectedFile);
  };

  const handleStartPractice = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("Auth check:", { user, userError });
      
      if (!user || userError) {
        console.error("Authentication error:", userError);
        toast('Authentication required', {
          description: "Please sign in to continue",
        });
        return;
      }

      let uploadedSlideUrl = '';
      if (practiceType === 'presentation' && file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        
        console.log("Attempting file upload:", { filePath, fileType: file.type });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('slides')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        console.log("Upload response:", { uploadData, uploadError });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "File upload failed",
            description: "Continuing without slides",
            variant: "default",
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('slides')
            .getPublicUrl(filePath);
            
          console.log("Generated public URL:", publicUrl);
          
          uploadedSlideUrl = publicUrl;
          setSlideUrl(uploadedSlideUrl);
        }
      }

      let questions = [];
      if (practiceType === 'interview') {
        questions = await generateInterviewQuestions(jobType, industry);
      }

      console.log("Creating practice session:", {
        userId: user.id,
        practiceType,
        jobType,
        industry,
        slideUrl: uploadedSlideUrl
      });

      const { error: sessionError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          practice_type: practiceType,
          job_type: jobType || null,
          industry: industry || null,
          slide_url: uploadedSlideUrl || null,
        });

      if (sessionError) {
        console.error("Session creation error:", sessionError);
        throw sessionError;
      }

      toast('Session started', {
        description: "Your practice environment is ready",
      });

      setSessionStarted(true);
    } catch (error) {
      console.error('Error setting up practice:', error);
      toast('Error', {
        description: error.message || "Failed to set up practice session",
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
                disabled={isLoading || (practiceType === 'interview' && (!jobType || !industry))}
                className="w-full mt-6"
              >
                {isLoading ? "Setting up..." : "Start Practice"}
              </Button>
            </div>
          ) : (
            <PracticeSession 
              practiceType={practiceType} 
              slideUrl={slideUrl}
              jobType={jobType}
              industry={industry}
            />
          )}
        </div>
      </div>
    </GestureProvider>
  );
};

export default Practice;
