
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
    // Parse request body - do this only once
    const body = await req.json();
    
    // Extract required fields
    const imageUrl = body.image_url;
    const goal = body.goal || "Increase conversions";
    const audience = body.audience || "General audience";
    const tone = body.tone || "Professional";
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log(`Analyzing image: ${imageUrl}`);
    console.log(`Goal: ${goal}, Audience: ${audience}, Tone: ${tone}`);
    
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
    const systemPrompt = `You are a senior CRO expert.

Analyze the landing page image below for:

- Clarity
- Visual Hierarchy
- CTA Strength
- Copy Resonance
- Trust & Credibility

Context:
- Goal: ${goal}
- Audience: ${audience}
- Tone: ${tone}

For each area, return a JSON object with:
- category
- section
- issue
- suggestion
- example

Example return:
[
  {
    "category": "Clarity",
    "section": "Hero",
    "issue": "Headline lacks clear value proposition.",
    "suggestion": "Rewrite the headline to highlight the benefit.",
    "example": "Save hours with AI-powered onboarding."
  }
]

Return ONLY the JSON. No extra explanation.`;

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
                text: "Analyze this landing page screenshot and provide detailed, actionable feedback for improvement."
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
      
      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Failed to parse OpenAI response as valid JSON");
      }
      
      // Handle different response formats
      let comments = [];
      
      if (Array.isArray(parsedResponse)) {
        // Direct array format as requested
        comments = parsedResponse;
      } else if (parsedResponse.roast && Array.isArray(parsedResponse.roast)) {
        // Object with roast array
        comments = parsedResponse.roast;
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
      
      // Standardize the comment format for compatibility with the existing UI
      const standardizedComments = comments.map((item, index) => ({
        id: index + 1,
        section: item.section || "Page",
        category: item.category || "General",
        issue: item.issue || "",
        solution: item.suggestion || "",
        example: item.example || "",
        highlightArea: item.highlightArea || {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
      }));
      
      // Generate scores based on categories
      const calculateCategoryScore = (category) => {
        const categoryComments = comments.filter(item => 
          (item.category || "").toLowerCase() === category.toLowerCase()
        );
        
        // More comments in a category = lower score
        if (categoryComments.length === 0) return 95; // Nearly perfect if no issues
        if (categoryComments.length === 1) return Math.floor(Math.random() * 10) + 80; // 80-90
        if (categoryComments.length === 2) return Math.floor(Math.random() * 10) + 70; // 70-80
        if (categoryComments.length === 3) return Math.floor(Math.random() * 10) + 60; // 60-70
        return Math.floor(Math.random() * 15) + 50; // 50-65 for 4+ issues
      };
      
      // Calculate scores for each category
      const scores = {
        overall: Math.floor(
          (calculateCategoryScore("clarity") +
           calculateCategoryScore("visual hierarchy") +
           calculateCategoryScore("cta") +
           calculateCategoryScore("copy") +
           calculateCategoryScore("trust")) / 5
        ),
        visualHierarchy: calculateCategoryScore("visual hierarchy"),
        valueProposition: calculateCategoryScore("clarity"),
        ctaStrength: calculateCategoryScore("cta"),
        copyResonance: calculateCategoryScore("copy"),
        trustCredibility: calculateCategoryScore("trust")
      };
      
      // Return the structured response
      return new Response(
        JSON.stringify({
          comments: standardizedComments,
          scores,
          source: "gpt-4o",
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
