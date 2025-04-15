
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
            title: "Missing roast ID",
            description: "No roast ID was provided",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        const { data: roast, error } = await supabase
          .from('roasts')
          .select('*')
          .eq('id', location.state.roastId)
          .single();

        if (error) throw error;

        if (!roast) {
          throw new Error('Roast not found');
        }

        if (!roast.screenshot_url) {
          throw new Error('Screenshot not available');
        }

        // Generate roast comments using our edge function
        const commentsResponse = await fetch('https://wtrnzafcmmwxizdkfkdu.supabase.co/functions/v1/generate-roast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            screenshot_url: roast.screenshot_url,
            page_goal: roast.page_goal || 'Increase conversions',
            audience: roast.audience,
            brand_tone: roast.brand_tone
          })
        });

        if (!commentsResponse.ok) {
          throw new Error('Failed to generate roast feedback');
        }

        const commentsData = await commentsResponse.json();

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

      } catch (error: any) {
        console.error('Error loading roast:', error);
        toast({
          title: "Error loading roast",
          description: error.message || "Could not load roast data",
          variant: "destructive",
        });
        navigate('/');
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
