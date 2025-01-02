import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('analyze-gestures function invoked');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType?.includes('application/json')) {
      console.error('Invalid content type:', contentType);
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await req.json();
    console.log('Request body structure:', Object.keys(body));
    console.log('Frames array length:', body.frames?.length);
    
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

    // Validate frame data
    const validFrames = body.frames.every((frame: string) => 
      typeof frame === 'string' && frame.length > 0
    );

    if (!validFrames) {
      console.error('Invalid frame data detected');
      return new Response(
        JSON.stringify({ error: 'Invalid frame data format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing', body.frames.length, 'valid frames');
    
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
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.name,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});