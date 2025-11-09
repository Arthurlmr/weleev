// Edge Function: Gemini NLP - Extraction de données structurées
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractDataRequest {
  propertyId: number
  description: string
  userId?: string
}

interface ExtractDataResponse {
  structuredData: {
    kitchen?: string
    bathrooms?: string
    heating?: string
    parking?: string
    orientation?: string
    view?: string
    floor?: string
    elevator?: string
    balcony?: string
    terrace?: string
    garden?: string
    cellar?: string
  }
  tags: string[]
  missingInfo: string[]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { propertyId, description, userId }: ExtractDataRequest = await req.json()

    if (!propertyId || !description) {
      return new Response(
        JSON.stringify({ error: 'propertyId and description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already analyzed (cache)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check cache
    if (userId) {
      const { data: existingAnalysis } = await supabaseClient
        .from('ai_property_analysis')
        .select('*')
        .eq('property_id', propertyId)
        .eq('user_id', userId)
        .single()

      if (existingAnalysis && existingAnalysis.nlp_analyzed_at) {
        // Return cached analysis if less than 30 days old
        const analyzedAt = new Date(existingAnalysis.nlp_analyzed_at)
        const now = new Date()
        const daysDiff = (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24)

        if (daysDiff < 30) {
          return new Response(
            JSON.stringify({
              structuredData: existingAnalysis.structured_data || {},
              tags: [], // Tags are stored in melo_properties.tags
              missingInfo: [],
              cached: true,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Build Gemini prompt
    const prompt = `Extrait des données structurées de cette description immobilière.

Description:
${description}

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans texte avant ou après. Format exact :

{
  "structuredData": {
    "kitchen": "Description cuisine si mentionnée (ex: Équipée moderne, Semi-équipée, Américaine)",
    "bathrooms": "Nombre et type de salles de bain/d'eau (ex: 1 salle de bain + 1 salle d'eau)",
    "heating": "Type de chauffage (ex: Gaz individuel, Électrique, Pompe à chaleur)",
    "parking": "Info stationnement (ex: Garage, Place de parking, Box fermé)",
    "orientation": "Orientation si mentionnée (ex: Sud, Sud-Ouest)",
    "view": "Vue si mentionnée (ex: Dégagée, Jardin, Monument)",
    "floor": "Étage si mentionné (ex: 3ème étage, Rez-de-chaussée)",
    "elevator": "Ascenseur (ex: Oui, Non)",
    "balcony": "Balcon si mentionné (ex: 10m²)",
    "terrace": "Terrasse si mentionnée (ex: 25m²)",
    "garden": "Jardin si mentionné (ex: 100m² privatif)",
    "cellar": "Cave/cellier si mentionné (ex: Cave)"
  },
  "tags": [
    "Liste de tags pertinents (ex: Rénové, Neuf, Lumineux, Calme, Parquet, Cheminée, Vue dégagée)"
  ],
  "missingInfo": [
    "Liste des informations importantes manquantes (ex: DPE, Nombre de chambres, Surface exacte)"
  ]
}

N'inclus que les champs où l'information est explicitement mentionnée. Sois précis et factuel.
Pour les tags, limite à 5-7 tags les plus pertinents.`

    // Call Gemini NLP API
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
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

    // DEBUG: Log full Gemini response
    console.log('[gemini-extract-data] Gemini response:', JSON.stringify(geminiData, null, 2))

    // Check if candidates exist
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('[gemini-extract-data] No candidates in Gemini response:', geminiData)
      return new Response(
        JSON.stringify({
          error: 'Gemini returned no candidates (possibly blocked by safety filters)',
          details: geminiData,
          promptFeedback: geminiData.promptFeedback
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const generatedText = geminiData.candidates[0]?.content?.parts?.[0]?.text || ''

    if (!generatedText) {
      console.error('[gemini-extract-data] Empty text response from Gemini')
      return new Response(
        JSON.stringify({ error: 'Empty response from Gemini', details: geminiData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse JSON response from Gemini
    let extractionResult: ExtractDataResponse

    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      extractionResult = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('[gemini-extract-data] Failed to parse Gemini response:', generatedText)
      return new Response(
        JSON.stringify({ error: 'Failed to parse Gemini response', raw: generatedText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save to database if userId provided
    if (userId) {
      // Update ai_property_analysis
      await supabaseClient.from('ai_property_analysis').upsert(
        {
          property_id: propertyId,
          user_id: userId,
          structured_data: extractionResult.structuredData,
          nlp_analyzed_at: new Date().toISOString(),
          nlp_model_version: 'gemini-2.5-flash',
          nlp_confidence_score: 0.9, // NLP is generally high confidence
        },
        { onConflict: 'property_id,user_id' }
      )

      // Update melo_properties tags
      if (extractionResult.tags.length > 0) {
        await supabaseClient
          .from('melo_properties')
          .update({ tags: extractionResult.tags })
          .eq('id', propertyId)
      }
    }

    return new Response(JSON.stringify({ ...extractionResult, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in gemini-extract-data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
