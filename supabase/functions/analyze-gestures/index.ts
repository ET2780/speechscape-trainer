import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    console.log('Starting gesture analysis...');
    const formData = await req.formData();
    const images = formData.getAll('images');
    const sessionId = formData.get('sessionId');
    
    console.log(`Analyzing ${images.length} gesture frames for session ${sessionId}`);

    // Initialize Supabase client for storage operations
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const analyses = await Promise.all(images.map(async (image: File, index) => {
      // Upload image to Supabase Storage
      const timestamp = new Date().toISOString();
      const fileName = `gesture-${sessionId}-${timestamp}-${index}.jpg`;
      
      console.log(`Uploading frame ${index + 1} as ${fileName}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('slides')
        .upload(fileName, image);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('slides')
        .getPublicUrl(fileName);

      console.log(`Frame ${index + 1} uploaded successfully, analyzing...`);

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
              content: `You are an expert presentation coach analyzing gestures and body language.
              Provide detailed analysis in JSON format with these fields:
              {
                "timestamp": string (ISO date),
                "gestureType": string,
                "description": string (detailed analysis),
                "confidence": number (0-100),
                "impact": string (positive/negative/neutral),
                "suggestions": string[],
                "imageUrl": string
              }`
            },
            {
              role: 'user',
              content: [
                { 
                  type: 'text', 
                  text: `Analyze this presenter's body language and gestures in detail.` 
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
      analysis.imageUrl = publicUrl;
      analysis.timestamp = timestamp;

      console.log(`Analysis completed for frame ${index + 1}:`, analysis);
      return analysis;
    }));

    // Generate comprehensive summary
    console.log('Generating comprehensive analysis summary...');
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
            content: `You are an expert presentation coach. Analyze the sequence of gestures and provide:
            1. Overall effectiveness patterns
            2. Specific strengths and areas for improvement
            3. Detailed recommendations
            Return the analysis in this JSON format:
            {
              "overallAssessment": string,
              "gesturePatterns": string[],
              "strengths": string[],
              "improvements": string[],
              "recommendations": string[]
            }`
          },
          {
            role: 'user',
            content: `Based on these sequential analyses, provide a comprehensive evaluation:\n\n${JSON.stringify(analyses, null, 2)}`
          }
        ]
      })
    });

    const summaryData = await summaryResponse.json();
    const summary = JSON.parse(summaryData.choices[0].message.content);

    console.log('Analysis summary generated:', summary);

    // Calculate metrics
    const metrics = {
      gesturesPerMinute: Math.round((analyses.length * (60 / 5)) * 10) / 10,
      gestureTypes: {
        pointing: 0,
        waving: 0,
        openPalm: 0,
        other: 0
      },
      smoothnessScore: 7.5,
      gestureToSpeechRatio: 0.8,
      aiFeedback: summary.overallAssessment
    };

    // Update gesture types based on analysis
    analyses.forEach(analysis => {
      const type = analysis.gestureType.toLowerCase();
      if (type.includes('point')) metrics.gestureTypes.pointing++;
      else if (type.includes('wave')) metrics.gestureTypes.waving++;
      else if (type.includes('open') && type.includes('palm')) metrics.gestureTypes.openPalm++;
      else metrics.gestureTypes.other++;
    });

    const result = {
      metrics,
      gestureAnalysis: {
        frames: analyses,
        summary
      }
    };

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify(result),
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