# Plan d'Implémentation - Refonte LUMINᵉ MVP

**Date** : 2025-11-08
**Branche** : `claude/add-html-mockups-design-011CUw3DD32gcMxLaa9e197M`
**Status** : Phase 2 (Brand) terminée → Phase 3+ en cours

---

## 📊 Analyse des Mockups HTML

### Fichiers analysés

1. ✅ `property_feed.html` (566 lignes) - Feed principal vertical
2. ✅ `map_feed.html` (665 lignes) - Vue carte
3. ✅ `hybrid_feed.html` (637 lignes) - Vue hybride (liste + carte)
4. ✅ `enhanced_property_detail_page.html` (748 lignes) - Page détail enrichie IA
5. ✅ `landing_page.html` (468 lignes) - Landing page publique
6. ✅ `onboarding_flow.html` (510 lignes) - Onboarding flow
7. ✅ `conversational_profiling.html` (308 lignes) - Chatbot conversationnel
8. ✅ `value_realization_-_saved_searches_recommendations_experience.html` (664 lignes) - Dashboard recherches sauvegardées

---

## 🔍 Données Identifiées dans les Mockups

### 1. Feed des annonces (property_feed, hybrid_feed)

**Données affichées par card** :
```typescript
interface PropertyCardData {
  // Existant
  id: string
  title: string
  price: number
  surface: number
  rooms: number
  bedrooms: number
  bathrooms: number // ❌ MANQUANT
  city: string
  zipcode: string
  images: string[]

  // ❌ NOUVEAUX CHAMPS NÉCESSAIRES
  personalizedScore: number       // Score IA personnalisé (ex: 9.2/10)
  reviewCount: number              // Nombre d'avis (ex: 247 avis)
  monthlyPayment: number           // Mensualité estimée (ex: 1 847€/mois)
  constructionYear: number         // Année de construction (ex: 2015)
  neighborhood: string             // Quartier (ex: "Cœur du Marais")
  neighborhoodDescription: string  // Description courte quartier

  // Badges & Tags
  recommendationBadge: 'recommended' | 'favorite' | 'trending' | null
  tags: string[]                   // ["Rénové", "Énergie A", "Neuf", etc.]

  // État/Condition
  renovationStatus: 'renovated' | 'new' | 'to_renovate' | null
  energyClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
}
```

### 2. Page détail enrichie (enhanced_property_detail_page)

**Analyse IA - Section "Analyse LUMINᵉ"** :
```typescript
interface AIAnalysis {
  // État général
  generalCondition: {
    status: 'excellent' | 'good' | 'fair' | 'poor'
    details: string // "Toiture rénovée, isolation thermique moderne..."
  }

  // Détails remarqués (Vision AI)
  remarkedFeatures: string[] // ["Parquet chêne d'époque", "moulures en stuc", ...]

  // Travaux recommandés
  recommendedWorks: {
    description: string  // "Peinture intérieure"
    estimatedCost: number // 3500
    diyCost?: number      // 1200
    urgency: 'minor' | 'moderate' | 'urgent'
  }[]

  // Données structurées extraites (NLP)
  structuredData: {
    kitchen?: string      // "Équipée, moderne, 10m²"
    bathrooms?: string    // "1 principale + 1 secondaire"
    heating?: string      // "Radiateurs fonte + clim réversible"
    parking?: string      // "Garage souterrain inclus"
  }
}
```

**Données financières** :
```typescript
interface FinancialData {
  // Coûts d'acquisition
  price: number
  agencyFees: number          // ❌ MANQUANT (~3% prix)
  notaryFees: number          // ❌ MANQUANT (~7.5% prix)
  propertyTaxAnnual: number   // ❌ MANQUANT (taxe foncière)

  // Performance prix
  pricePerSqm: number
  marketPriceHistory?: {
    year: number
    pricePerSqm: number
  }[]

  // Simulation prêt
  downPayment: number         // Apport (calculé)
  loanDuration: 15 | 20 | 25  // Durée prêt
  interestRate: number        // Taux (3.85% TMA)

  // Coûts mensuels
  monthlyPayment: number      // Remboursement prêt
  loanInsurance: number       // Assurance prêt
  propertyTaxMonthly: number  // Taxe foncière / 12
  energyCostEstimate: number  // Coût énergie estimé

  // Travaux
  totalRenovationBudget: number  // Budget travaux total
}
```

