
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, EyeOff, Eye, MessageSquare, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from '@/components/Header';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ScreenshotPanel from '@/components/roast/ScreenshotPanel';
import ScorePanel from '@/components/roast/ScorePanel';
import CommentsPanel from '@/components/roast/CommentsPanel';

// Mock data for heatmap areas
const mockHeatmapData = [
  { x: 10, y: 10, width: 200, height: 100, intensity: 0.9 }, // Header - Red (high intensity)
  { x: 50, y: 120, width: 300, height: 200, intensity: 0.5 }, // Hero - Yellow (medium intensity)
  { x: 100, y: 350, width: 250, height: 150, intensity: 0.2 }, // Benefits - Blue (low intensity)
];

// Mock data for CRO scores
const mockScores = {
  overall: 68,
  visualHierarchy: 75,
  valueProposition: 60,
  ctaStrength: 85,
  copyResonance: 55,
  trustCredibility: 70
};

// Mock data for expert comments
const mockComments = [
  {
    id: 1,
    category: 'Clarity',
    highlightArea: { x: 50, y: 120, width: 300, height: 80 },
    issue: 'Headline is not immediately clear about the value proposition.',
    solution: 'Rewrite headline to clearly state the primary benefit in 8 words or less.'
  },
  {
    id: 2,
    category: 'CTAs',
    highlightArea: { x: 150, y: 320, width: 120, height: 40 },
    issue: 'CTA button blends in with surrounding elements and lacks urgency.',
    solution: 'Use contrasting color for CTA and add action-oriented text like "Start Free Trial Now".'
  },
  {
    id: 3,
    category: 'Design',
    highlightArea: { x: 10, y: 200, width: 450, height: 100 },
    issue: 'Too many visual elements competing for attention in this section.',
    solution: 'Simplify to 3 key points with icons and remove the decorative elements.'
  },
  {
    id: 4,
    category: 'Trust',
    highlightArea: { x: 100, y: 450, width: 250, height: 100 },
    issue: 'Social proof is placed too far down the page to impact initial impressions.',
    solution: 'Move testimonials or client logos higher, just below the main value proposition.'
  },
  {
    id: 5,
    category: 'Copy',
    highlightArea: { x: 50, y: 250, width: 350, height: 60 },
    issue: 'Feature description uses technical jargon that may confuse your audience.',
    solution: 'Simplify language and focus on benefits rather than features.'
  }
];

const RoastResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roastData, setRoastData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    const fetchRoastData = async () => {
      try {
        if (!location.state?.roastId) {
          toast({
            title: "Error",
            description: "No roast ID provided. Please try again.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        const { data, error } = await supabase
          .from('roasts')
          .select('*')
          .eq('id', location.state.roastId)
          .single();

        if (error) throw error;

        // Enhance the data with our mock analysis data
        setRoastData({
          ...data,
          heatmapData: mockHeatmapData,
          scores: mockScores,
          comments: mockComments
        });
      } catch (error: any) {
        toast({
          title: "Error loading roast",
          description: error.message || "Could not load roast data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoastData();
  }, [location.state, navigate, toast]);

  const goBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <Zap size={32} className="text-brand-green" />
            </div>
            <h2 className="text-xl font-semibold">Analyzing your landing page...</h2>
            <p className="text-gray-500 mt-2">This may take a moment</p>
          </div>
        </main>
      </div>
    );
  }

  if (!roastData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Roast not found</h2>
            <p className="text-gray-500 mt-2">We couldn't find the requested roast analysis</p>
            <Button onClick={goBack} className="mt-4">Return Home</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="gap-2 mb-4" 
            onClick={goBack}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {roastData.title || "Untitled"} 
            <span className="text-brand-green bg-brand-green/10 p-1 rounded text-sm">Roast</span>
          </h1>
          
          {roastData.url && (
            <a 
              href={roastData.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-500 hover:text-brand-green flex items-center gap-1 mt-1"
            >
              {roastData.url} <Eye size={14} />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Screenshot + Heatmap Toggle */}
          <ScreenshotPanel 
            screenshot={roastData.screenshot_url} 
            heatmapData={roastData.heatmapData} 
            showHeatmap={showHeatmap}
            setShowHeatmap={setShowHeatmap}
          />
          
          {/* Center Panel: CRO Scorecard */}
          <ScorePanel scores={roastData.scores} />
          
          {/* Right Panel: Expert Roast Comments */}
          <CommentsPanel comments={roastData.comments} />
        </div>
      </main>
      
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2025 Conversion ROAST. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default RoastResults;
