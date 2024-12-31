import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const formData = await req.formData();
    const images = formData.getAll('images');
    
    console.log('Analyzing gestures from', images.length, 'images');

    const analyses = await Promise.all(images.map(async (image: File, index) => {
      const base64Image = await image.arrayBuffer().then(buffer => 
        btoa(String.fromCharCode(...new Uint8Array(buffer)))
      );

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
              content: 'You are an expert in analyzing body language and gestures in presentations. Analyze the image and provide detailed feedback about the presenter\'s posture, hand gestures, and overall body language. Focus on professional presentation aspects.'
            },
            {
              role: 'user',
              content: [
                { 
                  type: 'text', 
                  text: 'Analyze this presenter\'s body language and gestures. Provide specific observations about hand movements, posture, and overall presence.' 
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      console.log('Analysis completed for image', index + 1);
      return data.choices[0].message.content;
    }));

    // Aggregate all analyses into a summary
    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an expert in analyzing presentation body language. Create a concise summary of multiple gesture analyses and provide actionable feedback.'
          },
          {
            role: 'user',
            content: `Summarize these gesture analyses and provide overall feedback: ${JSON.stringify(analyses)}`
          }
        ]
      })
    });

    const summaryData = await summaryResponse.json();
    const summary = summaryData.choices[0].message.content;

    // Calculate metrics based on the analyses
    const metrics = {
      gesturesPerMinute: analyses.length * (60 / 5), // 5 seconds between captures
      gestureTypes: {
        pointing: 0,
        waving: 0,
        openPalm: 0,
        other: 0
      },
      smoothnessScore: 7.5, // Default score, could be improved with more sophisticated analysis
      gestureToSpeechRatio: 0.8, // Default ratio
      aiFeedback: summary
    };

    return new Response(
      JSON.stringify({ analyses, summary, metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing gestures:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});