
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the REPLICATE_API_TOKEN from environment variables
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not set');
    }

    // Parse the request body
    const { image_url } = await req.json();
    
    if (!image_url) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing image_url parameter' 
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

    console.log(`Generating heatmap for image: ${image_url}`);
    
    // Create a prediction on Replicate
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "915ca5937158c8cd8553a91637345c3fb0eddf33c76e195da03b5eea520e79e3", // FastSAM model version
        input: {
          image: image_url,
          device: "cpu",
          output_type: "segment",
          high_quality: true,
          box_threshold: 0.3,
          text_threshold: 0.25,
          heatmap_format: "float" // Request a heatmap output
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Replicate API returned ${response.status}: ${errorData}`);
    }
    
    const prediction = await response.json();
    console.log("Prediction started:", prediction.id);
    
    // Poll for the prediction result
    let heatmapResult;
    let attempts = 0;
    const maxAttempts = 30; // Adjust based on expected processing time
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Wait for 1-2 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check prediction status
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
      }
      
      const result = await statusResponse.json();
      console.log(`Prediction status (${attempts}/${maxAttempts}):`, result.status);
      
      if (result.status === 'succeeded') {
        heatmapResult = result.output;
        break;
      } else if (result.status === 'failed') {
        throw new Error(`Prediction failed: ${result.error || 'Unknown error'}`);
      }
      // Continue polling if still processing
    }
    
    if (!heatmapResult) {
      throw new Error('Model prediction timed out or did not return expected results');
    }
    
    // Return the heatmap URL
    return new Response(
      JSON.stringify({
        heatmap_url: heatmapResult,
        original_url: image_url,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  } catch (error) {
    console.error('Error in generate-heatmap function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate heatmap', 
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
