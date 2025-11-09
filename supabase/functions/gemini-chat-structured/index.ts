// Edge Function: Gemini Chat Structured - Chatbot structuré avec 19 critères
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StructuredQuestion {
  id: number
  key: string
  question: string
  quickReplies: string[]
  evasiveReplies: string[]
  dbField: string
  type: 'text' | 'multiple_choice' | 'single_choice' | 'number' | 'boolean'
  conditional?: {
    field: string
    value: any
  }
}

// Les 19 questions structurées
const STRUCTURED_QUESTIONS: StructuredQuestion[] = [
  {
    id: 1,
    key: 'search_type',
    question: "Recherchez-vous un bien en achat ou en location ?",
    quickReplies: ['Achat', 'Location'],
    evasiveReplies: [],
    dbField: 'search_type',
    type: 'single_choice',
  },
  {
    id: 2,
    key: 'property_type_filter',
    question: "Recherchez-vous un appartement ou une maison ?",
    quickReplies: ['Appartement', 'Maison', 'Les deux me conviennent'],
    evasiveReplies: ['Les deux'],
    dbField: 'property_type_filter',
    type: 'multiple_choice',
  },
  {
    id: 3,
    key: 'city_filter',
    question: "Dans quelle ville recherchez-vous ?",
    quickReplies: ['Niort', 'Niort + communes limitrophes', 'Autres communes'],
    evasiveReplies: [],
    dbField: 'city_filter',
    type: 'text',
  },
  {
    id: 4,
    key: 'neighborhoods_filter',
    question: "Avez-vous des quartiers ou zones préférés ? (Très important pour le filtrage)",
    quickReplies: ['Centre-ville', 'Quartier Nord', 'Quartier Sud', 'Tous les quartiers me vont'],
    evasiveReplies: ['Tous les quartiers', 'Peu importe'],
    dbField: 'neighborhoods_filter',
    type: 'multiple_choice',
  },
  {
    id: 5,
    key: 'budget_max',
    question: "Quel est votre budget maximum ?",
    quickReplies: ['300 000€', '350 000€', '400 000€', '450 000€+'],
    evasiveReplies: ['Pas de limite stricte', 'Flexible'],
    dbField: 'budget_max',
    type: 'number',
  },
  {
    id: 6,
    key: 'surface_min',
    question: "Quelle surface minimale souhaitez-vous ?",
    quickReplies: ['80m²', '100m²', '120m²', 'Flexible'],
    evasiveReplies: ['Flexible', 'Peu importe'],
    dbField: 'surface_min',
    type: 'number',
  },
  {
    id: 7,
    key: 'bedrooms_min',
    question: "Combien de chambres minimum ?",
    quickReplies: ['2', '3', '4+', 'Peu importe'],
    evasiveReplies: ['Peu importe', 'Flexible'],
    dbField: 'bedrooms_min',
    type: 'number',
  },
  {
    id: 8,
    key: 'floor_preference',
    question: "Concernant l'étage (si appartement), avez-vous une préférence ?",
    quickReplies: ['Pas rez-de-chaussée', 'Dernier étage', 'Peu importe'],
    evasiveReplies: ['Peu importe', 'Pas important'],
    dbField: 'floor_preference',
    type: 'single_choice',
    conditional: { field: 'property_type_filter', value: 'apartment' },
  },
  {
    id: 9,
    key: 'outdoor_preference',
    question: "Avez-vous besoin d'un espace extérieur ?",
    quickReplies: ['Jardin obligatoire', 'Balcon suffit', 'Pas nécessaire'],
    evasiveReplies: ['Pas nécessaire', 'Peu importe'],
    dbField: 'outdoor_preference',
    type: 'single_choice',
  },
  {
    id: 10,
    key: 'parking_preference',
    question: "Concernant le stationnement, qu'attendez-vous ?",
    quickReplies: ['Garage obligatoire', 'Place de parking suffit', 'Pas important'],
    evasiveReplies: ['Pas important', 'Peu importe'],
    dbField: 'parking_preference',
    type: 'single_choice',
  },
  {
    id: 11,
    key: 'state_filter',
    question: "Quel état de bien vous intéresse ?",
    quickReplies: ['Neuf uniquement', 'Récent (<10 ans)', 'Ancien OK', 'Pas de neuf', 'À construire'],
    evasiveReplies: ['Tous', 'Peu importe'],
    dbField: 'state_filter',
    type: 'multiple_choice',
  },
  {
    id: 12,
    key: 'detached_house_only',
    question: "Si maison, souhaitez-vous absolument une maison non mitoyenne ?",
    quickReplies: ['Oui, obligatoire', 'Non, mitoyenne OK', 'Peu importe'],
    evasiveReplies: ['Peu importe', 'Pas important'],
    dbField: 'detached_house_only',
    type: 'boolean',
    conditional: { field: 'property_type_filter', value: 'house' },
  },
  {
    id: 13,
    key: 'vis_a_vis_importance',
    question: "L'absence de vis-à-vis est-elle importante pour vous ?",
    quickReplies: ['Dégagé obligatoire', 'Important', 'Peu importe'],
    evasiveReplies: ['Peu importe', 'Pas important'],
    dbField: 'vis_a_vis_importance',
    type: 'single_choice',
  },
  {
    id: 14,
    key: 'orientation_importance',
    question: "L'orientation du bien (Sud/Sud-Ouest) est-elle importante ?",
    quickReplies: ['Obligatoire', 'Important', 'Peu importe'],
    evasiveReplies: ['Peu importe', 'Pas important'],
    dbField: 'orientation_importance',
    type: 'single_choice',
  },
  {
    id: 15,
    key: 'proximity_priorities',
    question: "Quelles proximités sont essentielles pour vous ? (plusieurs choix possibles)",
    quickReplies: ['Écoles', 'Transports en commun', 'Commerces', 'Rien de spécifique'],
    evasiveReplies: ['Rien de spécifique', 'Peu importe'],
    dbField: 'proximity_priorities',
    type: 'multiple_choice',
  },
  {
    id: 16,
    key: 'renovation_acceptance',
    question: "Acceptez-vous un bien nécessitant des travaux ?",
    quickReplies: ['Non', 'Petits travaux OK', 'Gros travaux OK'],
    evasiveReplies: [],
    dbField: 'renovation_acceptance',
    type: 'single_choice',
  },
  {
    id: 17,
    key: 'max_charges',
    question: "Si appartement, quel est le maximum de charges de copropriété acceptable ?",
    quickReplies: ['< 100€/mois', '< 200€/mois', 'Peu importe'],
    evasiveReplies: ['Peu importe', 'Pas important'],
    dbField: 'max_charges',
    type: 'number',
    conditional: { field: 'property_type_filter', value: 'apartment' },
  },
  {
    id: 18,
    key: 'is_current_owner',
    question: "Êtes-vous actuellement propriétaire d'un bien immobilier ?",
    quickReplies: ['Oui', 'Non', 'Préfère ne pas dire'],
    evasiveReplies: ['Préfère ne pas dire'],
    dbField: 'is_current_owner',
    type: 'boolean',
  },
  {
    id: 19,
    key: 'property_usage',
    question: "Quel est l'usage prévu du bien ?",
    quickReplies: ['Résidence principale', 'Investissement locatif', 'Résidence secondaire'],
    evasiveReplies: [],
    dbField: 'property_usage',
    type: 'single_choice',
  },
]

