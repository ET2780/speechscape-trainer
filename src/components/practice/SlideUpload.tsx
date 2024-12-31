import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SlideUploadProps = {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
};

export const SlideUpload = ({ onFileChange, file }: SlideUploadProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Upload Presentation Slides</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          type="file"
          accept=".pdf,.pptx"
          onChange={onFileChange}
          className="mb-4"
        />
        {file && (
          <p className="text-sm text-gray-600">
            Selected file: {file.name}
          </p>
        )}
      </CardContent>
    </Card>
  );
};