**Diagnostics & Risques** :
```typescript
interface DiagnosticsData {
  // DPE
  dpeCategory: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  dpeValue: number  // kWh/m²/an
  gesValue: number  // kg CO₂/m²/an

  // Risques naturels (API Géorisques)
  floodRisk: 'very_low' | 'low' | 'moderate' | 'high'
  geologicalRisk: 'none' | 'low' | 'moderate' | 'high'
  pollutionRisk: 'low' | 'moderate' | 'high'

  // Diagnostics légaux
  asbestosReport: string
  termitesReport: string
  radonLevel: string
}
```

### 3. Conversational Profiling (chatbot)

```typescript
interface ConversationalProfile {
  userId: string
  conversationHistory: {
    question: string
    answer: string | number | string[]
    timestamp: Date
  }[]

  // Préférences extraites
  extractedPreferences: {
    lifestyle?: string[]       // ["calme", "proche transports"]
    priorities?: string[]      // ["luminosité", "espace"]
    dealBreakers?: string[]    // ["bruit", "travaux lourds"]
    futureProjects?: string[]  // ["agrandissement", "revente 5 ans"]
  }
}
```

### 4. Dashboard Recherches Sauvegardées

```typescript
interface SavedSearchDashboard {
  savedSearches: {
    id: string
    name: string
    criteria: SearchCriteria
    newResultsCount: number     // Nouvelles annonces
    priceAlerts: boolean
    emailNotifications: boolean
  }[]

  recommendations: {
    propertyId: string
    reason: string              // "Correspond à votre recherche Paris 11ᵉ"
    matchScore: number          // % match
  }[]
}
```

---

## 🗄️ Migrations Supabase Nécessaires

### Migration 1 : Champs manquants table `melo_properties`

```sql
-- Ajouter colonnes manquantes
ALTER TABLE melo_properties
ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS neighborhood_description TEXT,
ADD COLUMN IF NOT EXISTS construction_year INTEGER,
ADD COLUMN IF NOT EXISTS renovation_status TEXT CHECK (renovation_status IN ('renovated', 'new', 'to_renovate')),
ADD COLUMN IF NOT EXISTS tags TEXT[],

-- Données financières
ADD COLUMN IF NOT EXISTS price_per_sqm NUMERIC,
ADD COLUMN IF NOT EXISTS agency_fees NUMERIC,
ADD COLUMN IF NOT EXISTS notary_fees NUMERIC,
ADD COLUMN IF NOT EXISTS property_tax_annual NUMERIC,
ADD COLUMN IF NOT EXISTS monthly_payment_estimate NUMERIC,
ADD COLUMN IF NOT EXISTS energy_cost_estimate NUMERIC,

-- Diagnostics
ADD COLUMN IF NOT EXISTS flood_risk TEXT,
ADD COLUMN IF NOT EXISTS geological_risk TEXT,
ADD COLUMN IF NOT EXISTS pollution_risk TEXT,
ADD COLUMN IF NOT EXISTS asbestos_report TEXT,
ADD COLUMN IF NOT EXISTS termites_report TEXT,
ADD COLUMN IF NOT EXISTS radon_level TEXT;

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_properties_score ON melo_properties(personalized_score DESC);
CREATE INDEX IF NOT EXISTS idx_properties_construction_year ON melo_properties(construction_year);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON melo_properties(neighborhood);
```

### Migration 2 : Table `ai_property_analysis`

```sql
-- Créer table pour stocker les analyses IA
CREATE TABLE IF NOT EXISTS ai_property_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id INTEGER REFERENCES melo_properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Analyse état général
  general_condition TEXT CHECK (general_condition IN ('excellent', 'good', 'fair', 'poor')),
  general_condition_details TEXT,

  -- Features détectées (Vision AI)
  remarked_features TEXT[],

  -- Travaux recommandés
  recommended_works JSONB,  -- Array of {description, estimatedCost, diyCost, urgency}
  total_renovation_budget NUMERIC,

  -- Données structurées extraites (NLP)
  structured_data JSONB,  -- {kitchen, bathrooms, heating, parking, etc.}

  -- Métadonnées IA
  vision_model_version TEXT,
  nlp_model_version TEXT,
  confidence_score NUMERIC,

  UNIQUE(property_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_property ON ai_property_analysis(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user ON ai_property_analysis(user_id);
```

