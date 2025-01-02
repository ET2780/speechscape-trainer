import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('analyze-gestures function invoked');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const body = await req.json();
    console.log('Received request body:', body);

    if (!body.frames || !Array.isArray(body.frames)) {
      console.error('Invalid or missing frames in request');
      return new Response(
        JSON.stringify({ error: 'frames array is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing', body.frames.length, 'frames');
    
    // Mock analysis for testing
    const mockMetrics = {
      gesturesPerMinute: body.frames.length * (60 / 15),
      gestureTypes: {
        pointing: 1,
        waving: 1,
        openPalm: 1,
        other: 1
      },
      smoothnessScore: 8.5,
      gestureToSpeechRatio: 75
    };

    console.log('Analysis completed, returning metrics:', mockMetrics);

    return new Response(
      JSON.stringify({ metrics: mockMetrics }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});