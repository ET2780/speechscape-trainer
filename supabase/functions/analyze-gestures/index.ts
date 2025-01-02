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
    
    console.log(`Processing ${images.length} gesture frames with body tracking data`);
    if (images.length === 0) {
      throw new Error('No images provided for analysis');
    }

    const analyses = await Promise.all(images.map(async (image: File, index) => {
      console.log(`Processing image ${index + 1} with body tracking, size: ${image.size} bytes`);
      
      const arrayBuffer = await image.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const requestBody = {
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert presentation coach analyzing body language and facial expressions.
            The images provided include body tracking data visualized as red highlights.
            Focus on:
            1. Body positioning and movement patterns
            2. Gesture amplitude and frequency
            3. Facial expressions and engagement
            4. Stage presence and space utilization
            5. Overall body language confidence
            
            Provide analysis in JSON format with:
            {
              "gestureType": "pointing|waving|openPalm|other",
              "description": "detailed analysis including tracked body movements",
              "confidence": 0-100,
              "impact": "positive|negative|neutral",
              "suggestions": ["specific improvements"],
              "movementPatterns": ["observed patterns"]
            }`
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Analyze this presenter\'s body language, facial expressions, and movement patterns (highlighted in red).' 
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      };

      console.log(`Sending request to OpenAI for frame ${index + 1} with body tracking analysis`);
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
      console.log(`Received OpenAI response for frame ${index + 1} with body tracking analysis`);
      
      try {
        const analysis = JSON.parse(data.choices[0].message.content);
        analysis.timestamp = new Date().toISOString();
        console.log(`Successfully parsed analysis for frame ${index + 1} with movement patterns`);
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
      smoothnessScore: calculateSmoothnessScore(analyses),
      gestureToSpeechRatio: 0.8,
      aiFeedback: generateOverallFeedback(analyses),
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

    console.log('Final metrics calculated with body tracking analysis:', metrics);

    return new Response(
      JSON.stringify({ metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing gestures with body tracking:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculateSmoothnessScore(analyses: any[]): number {
  // Calculate smoothness based on movement patterns
  const hasConsistentMovements = analyses.some(a => 
    a.movementPatterns && a.movementPatterns.length > 0
  );
  return hasConsistentMovements ? 8.5 : 6.0;
}

function generateOverallFeedback(analyses: any[]): string {
  const patterns = analyses.flatMap(a => a.movementPatterns || []);
  const uniquePatterns = [...new Set(patterns)];
  
  if (uniquePatterns.length === 0) {
    return "No significant movement patterns detected. Consider being more dynamic in your presentation.";
  }
  
  return `Observed movement patterns: ${uniquePatterns.join(', ')}. ` +
         `Overall, your body language shows ${analyses[0]?.impact || 'mixed'} impact.`;
}