# Documentation Melo.io - Synthèse Complète

**Date de création :** 2025-11-05
**Objectif :** Intégration de l'API Melo.io pour fournir des annonces immobilières réelles aux utilisateurs de Weleev

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Concepts clés](#concepts-clés)
3. [Authentification](#authentification)
4. [Environnements & URLs](#environnements--urls)
5. [Endpoints - Recherches (Searches)](#endpoints---recherches-searches)
6. [Endpoints - Propriétés (Properties)](#endpoints---propriétés-properties)
7. [Modèles de données](#modèles-de-données)
8. [Recommandations pour l'intégration](#recommandations-pour-lintégration)

---

## Vue d'ensemble

### Qu'est-ce que Melo.io ?

**Melo.io est une API qui permet d'accéder à des données immobilières on-chain.**

> "The Melo API is designed to enable builders to easily query, observe, and automate on-chain real estate data and insights."

### Cas d'usage pour Weleev

L'API Melo.io nous permettra de :
- ✅ Récupérer des annonces immobilières réelles (ventes et locations)
- ✅ Créer des recherches sauvegardées pour chaque utilisateur
- ✅ Filtrer les propriétés selon les critères d'onboarding
- ✅ Recevoir des notifications en temps réel (webhooks)
- ✅ Suivre les changements de prix et de disponibilité

### Ressources disponibles

- 📚 Documentation technique complète
- 🔌 Intégrations pré-construites (Make.com, Zapier)
- 📝 Changelog des mises à jour
- ❓ FAQ

---

## Concepts clés

### 1. **Property** (Propriété)

**Définition :** Une unité immobilière spécifique (maison, appartement, espace commercial).

**Caractéristiques :**
- C'est l'entité fondamentale du système
- Une propriété peut avoir plusieurs "adverts" (annonces) de différentes sources
- Contient les informations physiques du bien (surface, chambres, etc.)

### 2. **Advert** (Annonce)

**Définition :** Une présentation ou promotion spécifique d'une propriété par une agence ou un particulier.

**Caractéristiques :**
- Plusieurs annonces peuvent référencer la même propriété
- Contient les informations de contact, prix, agence
- Peut expirer ou être mise à jour

### 3. **Search** (Recherche sauvegardée)

**Définition :** Une requête définie par l'utilisateur, sauvegardée et exécutée en temps réel.

**Caractéristiques :**
- Permet de récupérer des propriétés selon des critères spécifiques
- Peut être associée à des notifications (email, webhook)
- Réutilisable et modifiable

### 4. **Match** (Correspondance)

**Définition :** Une nouvelle propriété qui correspond aux critères d'une recherche sauvegardée.

**Utilisation :** Notifications automatiques quand de nouvelles propriétés correspondent

### 5. **Event** (Événement)

**Définition :** Occurrence traçable dans le système.

**Types d'événements :**
- Création d'une annonce
- Mise à jour d'une annonce
- Expiration d'une annonce
- Changement de prix
- Changement de surface

### 6. **Webhook**

**Définition :** Mécanisme de notification en temps réel vers un endpoint spécifié.

**Usage :** Alerter quand des propriétés correspondent à une recherche ou quand des événements se produisent

### 7. **lastCrawledAt**

**Définition :** Timestamp de la dernière mise à jour.

**Comportement :**
- Au niveau propriété : date de la dernière mise à jour d'annonce (excluant les expirées)
- Au niveau annonce : inclut les annonces expirées

---

## Authentification

### Méthode d'authentification

**Header requis :** `X-API-KEY`

```bash
curl -X GET 'https://api.notif.immo/documents/properties' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: <votre_api_key>'
```

### Headers standards

```
Content-Type: application/json
X-API-KEY: <api_key>
platformOrigin: melo  # Pour certains endpoints
```

---

## Environnements & URLs

### URL de base

**Production :** `https://api.notif.immo`

### Endpoints principaux

```
/documents/properties    → Récupérer les propriétés
/searches               → Gérer les recherches sauvegardées
```

---

## Endpoints - Recherches (Searches)

### 1. Créer une recherche

**Endpoint :** `POST /searches`

**Headers :**
```
Content-Type: application/json
X-API-KEY: <api_key>
```

**Champs requis :**
```json
{
  "title": "string",
  "propertyTypes": [0, 1],  // 0=Appartement, 1=Maison, etc.
  "transactionType": 0       // 0=Vente, 1=Location
}
```

**Champs optionnels importants :**

**Budget & Dimensions :**
```json
{
  "budgetMin": 100000,
  "budgetMax": 500000,
  "surfaceMin": 50,
  "surfaceMax": 150,
  "landSurfaceMin": 100,
  "landSurfaceMax": 1000,
  "bedroomMin": 2,
  "roomMin": 3,
  "roomMax": 6
}
```

**Localisation :**
```json
{
  "lat": 48.8566,
  "lon": 2.3522,
  "radius": 10,  // en kilomètres
  "includedCities": ["/cities/75056"],
  "includedDepartments": ["/departments/75"],
  "includedZipcodes": ["75001", "75002"],
  "excludedCities": ["/cities/75001"]
}
```

**Filtres supplémentaires :**
```json
{
  "furnished": true,
  "withVirtualTour": true,
  "withCoherentPrice": true,
  "publisherTypes": [0, 1],  // 0=Particulier, 1=Professionnel
  "expressions": [
    {
      "include": ["balcon", "parking"],
      "exclude": ["rez-de-chaussée"]
    }
  ]
}
```

**Notifications :**
```json
{
  "notificationEnabled": true,
  "notificationRecipient": "user@example.com",
  "endpointRecipient": "https://weleev.com/api/webhooks/match",
  "eventEndpoint": "https://weleev.com/api/webhooks/events",
  "subscribedEvents": ["property.ad.create", "property.ad.update"]
}
```

**Réponse :**
```json
{
  "@id": "/searches/uuid-123",
  "uuid": "uuid-123",
  "title": "Appartement Paris",
  "token": "webhook-auth-token",
  "createdAt": "2025-11-05T10:00:00+00:00",
  ...
}
```

---

### 2. Récupérer toutes les recherches

**Endpoint :** `GET /searches`

**Paramètres de requête :**
```
notificationEnabled: boolean  // Filtrer par notifications activées
order[title]: "asc" | "desc" // Tri alphabétique
page: integer                 // Pagination
title: string                 // Filtrer par titre
```

**Exemple :**
```bash
GET /searches?notificationEnabled=true&page=1&order[title]=asc
```

**Réponse (Format Hydra) :**
```json
{
  "hydra:member": [
    {
      "@id": "/searches/uuid-123",
      "uuid": "uuid-123",
      "title": "Appartement Paris",
      ...
    }
  ],
  "hydra:totalItems": 5,
  "hydra:view": {
    "hydra:first": "/searches?page=1",
    "hydra:last": "/searches?page=2",
    "hydra:next": "/searches?page=2"
  }
}
```

---

### 3. Récupérer une recherche spécifique

**Endpoint :** `GET /searches/{id}`

**Paramètre :**
- `id` (path) : UUID de la recherche

**Exemple :**
```bash
GET /searches/550e8400-e29b-41d4-a716-446655440000
```

**Réponse :** Objet Search complet

---

### 4. Mettre à jour une recherche

**Endpoint :** `POST /searches/{id}`

**Corps de la requête :** Même format que la création

**Champs modifiables :**
- Tous les critères de recherche
- Paramètres de notification
- Titre

**Exemple :**
```json
{
  "title": "Appartement Paris - Modifié",
  "budgetMax": 600000,
  "notificationEnabled": false
}
```

---

### 5. Supprimer une recherche

**Endpoint :** `DELETE /searches/{id}`

**Paramètre :**
- `id` (path) : UUID de la recherche

**Exemple :**
```bash
DELETE /searches/550e8400-e29b-41d4-a716-446655440000
```

**Réponse :** Statut 204 (No Content)

---

## Endpoints - Propriétés (Properties)

### Récupérer les propriétés

**Endpoint :** `GET /documents/properties`

**URL complète :** `https://api.notif.immo/documents/properties`

---

### Paramètres de filtrage

#### 🗺️ Localisation & Géographie

```
includedCities: ["/cities/30953"]
includedDepartments: ["/departments/77"]
includedInseeCodes: [75056]
includedZipcodes: ["75001", "75002"]

excludedCities: ["/cities/123"]
excludedInseeCodes: [12345]
excludedZipcodes: ["75020"]
excludedSites: ["leboncoin"]

geoShapes: [[lat, lon], [lat, lon], ...]  // Polygone
geoAccuracy: 1 | 2  // 1=Numéro de rue, 2=Quartier

lat: 48.8566
lon: 2.3522
radius: 10  // en km
```

#### 🏠 Caractéristiques de la propriété

```
propertyTypes: [0, 1, 2, 3, 4, 5, 6]
// 0=Appartement, 1=Maison, 2=Immeuble, 3=Parking
// 4=Bureau, 5=Terrain, 6=Commerce

bedroomMin: 2
bedroomMax: 5

roomMin: 3
roomMax: 6

surfaceMin: 50
surfaceMax: 150

landSurfaceMin: 100
landSurfaceMax: 1000

floorQuantityMin: 1
floorQuantityMax: 3

floor: 2  // Étage spécifique

elevator: true
furnished: true
```

#### 💰 Prix & Finances

```
budgetMin: 100000
budgetMax: 500000

priceExcludingFeesMin: 95000
priceExcludingFeesMax: 480000

pricePerMeterMin: 2000
pricePerMeterMax: 8000

inventoryPriceMin: 100000
inventoryPriceMax: 500000

condominiumFeesMin: 50
condominiumFeesMax: 500

rentalChargesMin: 50
rentalChargesMax: 200

rentalPledgeMin: 1000
rentalPledgeMax: 3000

renterFeesMin: 100
renterFeesMax: 1000

feesPercentageMin: 3
feesPercentageMax: 10

feesResponsibility: 0 | 1  // 0=Vendeur, 1=Acheteur
```

#### 🌱 Énergie & Environnement

```
energyCategories: ["A", "B", "C", "D", "E", "F", "G"]
energyValueMin: 50
energyValueMax: 300

greenHouseGasCategories: ["A", "B", "C", "D", "E", "F", "G"]
greenHouseGasValueMin: 5
greenHouseGasValueMax: 50
```

#### 📅 Filtres temporels

```
fromDate: "2020-01-10"
toDate: "2025-12-31"

fromUpdatedAt: "2025-01-01T00:00:00Z"
toUpdatedAt: "2025-12-31T23:59:59Z"

fromExpiredAt: "2025-01-01"
toExpiredAt: "2025-12-31"

// Événements de variation de prix
eventPriceVariationFromCreatedAt: "2025-01-01"
eventPriceVariationToCreatedAt: "2025-12-31"
eventPriceVariationMin: -10  // %
eventPriceVariationMax: 10   // %

// Événements de variation de surface
eventSurfaceVariationFromCreatedAt: "2025-01-01"
eventSurfaceVariationToCreatedAt: "2025-12-31"
eventSurfaceVariationMin: -5   // %
eventSurfaceVariationMax: 5    // %
```

#### 📝 Filtres de contenu

```
expressions: [
  {
    "include": ["balcon", "parking"],
    "exclude": ["rez-de-chaussée"],
    "strict": true
  }
]

publisherTypes: [0, 1]  // 0=Particulier, 1=Professionnel

includedSites: ["seloger", "leboncoin"]
excludedSites: ["pap"]

transactionType: 0 | 1  // 0=Vente, 1=Location

expired: true | false | null  // null=tous

withLocation: true  // Doit avoir des coordonnées
withVirtualTour: true
withCoherentPrice: true  // Filtre les prix réalistes (défaut: true)

excludedProperties: ["/properties/uuid-123"]
```

#### 📊 Tri & Pagination

```
order[createdAt]: "asc" | "desc"  // défaut: desc
order[price]: "asc" | "desc"
order[pricePerMeter]: "asc" | "desc"
order[surface]: "asc" | "desc"
order[updatedAt]: "asc" | "desc"

sortMode: "property" | "advert"
// property = tri par date de création de la propriété
// advert = tri par date de création de l'annonce

page: 1
itemsPerPage: 10  // défaut: 10, max: 30
```

---

### Exemple de requête complète

```bash
curl -g -X GET 'https://api.notif.immo/documents/properties?\
includedDepartments[]=departments/77&\
fromDate=2020-01-10&\
propertyTypes[]=1&\
transactionType=0&\
withCoherentPrice=true&\
budgetMin=1800000&\
budgetMax=1900000&\
page=1&\
itemsPerPage=30' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: <api_key>'
```

---

## Modèles de données

### PropertyDocument (Objet Propriété)

```json
{
  "@id": "/documents/properties/uuid-123",
  "@type": "PropertyDocument",
  "@context": "/contexts/PropertyDocument",

  "uuid": "550e8400-e29b-41d4-a716-446655440000",

  // Informations principales
  "title": "Appartement 3 pièces Paris 15ème",
  "description": "Bel appartement lumineux...",

  // Prix
  "price": 450000,
  "pricePerMeter": 7500,
  "priceExcludingFees": 440000,
  "inventoryPrice": 450000,

  // Caractéristiques physiques
  "surface": 60,
  "landSurface": null,
  "bedroom": 2,
  "room": 3,
  "floor": 3,
  "floorQuantity": 5,

  // Équipements
  "furnished": false,
  "elevator": true,

  // Finances supplémentaires
  "condominiumFees": 150,
  "rentalCharges": null,
  "rentalPledge": null,
  "renterFees": null,

  // Énergie
  "energy": {
    "category": "C",
    "value": 150
  },
  "greenHouseGas": {
    "category": "D",
    "value": 25
  },

  // Localisation
  "city": {
    "name": "Paris",
    "zipcode": "75015",
    "inseeCode": "75115",
    "latitude": 48.8400,
    "longitude": 2.3000,
    "department": {
      "code": "75",
      "name": "Paris"
    },
    "region": {
      "code": "11",
      "name": "Île-de-France"
    }
  },

  "locations": [
    {
      "lat": 48.8400,
      "lon": 2.3000
    }
  ],

  // Médias
  "pictures": [
    "https://exemple.com/image1.jpg",
    "https://exemple.com/image2.jpg"
  ],
  "picturesRemote": [
    "https://remote.com/image1.jpg"
  ],
  "virtualTour": "https://visite.com/tour123",

  // Annonces associées
  "adverts": [
    {
      "@id": "/documents/adverts/advert-uuid",
      "uuid": "advert-uuid-123",
      "url": "https://seloger.com/annonce-123",
      "site": "seloger",
      "contact": {
        "name": "Agence Immobilière XYZ",
        "phone": "+33123456789",
        "email": "contact@agence.fr"
      },
      "publisher": {
        "name": "Agence XYZ",
        "type": 1  // 0=Particulier, 1=Professionnel
      },
      "createdAt": "2025-01-15T10:00:00+00:00",
      "events": [
        {
          "type": "price_variation",
          "oldValue": 460000,
          "newValue": 450000,
          "variation": -2.17,
          "createdAt": "2025-02-01T10:00:00+00:00"
        }
      ],
      "features": [
        "balcon",
        "parking",
        "cave"
      ]
    }
  ],

  // Transports
  "stations": [
    {
      "name": "Métro Convention",
      "distance": 300,
      "lines": [
        {
          "name": "12",
          "type": "metro"
        }
      ]
    }
  ],

  // Dates
  "createdAt": "2025-01-15T10:00:00+00:00",
  "updatedAt": "2025-02-01T10:00:00+00:00",
  "lastCrawledAt": "2025-02-05T08:30:00+00:00",

  // Statut
  "expired": false,
  "expiredAt": null
}
```

---

### Réponse de collection (Format Hydra)

```json
{
  "@context": "/contexts/PropertyDocument",
  "@id": "/documents/properties",
  "@type": "hydra:Collection",

  "hydra:member": [
    // ... array de PropertyDocument
  ],

  "hydra:totalItems": 156,

  "hydra:view": {
    "@id": "/documents/properties?page=1",
    "@type": "hydra:PartialCollectionView",
    "hydra:first": "/documents/properties?page=1",
    "hydra:last": "/documents/properties?page=6",
    "hydra:next": "/documents/properties?page=2"
  },

  "hydra:search": {
    "@type": "hydra:IriTemplate",
    "hydra:template": "/documents/properties{?...}",
    "hydra:mapping": [
      // ... description des paramètres disponibles
    ]
  }
}
```

---

## Recommandations pour l'intégration

### 🎯 Stratégie d'intégration pour Weleev

#### Phase 1 : Création de recherches utilisateur

1. **À la fin de l'onboarding :**
   - Créer automatiquement une recherche Melo pour chaque utilisateur
   - Mapper les préférences Weleev vers les paramètres Melo :
     ```
     Weleev → Melo
     location → includedCities / lat,lon,radius
     propertyType → propertyTypes
     maxBudget → budgetMax
     minRooms → roomMin
     wantsParking → expressions (include: ["parking"])
     refinements → expressions
     ```

2. **Sauvegarder la référence :**
   - Stocker l'UUID de la recherche Melo dans Supabase
   - Associer à l'utilisateur et à sa recherche locale

#### Phase 2 : Récupération des annonces

1. **Stratégie de récupération :**
   - Option A : Polling régulier (toutes les heures/jour)
   - Option B : Webhooks en temps réel (recommandé)

2. **Nombre d'annonces :**
   - Récupérer 30 propriétés max par utilisateur (limite API)
   - Trier par `order[createdAt]=desc` pour avoir les plus récentes
   - Possibilité de pagination si besoin de plus

3. **Filtrage supplémentaire :**
   - Appliquer `withCoherentPrice=true` pour éviter les anomalies
   - Filtrer les annonces expirées : `expired=false`

#### Phase 3 : Stockage dans Supabase

**Nouvelle table : `melo_properties`**

```sql
CREATE TABLE melo_properties (
  id BIGSERIAL PRIMARY KEY,
  melo_uuid UUID NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  search_id BIGINT REFERENCES searches(id) ON DELETE CASCADE,

  -- Données de la propriété (JSON)
  property_data JSONB NOT NULL,

  -- Champs dénormalisés pour les requêtes
  title TEXT,
  price INTEGER,
  surface INTEGER,
  city TEXT,
  zipcode TEXT,
  property_type TEXT,

  -- Médias
  main_image TEXT,
  images TEXT[],
  virtual_tour TEXT,

  -- Statut
  is_favorite BOOLEAN DEFAULT FALSE,
  is_viewed BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,

  -- Dates
  melo_created_at TIMESTAMP WITH TIME ZONE,
  melo_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Index
  CONSTRAINT unique_user_property UNIQUE(user_id, melo_uuid)
);

-- Index pour les requêtes
CREATE INDEX idx_melo_properties_user_id ON melo_properties(user_id);
CREATE INDEX idx_melo_properties_search_id ON melo_properties(search_id);
CREATE INDEX idx_melo_properties_price ON melo_properties(price);
CREATE INDEX idx_melo_properties_created_at ON melo_properties(melo_created_at DESC);
```

**Nouvelle table : `melo_searches`**

```sql
CREATE TABLE melo_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  search_id BIGINT REFERENCES searches(id) ON DELETE CASCADE,

  -- Référence Melo
  melo_uuid UUID NOT NULL UNIQUE,
  melo_token TEXT,

  -- Configuration
  melo_search_data JSONB NOT NULL,

  -- Statut
  notification_enabled BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_search UNIQUE(user_id, search_id)
);
```

#### Phase 4 : Affichage dans le Feed

1. **Mapping des données :**
   ```typescript
   // Transformer PropertyDocument Melo → Listing Weleev
   function mapMeloToListing(melo: PropertyDocument): Listing {
     return {
       id: melo.uuid,
       title: melo.title,
       price: melo.price,
       surface: melo.surface,
       rooms: melo.room,
       bedrooms: melo.bedroom,
       bathrooms: melo.bathroom || 1, // Estimer si non fourni
       city: melo.city.name,
       address: `${melo.city.zipcode} ${melo.city.name}`,
       description: melo.description,
       images: melo.pictures,
       propertyType: melo.propertyTypes[0] === 0 ? 'apartment' : 'house',
       hasParking: melo.adverts[0]?.features?.includes('parking') || false,
       rating: calculateRating(melo), // Custom
       energyClass: melo.energy?.category,
       yearBuilt: melo.yearBuilt,
       floor: melo.floor,
       totalFloors: melo.floorQuantity
     };
   }
   ```

2. **Remplacer les données mockées :**
   - Dans `FeedPage.tsx`, récupérer depuis `melo_properties` au lieu de `MOCK_LISTINGS`
   - Garder l'enrichissement IA Gemini

#### Phase 5 : Gestion des favoris

1. **Actions utilisateur :**
   - Sauvegarder : `is_favorite = true`
   - Masquer : `is_hidden = true`
   - Marquer comme vu : `is_viewed = true`

2. **Page Favoris :**
   - Afficher uniquement `WHERE is_favorite = true AND is_hidden = false`

#### Phase 6 : Webhooks (Optionnel mais recommandé)

1. **Créer un endpoint webhook :**
   ```
   POST /api/webhooks/melo/matches
   POST /api/webhooks/melo/events
   ```

2. **Sécuriser avec le token :**
   - Vérifier le `token` de la recherche Melo

3. **Actions sur réception :**
   - Nouveau match → Insérer dans `melo_properties`
   - Événement → Mettre à jour la propriété existante
   - Notification email/push à l'utilisateur

---

### 🔐 Variables d'environnement à ajouter

```env
# Melo.io API
VITE_MELO_API_KEY=your_melo_api_key
VITE_MELO_API_URL=https://api.notif.immo

# Webhooks (si utilisés)
MELO_WEBHOOK_SECRET=your_webhook_secret
```

---

### 📊 Flux de données complet

```
1. Utilisateur complète onboarding
   ↓
2. Weleev crée une recherche dans Supabase (table searches)
   ↓
3. Backend crée une recherche Melo via POST /searches
   ↓
4. Stocke melo_uuid dans melo_searches
   ↓
5. Récupération initiale : GET /documents/properties avec critères
   ↓
6. Stocke les 30 premières propriétés dans melo_properties
   ↓
7. FeedPage affiche les propriétés depuis melo_properties
   ↓
8. Enrichissement IA Gemini pour chaque propriété
   ↓
9. Utilisateur sauvegarde → is_favorite = true
   ↓
10. Synchro régulière ou webhook pour nouvelles annonces
```

---

### ⚠️ Points d'attention

1. **Rate limiting :**
   - Vérifier les limites de l'API Melo
   - Implémenter un système de cache/queue

2. **Coût :**
   - Vérifier le pricing Melo.io
   - Limiter le nombre de requêtes par utilisateur

3. **Données obsolètes :**
   - Vérifier régulièrement `expired = true`
   - Marquer ou supprimer les propriétés expirées

4. **Géolocalisation :**
   - Melo fournit lat/lon
   - Utiliser pour la carte si on l'ajoute

5. **RGPD :**
   - Les données Melo contiennent parfois des contacts
   - S'assurer de la conformité

---

### 🚀 Prochaines étapes suggérées

1. **Obtenir une API key Melo.io**
   - S'inscrire sur https://melo.io
   - Obtenir les credentials

2. **Créer les tables Supabase**
   - `melo_searches`
   - `melo_properties`
   - Ajouter les index

3. **Implémenter le service Melo**
   - `src/lib/melo.ts`
   - Fonctions : createSearch, getProperties, updateSearch

4. **Mapper l'onboarding → Melo**
   - Créer la recherche après l'onboarding
   - Sauvegarder l'UUID

5. **Remplacer les mock data**
   - FeedPage utilise vraies données
   - Garder l'enrichissement IA

6. **Ajouter la gestion des favoris**
   - Bouton save/unsave
   - Page favoris fonctionnelle

---

## 📚 Ressources complémentaires

- Documentation officielle : https://docs.melo.io
- Support : via la plateforme Melo.io
- Intégrations no-code : Make.com, Zapier

---

**Document créé pour le projet Weleev - 2025-11-05**
