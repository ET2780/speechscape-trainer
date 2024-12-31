import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics } = await req.json();
    
    const prompt = `
      Analyze these gesture metrics and provide actionable feedback:
      - Gestures per minute: ${metrics.gesturesPerMinute}
      - Gesture types distribution: ${JSON.stringify(metrics.gestureTypes)}
      - Smoothness score: ${metrics.smoothnessScore}/10
      - Gesture to speech alignment: ${metrics.gestureToSpeechRatio}%

      Provide specific, constructive feedback about:
      1. Gesture frequency and timing
      2. Variety of gestures used
      3. Smoothness and natural flow
      4. Alignment with speech
      
      Format the response as a concise paragraph with actionable suggestions.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert public speaking coach specializing in gesture analysis. Provide concise, actionable feedback.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify({ feedback: data.choices[0].message.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating gesture feedback:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});