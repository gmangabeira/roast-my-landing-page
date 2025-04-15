
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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
  const [isGeneratingHeatmap, setIsGeneratingHeatmap] = useState(false);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'screenshot' | 'heatmap' | 'overlay'>('screenshot');

  useEffect(() => {
    // Set view mode based on showHeatmap prop (for backward compatibility)
    if (showHeatmap) {
      setViewMode(heatmapUrl ? 'overlay' : 'heatmap');
    } else {
      setViewMode('screenshot');
    }
  }, [showHeatmap, heatmapUrl]);

  const generateHeatmap = async () => {
    if (!screenshot || isGeneratingHeatmap) return;
    
    setIsGeneratingHeatmap(true);
    setHeatmapError(null);
    
    try {
      const response = await fetch('https://wtrnzafcmmwxizdkfkdu.supabase.co/functions/v1/generate-heatmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: screenshot
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate heatmap');
      }
      
      const result = await response.json();
      setHeatmapUrl(result.heatmap_url);
      
      // Auto-switch to overlay view when heatmap is ready
      setViewMode('overlay');
      setShowHeatmap(true);
    } catch (error) {
      console.error('Error generating heatmap:', error);
      setHeatmapError(error.message || 'Failed to generate heatmap');
    } finally {
      setIsGeneratingHeatmap(false);
    }
  };

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
            {!heatmapUrl && !isGeneratingHeatmap && screenshot && (
              <button 
                onClick={generateHeatmap}
                className="text-xs bg-brand-green/10 text-brand-green px-2 py-1 rounded-md hover:bg-brand-green/20 transition-colors flex items-center gap-1"
              >
                <Layers size={14} />
                Generate AI Heatmap
              </button>
            )}
            {isGeneratingHeatmap && (
              <Badge variant="outline" className="animate-pulse">
                Generating heatmap...
              </Badge>
            )}
            {heatmapUrl && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleViewModeChange('screenshot')}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${viewMode === 'screenshot' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                >
                  Original
                </button>
                <button 
                  onClick={() => handleViewModeChange('overlay')}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${viewMode === 'overlay' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                >
                  Overlay
                </button>
                <button 
                  onClick={() => handleViewModeChange('heatmap')}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${viewMode === 'heatmap' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                >
                  Heatmap Only
                </button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0 p-0 relative">
        <div className="rounded-md overflow-hidden bg-gray-50 w-full h-full min-h-[400px] relative">
          {/* Original Screenshot */}
          {screenshot && (viewMode === 'screenshot' || viewMode === 'overlay') && (
            <img 
              src={screenshot} 
              alt="Landing page screenshot" 
              className="w-full h-auto object-contain"
              style={{ 
                opacity: viewMode === 'overlay' ? 1 : 1
              }}
            />
          )}
          
          {/* Heatmap Overlay */}
          {heatmapUrl && (viewMode === 'heatmap' || viewMode === 'overlay') && (
            <div className="absolute top-0 left-0 w-full h-full">
              <img 
                src={heatmapUrl} 
                alt="AI-generated heatmap"
                className="w-full h-auto object-contain"
                style={{ 
                  opacity: viewMode === 'overlay' ? 0.6 : 1,
                  mixBlendMode: viewMode === 'overlay' ? 'multiply' : 'normal'
                }}
              />
            </div>
          )}
          
          {/* Fallback Legacy Heatmap */}
          {showHeatmap && !heatmapUrl && viewMode !== 'screenshot' && heatmapData && (
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
          
          {/* Loading State */}
          {isGeneratingHeatmap && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <div className="bg-white p-4 rounded-md shadow-lg text-center">
                <div className="animate-spin mb-2 mx-auto w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full"></div>
                <p className="text-sm">Generating AI heatmap analysis...</p>
                <p className="text-xs text-gray-500 mt-1">This may take up to 30 seconds</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {heatmapError && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-200 p-2 rounded text-xs text-red-600">
              Error: {heatmapError}
            </div>
          )}
          
          {/* No Screenshot State */}
          {!screenshot && (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Eye size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Screenshot not available</p>
              </div>
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
