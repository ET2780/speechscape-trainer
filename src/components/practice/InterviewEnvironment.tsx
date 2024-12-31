import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card } from "@/components/ui/card";

export const InterviewEnvironment = () => {
  return (
    <div className="w-full h-full min-h-[600px] relative bg-gradient-to-b from-gray-100 to-white rounded-lg overflow-hidden animate-fade-in">
      {/* Virtual Desk */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-gray-200 to-transparent" />
      
      {/* Interview Panel */}
      <div className="absolute top-8 left-0 right-0 flex justify-center gap-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="w-32 h-32 overflow-hidden">
            <AspectRatio ratio={1}>
              <img
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
                alt={`Interviewer ${i}`}
                className="object-cover"
              />
            </AspectRatio>
          </Card>
        ))}
      </div>

      {/* Desk Surface */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-300 to-gray-200" />
    </div>
  );
};