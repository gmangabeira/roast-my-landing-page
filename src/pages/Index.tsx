
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import UploadBox from '@/components/UploadBox';
import ContextForm from '@/components/ContextForm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [pageGoal, setPageGoal] = useState('');
  const [audience, setAudience] = useState('');
  const [brandTone, setBrandTone] = useState('');
  const [formExpanded, setFormExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
  };

  const handleSubmit = async () => {
    if (!file && document.querySelector('input[type="url"]')?.getAttribute('value') === '') {
      toast({
        title: "Missing content",
        description: "Please upload a screenshot or enter a URL to analyze",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let screenshotUrl = "";
      
      // If there's a file, upload it to Supabase Storage
      if (file) {
        // TODO: Implement file upload when storage bucket is created
        // const { data, error } = await supabase.storage
        //   .from('screenshots')
        //   .upload(`${user?.id || 'guest'}-${Date.now()}`, file);
        
        // if (error) throw error;
        // screenshotUrl = data.path;
      }
      
      // Create a new roast record
      const { data, error } = await supabase
        .from('roasts')
        .insert([
          {
            user_id: user?.id || null,
            title: "Untitled Roast",
            url: document.querySelector('input[type="url"]')?.getAttribute('value') || '',
            page_goal: pageGoal,
            audience,
            brand_tone: brandTone,
            screenshot_url: screenshotUrl
          }
        ]);
      
      if (error) throw error;
      
      toast({
        title: "Coming soon!",
        description: "This feature is not yet fully implemented. Check back later!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while submitting your roast",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 md:py-12">
        <section className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            Roast Your Landing Page{' '}
            <span className="inline-block animate-pulse-slow">🔥</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Want to know where your landing page fails before users bounce? 
            Get a CRO-grade roast powered by AI.
          </p>
        </section>
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-4">Upload Your Landing Page</h2>
              
              <UploadBox onFileChange={handleFileChange} />
              
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
          
          <div className="mt-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-lg shadow-sm border">
                <div className="bg-brand-green/10 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1">Predictive Heatmap</h3>
                <p className="text-sm text-gray-600">See where visitors look first and what they ignore</p>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm border">
                <div className="bg-brand-green/10 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                    <path d="M10 2c1 .5 2 2 2 5" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1">Copy Critique</h3>
                <p className="text-sm text-gray-600">Get actionable feedback on messaging clarity and persuasiveness</p>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm border">
                <div className="bg-brand-green/10 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 10v12" />
                    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1">Conversion Tips</h3>
                <p className="text-sm text-gray-600">Specific improvements to boost click-through and conversion rates</p>
              </div>
            </div>
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

export default Index;
