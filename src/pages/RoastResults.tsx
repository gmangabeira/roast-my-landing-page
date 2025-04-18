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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

        let screenshotUrl = roast.screenshot_url;
        
        if (screenshotUrl && !screenshotUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) && 
            !screenshotUrl.includes('api.screenshotmachine.com') && 
            !screenshotUrl.includes('/storage/v1/object/public/')) {
          try {
            console.log("Converting URL to screenshot:", screenshotUrl);
            const screenshotResponse = await fetch('https://wtrnzafcmmwxizdkfkdu.supabase.co/functions/v1/generate-screenshot', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: screenshotUrl
              })
            });
            
            if (!screenshotResponse.ok) {
              throw new Error(`Failed to generate screenshot: ${await screenshotResponse.text()}`);
            }
            
            const screenshotData = await screenshotResponse.json();
            screenshotUrl = screenshotData.screenshot_url;
            console.log("Generated screenshot URL:", screenshotUrl);
          } catch (screenshotError) {
            console.error("Error generating screenshot:", screenshotError);
          }
        }
        
        if (screenshotUrl !== roast.screenshot_url) {
          await supabase
            .from('roasts')
            .update({ screenshot_url: screenshotUrl })
            .eq('id', roast.id);
        }

        setIsGenerating(true);
        setErrorMessage(null);
        
        console.log("Generating roast analysis with GPT-4o Vision");
        
        const commentsResponse = await fetch('https://wtrnzafcmmwxizdkfkdu.supabase.co/functions/v1/generate-roast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: screenshotUrl,
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
          screenshot_url: screenshotUrl,
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
        setErrorMessage(error.message || "An unknown error occurred");
        
        if (retryCount >= 2) {
          toast({
            title: "Error loading roast",
            description: error.message || "Could not load roast data after multiple attempts",
            variant: "destructive",
          });
        } else {
          setRetryCount(prev => prev + 1);
          toast({
            title: "Retrying analysis",
            description: `Attempt ${retryCount + 1} of 3...`,
            variant: "default",
          });
          
          setTimeout(() => {
            setIsLoading(true);
            setIsGenerating(false);
          }, 3000);
          return;
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

  const handleRetry = () => {
    setIsLoading(true);
    setRetryCount(0);
    setErrorMessage(null);
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

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Error Analyzing Page</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <div className="space-y-2">
              <Button onClick={handleRetry} variant="default" className="w-full">
                Try Again
              </Button>
              <Button onClick={goBack} variant="outline" className="w-full">
                Return Home
              </Button>
            </div>
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
