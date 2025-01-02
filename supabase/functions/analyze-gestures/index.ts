import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Received request to analyze-gestures function');
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured');
    }

    const formData = await req.formData();
    const images = formData.getAll('images');
    
    console.log(`Processing ${images.length} gesture frames`);
    if (images.length === 0) {
      throw new Error('No images provided for analysis');
    }

    const analyses = await Promise.all(images.map(async (image: File, index) => {
      console.log(`Processing image ${index + 1}, size: ${image.size} bytes`);
      
      const arrayBuffer = await image.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const requestBody = {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert presentation coach analyzing body language and facial expressions.
            Focus on:
            1. Posture and stance - evaluate confidence and presence
            2. Hand gestures - assess naturalness and effectiveness
            3. Facial expressions - analyze engagement and emotional connection
            4. Eye contact - evaluate audience connection
            5. Overall presence - assess professionalism and authenticity
            
            Provide analysis in JSON format with:
            {
              "gestureType": "pointing|waving|openPalm|other",
              "description": "detailed analysis of the presenter's body language",
              "confidence": 0-100,
              "impact": "positive|negative|neutral",
              "suggestions": ["specific improvements"]
            }`
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Analyze this presenter\'s body language and facial expressions in the context of a professional presentation.' 
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
      };

      console.log(`Sending request to OpenAI for frame ${index + 1}`);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`OpenAI API error for frame ${index + 1}:`, error);
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      console.log(`Received OpenAI response for frame ${index + 1}`);
      
      try {
        const analysis = JSON.parse(data.choices[0].message.content);
        analysis.timestamp = new Date().toISOString();
        console.log(`Successfully parsed analysis for frame ${index + 1}`);
        return analysis;
      } catch (parseError) {
        console.error(`Error parsing OpenAI response for frame ${index + 1}:`, parseError);
        throw new Error('Failed to parse OpenAI response');
      }
    }));

    const metrics = {
      gesturesPerMinute: analyses.length * (60 / 15), // 15 seconds of analysis
      gestureTypes: {
        pointing: 0,
        waving: 0,
        openPalm: 0,
        other: 0
      },
      smoothnessScore: 7.5,
      gestureToSpeechRatio: 0.8,
      aiFeedback: null,
      screenshots: [],
      analysis: analyses.reduce((acc, analysis, index) => {
        acc[index] = analysis;
        return acc;
      }, {})
    };

    analyses.forEach(analysis => {
      if (metrics.gestureTypes.hasOwnProperty(analysis.gestureType)) {
        metrics.gestureTypes[analysis.gestureType]++;
      } else {
        metrics.gestureTypes.other++;
      }
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