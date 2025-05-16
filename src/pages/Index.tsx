import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flame, Search, Eye, MessageSquare, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import UploadBox from '@/components/UploadBox';
import ContextForm from '@/components/ContextForm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import UrlInputForm from '@/components/UrlInputForm';
import FeaturesGrid from '@/components/FeaturesGrid';
import TestimonialsSection from '@/components/TestimonialsSection';

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [pageGoal, setPageGoal] = useState('');
  const [audience, setAudience] = useState('');
  const [brandTone, setBrandTone] = useState('');
  const [formExpanded, setFormExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [enteredUrl, setEnteredUrl] = useState<string>('');

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
  };

  const handleImageUploaded = (url: string) => {
    setUploadedImageUrl(url);
    console.log("Image URL saved:", url);
  };

  const handleUrlChange = (url: string) => {
    setEnteredUrl(url);
    console.log("URL entered:", url);
  };

  const handleUrlSubmit = (url: string) => {
    setEnteredUrl(url);
    console.log("URL submitted:", url);
  };

  const handleSubmit = async () => {
    if (!uploadedImageUrl && !file && !enteredUrl) {
      toast({
        title: "Missing content",
        description: "Please upload a screenshot or enter a URL to analyze",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let screenshotUrl = uploadedImageUrl || "";
      let pageUrl = "";
      
      // If there's a file but no uploadedImageUrl (in case direct upload failed)
      if (file && !uploadedImageUrl) {
        console.log("Uploading file now...");
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const filePath = `${user?.id || 'anonymous'}/${timestamp}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('screenshots')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('screenshots')
          .getPublicUrl(filePath);
          
        screenshotUrl = publicUrl;
        console.log("Image uploaded to:", screenshotUrl);
      } else if (enteredUrl && !uploadedImageUrl && !file) {
        // If there's a URL entered but no file or uploadedImageUrl
        pageUrl = enteredUrl;
        screenshotUrl = enteredUrl; // We'll let the backend handle the screenshot generation
        console.log("Using URL for screenshot generation:", enteredUrl);
      }
      
      if (!screenshotUrl) {
        throw new Error('No screenshot URL available');
      }
      
      // Create a new roast record
      console.log("Creating roast record with screenshot:", screenshotUrl);
      const { data, error } = await supabase
        .from('roasts')
        .insert([
          {
            user_id: user?.id || null,
            title: "Landing Page Roast",
            url: pageUrl || enteredUrl || '',
            page_goal: pageGoal,
            audience,
            brand_tone: brandTone,
            screenshot_url: screenshotUrl
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log("Roast record created:", data[0].id);
        // Navigate to the results page with the roast ID
        navigate('/roast-results', { state: { roastId: data[0].id } });
      } else {
        throw new Error('Failed to create roast record');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while submitting your roast",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Features data
  const features = [
    {
      icon: <Eye size={24} className="text-brand-green" />,
      title: "Predictive Heatmap",
      description: "See where visitors look first and what they ignore on your landing page."
    },
    {
      icon: <MessageSquare size={24} className="text-brand-green" />,
      title: "Copy Critique",
      description: "Get actionable feedback on messaging clarity and persuasiveness."
    },
    {
      icon: <Star size={24} className="text-brand-green" />,
      title: "Conversion Tips",
      description: "Specific improvements to boost click-through and conversion rates."
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      quote: "We increased our landing page conversion rate by 28% after implementing the AI recommendations.",
      author: "Sarah Johnson",
      company: "Growth Marketing, TechStart",
      rating: 5
    },
    {
      quote: "The heatmap analysis showed exactly where users were getting stuck. Game changer!",
      author: "Michael Chen",
      company: "Lead Designer, Convertify",
      rating: 5
    },
    {
      quote: "Finally, AI feedback that actually understands conversion principles. Worth every penny.",
      author: "Alex Rodriguez",
      company: "CMO, SaaS Solutions",
      rating: 4
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <main className="flex-1">
        <section className="relative pt-20 pb-32 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 opacity-70"></div>
          
          <div className="container max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-brand-green to-emerald-600 bg-clip-text text-transparent">
                Convert More Visitors with AI
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8">
                Get an instant, data-driven roast of your landing page and see what's stopping visitors from converting.
              </p>
              
              {/* URL Input Form */}
              <UrlInputForm 
                onUrlSubmit={handleUrlSubmit} 
                isLoading={isLoading} 
              />
              
              <p className="mt-4 text-sm text-gray-500">
                Or upload a screenshot below if you prefer
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8 mt-8">
              {/* Keep Upload Box for those who want to upload directly */}
              <UploadBox 
                onFileChange={handleFileChange} 
                onImageUploaded={handleImageUploaded}
                onUrlChange={handleUrlChange}
              />
              
              <ContextForm 
                pageGoal={pageGoal}
                setPageGoal={setPageGoal}
                audience={audience}
                setAudience={setAudience}
                brandTone={brandTone}
                setBrandTone={setBrandTone}
                expanded={formExpanded}
                setExpanded={setFormExpanded}
              />
              
              <div className="mt-8">
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full py-6 text-lg bg-brand-green hover:bg-brand-green/90 shadow-md hover:shadow-lg transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Run My Roast <Flame size={20} />
                    </span>
                  )}
                </Button>
              </div>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                One free roast available for guest users. Sign up for unlimited roasts.
              </p>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">AI-Powered Conversion Insights</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our AI analyzes your landing page from a visitor's perspective and provides actionable recommendations
              </p>
            </div>
            
            <FeaturesGrid features={features} />
          </div>
        </section>
        
        {/* Testimonials Section */}
        <TestimonialsSection testimonials={testimonials} />
        
        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-brand-green/10 to-emerald-100/30">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Boost Your Conversion Rate?</h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Don't let visitors bounce without converting. Get your landing page roasted by our AI today.
            </p>
            <Button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              size="lg"
              className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-6 text-lg shadow-md hover:shadow-lg transition-all"
            >
              Analyze My Landing Page
            </Button>
          </div>
        </section>
      </main>
      
      <footer className="py-8 border-t">
        <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2025 Conversion ROAST. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
