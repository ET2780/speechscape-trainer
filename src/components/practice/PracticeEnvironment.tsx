import { PresentationEnvironment } from "./PresentationEnvironment";
import { InterviewEnvironment } from "./InterviewEnvironment";

interface PracticeEnvironmentProps {
  practiceType: 'presentation' | 'interview';
  slideUrl?: string | null;
  jobType?: string;
  industry?: string;
}

export const PracticeEnvironment = ({
  practiceType,
  slideUrl,
  jobType,
  industry
}: PracticeEnvironmentProps) => {
  return (
    <div className="w-full aspect-video bg-gray-50 rounded-lg shadow-lg overflow-hidden">
      {practiceType === 'presentation' ? (
        <PresentationEnvironment slideUrl={slideUrl} />
      ) : (
        <InterviewEnvironment jobType={jobType} industry={industry} />
      )}
    </div>
  );
};