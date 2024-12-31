import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.1.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.1';

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
    console.log('Starting speech analysis...');
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const sessionId = formData.get('sessionId') as string;
    const userId = formData.get('userId') as string;

    // Validate required fields
    if (!audioFile) {
      throw new Error('Audio file is required');
    }
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Received request:', {
      audioFileSize: audioFile.size,
      audioFileType: audioFile.type,
      sessionId,
      userId
    });

    // Check OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const configuration = new Configuration({
      apiKey: openAIApiKey,
    });
    const openai = new OpenAIApi(configuration);

    // Process audio file
    console.log('Starting transcription...');
    const transcriptionResponse = await openai.createTranscription(
      audioFile,
      'whisper-1'
    );

    if (!transcriptionResponse.data || !transcriptionResponse.data.text) {
      throw new Error('Failed to get transcription from OpenAI');
    }

    const transcription = transcriptionResponse.data.text;
    console.log('Transcription completed, length:', transcription.length);
    console.log('Sample of transcription:', transcription.substring(0, 100));

    // Analyze transcription with GPT
    console.log('Starting GPT analysis...');
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
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

    if (!completion.data?.choices?.[0]?.message?.content) {
      throw new Error('Failed to get analysis from GPT');
    }

    const analysis = JSON.parse(completion.data.choices[0].message.content);
    console.log('GPT analysis completed:', analysis);

    // Store analysis in Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Storing analysis in database...');
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

    if (insertError) {
      console.error('Error inserting analysis:', insertError);
      throw insertError;
    }

    console.log('Analysis stored successfully');
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-speech function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});