### Migration 3 : Table `user_property_scores`

```sql
-- Scoring personnalisé par utilisateur
CREATE TABLE IF NOT EXISTS user_property_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES melo_properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Score personnalisé
  personalized_score NUMERIC CHECK (personalized_score >= 0 AND personalized_score <= 10),

  -- Composantes du score
  score_breakdown JSONB,  -- {location: 9.5, price: 8.2, features: 9.0, ...}

  -- Match avec critères
  criteria_match_percentage NUMERIC,

  -- Recommandation
  recommendation_badge TEXT CHECK (recommendation_badge IN ('recommended', 'favorite', 'trending')),
  recommendation_reason TEXT,

  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_user_score ON user_property_scores(user_id, personalized_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_property ON user_property_scores(property_id);
```

### Migration 4 : Table `conversational_profiles`

```sql
-- Profil conversationnel
CREATE TABLE IF NOT EXISTS conversational_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Historique conversation
  conversation_history JSONB,  -- [{question, answer, timestamp}, ...]

  -- Préférences extraites
  lifestyle_preferences TEXT[],
  priorities TEXT[],
  deal_breakers TEXT[],
  future_projects TEXT[],

  -- Métadonnées
  total_interactions INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  profile_completeness_score NUMERIC  -- 0-100%
);

CREATE INDEX IF NOT EXISTS idx_conv_profiles_user ON conversational_profiles(user_id);
```

### Migration 5 : Table `saved_searches_enhanced`

```sql
-- Recherches sauvegardées avec notifications
CREATE TABLE IF NOT EXISTS saved_searches_enhanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_id INTEGER REFERENCES searches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Nom personnalisé
  name TEXT NOT NULL,

  -- Alertes
  new_results_count INTEGER DEFAULT 0,
  price_alerts_enabled BOOLEAN DEFAULT TRUE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,

  -- Dernière notification
  last_notified_at TIMESTAMPTZ,
  last_check_at TIMESTAMPTZ,

  UNIQUE(user_id, search_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches_enhanced(user_id);
```

---

## 🤖 Fonctions IA Nécessaires

### 1. **Vision AI - Analyse d'images** (Gemini 2.0 Flash Vision)

**Endpoint** : `/api/analyze-property-images`

**Input** :
```typescript
{
  propertyId: number
  imageUrls: string[]
}
```

**Output** :
```typescript
{
  generalCondition: {
    status: 'excellent' | 'good' | 'fair' | 'poor'
    details: string
  }
  remarkedFeatures: string[]
  recommendedWorks: {
    description: string
    estimatedCost: number
    urgency: string
  }[]
  confidence: number
}
```

**Prompt Gemini** :
```
Analyse ces photos d'un bien immobilier et fournis :
1. État général (excellent/bon/moyen/mauvais) avec justification
2. Éléments remarquables (parquet d'époque, moulures, etc.)
3. Travaux recommandés avec estimation coût
4. Détails techniques visibles (chauffage, isolation, etc.)

Réponds en JSON structuré.
```

### 2. **NLP - Extraction de données** (Gemini 2.0 Flash)

**Endpoint** : `/api/extract-property-data`

**Input** :
```typescript
{
  propertyId: number
  description: string
}
```

**Output** :
```typescript
{
  structuredData: {
    kitchen?: string
    bathrooms?: string
    heating?: string
    parking?: string
    orientation?: string
    view?: string
  }
  tags: string[]
  missingInfo: string[]
}
```

**Prompt Gemini** :
```
Extrait de cette description d'annonce :
1. Données structurées (cuisine, sdb, chauffage, parking, etc.)
2. Tags pertinents (rénové, neuf, lumineux, etc.)
3. Informations manquantes importantes

Description: {description}

Réponds en JSON.
```

### 3. **Scoring Personnalisé** (Algorithme + Gemini)

**Endpoint** : `/api/calculate-personalized-score`

