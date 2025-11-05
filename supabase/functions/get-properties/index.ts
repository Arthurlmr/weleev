import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const MELO_API_URL = 'https://api.notif.immo';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const params = await req.json();

    // Get API key from environment
    const apiKey = Deno.env.get('MELO_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'MELO_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build URL with query parameters
    const url = new URL(`${MELO_API_URL}/documents/properties`);

    // Add all parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach((item: any) => {
          url.searchParams.append(`${key}[]`, item.toString());
        });
      } else if (typeof value === 'object') {
        url.searchParams.set(key, JSON.stringify(value));
      } else {
        url.searchParams.set(key, value.toString());
      }
    });

    // Default parameters
    if (!params.page) url.searchParams.set('page', '1');
    if (!params.itemsPerPage) url.searchParams.set('itemsPerPage', '10');
    if (!params.hasOwnProperty('expired')) url.searchParams.set('expired', 'false');
    if (!params.hasOwnProperty('withCoherentPrice')) url.searchParams.set('withCoherentPrice', 'true');
    if (!params['order[createdAt]']) url.searchParams.set('order[createdAt]', 'desc');

    // Call Melo API
    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Melo API error: ${response.statusText}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
