
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ScreenshotMachine API key
const screenshotApiKey = "4d65e0";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { url } = await req.json();
    
    // Validate the URL
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: 'Missing or invalid URL parameter' 
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        }
      );
    }
    
    // Check if URL starts with http:// or https://
    if (!url.match(/^https?:\/\//i)) {
      return new Response(
        JSON.stringify({ 
          error: 'URL must start with http:// or https://' 
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        }
      );
    }
    
    // Encode the URL for the API call
    const encodedUrl = encodeURIComponent(url);
    
    // Construct the ScreenshotMachine API URL with fullpage=1
    const apiUrl = `https://api.screenshotmachine.com/?key=${screenshotApiKey}&url=${encodedUrl}&dimension=1024xfull&device=desktop&format=png&fullpage=1&hidecookiebanners=true&hidepopups=true`;
    
    console.log(`Calling ScreenshotMachine API for URL: ${url}`);
    
    // Call the ScreenshotMachine API to get the actual image
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`ScreenshotMachine API returned ${response.status}: ${await response.text()}`);
    }
    
    // Return the direct screenshot URL for display
    return new Response(
      JSON.stringify({
        screenshot_url: apiUrl,
        original_url: url,
        timestamp: Date.now()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  } catch (error) {
    console.error('Error in generate-screenshot function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate screenshot', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
