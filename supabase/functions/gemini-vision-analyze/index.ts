// Edge Function: Gemini Vision - Analyse d'images de propriétés
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VisionAnalysisRequest {
  propertyId: number
  imageUrls: string[]
  userId?: string
}

interface VisionAnalysisResponse {
  generalCondition: {
    status: 'excellent' | 'good' | 'fair' | 'poor'
    details: string
  }
  remarkedFeatures: string[]
  recommendedWorks: {
    description: string
    estimatedCost: number
    urgency: 'minor' | 'moderate' | 'urgent'
  }[]
  confidence: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { propertyId, imageUrls, userId }: VisionAnalysisRequest = await req.json()

    if (!propertyId || !imageUrls || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'propertyId and imageUrls are required' }),
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

      if (existingAnalysis && existingAnalysis.vision_analyzed_at) {
        // Return cached analysis if less than 30 days old
        const analyzedAt = new Date(existingAnalysis.vision_analyzed_at)
        const now = new Date()
        const daysDiff = (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24)

        if (daysDiff < 30) {
          return new Response(
            JSON.stringify({
              generalCondition: {
                status: existingAnalysis.general_condition,
                details: existingAnalysis.general_condition_details,
              },
              remarkedFeatures: existingAnalysis.remarked_features || [],
              recommendedWorks: existingAnalysis.recommended_works || [],
              confidence: existingAnalysis.vision_confidence_score || 0.8,
              cached: true,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Convert image URLs to base64 (only first 5 images for performance)
    const imagesToAnalyze = imageUrls.slice(0, 5)
    const imageDataParts = []

    for (const url of imagesToAnalyze) {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

        imageDataParts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64,
          },
        })
      } catch (error) {
        console.error(`Error loading image ${url}:`, error)
      }
    }

    if (imageDataParts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Could not load any images' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build Gemini prompt
    const prompt = `Analyse ces photos d'un bien immobilier et fournis une évaluation détaillée en JSON.

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans texte avant ou après. Format exact :

{
  "generalCondition": {
    "status": "excellent" | "good" | "fair" | "poor",
    "details": "Description détaillée de l'état général (toiture, isolation, électricité, plomberie, etc.)"
  },
  "remarkedFeatures": [
    "Liste des éléments remarquables (parquet d'époque, moulures, cheminée, etc.)"
  ],
  "recommendedWorks": [
    {
      "description": "Description du travail",
      "estimatedCost": 3500,
      "urgency": "minor" | "moderate" | "urgent"
    }
  ],
  "confidence": 0.85
}

Critères d'évaluation :
- "excellent" : Très bon état, travaux minimes
- "good" : Bon état général, quelques travaux d'entretien
- "fair" : État correct, travaux de rénovation nécessaires
- "poor" : Mauvais état, travaux importants requis

Pour les travaux, estime les coûts en euros de manière réaliste (prix France 2025).
Sois précis et factuel. Indique ton niveau de confiance (0-1).`

    // Call Gemini Vision API
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              ...imageDataParts,
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 1,
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

    // DEBUG: Log full Gemini response
    console.log('[gemini-vision-analyze] Gemini response:', JSON.stringify(geminiData, null, 2))

    // Check if candidates exist
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('[gemini-vision-analyze] No candidates in Gemini response:', geminiData)
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
      console.error('[gemini-vision-analyze] Empty text response from Gemini')
      return new Response(
        JSON.stringify({ error: 'Empty response from Gemini', details: geminiData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse JSON response from Gemini
    let analysisResult: VisionAnalysisResponse

    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      analysisResult = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('[gemini-vision-analyze] Failed to parse Gemini response:', generatedText)
      return new Response(
        JSON.stringify({ error: 'Failed to parse Gemini response', raw: generatedText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save to database if userId provided
    if (userId) {
      await supabaseClient.from('ai_property_analysis').upsert(
        {
          property_id: propertyId,
          user_id: userId,
          general_condition: analysisResult.generalCondition.status,
          general_condition_details: analysisResult.generalCondition.details,
          remarked_features: analysisResult.remarkedFeatures,
          recommended_works: analysisResult.recommendedWorks,
          total_renovation_budget: analysisResult.recommendedWorks.reduce(
            (sum, work) => sum + work.estimatedCost,
            0
          ),
          vision_confidence_score: analysisResult.confidence,
          vision_analyzed_at: new Date().toISOString(),
          vision_model_version: 'gemini-2.5-flash',
        },
        { onConflict: 'property_id,user_id' }
      )
    }

    return new Response(JSON.stringify({ ...analysisResult, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in gemini-vision-analyze:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
