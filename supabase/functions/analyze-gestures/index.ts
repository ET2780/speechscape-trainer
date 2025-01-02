import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Received request to analyze-gestures function');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frames } = await req.json();
    console.log(`Processing ${frames?.length || 0} gesture frames`);
    
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      console.error('Invalid or missing frames in request');
      throw new Error('No frames provided for analysis');
    }

    // Log the first frame's length to verify data
    console.log('First frame data length:', frames[0]?.length || 0);

    // Mock analysis for testing
    const mockMetrics = {
      gesturesPerMinute: frames.length * (60 / 15), // 15 seconds of analysis
      gestureTypes: {
        pointing: 1,
        waving: 1,
        openPalm: 1,
        other: 1
      },
      smoothnessScore: 8.5,
      gestureToSpeechRatio: 75,
      analysis: frames.map((_, index) => ({
        gestureType: 'pointing',
        description: 'Test gesture analysis',
        confidence: 85,
        impact: 'positive',
        suggestions: ['Keep gestures natural']
      }))
    };

    console.log('Analysis completed successfully:', mockMetrics);

    return new Response(
      JSON.stringify({ metrics: mockMetrics }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-gestures function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});