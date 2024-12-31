import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.1.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const sessionId = formData.get('sessionId') as string;
    const userId = formData.get('userId') as string;

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    // Transcribe audio using Whisper
    const transcriptionResponse = await openai.createTranscription(
      audioFile,
      'whisper-1'
    );

    const transcription = transcriptionResponse.data.text;
    console.log('Transcription:', transcription);

    // Analyze transcription with GPT-4
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
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
        { role: "user", content: transcription }
      ],
    });

    const analysis = JSON.parse(completion.data.choices[0].message.content);

    // Store analysis in Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: insertError } = await supabaseClient
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