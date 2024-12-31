import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcription, sessionId, userId } = await req.json();

    // Analyze speech with GPT-4
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
            content: `You are a speech analysis expert. Analyze the following transcription and provide:
              1. Words per minute (based on average reading speed)
              2. Count of filler words (um, uh, like, you know, etc.)
              3. Tone analysis (confidence score 0-100, energy score 0-100)
              4. Overall score (0-100)
              5. Three specific suggestions for improvement
              
              Respond in JSON format with these keys:
              {
                "wordsPerMinute": number,
                "fillerWordCount": number,
                "toneConfidence": number,
                "toneEnergy": number,
                "overallScore": number,
                "suggestions": string[]
              }`
          },
          { role: 'user', content: transcription }
        ],
      }),
    });

    const analysisData = await response.json();
    const analysis = JSON.parse(analysisData.choices[0].message.content);

    // Store the analysis in Supabase
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const { error: insertError } = await supabase
      .from('performance_reports')
      .insert({
        session_id: sessionId,
        user_id: userId,
        words_per_minute: analysis.wordsPerMinute,
        filler_word_count: analysis.fillerWordCount,
        tone_confidence: analysis.toneConfidence,
        tone_energy: analysis.toneEnergy,
        overall_score: analysis.overallScore,
        suggestions: analysis.suggestions
      });

    if (insertError) throw insertError;

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-speech function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});