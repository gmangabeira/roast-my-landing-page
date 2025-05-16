import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Zap, 
  Layout, 
  Navigation, 
  Palette, 
  Type, 
  Search,
  Gauge,
  Accessibility, 
  ShieldCheck,
  Link
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Header from '@/components/Header';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ScreenshotPanel from '@/components/roast/ScreenshotPanel';
import ScorePanel from '@/components/roast/ScorePanel';
import CommentsPanel from '@/components/roast/CommentsPanel';
import ReportSection from '@/components/roast/ReportSection';

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
  
  // Sample data for report sections - would normally come from the API
  const designChecklist = [
    { item: "Visual Hierarchy", isPassing: true, explanation: "Good use of headings and visual elements to guide users" },
    { item: "Color Contrast", isPassing: false, explanation: "Text contrast with background needs improvement for readability" },
    { item: "Mobile Responsiveness", isPassing: true, explanation: "Site responds well to different screen sizes" },
    { item: "Loading Speed", isPassing: true, explanation: "Initial page load is under 3 seconds" },
  ];
  
  const navigationChecklist = [
    { item: "Clear Navigation", isPassing: true, explanation: "Menu structure is logical and easy to follow" },
    { item: "Breadcrumbs", isPassing: false, explanation: "Missing breadcrumb navigation for deeper pages" },
    { item: "Search Functionality", isPassing: false, explanation: "No search option available for users" },
    { item: "Call-to-Actions", isPassing: true, explanation: "Primary CTAs are clearly visible and compelling" },
  ];
  
  const brandingChecklist = [
    { item: "Consistent Brand Identity", isPassing: true, explanation: "Logo, colors and typography are consistent" },
    { item: "Value Proposition", isPassing: false, explanation: "Value proposition needs to be more clearly stated on homepage" },
    { item: "Trust Elements", isPassing: true, explanation: "Good use of testimonials and social proof" },
    { item: "About Section", isPassing: true, explanation: "Company story effectively communicates brand values" },
  ];
  
  const copyChecklist = [
    { item: "Clear Headlines", isPassing: true, explanation: "Headlines effectively communicate benefits" },
    { item: "Persuasive Copy", isPassing: false, explanation: "Body copy needs more focus on benefits over features" },
    { item: "Call-to-Action Text", isPassing: true, explanation: "CTAs use action verbs and create urgency" },
    { item: "Grammar & Clarity", isPassing: true, explanation: "Content is free of grammatical errors and easy to understand" },
  ];
  
  const seoChecklist = [
    { item: "Meta Tags", isPassing: false, explanation: "Missing optimized meta descriptions on several pages" },
    { item: "URL Structure", isPassing: true, explanation: "URLs are clean, descriptive and keyword-rich" },
    { item: "Headings Structure", isPassing: true, explanation: "Good use of H1-H6 tags in hierarchical order" },
    { item: "Image Alt Text", isPassing: false, explanation: "Several images are missing alt text for accessibility & SEO" },
  ];
  
  const performanceChecklist = [
    { item: "Page Speed", isPassing: true, explanation: "Desktop speed score above 85/100" },
    { item: "Mobile Speed", isPassing: false, explanation: "Mobile speed needs improvement, currently below 60/100" },
    { item: "Image Optimization", isPassing: false, explanation: "Several images need compression and optimization" },
    { item: "Code Minification", isPassing: true, explanation: "JS and CSS files are properly minified" },
  ];
  
  const accessibilityChecklist = [
    { item: "Alt Text", isPassing: false, explanation: "Missing alt text on multiple images" },
    { item: "Keyboard Navigation", isPassing: true, explanation: "Site can be navigated with keyboard alone" },
    { item: "Color Contrast", isPassing: false, explanation: "Some text lacks sufficient contrast with background" },
    { item: "Form Labels", isPassing: true, explanation: "All form fields have proper labels" },
  ];
  
  const securityChecklist = [
    { item: "HTTPS", isPassing: true, explanation: "Site uses secure HTTPS protocol" },
    { item: "Privacy Policy", isPassing: true, explanation: "Privacy policy is present and up to date" },
    { item: "Forms Security", isPassing: true, explanation: "Forms have proper validation and protection against spam" },
    { item: "Cookie Consent", isPassing: false, explanation: "Missing cookie consent banner for GDPR compliance" },
  ];

  const keywordData = [
    { keyword: "organic skincare", volume: "8,100", difficulty: "High", ranking: "Not in top 100" },
    { keyword: "natural face cream", volume: "4,200", difficulty: "Medium", ranking: "Position 28" },
    { item: "vegan moisturizer", volume: "2,900", difficulty: "Low", ranking: "Position 12" },
    { item: "eco-friendly beauty", volume: "3,600", difficulty: "Medium", ranking: "Position 45" },
  ];

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
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {roastData?.title || "Website Analysis"} 
              </h1>
              
              {roastData?.url && (
                <a 
                  href={roastData.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-500 hover:text-brand-green flex items-center gap-1 mt-1"
                >
                  <Link size={14} />
                  {roastData.url}
                </a>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Overall Score:</span>
              <div className="bg-gray-100 px-4 py-1.5 rounded-full flex items-center">
                <span className="font-bold text-lg text-brand-green">{roastData.scores.overall || 75}</span>
                <span className="text-sm text-gray-500 ml-1">/100</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Screenshot Section */}
        <Card className="mb-10 overflow-hidden">
          <CardContent className="p-0">
            {roastData?.screenshot_url && (
              <img 
                src={roastData.screenshot_url}
                alt="Website screenshot" 
                className="w-full h-auto object-contain border-b"
              />
            )}
          </CardContent>
        </Card>
        
        {/* Conversion Report Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-brand-green bg-brand-green/10 p-1.5 rounded-full">📊</span>
            Conversion Report
          </h2>
          
          <ReportSection
            title="Design & User Experience"
            icon={<Layout size={24} className="text-gray-700" />}
            score={78}
            description="Your design is modern and clean, but there are some contrast issues that could affect readability."
            checklistItems={designChecklist}
          />
          
          <ReportSection
            title="Navigation"
            icon={<Navigation size={24} className="text-gray-700" />}
            score={65}
            description="Overall navigation is intuitive, but lacks some key elements that would improve user experience."
            checklistItems={navigationChecklist}
          />
          
          <ReportSection
            title="Branding"
            icon={<Palette size={24} className="text-gray-700" />}
            score={82}
            description="Your brand identity is consistent across the site, but your value proposition could be stronger."
            checklistItems={brandingChecklist}
          />
          
          <ReportSection
            title="Copywriting"
            icon={<Type size={24} className="text-gray-700" />}
            score={70}
            description="Your copy is clear but could be more persuasive with a stronger focus on benefits."
            checklistItems={copyChecklist}
          />
        </div>
        
        {/* Traffic Report Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-brand-green bg-brand-green/10 p-1.5 rounded-full">🔍</span>
            Traffic Report
          </h2>
          
          <ReportSection
            title="SEO"
            icon={<Search size={24} className="text-gray-700" />}
            score={62}
            description="Your site has solid URL structure but needs improvement in meta descriptions and alt text."
            checklistItems={seoChecklist}
          />
          
          {/* Keywords Table */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Keyword Analysis</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Monthly Volume</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Current Ranking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywordData.map((keyword, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell>{keyword.volume}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          keyword.difficulty === 'High' ? 'bg-red-100 text-red-700' :
                          keyword.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {keyword.difficulty}
                        </span>
                      </TableCell>
                      <TableCell>{keyword.ranking}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <ReportSection
            title="Performance"
            icon={<Gauge size={24} className="text-gray-700" />}
            score={68}
            description="Desktop performance is good, but mobile speed and image optimization need attention."
            checklistItems={performanceChecklist}
          />
        </div>
        
        {/* Website Fundamentals Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-brand-green bg-brand-green/10 p-1.5 rounded-full">🛠️</span>
            Website Fundamentals
          </h2>
          
          <ReportSection
            title="Accessibility"
            icon={<Accessibility size={24} className="text-gray-700" />}
            score={58}
            description="Your site has some accessibility features in place but needs significant improvements to be fully compliant."
            checklistItems={accessibilityChecklist}
          />
          
          <ReportSection
            title="Security"
            icon={<ShieldCheck size={24} className="text-gray-700" />}
            score={85}
            description="Your website has good security measures in place with only minor improvements needed."
            checklistItems={securityChecklist}
          />
        </div>
        
        {/* Upgrade CTA */}
        <div className="mb-12 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-8 text-white flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Want a deeper analysis?</h2>
              <p className="text-white/90">Upgrade to get a full professional audit with custom recommendations.</p>
            </div>
            <Button className="bg-white text-purple-700 hover:bg-white/90 hover:text-purple-800">
              Upgrade Now
            </Button>
          </div>
        </div>
      </main>
      
      <footer className="py-6 border-t bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl">Web Gremlin</span>
            </div>
            <p className="text-sm text-gray-400">
              Analyzing websites since 2023. AI-powered insights for better conversion rates.
            </p>
            <p className="text-sm text-gray-400">
              © 2025 Web Gremlin. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RoastResults;
