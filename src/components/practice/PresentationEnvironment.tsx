import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

type PresentationEnvironmentProps = {
  slideUrl?: string | null;
};

export const PresentationEnvironment = ({ slideUrl }: PresentationEnvironmentProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full min-h-[600px] relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden">
      {/* Stage lighting effect */}
      <div className="absolute inset-0 bg-gradient-radial from-yellow-500/20 via-transparent to-transparent"></div>
      
      {/* TED-style logo and timer */}
      <div className="absolute top-4 left-4 flex items-center space-x-4">
        <div className="text-red-600 font-bold text-2xl">TED</div>
        <div className="text-white font-mono">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Main presentation area */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="w-4/5 h-4/5 bg-white rounded-lg shadow-2xl overflow-hidden">
          {slideUrl ? (
            <iframe 
              src={slideUrl} 
              className="w-full h-full" 
              title="Presentation slides"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              No slides uploaded - Practice your presentation anyway!
            </div>
          )}
        </div>
      </div>

      {/* Virtual audience */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex justify-center gap-4 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="w-16 h-16 bg-gray-700 animate-pulse">
              <AspectRatio ratio={1}>
                <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-gray-600"></div>
                  </div>
                </div>
              </AspectRatio>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};