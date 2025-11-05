# Weleev - Historique des versions

## Version 1.0.0 - 5 novembre 2025

### 🎉 Premier déploiement fonctionnel complet

**Commit de référence:** [dc44389a17db72632f4bf0bb83943a641f1e84a1](https://github.com/Arthurlmr/weleev/commit/dc44389a17db72632f4bf0bb83943a641f1e84a1)

**Date:** 5 novembre 2025

---

## Résumé de l'état actuel

Weleev est une application web de recherche immobilière intelligente qui utilise l'API Melo.io pour fournir des annonces immobilières enrichies. L'application offre une expérience d'onboarding moderne et un système de recherche personnalisé.

### Architecture technique

**Frontend:**
- React 18 avec TypeScript
- React Router v6 pour la navigation
- Tailwind CSS v3 + shadcn/ui pour l'UI
- Framer Motion pour les animations
- Déploiement sur Netlify

**Backend:**
- Supabase (PostgreSQL + Auth + Edge Functions)
- API Melo.io pour les données immobilières
- 3 Edge Functions Deno pour proxy API

---

## Base de données Supabase

### Tables principales

#### `profiles`
Profils utilisateurs liés à l'authentification Supabase.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Trigger automatique:**
```sql
-- Création automatique du profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, onboarded)
  VALUES (new.id, new.email, false);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

#### `searches`
Recherches immobilières des utilisateurs.

```sql
CREATE TABLE searches (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'any')),
  max_budget INTEGER NOT NULL,
  min_rooms INTEGER NOT NULL,
  wants_parking BOOLEAN DEFAULT false,
  refinements JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_searches_user_id ON searches(user_id);
```

---

#### `melo_searches`
Références aux recherches créées dans l'API Melo.io.

```sql
CREATE TABLE melo_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_id BIGINT REFERENCES searches(id) ON DELETE CASCADE,
  melo_uuid TEXT NOT NULL UNIQUE,
  melo_token TEXT NOT NULL,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  transaction_type INTEGER NOT NULL,
  property_types INTEGER[] NOT NULL,
  budget_max INTEGER NOT NULL,
  room_min INTEGER NOT NULL,
  melo_search_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_melo_searches_user_id ON melo_searches(user_id);