**Input** :
```typescript
{
  userId: string
  propertyId: number
}
```

**Logique** :
1. Récupérer critères utilisateur (searches, conversational_profiles)
2. Calculer match critères (prix, localisation, taille, etc.) → 40%
3. Analyser préférences lifestyle (calme, transports, etc.) → 30%
4. Évaluer rapport qualité/prix (comparaison marché) → 20%
5. Facteurs bonus (DPE, état, proximités) → 10%

**Output** :
```typescript
{
  score: number  // 0-10
  breakdown: {
    criteriaMatch: number
    lifestyleMatch: number
    valueForMoney: number
    bonusFactors: number
  }
  recommendation: 'recommended' | 'favorite' | 'trending' | null
  reason: string
}
```

### 4. **Chatbot Conversationnel** (Gemini 2.0 Flash)

**Endpoint** : `/api/conversational-chat`

**Input** :
```typescript
{
  userId: string
  message: string
  conversationHistory: {question: string, answer: string}[]
}
```

**Output** :
```typescript
{
  question: string  // Question générée par Gemini
  options?: string[]  // Options de réponse si applicable
  type: 'text' | 'choice' | 'range'
  extractedPreferences: {
    lifestyle?: string[]
    priorities?: string[]
    dealBreakers?: string[]
  }
}
```

**Prompt Gemini** :
```
Tu es un assistant immobilier qui affine le profil d'un utilisateur.
Historique: {conversationHistory}
Message utilisateur: {message}

Génère la prochaine question contextuelle pour mieux comprendre :
- Son style de vie
- Ses priorités
- Ses deal-breakers

Extrais également les préférences de sa réponse actuelle.
Réponds en JSON.
```

### 5. **Calcul Financier**

**Fonction** : `calculateMonthlyPayment()`

```typescript
function calculateMonthlyPayment(
  price: number,
  downPayment: number,
  loanDuration: number,
  interestRate: number
): FinancialBreakdown {
  const loanAmount = price - downPayment
  const monthlyRate = interestRate / 12 / 100
  const numPayments = loanDuration * 12

  const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                        (Math.pow(1 + monthlyRate, numPayments) - 1)

  return {
    monthlyPayment,
    loanInsurance: loanAmount * 0.0003, // 0.3% du capital
    agencyFees: price * 0.03,
    notaryFees: price * 0.075,
    propertyTaxMonthly: (price * 0.003) / 12, // Estimation 0.3% du prix
    energyCost: 90, // Estimation base DPE
    totalMonthly: monthlyPayment + (loanAmount * 0.0003) + ((price * 0.003) / 12) + 90
  }
}
```

---

## 📋 Plan d'Implémentation par Phase

### ✅ Phase 1-2 : Mockups + Brand (COMPLÉTÉ)
- [x] Mockups HTML ajoutés
- [x] Brand guidelines LUMINᵉ
- [x] Migration couleurs (AuthPage, OnboardingPage, FeedPage, PropertyDetailPage)

### 🔄 Phase 3 : Migrations DB + Edge Functions IA (EN COURS)

**Étape 3.1 : Migrations Supabase**
- [ ] Exécuter Migration 1 (champs melo_properties)
- [ ] Exécuter Migration 2 (ai_property_analysis)
- [ ] Exécuter Migration 3 (user_property_scores)
- [ ] Exécuter Migration 4 (conversational_profiles)
- [ ] Exécuter Migration 5 (saved_searches_enhanced)

**Étape 3.2 : Edge Functions Gemini**
- [ ] Créer `supabase/functions/gemini-vision-analyze/index.ts`
- [ ] Créer `supabase/functions/gemini-extract-data/index.ts`
- [ ] Créer `supabase/functions/gemini-chat/index.ts`
- [ ] Créer `supabase/functions/calculate-score/index.ts`
- [ ] Tester toutes les Edge Functions

**Étape 3.3 : Utilitaires Frontend**
- [ ] Créer `src/lib/gemini-client.ts` (wrapper Edge Functions)
- [ ] Créer `src/lib/financial-calculator.ts`
- [ ] Créer `src/hooks/usePropertyScore.ts`
- [ ] Créer `src/hooks/useAIAnalysis.ts`

