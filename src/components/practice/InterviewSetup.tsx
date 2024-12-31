import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type InterviewSetupProps = {
  jobType: string;
  industry: string;
  onJobTypeChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
};

export const InterviewSetup = ({
  jobType,
  industry,
  onJobTypeChange,
  onIndustryChange,
}: InterviewSetupProps) => {
  return (
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
            onChange={(e) => onJobTypeChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select value={industry} onValueChange={onIndustryChange}>
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
  );
};