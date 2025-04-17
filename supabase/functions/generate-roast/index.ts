
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
    // Parse request body ONCE to avoid recursion issues
    let requestData;
    try {
      const bodyText = await req.text(); // Get raw text first
      requestData = bodyText ? JSON.parse(bodyText) : {};
      console.log("Request data parsed successfully:", Object.keys(requestData));
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      throw new Error('Invalid JSON in request body');
    }
    
    // Extract image URL and other fields with fallbacks
    const imageUrl = requestData.image_url || requestData.screenshot_url;
    const pageGoal = requestData.page_goal || requestData.goal || "Increase conversions";
    const audience = requestData.audience || "General audience";
    const brandTone = requestData.brand_tone || requestData.tone || "Professional";
    
    console.log(`Processing request with: 
      - Image URL: ${imageUrl?.substring(0, 50)}...
      - Goal: ${pageGoal}
      - Audience: ${audience}
      - Tone: ${brandTone}`);
    
    // Validate image URL
    if (!imageUrl) {
      throw new Error('Image URL is required. Please provide image_url or screenshot_url in the request body.');
    }

    // Validate OpenAI API key
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.');
    }
    
    // Fetch the image data
    console.log("Fetching image from URL...");
    let imageResponse;
    try {
      imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
      }
    } catch (fetchError) {
      console.error("Error fetching image:", fetchError);
      throw new Error(`Failed to fetch image: ${fetchError.message}`);
    }
    
    // Convert image to base64
    console.log("Converting image to base64...");
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const dataUri = `data:${imageResponse.headers.get('content-type') || 'image/png'};base64,${base64Image}`;
    
    // Prepare the GPT-4o Vision prompt
    console.log("Preparing prompt for GPT-4o...");
    const systemPrompt = `You are a senior CRO (Conversion Rate Optimization) expert analyzing landing pages.

Analyze this landing page screenshot based on these contextual details:
- Page Goal: ${pageGoal}
- Target Audience: ${audience}
- Brand Tone: ${brandTone}

For each relevant section (Hero, Features, Testimonials, Pricing, CTA, etc.), identify:
1. What's wrong - UX issues, copy problems, clarity concerns, or trust elements
2. How to fix it - provide a clear, actionable suggestion
3. Example - provide a specific example of the fix (rewrite, redesign)

Organize your analysis by category:
- Clarity (clear value proposition, easy understanding)
- Visual Hierarchy (layout, attention flow)
- CTA Strength (button placement, copy, contrast)
- Copy Resonance (messaging alignment with audience)
- Trust & Credibility (social proof, credentials)

Return ONLY a valid JSON array with objects in this exact format:
[
  {
    "section": "Hero", 
    "category": "Clarity",
    "issue": "Headline lacks clear value proposition.",
    "suggestion": "Rewrite headline to focus on primary benefit.",
    "example": "Boost Conversions by 37% with AI-Powered Landing Pages"
  },
  // Additional feedback items...
]`;

    // Call the OpenAI API with GPT-4o Vision
    console.log("Calling OpenAI API with GPT-4o...");
    let openAIResponse;
    try {
      openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
                  text: "Analyze this landing page screenshot and provide detailed, actionable feedback for improving conversion rates."
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
    } catch (openAIError) {
      console.error("Error calling OpenAI API:", openAIError);
      throw new Error(`OpenAI API call failed: ${openAIError.message}`);
    }

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("OpenAI API error response:", errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    // Process the OpenAI response
    console.log("Processing OpenAI response...");
    const openAIData = await openAIResponse.json();
    
    if (!openAIData.choices || openAIData.choices.length === 0) {
      console.error("Unexpected OpenAI response format:", openAIData);
      throw new Error("OpenAI returned an empty or invalid response");
    }
    
    // Extract and parse the response
    const rawResponse = openAIData.choices[0].message.content;
    console.log("Raw GPT-4o response (first 200 chars):", rawResponse.substring(0, 200) + "...");
    
    // Parse the JSON response with error handling
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(rawResponse);
      console.log("Successfully parsed JSON response");
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI:", parseError);
      console.log("Raw response that failed to parse:", rawResponse);
      throw new Error("Failed to parse OpenAI response as valid JSON");
    }
    
    // Handle different response formats (array or object with array property)
    let comments = [];
    
    if (Array.isArray(parsedResponse)) {
      // Direct array format
      comments = parsedResponse;
      console.log(`Found ${comments.length} comments in array format`);
    } else if (typeof parsedResponse === 'object') {
      // Look for any array property that might contain the comments
      const potentialArrays = Object.entries(parsedResponse)
        .filter(([_, value]) => Array.isArray(value) && value.length > 0);
      
      if (potentialArrays.length > 0) {
        // Use the first array property found (likely to be the comments)
        const [arrayKey, arrayValue] = potentialArrays[0];
        comments = arrayValue;
        console.log(`Found ${comments.length} comments in object property '${arrayKey}'`);
      } else {
        console.error("No valid array found in response:", parsedResponse);
        throw new Error("Could not find valid feedback array in API response");
      }
    } else {
      console.error("Unexpected response format:", typeof parsedResponse);
      throw new Error("OpenAI response is neither an array nor an object with an array property");
    }
    
    // Validate that we have at least some comments
    if (!comments || comments.length === 0) {
      console.error("No comments found in the parsed response");
      throw new Error("No feedback items found in the analysis");
    }
    
    // Standardize the comment format for compatibility with the frontend
    const standardizedComments = comments.map((item, index) => ({
      id: index + 1,
      section: item.section || "Page",
      category: item.category || item.label || "General",
      issue: item.issue || "",
      solution: item.suggestion || "",
      example: item.example || item.example_text || "",
      highlightArea: item.highlightArea || {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    }));
    
    console.log(`Standardized ${standardizedComments.length} comments for frontend compatibility`);
    
    // Generate scores based on categories
    const calculateCategoryScore = (category) => {
      // Find comments in this category
      const categoryComments = comments.filter(item => 
        (item.category || item.label || "").toLowerCase().includes(category.toLowerCase())
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
      overall: 0, // Will be calculated as average
      visualHierarchy: calculateCategoryScore("visual hierarchy"),
      valueProposition: calculateCategoryScore("clarity"),
      ctaStrength: calculateCategoryScore("cta"),
      copyResonance: calculateCategoryScore("copy"),
      trustCredibility: calculateCategoryScore("trust")
    };
    
    // Calculate overall score as average of others
    scores.overall = Math.floor(
      (scores.visualHierarchy +
       scores.valueProposition +
       scores.ctaStrength +
       scores.copyResonance +
       scores.trustCredibility) / 5
    );
    
    console.log("Generated scores:", scores);
    
    // Return the structured response
    console.log("Returning final response to client");
    return new Response(
      JSON.stringify({
        comments: standardizedComments,
        scores,
        source: "gpt-4o",
        screenshot_url: imageUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    // Handle any errors in the process
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