### 📦 Phase 4 : Restructuration UI

**Étape 4.1 : Landing Page**
- [ ] Créer `src/pages/LandingPage.tsx` (basé sur landing_page.html)
- [ ] Header public avec logo LUMINᵉ
- [ ] Hero section avec CTA
- [ ] Section features
- [ ] Footer

**Étape 4.2 : FeedPage Refonte**
- [ ] Restructurer en cards horizontales (hybrid_feed.html)
- [ ] Ajouter score personnalisé badge
- [ ] Ajouter mensualité estimée
- [ ] Ajouter badges (Recommandé, Coup de cœur, etc.)
- [ ] Ajouter tags (Rénové, Énergie A, etc.)
- [ ] Implémenter filtres chips avec × pour retirer
- [ ] Ajouter vue Hybride (Liste + Carte côte à côte)

**Étape 4.3 : PropertyDetailPage Refonte**
- [ ] Hero gallery avec thumbnails
- [ ] Section "Analyse LUMINᵉ" (AI insights)
- [ ] Simulateur financier (slider apport, durée, etc.)
- [ ] Section travaux recommandés avec coûts
- [ ] Diagnostics & risques (DPE, Géorisques)
- [ ] Sticky sidebar prix + CTA

**Étape 4.4 : Conversational Profiling**
- [ ] Créer `src/pages/ConversationalProfiling.tsx`
- [ ] Interface chatbot (UI conversationnelle)
- [ ] Appel Edge Function Gemini
- [ ] Sauvegarde préférences dans conversational_profiles
- [ ] Mise à jour scoring après profiling

**Étape 4.5 : Dashboard Recherches**
- [ ] Créer `src/pages/SavedSearchesDashboard.tsx`
- [ ] Liste recherches sauvegardées
- [ ] Compteur nouvelles annonces
- [ ] Recommandations basées IA
- [ ] Toggle alertes email/prix

### 🎨 Phase 5 : Polish & Optimisation

- [ ] Skeleton loaders
- [ ] Error boundaries
- [ ] Animations Framer Motion
- [ ] Responsive mobile
- [ ] Performance (lazy loading, code splitting)
- [ ] Tests (Vitest + Playwright)
- [ ] SEO (meta tags, sitemap)

### 🚀 Phase 6 : Features Avancées

- [ ] Favorites system (backend + frontend)
- [ ] Account page (edit profile, avatar upload)
- [ ] Notifications en temps réel (Supabase Realtime)
- [ ] Partage annonces (social, email)
- [ ] Comparateur annonces (side-by-side)

---

## 🎯 Prochaines Actions Immédiates

1. **Créer et exécuter les 5 migrations Supabase**
2. **Créer les 4 Edge Functions Gemini** (vision, extract, chat, score)
3. **Tester les Edge Functions** avec data réelle
4. **Implémenter Landing Page** (premier contact utilisateur)
5. **Restructurer FeedPage** avec scoring + badges
6. **Enrichir PropertyDetailPage** avec analyse IA

---

## 📝 Notes Importantes

### API Keys nécessaires
- ✅ Supabase : configuré
- ✅ Melo.io : configuré
- ❌ **Google Gemini API Key** : À ajouter dans Supabase Secrets
- ❌ **API Géorisques** : Gratuite, pas de key nécessaire

### Limites & Contraintes
- **Gemini 2.0 Flash** : 1500 requests/min (largement suffisant)
- **Rate limiting** : Implémenter côté Edge Functions
- **Coût IA** : ~0.002$ par analyse (vision) + 0.0001$ par extraction (NLP)
- **Cache IA** : Stocker analyses dans `ai_property_analysis` (ne pas re-analyser)

### Tests à faire
- [ ] Analyse Vision sur 10 annonces test
- [ ] Extraction NLP sur 20 descriptions
- [ ] Scoring sur 5 profils utilisateurs différents
- [ ] Chatbot conversationnel (5 conversations complètes)
- [ ] Calculs financiers (vérifier formules)

---

**Dernière mise à jour** : 2025-11-08 22:30
**Auteur** : Claude (Sonnet 4.5)
**Branch** : `claude/add-html-mockups-design-011CUw3DD32gcMxLaa9e197M`
