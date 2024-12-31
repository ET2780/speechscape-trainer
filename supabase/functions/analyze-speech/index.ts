import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.1.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHUNK_SIZE = 25 * 1024 * 1024; // 25MB chunks for Whisper API

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

    if (!audioFile || !sessionId || !userId) {
      console.error('Missing required fields:', { audioFile: !!audioFile, sessionId, userId });
      throw new Error('Missing required fields');
    }

    console.log('Received audio file:', {
      size: audioFile.size,
      type: audioFile.type,
      sessionId,
      userId
    });

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    // Process audio in chunks if needed
    let fullTranscription = '';
    if (audioFile.size > CHUNK_SIZE) {
      console.log('Large file detected, processing in chunks...');
      const chunks = Math.ceil(audioFile.size / CHUNK_SIZE);
      
      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, audioFile.size);
        const chunk = audioFile.slice(start, end, audioFile.type);
        
        console.log(`Processing chunk ${i + 1}/${chunks}`);
        const chunkResponse = await openai.createTranscription(
          chunk,
          'whisper-1'
        );
        fullTranscription += chunkResponse.data.text + ' ';
      }
    } else {
      console.log('Processing single file...');
      const transcriptionResponse = await openai.createTranscription(
        audioFile,
        'whisper-1'
      );
      fullTranscription = transcriptionResponse.data.text;
    }

    console.log('Transcription completed:', fullTranscription.substring(0, 100) + '...');

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
        { role: "user", content: fullTranscription }
      ],
    });

    const analysis = JSON.parse(completion.data.choices[0].message.content);
    console.log('Analysis completed:', analysis);

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

    if (insertError) {
      console.error('Error inserting analysis:', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-speech function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});