
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Layers, InfoIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface HeatmapArea {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number; // 0-1 where 1 is high (red), 0.5 is medium (yellow), 0 is low (blue)
}

interface ScreenshotPanelProps {
  screenshot: string | null;
  heatmapData: HeatmapArea[];
  showHeatmap: boolean;
  setShowHeatmap: (value: boolean) => void;
}

const ScreenshotPanel = ({ 
  screenshot, 
  heatmapData, 
  showHeatmap, 
  setShowHeatmap 
}: ScreenshotPanelProps) => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'screenshot' | 'heatmap' | 'overlay'>('screenshot');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Set view mode based on showHeatmap prop (for backward compatibility)
    if (showHeatmap) {
      setViewMode('heatmap');
    } else {
      setViewMode('screenshot');
    }
  }, [showHeatmap]);

  const handleViewModeChange = (mode: 'screenshot' | 'heatmap' | 'overlay') => {
    setViewMode(mode);
    setShowHeatmap(mode !== 'screenshot');
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Landing Page Analysis</CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md flex items-center gap-1 cursor-not-allowed opacity-80"
                  >
                    <Layers size={14} />
                    AI Heatmap
                    <Badge variant="outline" className="text-[10px] ml-1 bg-brand-green bg-opacity-10 text-brand-green border-none">Coming Soon</Badge>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">AI attention heatmap analysis will be available soon!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0 p-0 relative">
        <div className="rounded-md overflow-hidden bg-gray-50 w-full h-full min-h-[400px] relative">
          {/* Original Screenshot */}
          {screenshot ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto">
              <img 
                src={screenshot} 
                alt="Landing page screenshot" 
                className="w-full h-auto object-contain"
                onError={(e) => {
                  console.error("Image failed to load:", screenshot);
                  e.currentTarget.src = "/placeholder.svg";
                  toast({
                    title: "Image failed to load",
                    description: "The screenshot could not be loaded. Using placeholder instead.",
                    variant: "destructive",
                  });
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Eye size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Screenshot not available</p>
              </div>
            </div>
          )}
          
          {/* Fallback Legacy Heatmap */}
          {showHeatmap && heatmapData && heatmapData.length > 0 && (
            <div className="absolute top-0 left-0 w-full h-full">
              <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
                {heatmapData.map((area, i) => {
                  // Convert intensity to color
                  let fill;
                  if (area.intensity > 0.7) {
                    fill = "#DC2626"; // Red - high intensity
                  } else if (area.intensity > 0.3) {
                    fill = "#FACC15"; // Yellow - medium intensity
                  } else {
                    fill = "#3B82F6"; // Blue - low intensity
                  }
                  
                  return (
                    <rect
                      key={i}
                      x={area.x}
                      y={area.y}
                      width={area.width}
                      height={area.height}
                      fill={fill}
                      opacity={0.5}
                      rx={4}
                    />
                  );
                })}
              </svg>
            </div>
          )}
        </div>
        
        {/* Heatmap Legend */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <InfoIcon size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500">
                AI analysis of your landing page
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScreenshotPanel;
