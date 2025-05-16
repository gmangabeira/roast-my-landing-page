
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface UrlInputFormProps {
  onUrlSubmit: (url: string) => void;
  isLoading: boolean;
}

const UrlInputForm = ({ onUrlSubmit, isLoading }: UrlInputFormProps) => {
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a website URL to analyze",
        variant: "destructive",
      });
      return;
    }

    // Add http:// prefix if missing
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      formattedUrl = `https://${url}`;
    }
    
    onUrlSubmit(formattedUrl);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="flex-shrink-0 pl-4">
            <Link size={20} className="text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Enter your landing page URL (e.g., yoursite.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border-0 h-14 px-4 flex-grow focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-14 px-6 rounded-none bg-brand-green hover:bg-brand-green/90 text-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search size={20} />
                Analyze
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UrlInputForm;
