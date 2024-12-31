import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateInterviewQuestions } from "@/utils/openai";

const Practice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [practiceType, setPracticeType] = useState<'presentation' | 'interview'>('presentation');
  const [file, setFile] = useState<File | null>(null);
  const [jobType, setJobType] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      let slideUrl = '';
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
          
        slideUrl = publicUrl;
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
          job_type: jobType,
          industry: industry,
          slide_url: slideUrl,
        });

      if (error) throw error;

      toast({
        title: "Session created",
        description: "Your practice session has been set up successfully",
      });

      // Here you would typically navigate to the actual practice session
      // For now, we'll just show a success message
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Practice Session</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Choose Practice Type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              defaultValue="presentation"
              onValueChange={(value) => setPracticeType(value as 'presentation' | 'interview')}
              className="flex flex-col space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="presentation" id="presentation" />
                <Label htmlFor="presentation">Presentation Practice</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="interview" id="interview" />
                <Label htmlFor="interview">Mock Interview</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {practiceType === 'presentation' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Presentation Slides</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                accept=".pdf,.pptx"
                onChange={handleFileUpload}
                className="mb-4"
              />
              {file && (
                <p className="text-sm text-gray-600">
                  Selected file: {file.name}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {practiceType === 'interview' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type</Label>
                <Input
                  id="jobType"
                  placeholder="e.g., Software Engineer"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleStartPractice}
          disabled={isLoading || (practiceType === 'presentation' && !file) || (practiceType === 'interview' && (!jobType || !industry))}
          className="w-full"
        >
          {isLoading ? "Setting up..." : "Start Practice"}
        </Button>
      </div>
    </div>
  );
};

export default Practice;