interface ChatRequest {
  userId: string
  message: string
}

interface ChatResponse {
  nextQuestion: {
    id: number
    text: string
    quickReplies: string[]
    evasiveReplies: string[]
  } | null
  extractedCriteria: Record<string, any>
  allCriteriaFilled: boolean
  profileCompleteness: number
  criteriaFilled: number
  assistantMessage: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, message }: ChatRequest = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
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

    // Get user's profile
    let { data: profile } = await supabaseClient
      .from('conversational_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      // Create profile if doesn't exist
      const { data: newProfile } = await supabaseClient
        .from('conversational_profiles')
        .insert({
          user_id: userId,
          profile_version: 2,
        })
        .select()
        .single()

      profile = newProfile
    }

    // Determine which questions have already been answered
    const filledFields = new Set<string>()
    STRUCTURED_QUESTIONS.forEach((q) => {
      const value = profile[q.dbField]
      if (value !== null && value !== undefined) {
        // Check for meaningful values
        if (Array.isArray(value) && value.length > 0) {
          filledFields.add(q.key)
        } else if (typeof value === 'string' && value.trim() !== '') {
          filledFields.add(q.key)
        } else if (typeof value === 'number') {
          filledFields.add(q.key)
        } else if (typeof value === 'boolean') {
          filledFields.add(q.key)
        }
      }
    })

    // Build context for Gemini
    const filledCriteriaText = Array.from(filledFields).map(key => {
      const question = STRUCTURED_QUESTIONS.find(q => q.key === key)
      return question ? `${question.question} → ${profile[question.dbField]}` : ''
    }).filter(Boolean).join('\n')

    // Find next unanswered question (considering conditionals)
    let nextQuestion: StructuredQuestion | null = null
    for (const q of STRUCTURED_QUESTIONS) {
      if (!filledFields.has(q.key)) {
        // Check conditional
        if (q.conditional) {
          const condValue = profile[q.conditional.field]
          // Only ask if condition is met
          if (Array.isArray(condValue)) {
            if (condValue.includes(q.conditional.value)) {
              nextQuestion = q
              break
            }
          } else if (condValue === q.conditional.value) {
            nextQuestion = q
            break
          }
        } else {
          nextQuestion = q
          break
        }
      }
    }

    // Build Gemini prompt
    const prompt = `Tu es un assistant immobilier intelligent. L'utilisateur a dit : "${message}"

Critères déjà remplis (${filledFields.size}/19) :
${filledCriteriaText || 'Aucun critère rempli pour le moment'}

${nextQuestion ? `Prochaine question à poser : "${nextQuestion.question}"` : 'Tous les critères sont remplis !'}

Tâches :
1. Analyser le message de l'utilisateur et extraire TOUS les critères mentionnés
2. Normaliser les valeurs selon le format attendu (voir exemples ci-dessous)
3. Générer une réponse conversationnelle et naturelle
4. ${nextQuestion ? 'Poser la prochaine question de manière fluide' : 'Confirmer que le profil est complet'}

FORMATS DE NORMALISATION :

- search_type: 'purchase' | 'rental'
- property_type_filter: ['apartment'] | ['house'] | ['both']
- city_filter: string (nom de ville)
- neighborhoods_filter: array de strings (quartiers) ou [] si "tous"
- budget_max: number (en euros) ou null si "flexible"
- surface_min: number (en m²) ou null si "flexible"
- bedrooms_min: number ou null si "flexible"
- floor_preference: 'not_ground' | 'top_floor' | 'no_preference'
- outdoor_preference: 'garden_required' | 'balcony_ok' | 'not_needed'
- parking_preference: 'garage_required' | 'spot_ok' | 'not_important'
- state_filter: ['new'] | ['recent'] | ['old'] | ['construction'] | ['no_new'] ou combinaisons
- detached_house_only: true | false
- vis_a_vis_importance: 'clear_required' | 'important' | 'not_important'
- orientation_importance: 'required' | 'important' | 'not_important'
- proximity_priorities: ['schools', 'transport', 'shops'] ou [] si "rien"
- renovation_acceptance: 'none' | 'minor' | 'major'
- max_charges: number (en euros) ou null si "peu importe"
- is_current_owner: true | false | null (si préfère ne pas dire)
- property_usage: 'main_residence' | 'investment' | 'secondary'
- interior_config_prefs: ['open_living', 'open_kitchen', 'closed_rooms', 'flexible']

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans markdown. Format :

{
  "extractedCriteria": {
    "budget_max": 350000,
    "property_type_filter": ["house"]
  },
  "assistantMessage": "Parfait ! Vous recherchez une maison avec un budget de 350 000€. Pour affiner ma recherche, dans quelle ville souhaitez-vous chercher ?",
  "conversationalTone": true
}

Si tous les critères sont remplis, assistantMessage doit confirmer et féliciter l'utilisateur.`

    // Call Gemini
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
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

    // Check for candidates
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('No candidates in Gemini response:', geminiData)
      return new Response(
        JSON.stringify({ error: 'Empty response from Gemini', details: geminiData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const generatedText = geminiData.candidates[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON
    let aiResponse: { extractedCriteria: Record<string, any>; assistantMessage: string }
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

    // Update profile with extracted criteria
    const updateData: Record<string, any> = {}
    if (aiResponse.extractedCriteria) {
      Object.entries(aiResponse.extractedCriteria).forEach(([key, value]) => {
        updateData[key] = value
      })
    }

    if (Object.keys(updateData).length > 0) {
      await supabaseClient
        .from('conversational_profiles')
        .update(updateData)
        .eq('user_id', userId)
    }

    // Refresh profile to get updated criteria_filled and profile_completeness_score
    const { data: updatedProfile } = await supabaseClient
      .from('conversational_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    const criteriaFilled = updatedProfile?.criteria_filled || 0
    const profileCompleteness = updatedProfile?.profile_completeness_score || 0
    const allFilled = criteriaFilled >= 19

    // Prepare response
    const response: ChatResponse = {
      nextQuestion: nextQuestion && !allFilled ? {
        id: nextQuestion.id,
        text: nextQuestion.question,
        quickReplies: nextQuestion.quickReplies,
        evasiveReplies: nextQuestion.evasiveReplies,
      } : null,
      extractedCriteria: aiResponse.extractedCriteria || {},
      allCriteriaFilled: allFilled,
      profileCompleteness: profileCompleteness,
      criteriaFilled: criteriaFilled,
      assistantMessage: aiResponse.assistantMessage,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in gemini-chat-structured:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
