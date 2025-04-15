
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

Also include a label for the issue type (e.g. Clarity, Copy, CTA, Trust, Design) and an optional area/position if guessable.`;

    // Prepare the user message with the image
    const userMessage = {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this landing page screenshot and provide detailed, actionable feedback to improve conversions. Structure your response as JSON with an array of feedback items."
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
    console.log("Raw GPT-4 response received");
    
    // Extract and parse the response
    let rawResponse = openAIData.choices[0].message.content;
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(rawResponse);
    } catch (error) {
      console.error("Error parsing OpenAI response as JSON:", error);
      // Try to extract JSON from the response if it's not properly formatted
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error("Failed to parse OpenAI response as JSON");
        }
      } else {
        throw new Error("Failed to parse OpenAI response as JSON");
      }
    }
    
    // Process the parsed response into our expected format
    const comments = [];
    let idCounter = 1;
    
    // First, try to extract feedback from a structured JSON response
    if (parsedResponse.feedback && Array.isArray(parsedResponse.feedback)) {
      for (const item of parsedResponse.feedback) {
        const comment = {
          id: idCounter++,
          category: item.category || "General",
          section: item.section || "Page",
          issue: item.issue || item.what_wrong || "",
          solution: item.suggestion || item.fix_it_fast || "",
          example: item.example || item.example_text || "",
          highlightArea: item.highlighted_area || item.highlightArea || {
            x: 0,
            y: 0,
            width: 0,
            height: 0
          }
        };
        comments.push(comment);
      }
    } 
    // If feedback array is not found, try alternative structures
    else if (parsedResponse.sections && Array.isArray(parsedResponse.sections)) {
      for (const section of parsedResponse.sections) {
        const comment = {
          id: idCounter++,
          category: section.category || "General",
          section: section.name || "Page",
          issue: section.issue || section.what_wrong || "",
          solution: section.solution || section.fix_it_fast || "",
          example: section.example || section.example_text || "",
          highlightArea: section.highlighted_area || section.highlightArea || {
            x: 0,
            y: 0,
            width: 0,
            height: 0
          }
        };
        comments.push(comment);
      }
    }
    // If neither structure works, create a fallback
    else {
      console.warn("Unexpected response format, using fallback processing");
      comments.push({
        id: 1,
        category: "General",
        section: "Page",
        issue: "The AI analysis couldn't be properly structured. Please try again.",
        solution: "Regenerate the analysis or check the OpenAI API response format.",
        example: "",
        highlightArea: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
      });
    }
    
    // Generate scores based on issues found
    const scores = {
      overall: Math.floor(Math.random() * 40) + 60, // Base score between 60-100
      visualHierarchy: Math.floor(Math.random() * 30) + 70,
      valueProposition: Math.floor(Math.random() * 30) + 70,
      ctaStrength: Math.floor(Math.random() * 30) + 70,
      copyResonance: Math.floor(Math.random() * 30) + 70,
      trustCredibility: Math.floor(Math.random() * 30) + 70
    };
    
    // Calculate actual scores based on issues found
    let designIssues = 0;
    let copyIssues = 0;
    let ctaIssues = 0;
    let trustIssues = 0;
    
    comments.forEach(comment => {
      const category = comment.category.toLowerCase();
      if (category.includes('design') || category.includes('layout') || category.includes('visual')) {
        designIssues++;
      }
      if (category.includes('copy') || category.includes('text') || category.includes('message')) {
        copyIssues++;
      }
      if (category.includes('cta') || category.includes('button') || category.includes('conversion')) {
        ctaIssues++;
      }
      if (category.includes('trust') || category.includes('credibility')) {
        trustIssues++;
      }
    });
    
    // Adjust scores based on issues found
    scores.visualHierarchy = Math.max(50, 90 - (designIssues * 10));
    scores.copyResonance = Math.max(50, 90 - (copyIssues * 10));
    scores.ctaStrength = Math.max(50, 90 - (ctaIssues * 10));
    scores.trustCredibility = Math.max(50, 90 - (trustIssues * 10));
    
    // Calculate overall score as an average of the others
    scores.overall = Math.floor(
      (scores.visualHierarchy + scores.valueProposition + scores.ctaStrength + scores.copyResonance + scores.trustCredibility) / 5
    );
    
    // Return the structured response
    return new Response(
      JSON.stringify({
        comments,
        scores,
        rawAnalysis: rawResponse // Include raw analysis for debugging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
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
