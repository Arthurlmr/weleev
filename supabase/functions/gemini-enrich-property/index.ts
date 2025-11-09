// Edge Function: Gemini Enrich Property - Extract missing info from description
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnrichPropertyRequest {
  propertyData: {
    title?: string
    price?: number
    surface?: number
    rooms?: number
    bedrooms?: number
    bathrooms?: number
    floor?: number
    city?: string
    zipcode?: string
    description: string
    property_type?: string
    dpe_category?: string
    construction_year?: number
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[gemini-enrich-property] Starting enrichment...')

    // Get request body
    const { propertyData }: EnrichPropertyRequest = await req.json()

    if (!propertyData || !propertyData.description) {
      return new Response(
        JSON.stringify({ error: 'propertyData with description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[gemini-enrich-property] Property data received:', {
      hasDescription: !!propertyData.description,
      descriptionLength: propertyData.description?.length || 0,
      knownFields: Object.keys(propertyData).filter(k => propertyData[k as keyof typeof propertyData] != null)
    })

    // Build comprehensive prompt
    const knownInfo = `
**Informations déjà connues :**
- Titre: ${propertyData.title || 'Non renseigné'}
- Prix: ${propertyData.price ? propertyData.price.toLocaleString('fr-FR') + ' €' : 'Non renseigné'}
- Surface: ${propertyData.surface ? propertyData.surface + ' m²' : 'Non renseigné'}
- Pièces: ${propertyData.rooms || 'Non renseigné'}
- Chambres: ${propertyData.bedrooms || 'Non renseigné'}
- Salles de bain: ${propertyData.bathrooms || 'Non renseigné'}
- Étage: ${propertyData.floor !== null && propertyData.floor !== undefined ? propertyData.floor : 'Non renseigné'}
- Ville: ${propertyData.city || 'Non renseigné'}
- Code postal: ${propertyData.zipcode || 'Non renseigné'}
- Type de bien: ${propertyData.property_type || 'Non renseigné'}
- DPE: ${propertyData.dpe_category || 'Non renseigné'}
- Année de construction: ${propertyData.construction_year || 'Non renseigné'}
`.trim()

    const prompt = `Tu es un expert immobilier français. Voici une annonce immobilière avec ses informations déjà structurées et sa description complète.

${knownInfo}

**Description de l'annonce :**
${propertyData.description}

---

**Ta mission :** Analyse cette description et extrait UNIQUEMENT les informations importantes qui ne sont PAS déjà renseignées dans les champs ci-dessus.

**Format de réponse :** Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de \`\`\`json) :

{
  "nouvelles_informations": [
    {
      "categorie": "Caractéristique principale (ex: Extérieur, Équipements, État, Localisation, Charges, etc.)",
      "information": "Description précise et concise de l'information trouvée"
    }
  ],
  "informations_confirmees": [
    "Liste des informations déjà connues qui sont confirmées/précisées dans la description"
  ],
  "informations_manquantes": [
    "Liste des informations importantes qui manquent encore (ex: DPE, charges, taxe foncière, etc.)"
  ]
}

**Règles importantes :**
- N'inclus que des informations NOUVELLES et UTILES
- Sois factuel et précis
- Ne répète pas les informations déjà structurées (titre, prix, surface, etc.)
- Focus sur : équipements, état du bien, extérieurs (terrasse, jardin, balcon), charges, stationnement, chauffage, isolation, proximités, caractéristiques uniques
- Si aucune nouvelle information n'est trouvée, renvoie un tableau vide pour nouvelles_informations`

    console.log('[gemini-enrich-property] Calling Gemini API...')

    // Call Gemini API
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
          temperature: 0.2,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text()
      console.error('[gemini-enrich-property] Gemini API error:', error)
      return new Response(
        JSON.stringify({ error: 'Gemini API error', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = await geminiResponse.json()

    // DEBUG: Log full Gemini response
    console.log('[gemini-enrich-property] Gemini response:', JSON.stringify(geminiData, null, 2))

    // Check if candidates exist
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('[gemini-enrich-property] No candidates in Gemini response:', geminiData)
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
      console.error('[gemini-enrich-property] Empty text response from Gemini')
      return new Response(
        JSON.stringify({ error: 'Empty response from Gemini', details: geminiData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[gemini-enrich-property] Generated text:', generatedText)

    // Parse JSON response from Gemini
    let enrichmentResult: any

    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      enrichmentResult = JSON.parse(cleanedText)
      console.log('[gemini-enrich-property] Parsed result:', enrichmentResult)
    } catch (parseError) {
      console.error('[gemini-enrich-property] Failed to parse Gemini response:', generatedText)
      return new Response(
        JSON.stringify({ error: 'Failed to parse Gemini response', raw: generatedText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[gemini-enrich-property] Enrichment successful!')

    return new Response(JSON.stringify({
      success: true,
      ...enrichmentResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[gemini-enrich-property] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
