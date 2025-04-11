
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
    // Parse the request body
    const { section, score, context, zone } = await req.json();

    // Construct a detailed prompt for roast feedback
    const prompt = `You are a conversion rate optimization (CRO) expert analyzing a landing page section.

Section Details:
- Section Type: ${section}
- Current Performance Score: ${score}/100
- Page Context: ${context}
- Specific Zone: ${zone}

Provide a professional, actionable roast with:
❌ What's wrong: Identify specific issues undermining conversion potential
✅ Fix it fast: Provide 1-2 concrete, implementable recommendations to improve the section

Response Format:
- Be specific and data-driven
- Focus on conversion impact
- Use clear, concise language
- Avoid generic advice`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a conversion rate optimization expert.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 250,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    const roastFeedback = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      result: roastFeedback 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  } catch (error) {
    console.error('Error in generate-roast function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate roast feedback', 
      details: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});
