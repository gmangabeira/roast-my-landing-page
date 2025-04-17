
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ScreenshotPanel from '@/components/roast/ScreenshotPanel';
import ScorePanel from '@/components/roast/ScorePanel';
import CommentsPanel from '@/components/roast/CommentsPanel';

interface RoastData {
  id: string;
  title: string;
  url?: string;
  screenshot_url: string;
  page_goal?: string;
  audience?: string;
  brand_tone?: string;
  comments: any[];
  scores: {
    overall: number;
    visualHierarchy: number;
    valueProposition: number;
    ctaStrength: number;
    copyResonance: number;
    trustCredibility: number;
  };
}

const RoastResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchRoastData = async () => {
      try {
        if (!location.state?.roastId) {
          toast({
            title: "Missing roast ID",
            description: "No roast ID was provided",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        console.log("Fetching roast with ID:", location.state.roastId);
        const { data: roast, error } = await supabase
          .from('roasts')
          .select('*')
          .eq('id', location.state.roastId)
          .single();

        if (error) {
          console.error("Error fetching roast:", error);
          throw error;
        }

        if (!roast) {
          throw new Error('Roast not found');
        }

        console.log("Roast data retrieved:", roast);

        if (!roast.screenshot_url) {
          throw new Error('Screenshot not available');
        }

        setIsGenerating(true);
        
        console.log("Generating roast analysis with GPT-4o Vision");
        
        // Generate roast comments using our GPT-4o Vision edge function
        const commentsResponse = await fetch('https://wtrnzafcmmwxizdkfkdu.supabase.co/functions/v1/generate-roast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: roast.screenshot_url,
            page_goal: roast.page_goal || 'Increase conversions',
            audience: roast.audience || 'General audience',
            brand_tone: roast.brand_tone || 'Professional'
          })
        });

        if (!commentsResponse.ok) {
          let errorText = '';
          try {
            const errorJson = await commentsResponse.json();
            errorText = JSON.stringify(errorJson);
          } catch (e) {
            errorText = await commentsResponse.text();
          }
          console.error("Error from generate-roast function:", errorText);
          throw new Error(`Failed to generate roast feedback: ${errorText}`);
        }

        const commentsData = await commentsResponse.json();
        console.log("Analysis data received:", commentsData);
        
        if (commentsData.error) {
          throw new Error(commentsData.error);
        }

        setRoastData({
          ...roast,
          comments: commentsData.comments || [],
          scores: commentsData.scores || {
            overall: 0,
            visualHierarchy: 0,
            valueProposition: 0,
            ctaStrength: 0,
            copyResonance: 0,
            trustCredibility: 0
          }
        });

        toast({
          title: "Roast generated",
          description: "Your landing page roast has been successfully analyzed by our AI",
          variant: "default",
        });

      } catch (error: any) {
        console.error('Error loading roast:', error);
        
        // If we've already retried 3 times, show the error and give up
        if (retryCount >= 2) {
          toast({
            title: "Error loading roast",
            description: error.message || "Could not load roast data after multiple attempts",
            variant: "destructive",
          });
          navigate('/');
        } else {
          // Increment retry count and try again after a delay
          setRetryCount(prev => prev + 1);
          toast({
            title: "Retrying analysis",
            description: `Attempt ${retryCount + 1} of 3...`,
            variant: "default",
          });
          
          // Wait 2 seconds before retrying
          setTimeout(() => {
            setIsLoading(true);
            setIsGenerating(false);
          }, 2000);
          return; // Don't set isLoading to false yet
        }
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    };

    if (isLoading) {
      fetchRoastData();
    }
  }, [location.state, navigate, toast, isLoading, retryCount]);

  const goBack = () => {
    navigate('/');
  };

  if (isLoading || isGenerating) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <Zap size={32} className="text-brand-green" />
            </div>
            <h2 className="text-xl font-semibold">
              {isGenerating ? "Analyzing your landing page..." : "Loading roast data..."}
            </h2>
            <p className="text-gray-500 mt-2">
              {isGenerating ? "This may take a minute or two" : "Please wait..."}
              {retryCount > 0 && ` (Attempt ${retryCount + 1} of 3)`}
            </p>
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
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {roastData?.title || "Untitled"} 
            <span className="text-brand-green bg-brand-green/10 p-1 rounded text-sm">Roast</span>
          </h1>
          
          {roastData?.url && (
            <a 
              href={roastData.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-500 hover:text-brand-green flex items-center gap-1 mt-1"
            >
              {roastData.url}
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScreenshotPanel 
            screenshot={roastData?.screenshot_url} 
            heatmapData={[]} 
            showHeatmap={showHeatmap}
            setShowHeatmap={setShowHeatmap}
          />
          
          <ScorePanel scores={roastData?.scores || {
            overall: 0,
            visualHierarchy: 0,
            valueProposition: 0,
            ctaStrength: 0,
            copyResonance: 0,
            trustCredibility: 0
          }} />
          
          <CommentsPanel comments={roastData?.comments || []} />
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
