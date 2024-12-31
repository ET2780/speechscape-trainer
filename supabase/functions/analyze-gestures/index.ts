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
    console.log('Starting gesture analysis...');
    const formData = await req.formData();
    const images = formData.getAll('images');
    
    console.log(`Analyzing ${images.length} gesture frames`);

    const analyses = await Promise.all(images.map(async (image: File, index) => {
      const base64Image = await image.arrayBuffer().then(buffer => 
        btoa(String.fromCharCode(...new Uint8Array(buffer)))
      );

      console.log(`Analyzing frame ${index + 1} with OpenAI Vision...`);
      
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
              content: `You are an expert presentation coach analyzing body language and facial expressions for a TED-style talk.
              Focus on: posture, hand gestures, facial expressions, eye contact, and overall stage presence.
              Provide detailed analysis in JSON format with these fields:
              {
                "timestamp": string (ISO date),
                "gestureType": string (pointing/waving/openPalm/other),
                "description": string (detailed analysis),
                "confidence": number (0-100),
                "impact": string (positive/negative/neutral),
                "suggestions": string[]
              }`
            },
            {
              role: 'user',
              content: [
                { 
                  type: 'text', 
                  text: `Analyze this presenter's body language and facial expressions in detail.` 
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
      const analysis = JSON.parse(data.choices[0].message.content);
      analysis.timestamp = new Date().toISOString();

      console.log(`Analysis completed for frame ${index + 1}:`, analysis);
      return analysis;
    }));

    // Calculate metrics based on analyses
    const metrics = {
      gesturesPerMinute: analyses.length * (60 / 5), // Assuming 5-second intervals
      gestureTypes: {
        pointing: 0,
        waving: 0,
        openPalm: 0,
        other: 0
      },
      smoothnessScore: 7.5, // Default score
      gestureToSpeechRatio: 0.8, // Default ratio
      aiFeedback: null,
      screenshots: [],
      analysis: {}
    };

    // Update gesture types based on analysis
    analyses.forEach((analysis, index) => {
      const type = analysis.gestureType.toLowerCase();
      if (metrics.gestureTypes.hasOwnProperty(type)) {
        metrics.gestureTypes[type]++;
      } else {
        metrics.gestureTypes.other++;
      }
      metrics.analysis[index] = analysis;
    });

    console.log('Final metrics calculated:', metrics);

    return new Response(
      JSON.stringify({ metrics }),
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