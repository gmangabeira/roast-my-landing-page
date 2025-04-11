
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

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
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Landing Page Analysis</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {showHeatmap ? "Heatmap" : "Screenshot"}
            </span>
            <Switch 
              checked={showHeatmap} 
              onCheckedChange={setShowHeatmap} 
              className="data-[state=checked]:bg-brand-green"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0 p-0 relative">
        <div className="rounded-md overflow-hidden bg-gray-50 w-full h-full min-h-[400px] relative">
          {screenshot ? (
            <img 
              src={screenshot} 
              alt="Landing page screenshot" 
              className="w-full h-auto object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Eye size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Screenshot not available</p>
              </div>
            </div>
          )}
          
          {showHeatmap && heatmapData && (
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
          <div className="mt-4 bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium mb-2">Attention Heatmap</h4>
            <div className="flex items-center">
              <div className="h-2 flex-1 bg-gradient-to-r from-[#DC2626] via-[#FACC15] to-[#3B82F6] rounded"></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>High Attention</span>
              <span>Medium</span>
              <span>Low Attention</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScreenshotPanel;
