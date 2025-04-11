
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const assistantId = "asst_MJmhdAr0n0OQCYOwukGmqgUR";

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

    // Create a new thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const errorData = await threadResponse.json();
      throw new Error(`Failed to create thread: ${JSON.stringify(errorData)}`);
    }

    const threadData = await threadResponse.json();
    const threadId = threadData.id;
    console.log(`Created thread with ID: ${threadId}`);

    // Add a message to the thread
    const messageContent = `
      Please analyze this landing page section and provide detailed feedback:
      
      Section Type: ${section}
      Current Performance Score: ${score}/100
      Page Context: ${context}
      Specific Zone: ${zone}
      
      I need specific critique on what's wrong with this section and clear suggestions on how to fix it.
    `;

    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({
        role: 'user',
        content: messageContent
      }),
    });

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json();
      throw new Error(`Failed to add message: ${JSON.stringify(errorData)}`);
    }

    console.log('Added message to thread');

    // Run the assistant on the thread
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      }),
    });

    if (!runResponse.ok) {
      const errorData = await runResponse.json();
      throw new Error(`Failed to run assistant: ${JSON.stringify(errorData)}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;
    console.log(`Started run with ID: ${runId}`);

    // Poll for the run to complete
    let runStatus = 'in_progress';
    let attempts = 0;
    const maxAttempts = 30; // Maximum polling attempts (30 * 1s = 30 seconds max)
    
    while (runStatus !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polling
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        },
      });
      
      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(`Failed to get run status: ${JSON.stringify(errorData)}`);
      }
      
      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      console.log(`Run status: ${runStatus} (attempt ${attempts + 1})`);
      
      if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
        throw new Error(`Run failed with status: ${runStatus}`);
      }
      
      attempts++;
    }
    
    if (runStatus !== 'completed') {
      throw new Error('Assistant run timed out or did not complete successfully');
    }

    // Retrieve the messages from the thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      },
    });

    if (!messagesResponse.ok) {
      const errorData = await messagesResponse.json();
      throw new Error(`Failed to retrieve messages: ${JSON.stringify(errorData)}`);
    }

    const messagesData = await messagesResponse.json();
    
    // Get the assistant's response (the first message from the assistant in the thread)
    const assistantMessages = messagesData.data.filter(msg => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      throw new Error('No assistant response found');
    }
    
    // Get the most recent message from the assistant
    const assistantMessage = assistantMessages[0];
    const responseContent = assistantMessage.content[0].text.value;
    
    console.log('Assistant response:', responseContent);
    
    // Parse the response to extract structured feedback
    // Looking for patterns like "❌ What's wrong:" and "✅ Fix it fast:"
    let critique = '';
    let suggestion = '';
    
    const lines = responseContent.split('\n');
    for (const line of lines) {
      if (line.includes('❌') || line.toLowerCase().includes("what's wrong")) {
        critique = line.replace(/❌\s*What's wrong:?/i, '').trim();
      } else if (line.includes('✅') || line.toLowerCase().includes("fix it fast")) {
        suggestion = line.replace(/✅\s*Fix it fast:?/i, '').trim();
      }
    }
    
    // If we couldn't parse specific sections, use the whole response
    if (!critique && !suggestion) {
      critique = "Analysis of section";
      suggestion = responseContent;
    }
    
    // Format the response to match existing frontend expectations
    return new Response(
      JSON.stringify({
        result: `❌ What's wrong: ${critique}\n✅ Fix it fast: ${suggestion}`,
        section,
        zone,
        critique,
        suggestion
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
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
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