CREATE INDEX idx_melo_searches_search_id ON melo_searches(search_id);
CREATE INDEX idx_melo_searches_melo_uuid ON melo_searches(melo_uuid);
```

---

#### `melo_properties`
Propriétés immobilières enrichies provenant de Melo.io.

```sql
CREATE TABLE melo_properties (
  id BIGSERIAL PRIMARY KEY,
  melo_uuid TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  melo_search_id BIGINT REFERENCES melo_searches(id) ON DELETE CASCADE,

  -- Données complètes JSON
  property_data JSONB NOT NULL,

  -- Champs principaux extraits
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  surface INTEGER,
  rooms INTEGER,
  bedrooms INTEGER,
  city TEXT NOT NULL,
  zipcode TEXT,
  property_type TEXT NOT NULL,
  transaction_type INTEGER NOT NULL,

  -- Images
  main_image TEXT,
  images JSONB,
  pictures_remote JSONB,
  virtual_tour TEXT,

  -- Description et caractéristiques
  description TEXT,
  features JSONB,

  -- Performance énergétique
  dpe_category VARCHAR(1),
  dpe_value INTEGER,
  ges_category VARCHAR(1),
  ges_value INTEGER,

  -- Localisation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Détails supplémentaires
  floor INTEGER,
  land_surface INTEGER,
  construction_year INTEGER,
  price_per_meter DECIMAL(10, 2),

  -- Contact agence
  agency_name VARCHAR(255),
  agency_phone VARCHAR(50),
  advert_url TEXT,

  -- Métadonnées Melo
  melo_created_at TIMESTAMPTZ,
  melo_updated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_melo_properties_user_id ON melo_properties(user_id);
CREATE INDEX idx_melo_properties_melo_search_id ON melo_properties(melo_search_id);
CREATE INDEX idx_melo_properties_location ON melo_properties(latitude, longitude);
CREATE INDEX idx_melo_properties_price ON melo_properties(price);
CREATE INDEX idx_melo_properties_city ON melo_properties(city);
CREATE INDEX idx_melo_properties_melo_uuid ON melo_properties(melo_uuid);
```

---

## Configuration Supabase

### Variables d'environnement

**Secrets Supabase (Edge Functions):**
```bash
MELO_API_KEY=<votre_clé_api_melo_production>
MELO_API_URL=https://api.notif.immo
```

**JWT Settings:**
- JWT verification: **DISABLED** pour les Edge Functions
- Permet les appels Edge Functions sans authentification (pour éviter les erreurs CORS)

### Row Level Security (RLS)

**Politique actuelle:** RLS désactivé pour développement
**TODO pour production:** Activer RLS avec politiques :
- Users peuvent lire/écrire uniquement leurs propres données
- Politiques basées sur `auth.uid() = user_id`

---

## Edge Functions Supabase

### 1. `search-location`
**Route:** `https://<project>.supabase.co/functions/v1/search-location`

**Fonction:** Autocomplete de villes via l'API Melo.io

**Endpoint Melo:** `GET /public/location-autocomplete?query={query}`

**Code:**
```typescript
const url = new URL(`${MELO_API_URL}/public/location-autocomplete`);
url.searchParams.set('query', search);

const response = await fetch(url, {
  headers: { 'X-API-KEY': MELO_API_KEY }
});

const data = await response.json();
const locations = data['hydra:member'] || [];
return new Response(JSON.stringify({ locations }), { ... });
```

---

### 2. `create-search`
**Route:** `https://<project>.supabase.co/functions/v1/create-search`

**Fonction:** Créer une recherche dans Melo.io

**Endpoint Melo:** `POST /searches`

**Payload requis:**
```json
{
  "title": "Recherche Bordeaux",
  "transactionType": 0,
  "propertyTypes": [1],
  "budgetMax": 300000,
  "roomMin": 3,
  "includedCities": ["/cities/13061"]
}
```

**Format IRI important:** Les villes doivent être au format `/cities/{id}` (string IRI, pas integer)

**Réponse Melo:**
```json
{
  "@id": "/searches/{uuid}",
  "token": "abc123..."
}
```

⚠️ **Important:** Extraire l'UUID depuis `@id` avec `.split('/').pop()`

---

### 3. `get-properties`
**Route:** `https://<project>.supabase.co/functions/v1/get-properties`

**Fonction:** Récupérer les propriétés d'une recherche

**Endpoint Melo:** `GET /documents/properties`

**Paramètres avec notation array:**
```
propertyTypes[]=1
includedCities[]=/cities/13061
transactionType=0
budgetMax=300000
itemsPerPage=10
page=1
```

**Gestion des arrays dans le code:**
```typescript
if (Array.isArray(value)) {
  value.forEach((item: any) => {
    url.searchParams.append(`${key}[]`, item.toString());
  });
}
```

---

## Configuration Netlify

### Variables d'environnement

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_MELO_API_KEY=<non_utilisé_en_frontend>
VITE_GEMINI_API_KEY=<désactivé_pour_sécurité>
NODE_VERSION=20.x
```

### Build settings

**Build command:** `npm run build`
**Publish directory:** `dist`

**Redirects (netlify.toml):**
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Flux d'onboarding complet

### 1. Inscription / Connexion
- Magic link email via Supabase Auth
- Création automatique du profil via trigger `handle_new_user()`
- Redirection vers `/onboarding` si `onboarded = false`

### 2. Questions onboarding (OnboardingPage)

**Étape 1 - Localisation:**
- Autocomplete ville via `search-location` Edge Function
- Stockage de `location['@id']` (format IRI `/cities/{id}`)

**Étape 2-5 - Préférences:**
- Type de transaction (vente/location)
- Type de bien (maison/appartement/tous)
- Budget max
- Nombre de pièces min

**Étape 6 - Affinage (optionnel avec IA - désactivé):**
- Questions dynamiques générées par IA
- Critères supplémentaires

### 3. Création de la recherche

**a) Insertion dans `searches`:**
```typescript
const { data: searchData } = await supabase
  .from('searches')
  .insert({
    user_id: user.id,
    location: fixedPrefs.locationName,
    property_type: fixedPrefs.propertyType,
    max_budget: fixedPrefs.budgetMax,
    min_rooms: fixedPrefs.roomMin,
  })
  .select()
  .single();
```

**b) Création recherche Melo via `create-search`:**
```typescript
const meloSearchData = {
  title: `Recherche ${fixedPrefs.locationName}`,
  transactionType: fixedPrefs.transactionType,
  propertyTypes: mapPropertyTypeToMelo(fixedPrefs.propertyType),
  budgetMax: fixedPrefs.budgetMax,
  roomMin: fixedPrefs.roomMin,
  includedCities: [fixedPrefs.locationId], // Format IRI
};

const meloSearch = await createSearch(meloSearchData);
const meloUuid = meloSearch['@id'].split('/').pop();
```

**c) Insertion dans `melo_searches`:**
```typescript
const { data: meloSearchRecord } = await supabase
  .from('melo_searches')
  .insert({
    user_id: user.id,
    search_id: searchData.id,
    melo_uuid: meloUuid,
    melo_token: meloSearch.token,
    location_id: fixedPrefs.locationId,
    location_name: fixedPrefs.locationName,
    transaction_type: fixedPrefs.transactionType,
    property_types: mapPropertyTypeToMelo(fixedPrefs.propertyType),
    budget_max: fixedPrefs.budgetMax,
    room_min: fixedPrefs.roomMin,
    melo_search_data: meloSearchData,
  })
  .select()
  .single();
```

**d) Récupération des 10 premières propriétés:**
```typescript
const propertiesResponse = await getProperties({
  ...meloSearchData,
  itemsPerPage: 10,
  page: 1,
});
```

**e) Extraction et insertion des propriétés:**
```typescript
const propertiesToInsert = propertiesResponse['hydra:member'].map((prop: any) => {
  const latestAdvert: any = prop.adverts?.[0] || {};

  return {
    melo_uuid: prop.uuid,
    user_id: user.id,
    melo_search_id: meloSearchRecord.id, // ⚠️ ID de melo_searches, pas searches
    property_data: prop,

    // Extraction de 20+ champs
    title: prop.title || generateDefaultTitle(prop),
    price: prop.price,
    surface: prop.surface || null,
    rooms: prop.room || null,
    bedrooms: prop.bedroom || null,
    city: prop.city?.name || '',
    zipcode: prop.city?.zipcode || null,

    // Images
    main_image: prop.pictures?.[0] || latestAdvert.pictures?.[0] || null,
    images: prop.pictures || latestAdvert.pictures || [],
    pictures_remote: latestAdvert.picturesRemote || prop.picturesRemote || [],

    // Description
    description: prop.description || latestAdvert.description || null,
    features: latestAdvert.features || [],

    // DPE/GES
    dpe_category: latestAdvert.energy?.category || null,
    dpe_value: latestAdvert.energy?.value || null,
    ges_category: latestAdvert.greenHouseGas?.category || null,
    ges_value: latestAdvert.greenHouseGas?.value || null,

    // GPS
    latitude: prop.location?.lat || null,
    longitude: prop.location?.lon || null,

    // Autres
    floor: prop.floor || latestAdvert.floor || null,
    land_surface: prop.landSurface || latestAdvert.landSurface || null,
    construction_year: latestAdvert.constructionYear || null,
    price_per_meter: prop.pricePerMeter || latestAdvert.pricePerMeter || null,

    // Agence
    agency_name: latestAdvert.contact?.agency || null,
    agency_phone: latestAdvert.contact?.phone || null,
    advert_url: latestAdvert.url || null,

    melo_created_at: prop.createdAt,
    melo_updated_at: prop.updatedAt || null,
  };
});

await supabase.from('melo_properties').insert(propertiesToInsert);
```

**f) Marquage utilisateur comme onboardé:**
```typescript
await supabase
  .from('profiles')
  .update({ onboarded: true })
  .eq('id', user.id);
```

**g) Redirection vers feed:**
```typescript
navigate('/feed');
```

---

## Problèmes résolus

### ❌ Erreur IRI format (integer vs string)

**Symptôme:**
```json
{
  "error": "Expected IRI or nested document for attribute 'includedCities', 'integer' given."
}
```

**Cause:** Envoi de `[32655]` au lieu de `["/cities/32655"]`

**Solution:**
```typescript
// ❌ Avant
setFixedPrefs(prev => ({
  ...prev,
  locationId: location.id, // Integer
}));

// ✅ Après
setFixedPrefs(prev => ({
  ...prev,
  locationId: location['@id'], // String IRI "/cities/32655"
}));
```

---

### ❌ Null title constraint violation

**Symptôme:**
```json
{
  "code": "23502",
  "message": "null value in column \"title\" violates not-null constraint"
}
```

**Solution:** Génération automatique de titre
```typescript
const generateDefaultTitle = (prop: any): string => {
  const propertyTypeNames: Record<number, string> = {
    0: 'Appartement', 1: 'Maison', 2: 'Immeuble', ...
  };
  const typeName = propertyTypeNames[prop.propertyType] || 'Bien';
  const rooms = prop.room ? `${prop.room} pièces` : '';
  const surface = prop.surface ? `${prop.surface}m²` : '';
  const city = prop.city?.name || '';
  return `${typeName} ${rooms} ${surface} - ${city}`.trim();
};
```

---

### ❌ Foreign key constraint violation

**Symptôme:**
```json
{
  "code": "23503",
  "message": "Key is not present in table \"melo_searches\"."
}
```

**Cause:** Utilisation de `searches.id` au lieu de `melo_searches.id`

**Solution:**
```typescript
// ❌ Avant
melo_search_id: searchData.id

// ✅ Après
const { data: meloSearchRecord } = await supabase
  .from('melo_searches')
  .insert({...})
  .select()
  .single();

melo_search_id: meloSearchRecord.id
```

---

### ❌ Decimal error for price_per_meter

**Symptôme:**
```json
{
  "code": "22P02",
  "message": "invalid input syntax for type integer: \"2168.69\""
}
```

**Solution:**
```sql
ALTER TABLE public.melo_properties
ALTER COLUMN price_per_meter TYPE DECIMAL(10, 2);
```

---

### ❌ Profil non créé automatiquement

**Solution:** Trigger PostgreSQL
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Pages de l'application

### `/auth` - AuthPage
- Magic link authentication
- Design moderne avec animations Framer Motion
- Gradient background

### `/onboarding` - OnboardingPage
- 6 étapes d'onboarding
- Autocomplete ville avec debounce
- Sliders pour budget et nombre de pièces
- Design avec shadcn/ui et animations
- Progress bar

### `/feed` - FeedPage
- Liste des propriétés de l'utilisateur
- Chargement depuis `melo_properties` table
- Filtrage par recherche
- Navigation vers détail au clic

### `/property/:id` - PropertyDetailPage
- Affichage exhaustif de toutes les données d'une propriété
- Carousel d'images avec navigation
- DPE/GES avec badges colorés
- Carte OpenStreetMap interactive
- Contact agence
- Lien vers annonce originale
- Design moderne et élégant

---

## Stack technique détaillée

**Frontend:**
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- React Router 6.26.1
- Tailwind CSS 3.4.1
- shadcn/ui (Radix UI)
- Framer Motion 11.5.4
- Lucide React (icons)

**Backend:**
- Supabase (PostgreSQL 15)
- Supabase Auth (Magic Link)
- Supabase Edge Functions (Deno)

**APIs:**
- Melo.io API v1 (production)

**Déploiement:**
- Frontend: Netlify
- Backend: Supabase Cloud

---

## Commandes utiles

**Développement local:**
```bash
npm run dev
```

**Build production:**
```bash
npm run build
```

**Déploiement Edge Functions:**
```bash
supabase functions deploy search-location
supabase functions deploy create-search
supabase functions deploy get-properties
```

**Nettoyer base de données (dev):**
```sql
DELETE FROM melo_properties;
DELETE FROM melo_searches;
DELETE FROM searches;
DELETE FROM profiles;
DELETE FROM auth.users;
```

---

## TODO / Améliorations futures

- [ ] Activer Row Level Security (RLS)
- [ ] Système de favoris
- [ ] Notifications push pour nouvelles annonces
- [ ] Filtres avancés dans le feed
- [ ] Comparateur de biens
- [ ] Historique de recherches
- [ ] Export PDF des annonces
- [ ] Partage d'annonces
- [ ] Analyse IA des descriptions (enrichissement automatique)
- [ ] Points d'intérêt Melo.io (transports, commerces)
- [ ] Données de marché Melo.io (prix moyens, tendances)

---

## Support et documentation

**Documentation Melo.io:**
- Voir `MELO_API.md` pour spécifications complètes de l'API

**Guide de déploiement:**
- Voir `DEPLOYMENT.md` pour instructions détaillées

**Contact:**
- Repository: https://github.com/Arthurlmr/weleev
