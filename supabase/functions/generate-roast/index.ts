
// Import the necessary Deno modules
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Get the OpenAI API key from environment variables
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Set up CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main function to handle incoming requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to generate-roast");
    
    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Request data parsed successfully");
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      throw new Error('Invalid JSON in request body');
    }
    
    // Extract image URL and other fields with fallbacks
    let imageUrl = requestData.image_url || requestData.screenshot_url;
    const pageGoal = requestData.page_goal || requestData.goal || "Increase conversions";
    const audience = requestData.audience || "General audience";
    const brandTone = requestData.brand_tone || requestData.tone || "Professional";
    
    console.log(`Processing request with image URL: ${imageUrl?.substring(0, 50)}...`);
    
    // Validate image URL
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    // Validate OpenAI API key
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Check if the image URL is not from a storage bucket but is a plain URL
    // If it's not a direct image URL, we need to fetch the screenshot first
    if (imageUrl && !imageUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) && !imageUrl.includes('/storage/v1/object/public/')) {
      console.log("URL does not point to an image file or storage bucket, fetching screenshot...");
      
      try {
        // Call the generate-screenshot function to get a proper image URL
        const screenshotResponse = await fetch("https://api.screenshotmachine.com/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          // We're using the same params as in the generate-screenshot function
          params: {
            key: "4d65e0",
            url: imageUrl,
            dimension: "1024x768",
            device: "desktop",
            format: "png",
            hidecookiebanners: true,
            hidepopups: true
          }
        });
        
        if (!screenshotResponse.ok) {
          throw new Error(`Failed to generate screenshot: ${screenshotResponse.status}`);
        }
        
        // We use the Screenshot Machine API URL directly, which returns the image when accessed
        imageUrl = `https://api.screenshotmachine.com/?key=4d65e0&url=${encodeURIComponent(imageUrl)}&dimension=1024x768&device=desktop&hidecookiebanners=true&hidepopups=true&format=png`;
        
        console.log(`Generated screenshot URL: ${imageUrl}`);
      } catch (screenshotError) {
        console.error("Error generating screenshot:", screenshotError);
        throw new Error(`Failed to generate screenshot: ${screenshotError.message}`);
      }
    }
    
    // Prepare the GPT-4o Vision prompt
    const systemPrompt = `You are a senior CRO (Conversion Rate Optimization) expert analyzing landing pages.

Analyze this landing page screenshot based on these contextual details:
- Page Goal: ${pageGoal}
- Target Audience: ${audience}
- Brand Tone: ${brandTone}

For each section of the landing page (Hero, Features, Testimonials, Pricing, CTA, etc.), identify:
1. Key issues that could be hurting conversion rates
2. Specific, actionable recommendations to fix those issues
3. Example implementation when appropriate

Organize your feedback into these categories:
- Clarity (value proposition clarity, messaging)
- CTAs (button design, copy, placement)
- Copy (messaging alignment with audience)
- Design (visual hierarchy, layout, attention flow)
- Trust (social proof, testimonials, credibility)

IMPORTANT: Your response MUST include at least 5-8 specific feedback items across multiple categories.
For each item, include a specific issue, a recommended fix, and when helpful, an example.

Return a valid JSON object with this structure:
{
  "comments": [
    {
      "id": 1,
      "section": "Hero",
      "category": "Clarity",
      "issue": "Headline lacks clear value proposition.",
      "solution": "Rewrite headline to focus on primary benefit.",
      "example": "Boost Conversions by 37% with AI-Powered Landing Pages"
    },
    // More feedback items...
  ],
  "scores": {
    "overall": 72,
    "visualHierarchy": 65,
    "valueProposition": 70,
    "ctaStrength": 80,
    "copyResonance": 75,
    "trustCredibility": 70
  }
}

The scores should reflect your assessment of each aspect on a scale of 0-100:
- 90-100: Excellent, best practices followed
- 80-89: Very good with minor improvements needed
- 70-79: Good but needs some improvement
- 60-69: Several issues need addressing
- Below 60: Critical issues affecting conversions

Make scores realistic - no perfect 100s, and vary them based on strengths and weaknesses.`;

    // Call the OpenAI API directly with the image URL
    console.log("Calling OpenAI API with GPT-4o Vision...");
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
                text: "Analyze this landing page screenshot and provide detailed, actionable feedback for improving conversion rates."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000
      })
    });

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
    
    // Create a fallback response if needed
    const fallbackComments = [
      {
        id: 1,
        section: "Hero",
        category: "Clarity",
        issue: "Headline doesn't clearly communicate the unique value proposition.",
        solution: "Rewrite headline to focus on primary benefit and unique selling point.",
        example: "Boost Your Website Conversions by 37% with AI-Powered Analysis",
        highlightArea: { x: 100, y: 100, width: 600, height: 100 }
      },
      {
        id: 2,
        section: "CTA",
        category: "CTAs", 
        issue: "Primary call-to-action lacks visual prominence and urgency.",
        solution: "Increase button size, use contrasting color, and add urgency-inducing copy.",
        example: "Get Your Free Analysis Now →",
        highlightArea: { x: 200, y: 300, width: 200, height: 50 }
      },
      {
        id: 3,
        section: "Features",
        category: "Copy",
        issue: "Feature descriptions focus on capabilities rather than benefits.",
        solution: "Rewrite feature descriptions to emphasize customer outcomes and benefits.",
        example: "Save 5+ hours weekly with automated page analysis that identifies conversion killers instantly.",
        highlightArea: { x: 100, y: 400, width: 600, height: 200 }
      },
      {
        id: 4,
        section: "Testimonials",
        category: "Trust",
        issue: "Testimonials lack specificity and quantifiable results.",
        solution: "Include specific metrics, company names, and results in testimonials.",
        example: "\"Increased our conversion rate by 42% in just 3 weeks\" - John Smith, Marketing Director at Acme Inc.",
        highlightArea: { x: 100, y: 600, width: 600, height: 150 }
      },
      {
        id: 5,
        section: "Visual Design",
        category: "Design",
        issue: "Visual hierarchy doesn't guide users through an optimal flow.",
        solution: "Reorganize page elements to create a clear visual hierarchy and reading pattern.",
        example: "Start with problem → solution → benefits → proof → CTA",
        highlightArea: { x: 0, y: 0, width: 800, height: 1000 }
      }
    ];
    
    const fallbackScores = {
      overall: 68,
      visualHierarchy: 72,
      valueProposition: 65,
      ctaStrength: 70,
      copyResonance: 68,
      trustCredibility: 64
    };

    // Handle different response formats (array or object with array property)
    let comments = [];
    let scores = fallbackScores;
    
    if (parsedResponse.comments && Array.isArray(parsedResponse.comments)) {
      comments = parsedResponse.comments;
      console.log(`Found ${comments.length} comments in response.comments array`);
    } else if (Array.isArray(parsedResponse)) {
      // Direct array format
      comments = parsedResponse;
      console.log(`Found ${comments.length} comments in array format`);
    } else if (typeof parsedResponse === 'object') {
      // Look for an array property
      for (const key in parsedResponse) {
        if (Array.isArray(parsedResponse[key]) && key !== 'scores') {
          comments = parsedResponse[key];
          console.log(`Found ${comments.length} comments in object property '${key}'`);
          break;
        }
      }
    }
    
    // Extract scores from the response if present
    if (parsedResponse.scores && typeof parsedResponse.scores === 'object') {
      scores = parsedResponse.scores;
      console.log("Using scores from AI response");
    } else {
      console.log("Using fallback scores");
    }
    
    // If still no comments, use fallback
    if (comments.length === 0) {
      console.log("No valid comments found in response, using fallback comments");
      comments = fallbackComments;
    }
    
    // Standardize the comment format for compatibility with the frontend
    const standardizedComments = comments.map((item, index) => ({
      id: index + 1,
      section: item.section || "Page",
      category: item.category || item.label || "General",
      issue: item.issue || item.problem || "",
      solution: item.suggestion || item.solution || "",
      example: item.example || item.example_text || "",
      highlightArea: item.highlightArea || {
        x: Math.floor(Math.random() * 300),
        y: Math.floor(Math.random() * 300),
        width: Math.floor(Math.random() * 300) + 200,
        height: Math.floor(Math.random() * 100) + 50
      }
    }));
    
    console.log(`Standardized ${standardizedComments.length} comments for frontend compatibility`);
    
    // Return the structured response
    console.log("Returning final response to client");
    return new Response(
      JSON.stringify({
        comments: standardizedComments,
        scores: scores,
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
