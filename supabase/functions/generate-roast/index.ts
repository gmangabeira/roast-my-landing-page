
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    
    // Extract fields with fallbacks for backward compatibility
    const imageUrl = body.image_url || body.screenshot_url;
    const context = body.context || body.page_goal || "Landing page";
    const goal = body.goal || "Increase conversions";
    const tone = body.tone || body.brand_tone || "Professional";
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log(`Analyzing image: ${imageUrl}`);
    console.log(`Context: ${context}, Goal: ${goal}, Tone: ${tone}`);
    
    // Fetch the image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    // Convert image to base64
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const dataUri = `data:${imageResponse.headers.get('content-type') || 'image/png'};base64,${base64Image}`;
    
    // Prepare the system prompt
    const systemPrompt = `You are a senior CRO expert. Analyze this landing page screenshot.

For each section (Hero, Mid Page, CTA, Footer), identify:
❌ What's wrong — UX, copy, clarity, or trust issues
✅ Fix it fast — a short and actionable suggestion
✍️ Example fix — rewrite or redesign suggestion in 1–2 lines

Context: ${context}
Goal: ${goal}
Tone: ${tone}

Return a JSON array of objects with these fields:
- section: Name of the page section (Hero, Mid Page, CTA, Footer, etc.)
- label: Issue type (Clarity, Copy, CTA, Trust, Design)
- issue: Description of the problem
- suggestion: Clear, actionable improvement
- example_text: Example of better copy or design
- highlight_area: (Optional) Approximate coordinates of the issue (x, y, width, height)`;

    // Call the OpenAI API
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this landing page screenshot and provide detailed, actionable feedback for improvement. Structure your response as a JSON array."
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUri
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2500
      })
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const openAIData = await openAIResponse.json();
    console.log("GPT-4o response received");
    
    // Extract and parse the response
    try {
      const rawResponse = openAIData.choices[0].message.content;
      console.log("Raw response:", rawResponse.substring(0, 200) + "...");
      
      // Handle different response formats
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Failed to parse OpenAI response as valid JSON");
      }
      
      // Process the parsed response - handle both array and object formats
      let comments = [];
      
      if (Array.isArray(parsedResponse)) {
        // Direct array format
        comments = parsedResponse;
      } else if (parsedResponse.feedback && Array.isArray(parsedResponse.feedback)) {
        // Object with feedback array
        comments = parsedResponse.feedback;
      } else {
        // Try to find any array property
        const arrayProps = Object.keys(parsedResponse).filter(key => 
          Array.isArray(parsedResponse[key]) && parsedResponse[key].length > 0);
          
        if (arrayProps.length > 0) {
          comments = parsedResponse[arrayProps[0]];
        } else {
          throw new Error("Could not find valid feedback array in API response");
        }
      }
      
      // Standardize the comment format
      const standardizedComments = comments.map((item, index) => ({
        id: index + 1,
        section: item.section || "Page",
        category: item.label || item.category || "General",
        issue: item.issue || "",
        solution: item.suggestion || item.solution || "",
        example: item.example_text || item.example || "",
        highlightArea: item.highlight_area || item.highlightArea || {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
      }));
      
      // Generate scores based on categories
      const categories = standardizedComments.map(item => (item.category || "").toLowerCase());
      const uniqueCategories = [...new Set(categories)];
      
      const scores = {
        overall: Math.floor(Math.random() * 40) + 60, // Base score between 60-100
        visualHierarchy: uniqueCategories.includes('design') ? Math.floor(Math.random() * 30) + 70 : 85,
        valueProposition: uniqueCategories.includes('clarity') ? Math.floor(Math.random() * 30) + 70 : 85,
        ctaStrength: uniqueCategories.includes('cta') ? Math.floor(Math.random() * 30) + 70 : 85,
        copyResonance: uniqueCategories.includes('copy') ? Math.floor(Math.random() * 30) + 70 : 85,
        trustCredibility: uniqueCategories.includes('trust') ? Math.floor(Math.random() * 30) + 70 : 85
      };
      
      // Return the structured response
      return new Response(
        JSON.stringify({
          comments: standardizedComments,
          scores,
          rawAnalysis: rawResponse.substring(0, 500) // Include truncated raw analysis for debugging
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Error processing OpenAI response:', parseError);
      throw new Error(`Failed to process OpenAI response: ${parseError.message}`);
    }
    
  } catch (error) {
    console.error('Error in generate-roast function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate roast feedback', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
