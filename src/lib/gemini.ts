import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RefinementQuestion, SearchPreferences, Listing, ListingEnrichment, AiImageAnalysis } from '@/types';

// Temporarily disabled to prevent API key exposure in bundle
// TODO: Move Gemini calls to Edge Function for security
const AI_ENABLED = false;

// Don't read API key to prevent it from being bundled
const apiKey = AI_ENABLED ? import.meta.env.VITE_GEMINI_API_KEY : undefined;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Get refinement questions based on initial preferences
export async function getRefinementQuestions(
  preferences: SearchPreferences
): Promise<RefinementQuestion[]> {
  // Skip AI call if disabled or no API key
  if (!AI_ENABLED || !genAI) {
    return getDefaultRefinementQuestions();
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Tu es un assistant immobilier expert en France. Un utilisateur cherche un bien avec les critères suivants:
- Ville: ${preferences.location}
- Type: ${preferences.propertyType === 'any' ? 'Appartement ou Maison' : preferences.propertyType === 'apartment' ? 'Appartement' : 'Maison'}
- Budget max: ${preferences.maxBudget.toLocaleString('fr-FR')}€
- Pièces minimum: ${preferences.minRooms}
- Parking: ${preferences.wantsParking ? 'Oui' : 'Non'}

Génère exactement 3 questions pertinentes pour affiner sa recherche. Les questions doivent être pratiques et aider à mieux comprendre ses besoins.

Réponds au format JSON suivant (UNIQUEMENT du JSON valide, sans texte avant ou après):
{
  "questions": [
    {
      "id": "q1",
      "question": "Question ici?",
      "type": "multiple_choice",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
    }
  ]
}

Types disponibles: "multiple_choice" (avec options), "text" (réponse libre), "chips" (sélection multiple avec options).`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.questions || [];
  } catch (error) {
    console.error('Error getting refinement questions:', error);
    return getDefaultRefinementQuestions();
  }
}

// Helper function to get default refinement questions
function getDefaultRefinementQuestions(): RefinementQuestion[] {
  return [
    {
      id: 'q1',
      question: 'La proximité des transports en commun est-elle essentielle?',
      type: 'multiple_choice',
      options: ['Essentiel', 'Souhaitable', 'Pas important']
    },
    {
      id: 'q2',
      question: 'Quel type d\'environnement préférez-vous?',
      type: 'multiple_choice',
      options: ['Centre-ville animé', 'Quartier calme résidentiel', 'Proche nature', 'Indifférent']
    },
    {
      id: 'q3',
      question: 'Y a-t-il un défaut rédhibitoire pour vous?',
      type: 'text'
    }
  ];
}

// Generate AI questions for onboarding refinement
export async function generateAiQuestions(context: {
  location?: string;
  transactionType?: string;
  propertyType?: string;
  budgetMax?: number;
  roomMin?: number;
}): Promise<any[]> {
  // Skip AI call if disabled or no API key (prevents key exposure in bundle)
  if (!AI_ENABLED || !genAI) {
    return getDefaultQuestions(context);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-thinking-exp' });

  const prompt = `Tu es un assistant immobilier expert. L'utilisateur cherche :
- Localisation : ${context.location || 'Non spécifié'}
- Transaction : ${context.transactionType || 'Non spécifié'}
- Type de bien : ${context.propertyType || 'Non spécifié'}
- Budget max : ${context.budgetMax ? context.budgetMax.toLocaleString('fr-FR') + '€' : 'Non spécifié'}
- Pièces min : ${context.roomMin || 'Non spécifié'}

Génère 3 à 5 questions PERTINENTES et CONTEXTUELLES pour affiner sa recherche.
Chaque question doit être associée à un type de composant UI adapté.

Types de composants disponibles :
- "toggle" : Oui/Non (ex: "Souhaitez-vous un parking ?")
- "chips" : Choix multiple (ex: "Quels équipements ?")
- "slider" : Plage de valeurs (ex: "Surface minimum ?")
- "text" : Texte libre (ex: "Quartiers préférés ?")

IMPORTANT : Sois intelligent et contextuel :
- Si l'utilisateur cherche à Paris intra-muros, ne demande pas de parking (rare et cher)
- Si le budget est élevé, demande des équipements premium (piscine, jacuzzi, etc.)
- Si c'est une location, demande meublé/non meublé
- Si c'est une maison, demande la surface de jardin
- Adapte les questions au contexte précis

Réponds en JSON (UNIQUEMENT du JSON valide, sans backticks ni texte avant/après):
{
  "questions": [
    {
      "id": "parking",
      "question": "Souhaitez-vous un parking ?",
      "type": "toggle",
      "meloMapping": { "field": "expressions", "value": { "include": ["parking"] } }
    },
    {
      "id": "surface",
      "question": "Surface minimum souhaitée ?",
      "type": "slider",
      "min": 20,
      "max": 200,
      "step": 10,
      "unit": "m²",
      "meloMapping": { "field": "surfaceMin", "value": "{{value}}" }
    },
    {
      "id": "amenities",
      "question": "Quels équipements ?",
      "type": "chips",
      "options": ["Ascenseur", "Cave", "Gardien", "Balcon"],
      "meloMapping": { "field": "expressions", "value": { "include": ["{{value}}"] } }
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.questions || [];
  } catch (error) {
    console.error('Error generating AI questions:', error);
    return getDefaultQuestions(context);
  }
}

// Helper function to generate default questions without AI
function getDefaultQuestions(context: {
  transactionType?: string;
  propertyType?: string;
}): any[] {
  const isRental = context.transactionType === 'Location';
  const isHouse = context.propertyType === 'house';

  const defaultQuestions: any[] = [
    {
      id: 'surface',
      question: 'Surface minimum souhaitée ?',
      type: 'slider',
      min: 20,
      max: 200,
      step: 10,
      unit: 'm²',
      meloMapping: { field: 'surfaceMin', value: '{{value}}' }
    }
  ];

  if (isRental) {
    defaultQuestions.push({
      id: 'furnished',
      question: 'Souhaitez-vous un logement meublé ?',
      type: 'toggle',
      meloMapping: { field: 'furnished', value: true }
    });
  }

  if (isHouse) {
    defaultQuestions.push({
      id: 'land',
      question: 'Surface de jardin minimum ?',
      type: 'slider',
      min: 0,
      max: 1000,
      step: 50,
      unit: 'm²',
      meloMapping: { field: 'landSurfaceMin', value: '{{value}}' }
    });
  } else {
    defaultQuestions.push({
      id: 'floor',
      question: 'Étage minimum ?',
      type: 'slider',
      min: 0,
      max: 10,
      step: 1,
      unit: '',
      meloMapping: { field: 'floor', value: '{{value}}' }
    });
  }

  return defaultQuestions.slice(0, 3);
}

// Get districts for a city
export async function getDistrictsFromGemini(city: string): Promise<string[]> {
  // Skip AI call if disabled or no API key
  if (!AI_ENABLED || !genAI) {
    return ['Centre-ville', 'Nord', 'Sud', 'Est', 'Ouest'];
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Liste les 5-8 principaux quartiers ou arrondissements de ${city} en France qui sont pertinents pour une recherche immobilière.

Réponds au format JSON suivant (UNIQUEMENT du JSON valide):
{
  "districts": ["Quartier 1", "Quartier 2", "Quartier 3"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.districts || [];
  } catch (error) {
    console.error('Error getting districts:', error);
    return ['Centre-ville', 'Nord', 'Sud', 'Est', 'Ouest'];
  }
}

// Analyze image with Gemini
export async function analyzeImageWithGemini(_imageUrl: string): Promise<AiImageAnalysis> {
  // Note: For image analysis, we'd need to fetch and convert the image
  // This is a simplified version that returns default analysis
  // In production, you would use gemini-pro-vision model with actual image data

  try {
    // For now, return a default analysis
    return {
      roomType: 'salon',
      condition: 'good',
      features: ['Parquet', 'Grande fenêtre', 'Moulures'],
      naturalLight: 'good',
      style: 'classique'
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      roomType: 'inconnu',
      condition: 'good',
      features: [],
      naturalLight: 'moderate',
      style: 'standard'
    };
  }
}

// Generate enrichment data for a listing
export async function generateEnrichmentData(listing: Listing): Promise<ListingEnrichment> {
  // Skip AI call if disabled or no API key - return fallback immediately
  if (!AI_ENABLED || !genAI) {
    return getFallbackEnrichment(listing);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Analyse ce bien immobilier et génère un enrichissement complet:

Bien: ${listing.title}
Prix: ${listing.price.toLocaleString('fr-FR')}€
Surface: ${listing.surface}m²
Pièces: ${listing.rooms}
Ville: ${listing.city}
Description: ${listing.description}

Génère une analyse complète au format JSON (UNIQUEMENT du JSON valide):
{
  "aiSummary": "Résumé intelligent du bien en 2-3 phrases",
  "financialAnalysis": {
    "monthlyPayment": 0,
    "downPayment": 0,
    "propertyTax": 0,
    "condoFees": 0,
    "totalMonthlyCost": 0,
    "assumptions": {
      "interestRate": 3.5,
      "loanTerm": 25
    }
  },
  "marketComparison": {
    "averagePricePerSqm": 0,
    "pricePositioning": "average",
    "percentageDifference": 0,
    "marketTrend": "stable",
    "similarListingsCount": 0
  }
}

Calcule les mensualités avec un apport de 20%, taux d'intérêt réaliste actuel en France.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Generate mock amenities based on city
    const amenities = [
      { name: 'Métro', type: 'transport' as const, distance: 300, walkTime: 4 },
      { name: 'Supermarché', type: 'commerce' as const, distance: 500, walkTime: 6 },
      { name: 'École primaire', type: 'school' as const, distance: 400, walkTime: 5 },
      { name: 'Pharmacie', type: 'health' as const, distance: 250, walkTime: 3 },
    ];

    return {
      listingId: listing.id,
      aiSummary: parsed.aiSummary,
      financialAnalysis: parsed.financialAnalysis,
      amenities,
      marketComparison: parsed.marketComparison,
      imageAnalysis: []
    };
  } catch (error) {
    console.error('Error generating enrichment:', error);
    return getFallbackEnrichment(listing);
  }
}

// Helper function to get fallback enrichment data
function getFallbackEnrichment(listing: Listing): ListingEnrichment {
  const monthlyPayment = Math.round((listing.price * 0.8 * 0.004));
  return {
    listingId: listing.id,
    aiSummary: `${listing.title} - Un bien de ${listing.surface}m² proposé à ${listing.price.toLocaleString('fr-FR')}€.`,
    financialAnalysis: {
      monthlyPayment,
      downPayment: listing.price * 0.2,
      propertyTax: Math.round(listing.price * 0.001),
      condoFees: listing.propertyType === 'apartment' ? 150 : 0,
      totalMonthlyCost: monthlyPayment + Math.round(listing.price * 0.001) + (listing.propertyType === 'apartment' ? 150 : 0),
      assumptions: {
        interestRate: 3.5,
        loanTerm: 25
      }
    },
    amenities: [
      { name: 'Métro', type: 'transport', distance: 300, walkTime: 4 },
      { name: 'Supermarché', type: 'commerce', distance: 500, walkTime: 6 },
    ],
    marketComparison: {
      averagePricePerSqm: Math.round(listing.price / listing.surface),
      pricePositioning: 'average',
      percentageDifference: 0,
      marketTrend: 'stable',
      similarListingsCount: 12
    },
    imageAnalysis: []
  };
}
