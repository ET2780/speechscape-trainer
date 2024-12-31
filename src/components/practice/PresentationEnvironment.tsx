import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card } from "@/components/ui/card";

type PresentationEnvironmentProps = {
  slideUrl?: string | null;
};

export const PresentationEnvironment = ({ slideUrl }: PresentationEnvironmentProps) => {
  return (
    <div className="w-full h-full min-h-[600px] relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden animate-fade-in">
      {/* Virtual Stage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4/5 h-4/5 bg-white rounded-lg shadow-2xl overflow-hidden">
          {slideUrl ? (
            <iframe src={slideUrl} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              No slides uploaded
            </div>
          )}
        </div>
      </div>

      {/* Simulated Audience */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex justify-center gap-4 p-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-16 h-16 bg-gray-700 animate-pulse">
              <AspectRatio ratio={1}>
                <img
                  src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81"
                  alt={`Virtual audience member ${i}`}
                  className="object-cover rounded-lg opacity-50"
                />
              </AspectRatio>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};