// Edge Function: Gemini Chat - Chatbot conversationnel pour profiling
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  userId: string
  message: string
  conversationHistory?: { question: string; answer: string }[]
}

interface ChatResponse {
  question: string
  options?: string[]
  type: 'text' | 'choice' | 'range'
  extractedPreferences: {
    lifestyle?: string[]
    priorities?: string[]
    dealBreakers?: string[]
    futureProjects?: string[]
  }
  profileCompleteness: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { userId, message, conversationHistory = [] }: ChatRequest = await req.json()

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

    // Get or create conversational profile
    let { data: profile } = await supabaseClient
      .from('conversational_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      const { data: newProfile } = await supabaseClient
        .from('conversational_profiles')
        .insert({
          user_id: userId,
          conversation_history: [],
          lifestyle_preferences: [],
          priorities: [],
          deal_breakers: [],
          future_projects: [],
        })
        .select()
        .single()

      profile = newProfile
    }

    // Build conversation context
    const historyContext = conversationHistory
      .map((h) => `Q: ${h.question}\nA: ${h.answer}`)
      .join('\n\n')

    // Build Gemini prompt
    const prompt = `Tu es un assistant immobilier intelligent qui affine le profil d'un utilisateur.

Historique de conversation:
${historyContext || 'Début de la conversation'}

${message ? `Dernier message utilisateur: "${message}"` : 'C\'est le début de la conversation.'}

Profil actuel:
- Style de vie: ${profile.lifestyle_preferences?.join(', ') || 'Non défini'}
- Priorités: ${profile.priorities?.join(', ') || 'Non défini'}
- Deal-breakers: ${profile.deal_breakers?.join(', ') || 'Non défini'}
- Projets futurs: ${profile.future_projects?.join(', ') || 'Non défini'}

Tâche:
1. ${message ? `Analyse la réponse de l'utilisateur et extrais ses préférences` : 'Pose la première question pour mieux comprendre ses besoins'}
2. Génère la prochaine question contextuelle pour affiner son profil
3. Choisis le type de réponse attendue (text, choice, range)

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans texte avant ou après. Format exact :

{
  "question": "La question à poser à l'utilisateur",
  "type": "text" | "choice" | "range",
  "options": ["Option 1", "Option 2"] (si type = "choice"),
  "extractedPreferences": {
    "lifestyle": ["préférences de style de vie extraites du message"],
    "priorities": ["priorités identifiées"],
    "dealBreakers": ["deal-breakers absolus"],
    "futureProjects": ["projets futurs mentionnés"]
  },
  "profileCompleteness": 0.45 (score 0-1 de complétude du profil)
}

Exemples de questions pertinentes:
- "Quel est votre style de vie idéal ? Plutôt calme ou animé ?"
- "Quelles sont vos 3 priorités principales pour votre futur logement ?"
- "Y a-t-il des éléments absolument rédhibitoires pour vous ?"
- "Prévoyez-vous d'agrandir votre famille dans les prochaines années ?"
- "Préférez-vous être proche des transports ou avoir un jardin ?"

Sois conversationnel, empathique et contextuel. Ne pose pas plus de 5-7 questions au total.`

    // Call Gemini Chat API
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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
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
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON response from Gemini
    let chatResult: ChatResponse

    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      chatResult = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', generatedText)
      return new Response(
        JSON.stringify({ error: 'Failed to parse Gemini response', raw: generatedText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update conversational profile
    const updatedHistory = [
      ...(profile.conversation_history || []),
      {
        question: chatResult.question,
        answer: message,
        timestamp: new Date().toISOString(),
      },
    ]

    const updatedLifestyle = [
      ...new Set([
        ...(profile.lifestyle_preferences || []),
        ...(chatResult.extractedPreferences.lifestyle || []),
      ]),
    ]

    const updatedPriorities = [
      ...new Set([
        ...(profile.priorities || []),
        ...(chatResult.extractedPreferences.priorities || []),
      ]),
    ]

    const updatedDealBreakers = [
      ...new Set([
        ...(profile.deal_breakers || []),
        ...(chatResult.extractedPreferences.dealBreakers || []),
      ]),
    ]

    const updatedFutureProjects = [
      ...new Set([
        ...(profile.future_projects || []),
        ...(chatResult.extractedPreferences.futureProjects || []),
      ]),
    ]

    await supabaseClient
      .from('conversational_profiles')
      .update({
        conversation_history: updatedHistory,
        lifestyle_preferences: updatedLifestyle,
        priorities: updatedPriorities,
        deal_breakers: updatedDealBreakers,
        future_projects: updatedFutureProjects,
        total_interactions: (profile.total_interactions || 0) + 1,
        last_interaction_at: new Date().toISOString(),
        profile_completeness_score: chatResult.profileCompleteness * 100,
      })
      .eq('user_id', userId)

    return new Response(JSON.stringify(chatResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in gemini-chat:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
