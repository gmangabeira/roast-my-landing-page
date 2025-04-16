
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { screenshot_url, page_goal, audience, brand_tone } = await req.json();
    
    if (!screenshot_url) {
      throw new Error('Screenshot URL is required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log(`Analyzing screenshot: ${screenshot_url}`);
    console.log(`Page goal: ${page_goal}, Audience: ${audience}, Brand tone: ${brand_tone}`);
    
    // Fetch the image data
    const imageResponse = await fetch(screenshot_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    // Convert image to base64
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const dataUri = `data:${imageResponse.headers.get('content-type') || 'image/png'};base64,${base64Image}`;
    
    // Prepare the system prompt
    const systemPrompt = `You are a Conversion Rate Optimization expert. Analyze this landing page screenshot for ${page_goal || 'improved conversions'}.
The target audience is ${audience || 'general consumers'} and the brand tone is ${brand_tone || 'professional'}.

For each major section (hero/header, mid-page, CTA, footer, etc), identify:
• ❌ What's wrong: Describe clarity, copy, CTA, design, or trust issues
• ✅ Fix it fast: Suggest an actionable improvement
• ✍️ Example: Provide a revised version of copy or layout that addresses the issue.

Provide the response as a JSON object with a 'feedback' array containing:
- section: Name of the page section
- category: Issue type (Clarity, Copy, CTA, Trust, Design)
- issue: Specific problem description
- solution: Actionable improvement suggestion
- example: Revised copy or layout suggestion
- highlightArea: Optional object with x, y, width, height of the problematic area`;

    // Prepare the user message with the image
    const userMessage = {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this landing page screenshot and provide detailed, actionable feedback to improve conversions. Structure your response as JSON."
        },
        {
          type: "image_url",
          image_url: {
            url: dataUri
          }
        }
      ]
    };

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
          userMessage
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
    console.log("Raw GPT-4o response received");
    
    // Extract and parse the response
    try {
      const rawResponse = openAIData.choices[0].message.content;
      const parsedResponse = JSON.parse(rawResponse);
      
      // Process the parsed response
      const comments = parsedResponse.feedback.map((item, index) => ({
        id: index + 1,
        category: item.category || "General",
        section: item.section || "Page",
        issue: item.issue || "",
        solution: item.solution || "",
        example: item.example || "",
        highlightArea: item.highlightArea || {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
      }));
      
      // Generate scores (simplified scoring logic)
      const categories = [...new Set(comments.map(item => item.category.toLowerCase()))];
      
      const scores = {
        overall: Math.floor(Math.random() * 40) + 60, // Base score between 60-100
        visualHierarchy: categories.includes('design') ? Math.floor(Math.random() * 30) + 70 : 85,
        valueProposition: categories.includes('clarity') ? Math.floor(Math.random() * 30) + 70 : 85,
        ctaStrength: categories.includes('cta') ? Math.floor(Math.random() * 30) + 70 : 85,
        copyResonance: categories.includes('copy') ? Math.floor(Math.random() * 30) + 70 : 85,
        trustCredibility: categories.includes('trust') ? Math.floor(Math.random() * 30) + 70 : 85
      };
      
      // Return the structured response
      return new Response(
        JSON.stringify({
          comments,
          scores,
          rawAnalysis: rawResponse // Include raw analysis for debugging
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
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
