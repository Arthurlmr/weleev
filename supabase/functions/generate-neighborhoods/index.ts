// Edge Function: Generate Neighborhoods - Génération IA des quartiers pour une ville
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_PRO_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  city: string
  postalCode?: string
}

interface Neighborhood {
  name: string
  zone: string
  type: 'quartier' | 'commune' | 'secteur'
  description?: string
}

interface GenerateResponse {
  city: string
  postalCode: string | null
  neighborhoods: Neighborhood[]
  cached: boolean
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { city, postalCode }: GenerateRequest = await req.json()

    if (!city) {
      return new Response(
        JSON.stringify({ error: 'city is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check if neighborhoods already exist for this city (cache)
    const { data: existingNeighborhoods, error: fetchError } = await supabaseClient
      .from('city_neighborhoods')
      .select('name, zone, type, description')
      .eq('city', city)

    if (existingNeighborhoods && existingNeighborhoods.length > 0) {
      console.log(`Returning cached neighborhoods for ${city} (${existingNeighborhoods.length} found)`)
      return new Response(
        JSON.stringify({
          city,
          postalCode: postalCode || null,
          neighborhoods: existingNeighborhoods,
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate neighborhoods using Gemini 2.5 Pro
    const prompt = `Tu es un expert en géographie urbaine française avec une connaissance approfondie de toutes les villes de France.

Pour la ville de "${city}"${postalCode ? ` (code postal: ${postalCode})` : ''}, génère une liste EXHAUSTIVE, PRÉCISE et COMPLÈTE de tous les quartiers, zones et secteurs.

CRITÈRES OBLIGATOIRES :
1. Inclure TOUS les quartiers officiels et reconnus
2. Inclure les secteurs géographiques principaux (Nord, Sud, Est, Ouest, Centre si applicable)
3. Inclure les communes limitrophes importantes qui font partie de l'agglomération
4. Pour chaque quartier, préciser :
   - Le nom exact et officiel
   - La zone parent (nord, sud, est, ouest, centre, limitrophe)
   - Le type (quartier, commune, secteur)
   - Une brève description en 5-10 mots maximum (optionnel mais recommandé)

IMPORTANT :
- Sois exhaustif : mieux vaut trop de quartiers que pas assez
- Utilise les noms officiels et reconnus par les habitants
- Pour les grandes villes, inclure minimum 20-30 quartiers
- Pour les petites villes, inclure minimum 5-10 quartiers
- Toujours inclure les communes limitrophes importantes

RÉPONDS UNIQUEMENT EN JSON VALIDE, sans markdown :

{
  "neighborhoods": [
    {
      "name": "Centre-ville",
      "zone": "centre",
      "type": "quartier",
      "description": "Quartier historique et commercial"
    },
    {
      "name": "Chauray",
      "zone": "limitrophe",
      "type": "commune",
      "description": "Commune limitrophe, zone commerciale"
    }
  ]
}

Si tu ne connais pas cette ville ou qu'elle n'existe pas, réponds :
{
  "error": "Ville inconnue ou introuvable",
  "neighborhoods": []
}`

    console.log(`Calling Gemini 2.5 Pro to generate neighborhoods for ${city}...`)

    // Call Gemini 2.5 Pro
    const geminiResponse = await fetch(`${GEMINI_PRO_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // Basse température pour plus de précision
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text()
      console.error('Gemini API error:', error)
      return new Response(
        JSON.stringify({ error: 'Gemini API error', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = await geminiResponse.json()

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('No candidates in Gemini response:', geminiData)
      return new Response(
        JSON.stringify({ error: 'Empty response from Gemini', details: geminiData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const generatedText = geminiData.candidates[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON
    let aiResponse: { neighborhoods: Neighborhood[]; error?: string }
    try {
      const cleanedText = generatedText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()
      aiResponse = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', generatedText)
      return new Response(
        JSON.stringify({ error: 'Failed to parse Gemini response', raw: generatedText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for error in AI response
    if (aiResponse.error || !aiResponse.neighborhoods || aiResponse.neighborhoods.length === 0) {
      return new Response(
        JSON.stringify({
          error: aiResponse.error || 'No neighborhoods generated',
          city,
          neighborhoods: [],
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Generated ${aiResponse.neighborhoods.length} neighborhoods for ${city}`)

    // Insert neighborhoods into database
    const neighborhoodsToInsert = aiResponse.neighborhoods.map((n) => ({
      city,
      postal_code: postalCode || null,
      name: n.name,
      zone: n.zone,
      type: n.type,
      description: n.description || null,
    }))

    const { data: insertedData, error: insertError } = await supabaseClient
      .from('city_neighborhoods')
      .insert(neighborhoodsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting neighborhoods:', insertError)
      // Continue even if insert fails (might be duplicate)
    } else {
      console.log(`Successfully inserted ${insertedData?.length || 0} neighborhoods into DB`)
    }

    // Return response
    const response: GenerateResponse = {
      city,
      postalCode: postalCode || null,
      neighborhoods: aiResponse.neighborhoods,
      cached: false,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in generate-neighborhoods:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
