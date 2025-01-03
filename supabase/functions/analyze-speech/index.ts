import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";

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

    const openai = new OpenAI({
      apiKey: openAIApiKey,
    });

    // Process audio file
    console.log('Starting transcription...');
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: new File([uint8Array], audioFile.name, { type: audioFile.type }),
      model: "whisper-1",
    });

    if (!transcriptionResponse || !transcriptionResponse.text) {
      throw new Error('Failed to get transcription from OpenAI');
    }

    const transcription = transcriptionResponse.text;
    console.log('Transcription completed, length:', transcription.length);
    console.log('Sample of transcription:', transcription.substring(0, 100));

    // Analyze transcription with GPT
    console.log('Starting GPT analysis...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a speech analysis expert. Analyze the following transcription and provide metrics in a strict JSON format with these exact keys and value types:
{
  "wordsPerMinute": number,
  "fillerWordCount": number,
  "toneConfidence": number,
  "toneEnergy": number,
  "overallScore": number,
  "suggestions": string[]
}
Do not include any additional text, markdown formatting, or explanation - only return the JSON object.`
        },
        { role: "user", content: transcription }
      ],
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('Failed to get analysis from GPT');
    }

    let analysisText = completion.choices[0].message.content.trim();
    
    // Remove any potential markdown code block indicators
    analysisText = analysisText.replace(/^```json\s*/, '').replace(/```$/, '');
    
    try {
      const analysis = JSON.parse(analysisText);
      console.log('GPT analysis completed:', analysis);

      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing GPT response:', parseError);
      console.error('Raw GPT response:', analysisText);
      throw new Error('Failed to parse GPT analysis response');
    }
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