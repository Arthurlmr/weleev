# Plan d'Intégration Melo.io - Version Révisée

**Date :** 2025-11-05
**Objectif :** Intégrer les annonces immobilières réelles de Melo.io dans Weleev

---

## 📋 Table des Matières

1. [Changements par rapport au plan initial](#changements-par-rapport-au-plan-initial)
2. [Nouvel Onboarding Hybride](#nouvel-onboarding-hybride)
3. [Architecture technique](#architecture-technique)
4. [Ce que vous devez faire](#ce-que-vous-devez-faire)
5. [Ce que je vais implémenter](#ce-que-je-vais-implémenter)
6. [Plan d'implémentation étape par étape](#plan-dimplémentation-étape-par-étape)

---

## Changements par rapport au plan initial

### ✅ Ce qu'on garde
- Création automatique de recherche Melo après onboarding
- Stockage dans Supabase (`melo_properties`, `melo_searches`)
- Affichage dans le Feed
- Enrichissement IA Gemini

### 🔄 Ce qu'on change

| Avant | Après |
|-------|-------|
| Onboarding chatbot complet | **Onboarding hybride** : Questions fixes + Affinement IA |
| 30 annonces par utilisateur | **10 annonces** les plus récentes |
| Webhooks temps réel | **Pas de webhooks** (pour l'instant) |
| Polling régulier | **Mise à jour quotidienne à 7h** + **Bouton manuel** |
| Questions d'onboarding actuelles | **Questions repensées** (optimales pour Melo) |

---

## Nouvel Onboarding Hybride

### 🎯 Objectif

**Un onboarding rapide, mobile-first, avec de l'IA pour affiner intelligemment.**

### 📱 Structure en 2 parties

#### **Partie 1 : Questions Fixes (Rapides et Essentielles)**

Interface : Formulaire classique avec composants UI optimisés

**Question 1 : Localisation** 🗺️
```
Type : Input avec autocomplétion
Label : "Où cherchez-vous ?"
Placeholder : "Paris, Lyon, Marseille..."

Backend :
- Appel à l'endpoint Melo /indicators/locations
- Conversion ville → location_id
- Stockage du location_id pour la recherche
```

**Question 2 : Type de transaction** 💰
```
Type : Radio buttons / Toggle
Options :
  [ ] Acheter
  [ ] Louer

Backend : transactionType (0=Vente, 1=Location)
```

**Question 3 : Type de bien** 🏠
```
Type : Chips / Boutons
Options :
  [ ] Appartement
  [ ] Maison
  [ ] Les deux

Backend : propertyTypes [0, 1]
```

**Question 4 : Budget maximum** 💸
```
Type : Slider + Input numérique
Range :
  - Vente : 50k → 5M€ (steps de 10k)
  - Location : 300€ → 5000€ (steps de 50€)

Backend : budgetMax
```

**Question 5 : Nombre de pièces minimum** 🛏️
```
Type : Chips / Boutons
Options : 1 | 2 | 3 | 4 | 5+

Backend : roomMin
```

**Temps de remplissage estimé : 30 secondes**

---

#### **Partie 2 : Affinement IA (Intelligent et Contextuel)**

**Transition :**
```
Message : "Parfait ! Voulez-vous affiner votre recherche ?"
Boutons :
  [Oui, affiner] → Passe à l'IA
  [Non, c'est bon] → Crée la recherche directement
```

**Si "Oui, affiner" :**

1. **Appel à Gemini 2.0 Flash Thinking avec contexte**
```typescript
const prompt = `
Tu es un assistant immobilier expert. L'utilisateur cherche :
- Localisation : ${location}
- Transaction : ${transactionType === 0 ? 'Achat' : 'Location'}
- Type de bien : ${propertyType}
- Budget max : ${budgetMax}€
- Pièces min : ${roomMin}

Génère 3-5 questions pertinentes pour affiner sa recherche.
Chaque question doit être associée à un type de composant UI adapté.

Types de composants disponibles :
- "toggle" : Oui/Non (ex: "Souhaitez-vous un parking ?")
- "chips" : Choix multiple (ex: "Quels équipements ?")
- "slider" : Plage de valeurs (ex: "Surface minimum ?")
- "text" : Texte libre (ex: "Quartiers préférés ?")

Réponds en JSON :
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
    }
  ]
}

Sois intelligent :
- Si l'utilisateur cherche à Paris intra-muros, ne demande pas de parking
- Si le budget est élevé, demande des équipements premium
- Si c'est une location, demande meublé/non meublé
- Adapte les questions au contexte
`;
```

2. **Affichage dynamique des questions**

L'IA génère les questions, le front affiche les composants correspondants :

```tsx
// Exemple de rendu
questions.map(q => {
  switch(q.type) {
    case 'toggle':
      return <ToggleQuestion question={q} onAnswer={handleAnswer} />
    case 'slider':
      return <SliderQuestion question={q} onAnswer={handleAnswer} />
    case 'chips':
      return <ChipsQuestion question={q} onAnswer={handleAnswer} />
    case 'text':
      return <TextQuestion question={q} onAnswer={handleAnswer} />
  }
})
```

**Exemple de questions générées par l'IA :**

Pour un achat d'appartement à Paris, budget 500k€ :
```
1. Toggle : "Souhaitez-vous un balcon ou une terrasse ?"
2. Slider : "À quel étage minimum ?" (0-10)
3. Chips : "Quels équipements ?" [Ascenseur, Cave, Gardien, Parking]
4. Text : "Quartiers préférés à Paris ?" (optionnel)
5. Slider : "Surface minimum ?" (30m² - 120m²)
```

Pour une location de maison à Lyon, budget 1500€ :
```
1. Toggle : "Meublé ou non meublé ?"
2. Slider : "Surface de jardin minimum ?" (0-500m²)
3. Toggle : "Garage ou parking obligatoire ?"
4. Chips : "Proximité ?" [École, Métro, Commerces, Parcs]
```

**Temps estimé : 1-2 minutes**

---

### 🧠 Avantages de cette approche

1. **Rapide** : Les questions fixes prennent 30 secondes
2. **Contextuel** : L'IA pose des questions pertinentes selon le profil
3. **Mobile-friendly** : Composants UI natifs, pas de chat lourd
4. **Flexible** : L'utilisateur peut skip l'affinement
5. **Intelligent** : L'IA comprend le contexte (Paris ≠ campagne)
6. **Mapping automatique** : Chaque question est déjà mappée vers Melo

---

## Architecture technique

### 1. Endpoint Locations (Nouveau)

**URL :** `GET https://api.notif.immo/indicators/locations`

**Usage :** Convertir une ville en location ID Melo

**Paramètres :**
```
search: "Paris"
type: "city" | "department" | "region"
```

**Exemple de requête :**
```bash
curl -X GET 'https://api.notif.immo/indicators/locations?search=Paris&type=city' \
  -H 'X-API-KEY: your_key'
```

**Réponse :**
```json
{
  "locations": [
    {
      "id": "/cities/75056",
      "name": "Paris",
      "zipcode": "75001",
      "inseeCode": "75056",
      "type": "city",
      "department": {
        "id": "/departments/75",
        "name": "Paris"
      }
    }
  ]
}
```

**Intégration :**
```typescript
// src/lib/melo.ts
async function searchLocation(cityName: string) {
  const response = await fetch(
    `https://api.notif.immo/indicators/locations?search=${encodeURIComponent(cityName)}&type=city`,
    {
      headers: {
        'X-API-KEY': import.meta.env.VITE_MELO_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  return data.locations[0]; // Prendre le premier résultat
}
```

---

### 2. Flux de données complet

```
┌─────────────────────────────────────────────────┐
│  1. Utilisateur remplit onboarding              │
│     - Questions fixes (ville, budget, type)     │
│     - Optionnel : Affinement IA                 │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  2. Appel endpoint /indicators/locations        │
│     "Paris" → "/cities/75056"                   │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  3. Création recherche Supabase                 │
│     Table: searches                             │
│     Données : location, budget, type, etc.      │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  4. Création recherche Melo                     │
│     POST /searches                              │
│     Mapping Weleev → Melo                       │
│     Réponse : melo_uuid                         │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  5. Stockage dans melo_searches                 │
│     melo_uuid, melo_token, search_id            │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  6. Récupération initiale des annonces          │
│     GET /documents/properties                   │
│     Filtres : critères de la recherche          │
│     itemsPerPage=10, order[createdAt]=desc      │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  7. Stockage dans melo_properties               │
│     10 annonces avec property_data (JSONB)      │
│     is_favorite=false, is_viewed=false          │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  8. Affichage dans FeedPage                     │
│     Lecture depuis melo_properties              │
│     Transformation PropertyDocument → Listing   │
│     Enrichissement IA Gemini                    │
└─────────────────────────────────────────────────┘
```

---

### 3. Mise à jour des annonces

#### **Option A : Bouton manuel "Voir nouvelles annonces"**

```tsx
// Dans FeedPage.tsx
<button onClick={handleRefresh}>
  🔄 Voir les nouvelles annonces
</button>
```

**Comportement :**
1. Appel API immédiat à Melo
2. Récupération des 10 annonces les plus récentes
3. Comparaison avec les annonces existantes (par melo_uuid)
4. Insertion uniquement des nouvelles
5. Affichage d'un toast : "X nouvelles annonces ajoutées !"

**Backend :**
```typescript
// Edge Function : /api/refresh-properties
async function refreshProperties(userId: string) {
  // 1. Récupérer la recherche Melo de l'utilisateur
  const meloSearch = await supabase
    .from('melo_searches')
    .select('*')
    .eq('user_id', userId)
    .single();

  // 2. Appel API Melo
  const properties = await fetchMeloProperties({
    searchCriteria: meloSearch.melo_search_data,
    page: 1,
    itemsPerPage: 10,
    order: { createdAt: 'desc' }
  });

  // 3. Filtrer les nouvelles
  const existingUuids = await supabase
    .from('melo_properties')
    .select('melo_uuid')
    .eq('user_id', userId);

  const newProperties = properties.filter(
    p => !existingUuids.includes(p.uuid)
  );

  // 4. Insérer les nouvelles
  if (newProperties.length > 0) {
    await supabase.from('melo_properties').insert(
      newProperties.map(p => mapMeloToSupabase(p, userId))
    );
  }

  return { count: newProperties.length };
}
```

---

#### **Option B : Mise à jour automatique quotidienne (7h du matin)**

**Technologie :** Supabase Edge Function + Cron

**Configuration Supabase :**
```sql
-- Créer une extension pg_cron (si pas déjà activée)
SELECT cron.schedule(
  'daily-properties-refresh',
  '0 7 * * *',  -- Tous les jours à 7h (UTC)
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/daily-refresh',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

**Edge Function : `/functions/daily-refresh`**
```typescript
serve(async (req) => {
  // 1. Récupérer tous les utilisateurs actifs
  const users = await supabase
    .from('profiles')
    .select('id')
    .eq('onboarded', true);

  // 2. Pour chaque utilisateur, rafraîchir les annonces
  for (const user of users) {
    await refreshProperties(user.id);
  }

  return new Response('Refresh completed', { status: 200 });
});
```

**Alternative simple (si pg_cron pas dispo) :**
- Service externe : Cron-job.org, EasyCron
- Appelle votre Edge Function tous les jours à 7h

---

### 4. Schémas Supabase mis à jour

#### **Table : melo_searches**

```sql
CREATE TABLE melo_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  search_id BIGINT NOT NULL REFERENCES searches(id) ON DELETE CASCADE,

  -- Référence Melo
  melo_uuid UUID NOT NULL UNIQUE,
  melo_token TEXT,

  -- Données de recherche (pour faciliter les updates)
  location_id TEXT NOT NULL,  -- "/cities/75056"
  location_name TEXT NOT NULL, -- "Paris"
  transaction_type INTEGER NOT NULL, -- 0=Vente, 1=Location
  property_types INTEGER[] NOT NULL, -- [0, 1]
  budget_max INTEGER NOT NULL,
  room_min INTEGER,

  -- Configuration complète Melo (JSONB)
  melo_search_data JSONB NOT NULL,

  -- Statut
  last_synced_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_search UNIQUE(user_id, search_id)
);

CREATE INDEX idx_melo_searches_user_id ON melo_searches(user_id);
CREATE INDEX idx_melo_searches_melo_uuid ON melo_searches(melo_uuid);
```

---

#### **Table : melo_properties**

```sql
CREATE TABLE melo_properties (
  id BIGSERIAL PRIMARY KEY,
  melo_uuid UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  melo_search_id BIGINT REFERENCES melo_searches(id) ON DELETE CASCADE,

  -- Données complètes de la propriété (JSONB)
  property_data JSONB NOT NULL,

  -- Champs dénormalisés pour requêtes rapides
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  surface INTEGER,
  rooms INTEGER,
  bedrooms INTEGER,
  city TEXT NOT NULL,
  zipcode TEXT,
  property_type TEXT NOT NULL, -- 'apartment' | 'house'
  transaction_type INTEGER NOT NULL, -- 0=Vente, 1=Location

  -- Médias
  main_image TEXT,
  images TEXT[],
  virtual_tour TEXT,

  -- Statut utilisateur
  is_favorite BOOLEAN DEFAULT FALSE,
  is_viewed BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,

  -- Dates
  melo_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  melo_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_property UNIQUE(user_id, melo_uuid)
);

-- Index
CREATE INDEX idx_melo_properties_user_id ON melo_properties(user_id);
CREATE INDEX idx_melo_properties_melo_uuid ON melo_properties(melo_uuid);
CREATE INDEX idx_melo_properties_price ON melo_properties(price);
CREATE INDEX idx_melo_properties_created_at ON melo_properties(melo_created_at DESC);
CREATE INDEX idx_melo_properties_favorites ON melo_properties(user_id, is_favorite) WHERE is_favorite = true;
```

---

## Ce que vous devez faire

### ✅ Actions côté Arthur

#### **1. Configuration Netlify (5 min)**

Ajouter la variable d'environnement :

```
Netlify Dashboard
→ Site settings
→ Environment variables
→ Add a variable

Key: VITE_MELO_API_KEY
Value: [votre_api_key_melo]
```

**Important :** Redéployer le site après ajout de la variable.

---

#### **2. Configuration Supabase (10 min)**

**A. Créer les tables**

Dans le SQL Editor de Supabase, exécuter :
```sql
-- Je vais fournir le script SQL complet
-- Vous n'aurez qu'à copier-coller et exécuter
```

**B. Activer pg_cron (optionnel)**

Si vous voulez la mise à jour automatique à 7h :
```sql
-- Dans Supabase SQL Editor
-- Je fournirai le script de configuration
```

**Alternative :** Utiliser un service externe (Cron-job.org) pour appeler l'Edge Function quotidiennement.

---

#### **3. Vérifications (5 min)**

- ✅ API Key Melo fonctionne (tester avec Postman/curl)
- ✅ Variables d'environnement bien configurées
- ✅ Tables Supabase créées
- ✅ RLS (Row Level Security) configurée

---

#### **4. Validation de l'onboarding**

Une fois que j'aurai implémenté :
- Tester le parcours complet
- Me donner des retours sur l'UX
- Valider que les questions IA sont pertinentes

---

## Ce que je vais implémenter

### 🛠️ Phase 1 : Onboarding Hybride

**Fichiers à créer/modifier :**

1. **`src/pages/OnboardingPage.tsx`** (refonte complète)
   - Partie 1 : Questions fixes
   - Transition vers affinement
   - Partie 2 : Questions IA dynamiques

2. **`src/components/onboarding/LocationAutocomplete.tsx`**
   - Input avec autocomplétion
   - Appel à `/indicators/locations`

3. **`src/components/onboarding/AiQuestions.tsx`**
   - Composants dynamiques (Toggle, Slider, Chips, Text)
   - Génération via Gemini

4. **`src/lib/melo.ts`** (nouveau)
   - `searchLocation(cityName)` → location_id
   - `createSearch(criteria)` → melo_uuid
   - `getProperties(searchId)` → properties[]
   - `updateSearch(searchId, criteria)`

5. **`src/lib/gemini.ts`** (modifier)
   - `generateAiQuestions(context)` → questions[]

6. **`src/types/index.ts`** (ajouter)
   - Types pour Melo API
   - Types pour questions IA

---

### 🛠️ Phase 2 : Création Recherche Melo

**Fichiers :**

1. **`supabase/migrations/003_melo_integration.sql`**
   - Création tables `melo_searches` et `melo_properties`
   - RLS policies

2. **Modification de `completeOnboarding()` dans OnboardingPage**
   - Appel à `createSearch()` Melo
   - Stockage dans `melo_searches`

---

### 🛠️ Phase 3 : Récupération Annonces

**Fichiers :**

1. **`src/lib/melo.ts`** (étendre)
   - `fetchProperties(searchCriteria, limit=10)`
   - Mapping `PropertyDocument → Listing`

2. **Fonction après création recherche**
   - Récupération immédiate des 10 premières annonces
   - Stockage dans `melo_properties`

---

### 🛠️ Phase 4 : Affichage Feed

**Fichiers :**

1. **`src/pages/FeedPage.tsx`** (modifier)
   - Remplacer `MOCK_LISTINGS` par lecture depuis `melo_properties`
   - Garder l'enrichissement IA Gemini
   - Ajouter bouton "Voir nouvelles annonces"

2. **`src/hooks/useMeloProperties.ts`** (nouveau)
   - Hook pour charger les propriétés
   - Gestion du refresh

---

### 🛠️ Phase 5 : Mise à Jour

**Fichiers :**

1. **`supabase/functions/refresh-properties/index.ts`** (Edge Function)
   - Logique de refresh manuel
   - API endpoint : `/api/refresh-properties`

2. **`supabase/functions/daily-refresh/index.ts`** (Edge Function)
   - Cron quotidien à 7h
   - Refresh pour tous les utilisateurs

3. **`src/pages/FeedPage.tsx`** (ajouter)
   - Bouton refresh avec loading state
   - Toast notification des nouvelles annonces

---

### 🛠️ Phase 6 : Gestion Favoris

**Fichiers :**

1. **`src/pages/FeedPage.tsx`** (modifier)
   - Action save/unsave
   - Update `is_favorite` dans `melo_properties`

2. **`src/pages/FavoritesPage.tsx`** (modifier)
   - Charger depuis `melo_properties WHERE is_favorite = true`

---

## Plan d'implémentation étape par étape

### 📅 Ordre d'implémentation

| Étape | Description | Durée estimée | Dépendances |
|-------|-------------|---------------|-------------|
| 1 | Créer les tables Supabase | 10 min | Vous : Exécuter le SQL |
| 2 | Ajouter API Key Netlify | 5 min | Vous : Config Netlify |
| 3 | Créer `src/lib/melo.ts` | 30 min | Étape 2 |
| 4 | Implémenter endpoint `/indicators/locations` | 15 min | Étape 3 |
| 5 | Créer composants Onboarding Partie 1 (questions fixes) | 45 min | Étape 4 |
| 6 | Implémenter génération questions IA (Gemini) | 30 min | Étape 3 |
| 7 | Créer composants dynamiques AI Questions | 45 min | Étape 6 |
| 8 | Connecter création recherche Melo | 30 min | Étapes 3, 5, 7 |
| 9 | Récupération initiale 10 annonces | 20 min | Étape 8 |
| 10 | Modifier FeedPage pour charger depuis Supabase | 30 min | Étape 9 |
| 11 | Implémenter bouton "Voir nouvelles annonces" | 30 min | Étape 10 |
| 12 | Créer Edge Function daily-refresh | 30 min | Étape 9 |
| 13 | Configurer cron 7h | 15 min | Étape 12 |
| 14 | Gestion favoris | 20 min | Étape 10 |
| 15 | Tests & ajustements | 60 min | Toutes |

**Durée totale estimée : ~6-7 heures de dev**

---

### 🚦 Validation avant de commencer

**Checklist :**

- [ ] Vous avez votre API Key Melo.io
- [ ] Vous êtes OK avec le nouvel onboarding hybride
- [ ] Vous êtes OK avec 10 annonces max
- [ ] Vous êtes OK avec refresh manuel + cron 7h
- [ ] Vous êtes OK pour créer les tables Supabase
- [ ] Vous êtes OK pour ajouter la variable d'environnement

**Une fois tout coché → On lance l'implémentation ! 🚀**

---

## Questions / Clarifications

### ❓ À discuter si besoin

1. **Affinement IA :**
   - Combien de questions max ? (je propose 3-5)
   - L'utilisateur peut-il skip certaines questions ?

2. **Limite 10 annonces :**
   - Que faire si l'utilisateur veut plus ?
   - Pagination ? Ou garder 10 max ?

3. **Mise à jour 7h :**
   - 7h heure française (UTC+1) ou UTC ?
   - Notification à l'utilisateur (email/push) ?

4. **Favoris :**
   - Limite de favoris ? (ex: 50 max)

---

**Dites-moi si vous êtes OK avec ce plan et on passe à l'implémentation ! 💪**
