import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PracticeTypeSelector } from "@/components/practice/PracticeTypeSelector";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { SlideUpload } from "@/components/practice/SlideUpload";
import { toast } from "sonner";

const Practice = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [practiceType, setPracticeType] = useState<'presentation' | 'interview'>('presentation');
  const [jobType, setJobType] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [slideUrl, setSlideUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session || error) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        console.error("Authentication error:", userError);
        toast("Please sign in to continue");
        return;
      }

      let uploadedSlideUrl = null;
      if (slideFile) {
        const fileExt = slideFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('slides')
          .upload(fileName, slideFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast("File upload failed. Continuing without slides");
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('slides')
            .getPublicUrl(fileName);
          uploadedSlideUrl = publicUrl;
          setSlideUrl(uploadedSlideUrl);
        }
      }

      const { error: sessionError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          practice_type: practiceType,
          job_type: jobType,
          industry: industry,
          slide_url: uploadedSlideUrl,
        });

      if (sessionError) {
        console.error("Session creation error:", sessionError);
        throw sessionError;
      }

      toast("Your practice environment is ready");
      setSessionStarted(true);
    } catch (error) {
      console.error('Error setting up practice:', error);
      toast(error.message || "Failed to set up practice session");
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionStarted) {
    return (
      <PracticeSession
        practiceType={practiceType}
        slideUrl={slideUrl}
        jobType={jobType}
        industry={industry}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Practice Session Setup</h1>
          <p className="text-gray-600">
            Configure your practice environment to get started
          </p>
        </div>

        <PracticeTypeSelector
          value={practiceType}
          onChange={setPracticeType}
        />

        {practiceType === "presentation" && (
          <SlideUpload
            onFileChange={(e) => setSlideFile(e.target.files?.[0] || null)}
            file={slideFile}
          />
        )}

        <div className="flex justify-center">
          <button
            onClick={handleStartSession}
            disabled={!practiceType || isLoading}
            className={`px-6 py-3 rounded-lg text-white font-semibold ${
              !practiceType || isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Setting up..." : "Start Practice Session"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Practice;