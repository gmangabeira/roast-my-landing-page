
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Flame, ArrowLeft, Eye, MessageSquare, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import { ChartContainer } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock data for the heatmap analysis
const mockAttentionData = [
  { name: 'Header', value: 75 },
  { name: 'Hero Section', value: 90 },
  { name: 'Features', value: 45 },
  { name: 'Testimonials', value: 30 },
  { name: 'CTA', value: 60 },
  { name: 'Footer', value: 15 },
];

const RoastResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roastData, setRoastData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        setRoastData({
          ...data,
          // Add mock analysis data since we don't have a real AI analysis yet
          heatmapData: mockAttentionData,
          copyFeedback: {
            headline: "Your headline is clear but could be more compelling",
            value_proposition: "Your value proposition isn't immediately clear",
            cta: "Your call-to-action button text is effective",
          },
          conversionTips: [
            "Add social proof near your main call-to-action",
            "Reduce form fields to minimize friction",
            "Clarify the immediate benefit in your headline",
            "Add urgency element like limited time offer",
            "Make your primary CTA more visually distinct"
          ]
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
        <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <Flame size={32} className="text-brand-green" />
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
        <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 flex items-center justify-center">
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
      
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="gap-2 mb-4" 
            onClick={goBack}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold">
            {roastData.title} <span className="text-brand-green">Roast</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="heatmap">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="heatmap" className="gap-2">
                  <Eye size={16} /> Predictive Heatmap
                </TabsTrigger>
                <TabsTrigger value="copy" className="gap-2">
                  <MessageSquare size={16} /> Copy Analysis
                </TabsTrigger>
                <TabsTrigger value="conversion" className="gap-2">
                  <Zap size={16} /> Conversion Tips
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="heatmap" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Attention Distribution</CardTitle>
                    <CardDescription>
                      See where visitors look first and what they might ignore
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={roastData.heatmapData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="name" />
                          <YAxis label={{ value: 'Attention Score', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#22C55E" 
                            fill="#22C55E" 
                            fillOpacity={0.3} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Key Insights:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="bg-green-100 text-green-800 p-1 rounded-full flex-shrink-0">
                            <Flame size={12} />
                          </span>
                          <span>Your hero section captures strong initial attention</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-amber-100 text-amber-800 p-1 rounded-full flex-shrink-0">
                            <Flame size={12} />
                          </span>
                          <span>Testimonials section isn't getting enough visibility</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-red-100 text-red-800 p-1 rounded-full flex-shrink-0">
                            <Flame size={12} />
                          </span>
                          <span>Features section attention drops significantly</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="copy" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Copy Analysis</CardTitle>
                    <CardDescription>
                      Feedback on your messaging clarity and persuasiveness
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-medium">Headline</h4>
                        <div className="p-4 bg-gray-50 rounded-lg border text-sm">
                          {roastData.copyFeedback.headline}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Value Proposition</h4>
                        <div className="p-4 bg-gray-50 rounded-lg border text-sm">
                          {roastData.copyFeedback.value_proposition}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Call to Action</h4>
                        <div className="p-4 bg-gray-50 rounded-lg border text-sm">
                          {roastData.copyFeedback.cta}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="conversion" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Tips</CardTitle>
                    <CardDescription>
                      Specific improvements to boost click-through and conversion rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {roastData.conversionTips.map((tip: string, index: number) => (
                        <li key={index} className="flex gap-3 items-start">
                          <div className="bg-brand-green/10 text-brand-green p-2 rounded-full flex-shrink-0">
                            <Zap size={16} />
                          </div>
                          <div>
                            <p className="text-gray-800">{tip}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Landing Page</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center">
                  {roastData.screenshot_url ? (
                    <img 
                      src={roastData.screenshot_url} 
                      alt="Landing page screenshot" 
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="text-center p-8 text-gray-400">
                      <Eye size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Screenshot will appear here</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Page Goal</h4>
                    <p className="text-sm text-gray-600">{roastData.page_goal || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Target Audience</h4>
                    <p className="text-sm text-gray-600">{roastData.audience || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Brand Voice & Tone</h4>
                    <p className="text-sm text-gray-600">{roastData.brand_tone || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <footer className="py-6 border-t">
        <div className="container max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2025 Conversion ROAST. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default RoastResults;
