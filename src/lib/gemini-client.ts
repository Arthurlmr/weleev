/**
 * Client wrapper pour les Edge Functions Gemini
 */

import { supabase } from './supabase'

const EDGE_FUNCTION_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// Types
interface VisionAnalysisResult {
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
  cached?: boolean
}

interface ExtractDataResult {
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
  cached?: boolean
}

interface ChatResult {
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

interface ScoreResult {
  score: number // 0-10
  breakdown: {
    criteriaMatch: number
    lifestyleMatch: number
    valueForMoney: number
    bonusFactors: number
  }
  recommendation: 'recommended' | 'favorite' | 'trending' | null
  reason: string
  cached?: boolean
}

/**
 * Analyser les images d'une propriété avec Gemini Vision
 */
export async function analyzePropertyImages(
  propertyId: number,
  imageUrls: string[]
): Promise<VisionAnalysisResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/gemini-vision-analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      propertyId,
      imageUrls,
      userId: session.user.id,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Vision analysis failed')
  }

  return response.json()
}

/**
 * Extraire des données structurées d'une description avec Gemini NLP
 */
export async function extractPropertyData(
  propertyId: number,
  imageUrls: string[],
  description: string
): Promise<ExtractDataResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/gemini-extract-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      propertyId,
      imageUrls,
      description,
      userId: session.user.id,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Data extraction failed')
  }

  return response.json()
}

/**
 * Obtenir la prochaine question du chatbot conversationnel
 */
export async function getChatbotResponse(
  message: string,
  conversationHistory: { question: string; answer: string }[] = []
): Promise<ChatResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/gemini-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      userId: session.user.id,
      message,
      conversationHistory,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Chat failed')
  }

  return response.json()
}

/**
 * Calculer le score personnalisé d'une propriété
 */
export async function calculatePropertyScore(propertyId: number): Promise<ScoreResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/calculate-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      userId: session.user.id,
      propertyId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Score calculation failed')
  }

  return response.json()
}

/**
 * Analyser complètement une propriété (Vision + NLP)
 */
export async function analyzePropertyComplete(
  propertyId: number,
  imageUrls: string[],
  description: string
): Promise<{
  vision: VisionAnalysisResult
  extraction: ExtractDataResult
}> {
  const [vision, extraction] = await Promise.all([
    analyzePropertyImages(propertyId, imageUrls),
    extractPropertyData(propertyId, imageUrls, description),
  ])

  return { vision, extraction }
}

/**
 * Obtenir le score et l'analyse complète d'une propriété
 */
export async function getPropertyEnrichment(
  propertyId: number,
  imageUrls: string[],
  description: string
): Promise<{
  score: ScoreResult
  vision: VisionAnalysisResult
  extraction: ExtractDataResult
}> {
  const [score, analysis] = await Promise.all([
    calculatePropertyScore(propertyId),
    analyzePropertyComplete(propertyId, imageUrls, description),
  ])

  return {
    score,
    vision: analysis.vision,
    extraction: analysis.extraction,
  }
}

/**
 * Enrichir une propriété depuis sa description (sans images)
 */
export async function enrichPropertyFromDescription(
  propertyData: any
): Promise<{
  success: boolean
  nouvelles_informations: Array<{
    categorie: string
    information: string
  }>
  informations_confirmees: string[]
  informations_manquantes: string[]
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/gemini-enrich-property`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      propertyData,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Property enrichment failed')
  }

  return response.json()
}
