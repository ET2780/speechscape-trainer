import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PracticeTypeSelectorProps = {
  value: 'presentation' | 'interview';
  onChange: (value: 'presentation' | 'interview') => void;
};

export const PracticeTypeSelector = ({ value, onChange }: PracticeTypeSelectorProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Choose Practice Type</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={value}
          onValueChange={(value) => onChange(value as 'presentation' | 'interview')}
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
  );
};