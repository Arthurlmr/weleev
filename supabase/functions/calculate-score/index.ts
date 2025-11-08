// Edge Function: Calculate Personalized Score
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScoreRequest {
  userId: string
  propertyId: number
}

interface ScoreResponse {
  score: number // 0-10
  breakdown: {
    criteriaMatch: number
    lifestyleMatch: number
    valueForMoney: number
    bonusFactors: number
  }
  recommendation: 'recommended' | 'favorite' | 'trending' | null
  reason: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { userId, propertyId }: ScoreRequest = await req.json()

    if (!userId || !propertyId) {
      return new Response(
        JSON.stringify({ error: 'userId and propertyId are required' }),
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

    // Check if score already exists and is recent
    const { data: existingScore } = await supabaseClient
      .from('user_property_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .single()

    if (existingScore) {
      const updatedAt = new Date(existingScore.updated_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)

      // Return cached score if less than 24 hours old
      if (hoursDiff < 24) {
        return new Response(
          JSON.stringify({
            score: existingScore.personalized_score,
            breakdown: existingScore.score_breakdown,
            recommendation: existingScore.recommendation_badge,
            reason: existingScore.recommendation_reason,
            cached: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Fetch property
    const { data: property } = await supabaseClient
      .from('melo_properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (!property) {
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch user's search criteria
    const { data: searches } = await supabaseClient
      .from('searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    const userSearch = searches?.[0]

    // Fetch conversational profile
    const { data: profile } = await supabaseClient
      .from('conversational_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // --- SCORING ALGORITHM ---

    // 1. CRITERIA MATCH (40% weight)
    let criteriaScore = 0
    let criteriaCount = 0

    if (userSearch) {
      // Price match
      if (property.price <= userSearch.max_budget) {
        const priceRatio = property.price / userSearch.max_budget
        criteriaScore += priceRatio < 0.7 ? 10 : priceRatio < 0.9 ? 8 : 5
      } else {
        criteriaScore += 0 // Over budget = 0
      }
      criteriaCount++

      // Rooms match
      if (property.rooms >= userSearch.min_rooms) {
        criteriaScore += property.rooms === userSearch.min_rooms ? 10 : 8
      } else {
        criteriaScore += 0
      }
      criteriaCount++

      // Property type match
      if (userSearch.property_type === 'any' || property.property_type === userSearch.property_type) {
        criteriaScore += 10
      } else {
        criteriaScore += 2
      }
      criteriaCount++
    }

    const criteriaMatchScore = criteriaCount > 0 ? (criteriaScore / criteriaCount / 10) * 10 : 5

    // 2. LIFESTYLE MATCH (30% weight)
    let lifestyleScore = 5 // Default neutral score

    if (profile && profile.lifestyle_preferences?.length > 0) {
      const description = (property.description || '').toLowerCase()
      let matches = 0
      let total = 0

      profile.lifestyle_preferences.forEach((pref: string) => {
        total++
        const prefLower = pref.toLowerCase()

        if (
          prefLower.includes('calme') && (description.includes('calme') || description.includes('tranquille'))
        ) {
          matches++
        } else if (
          prefLower.includes('animé') && (description.includes('proche commerces') || description.includes('centre'))
        ) {
          matches++
        } else if (
          prefLower.includes('transport') && (description.includes('métro') || description.includes('gare'))
        ) {
          matches++
        } else if (
          prefLower.includes('jardin') && (property.land_surface > 0 || description.includes('jardin'))
        ) {
          matches++
        }
      })

      if (total > 0) {
        lifestyleScore = (matches / total) * 10
      }
    }

    // 3. VALUE FOR MONEY (20% weight)
    let valueScore = 5 // Default neutral

    if (property.price_per_meter) {
      // Compare to market average (estimation: ~3000€/m² for city apartments)
      const marketAvg = 3000
      const priceDiff = property.price_per_meter / marketAvg

      if (priceDiff < 0.8) {
        valueScore = 9 // Great value
      } else if (priceDiff < 1.0) {
        valueScore = 7 // Good value
      } else if (priceDiff < 1.2) {
        valueScore = 5 // Fair
      } else {
        valueScore = 3 // Expensive
      }
    }

    // 4. BONUS FACTORS (10% weight)
    let bonusScore = 0
    let bonusCount = 0

    // DPE bonus
    if (property.dpe_category) {
      const dpeScores: Record<string, number> = {
        A: 10,
        B: 8,
        C: 6,
        D: 4,
        E: 2,
        F: 1,
        G: 0,
      }
      bonusScore += dpeScores[property.dpe_category] || 0
      bonusCount++
    }

    // Renovation status bonus
    if (property.renovation_status === 'renovated') {
      bonusScore += 8
      bonusCount++
    } else if (property.renovation_status === 'new') {
      bonusScore += 10
      bonusCount++
    }

    // Construction year bonus (newer is better)
    if (property.construction_year && property.construction_year >= 2020) {
      bonusScore += 8
      bonusCount++
    } else if (property.construction_year && property.construction_year >= 2000) {
      bonusScore += 5
      bonusCount++
    }

    const bonusFactorScore = bonusCount > 0 ? bonusScore / bonusCount : 5

    // --- FINAL SCORE CALCULATION ---
    const finalScore =
      criteriaMatchScore * 0.4 +
      lifestyleScore * 0.3 +
      valueScore * 0.2 +
      bonusFactorScore * 0.1

    // Round to 1 decimal
    const roundedScore = Math.round(finalScore * 10) / 10

    // --- RECOMMENDATION BADGE ---
    let badge: 'recommended' | 'favorite' | 'trending' | null = null
    let reason = ''

    if (roundedScore >= 9.0) {
      badge = 'favorite'
      reason = 'Coup de cœur : Correspond parfaitement à vos critères !'
    } else if (roundedScore >= 8.0) {
      badge = 'recommended'
      reason = `Recommandé : Excellent rapport qualité-prix pour votre recherche ${userSearch?.location || ''}`
    } else if (valueScore >= 8 && criteriaMatchScore >= 7) {
      badge = 'trending'
      reason = 'À considérer : Belle opportunité dans votre budget'
    }

    // Criteria match percentage
    const criteriaMatchPercentage = Math.round((criteriaMatchScore / 10) * 100)

    // Save score to database
    const scoreData = {
      user_id: userId,
      property_id: propertyId,
      personalized_score: roundedScore,
      score_breakdown: {
        criteriaMatch: Math.round(criteriaMatchScore * 10) / 10,
        lifestyleMatch: Math.round(lifestyleScore * 10) / 10,
        valueForMoney: Math.round(valueScore * 10) / 10,
        bonusFactors: Math.round(bonusFactorScore * 10) / 10,
      },
      criteria_match_percentage: criteriaMatchPercentage,
      recommendation_badge: badge,
      recommendation_reason: reason,
      scoring_algorithm_version: 'v1.0',
      factors_used: [
        'price_match',
        'rooms_match',
        'property_type_match',
        'lifestyle_preferences',
        'price_per_sqm',
        'dpe_category',
        'renovation_status',
        'construction_year',
      ],
    }

    await supabaseClient.from('user_property_scores').upsert(scoreData, {
      onConflict: 'user_id,property_id',
    })

    return new Response(
      JSON.stringify({
        score: roundedScore,
        breakdown: scoreData.score_breakdown,
        recommendation: badge,
        reason: reason,
        cached: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in calculate-score:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
