import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RefinementQuestion, SearchPreferences, Listing, ListingEnrichment, AiImageAnalysis } from '@/types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing Gemini API key');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Get refinement questions based on initial preferences
export async function getRefinementQuestions(
  preferences: SearchPreferences
): Promise<RefinementQuestion[]> {
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
    // Return default questions as fallback
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
}

// Get districts for a city
export async function getDistrictsFromGemini(city: string): Promise<string[]> {
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

    // Return fallback enrichment
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
}
