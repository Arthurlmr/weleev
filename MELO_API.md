# 📘 Melo.io API Documentation

Documentation officielle pour l'intégration de l'API Melo.io dans Weleev.

---

## 🔑 Authentification

Toutes les requêtes nécessitent une clé API dans le header :

```
X-API-KEY: votre_cle_api
```

**URL de base** : `https://api.notif.immo`

---

## 📍 1. Location Autocomplete

Recherche de villes pour l'autocomplete.

### Endpoint

```
GET /public/location-autocomplete
```

### Paramètres

| Paramètre | Type   | Requis | Description                          |
|-----------|--------|--------|--------------------------------------|
| `query`   | string | ✅     | Nom de la ville à rechercher         |
| `type`    | string | ❌     | Type de location (`city`, `department`, `region`). Par défaut: `city` |

### Exemple de requête

```bash
curl -X GET 'https://api.notif.immo/public/location-autocomplete?query=Bordeaux&type=city' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: votre_cle'
```

### Réponse

```json
{
  "@context": "/contexts/LocationComplete",
  "@id": "/public/location-autocomplete",
  "@type": "hydra:Collection",
  "hydra:member": [
    {
      "@id": "/cities/37060",
      "@type": "City",
      "id": 37060,
      "name": "Bordeaux",
      "displayName": "Bordeaux (toute la ville)",
      "zipcode": "33000",
      "insee": "33063",
      "groupedCityZipcodes": ["33000", "33090", "33100", "33200", "33300", "33800"],
      "location": {
        "lon": -0.587269,
        "lat": 44.8350088
      }
    }
  ],
  "hydra:totalItems": 13
}
```

### Points importants

- ✅ Le champ `@id` contient l'identifiant au format IRI : `/cities/37060`
- ✅ Le champ `displayName` contient le nom complet avec précisions : "Bordeaux (33000)"
- ✅ Utiliser `@id` pour les recherches, pas `id`

---

## 🔍 2. Create Search

Crée une recherche sauvegardée dans Melo.

### Endpoint

```
POST /searches
```

### Paramètres principaux

| Paramètre        | Type      | Requis | Description                                      |
|------------------|-----------|--------|--------------------------------------------------|
| `title`          | string    | ✅     | Titre de la recherche                            |
| `transactionType`| integer   | ✅     | Type de transaction : `0` (Vente), `1` (Location)|
| `propertyTypes`  | integer[] | ✅     | Types de biens : `0` (Appartement), `1` (Maison), `2` (Immeuble), `3` (Parking), `4` (Bureau), `5` (Terrain), `6` (Boutique) |
| `budgetMax`      | number    | ❌     | Budget maximum                                   |
| `budgetMin`      | number    | ❌     | Budget minimum                                   |
| `roomMin`        | integer   | ❌     | Nombre de pièces minimum                         |
| `bedroomMin`     | integer   | ❌     | Nombre de chambres minimum                       |
| `surfaceMin`     | integer   | ❌     | Surface minimum (m²)                             |
| `surfaceMax`     | integer   | ❌     | Surface maximum (m²)                             |
| `includedCities` | array     | ❌     | Villes incluses au format IRI : `["/cities/37060"]` |
| `furnished`      | boolean   | ❌     | Meublé ou non (pour locations)                   |
| `withCoherentPrice` | boolean | ❌  | Filtrer les prix cohérents. Par défaut: `true`  |

### Exemple de requête

```bash
curl -X POST 'https://api.notif.immo/searches' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: votre_cle' \
  -d '{
    "title": "Recherche Bordeaux",
    "transactionType": 0,
    "propertyTypes": [1],
    "budgetMax": 520000,
    "roomMin": 4,
    "includedCities": ["/cities/37060"]
  }'
```

### Réponse

```json
{
  "@context": "/contexts/Search",
  "@id": "/searches/593b66bd-5cd7-4d3d-878f-6056ae916ab9",
  "@type": "Search",
  "title": "Recherche Bordeaux",
  "user": "/users/7a6f6ea4-b3e5-4783-9e7e-3d4fd0a95508",
  "transactionType": 0,
  "budgetMax": 520000,
  "roomMin": 4,
  "propertyTypes": [1],
  "token": "9d4520e875da0abc0ce22102487660ddadba5597a65e58f1f6",
  "createdAt": "2025-11-05T17:08:51+01:00",
  "updatedAt": "2025-11-05T17:08:51+01:00",
  "includedCities": [
    {
      "@id": "/cities/37060",
      "@type": "City",
      "name": "Bordeaux",
      "zipcode": "33000",
      "insee": "33063"
    }
  ]
}
```

### Points importants

- ✅ Le champ `@id` contient l'identifiant de la recherche : `/searches/<uuid>`
- ✅ Le champ `token` contient le token pour accéder aux propriétés
- ❌ Il n'y a **PAS** de champ `uuid` - extraire l'UUID depuis `@id`
- ✅ `includedCities` doit être au format IRI : `["/cities/37060"]` et non `[37060]`

---

## 🏠 3. Get Properties

Récupère les propriétés correspondant aux critères.

### Endpoint

```
GET /documents/properties
```

### Paramètres principaux

| Paramètre        | Type      | Requis | Description                                      |
|------------------|-----------|--------|--------------------------------------------------|
| `transactionType`| integer   | ❌     | Type de transaction : `0` (Vente), `1` (Location)|
| `propertyTypes[]`| integer   | ❌     | Types de biens (format array avec `[]`)          |
| `budgetMax`      | number    | ❌     | Budget maximum                                   |
| `budgetMin`      | number    | ❌     | Budget minimum                                   |
| `roomMin`        | integer   | ❌     | Nombre de pièces minimum                         |
| `includedCities[]`| string   | ❌     | Villes au format IRI (format array avec `[]`)    |
| `itemsPerPage`   | integer   | ❌     | Nombre d'items par page (max: 30). Par défaut: 10|
| `page`           | integer   | ❌     | Numéro de page. Par défaut: 1                    |
| `expired`        | boolean   | ❌     | Inclure les annonces expirées. Par défaut: `null`|
| `withCoherentPrice`| boolean | ❌     | Filtrer les prix cohérents. Par défaut: `true`  |
| `order[createdAt]`| string   | ❌     | Ordre par date : `asc` ou `desc`. Par défaut: `desc`|

### Format des arrays

⚠️ **IMPORTANT** : Les paramètres array doivent utiliser la notation `[]` :

```bash
# ✅ CORRECT
includedCities[]=/cities/37060&includedCities[]=/cities/37061
propertyTypes[]=0&propertyTypes[]=1

# ❌ INCORRECT
includedCities=/cities/37060,/cities/37061
propertyTypes=0,1
```

### Exemple de requête

```bash
curl -X GET 'https://api.notif.immo/documents/properties?transactionType=0&propertyTypes[]=1&budgetMax=520000&roomMin=4&includedCities[]=/cities/37060&itemsPerPage=10&page=1' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: votre_cle'
```

### Réponse

```json
{
  "hydra:member": [
    {
      "@id": "/documents/properties/38cb65b9-2965-4bd0-bc9b-2b8a8be7c457",
      "@type": "PropertyDocument",
      "uuid": "38cb65b9-2965-4bd0-bc9b-2b8a8be7c457",
      "title": "Maison 5 pièces",
      "description": "Belle maison avec jardin...",
      "price": 450000,
      "pricePerMeter": 3000,
      "surface": 150,
      "room": 5,
      "bedroom": 3,
      "floor": null,
      "elevator": false,
      "furnished": false,
      "landSurface": 500,
      "transactionType": 0,
      "propertyType": 1,
      "city": {
        "id": 37060,
        "name": "Bordeaux",
        "zipcode": "33000",
        "insee": "33063",
        "latitude": 44.8350088,
        "longitude": -0.587269
      },
      "pictures": [
        "https://pictures.notif.immo/properties/2021/05/10/10/abc123.jpg"
      ],
      "picturesRemote": [],
      "virtualTour": null,
      "energy": {
        "category": "C",
        "value": 120
      },
      "createdAt": "2023-05-23T23:48:47+02:00",
      "updatedAt": "2023-05-23T23:48:47+02:00",
      "expired": false,
      "adverts": [
        {
          "uuid": "21f2a17b-dae3-4ea4-976f-e521cebfe609",
          "url": "https://www.example.com/annonce/123",
          "publisher": {
            "name": "Agence Immo",
            "type": 1
          },
          "createdAt": "2023-05-23T23:48:47+02:00"
        }
      ]
    }
  ],
  "hydra:totalItems": 125,
  "hydra:view": {
    "@id": "/documents/properties?page=1",
    "@type": "hydra:PartialCollectionView",
    "hydra:first": "/documents/properties?page=1",
    "hydra:last": "/documents/properties?page=13",
    "hydra:next": "/documents/properties?page=2"
  }
}
```

### Points importants

- ✅ Les propriétés sont dans `hydra:member`
- ✅ Le nombre total est dans `hydra:totalItems`
- ✅ La pagination est gérée via `hydra:view`
- ✅ Chaque propriété a un `uuid` unique
- ✅ Les images peuvent être dans `pictures` (hébergées par Melo) ou `picturesRemote` (liens externes)

---

## 🔧 Intégration dans Weleev

### Edge Functions Supabase

Nous utilisons 3 Edge Functions pour éviter les problèmes CORS :

1. **`search-location`** : Proxy pour `/public/location-autocomplete`
2. **`create-melo-search`** : Proxy pour `/searches` (POST)
3. **`get-properties`** : Proxy pour `/documents/properties` (GET)

### Configuration

**Variables d'environnement Supabase** :
```
MELO_API_KEY = votre_cle_api_melo
```

**Variables d'environnement Frontend (Netlify)** :
```
VITE_SUPABASE_URL = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbG...
```

### Flux de données

```
1. User tape "Bordeaux"
   → Frontend appelle search-location Edge Function
   → Edge Function appelle Melo /public/location-autocomplete
   → Retourne liste avec @id au format IRI

2. User sélectionne une ville
   → Frontend stocke location['@id'] (ex: "/cities/37060")

3. User valide l'onboarding
   → Frontend appelle create-melo-search Edge Function
   → Edge Function appelle Melo /searches avec includedCities: ["/cities/37060"]
   → Melo retourne @id et token
   → Frontend extrait UUID depuis @id

4. Frontend appelle get-properties Edge Function
   → Edge Function appelle Melo /documents/properties
   → Retourne les propriétés dans hydra:member
   → Frontend les enregistre dans Supabase
```

---

## ⚠️ Erreurs courantes

### 1. "Expected IRI or nested document for attribute 'includedCities', 'integer' given"

**Cause** : Vous envoyez `[37060]` au lieu de `["/cities/37060"]`

**Solution** : Utilisez `location['@id']` et non `location.id`

### 2. "Access Denied" sur /documents/properties

**Cause** : La clé API n'a pas les permissions ou est invalide

**Solution** : Vérifiez votre clé API sur le dashboard Melo.io

### 3. Pas de champ `uuid` dans la réponse de /searches

**Cause** : L'API retourne `@id` et `token`, pas `uuid`

**Solution** : Extraire l'UUID depuis `@id` :
```typescript
const uuid = response['@id'].split('/').pop();
```

---

## 📚 Ressources

- **Documentation officielle** : https://docs.melo.io
- **Dashboard Melo** : https://app.melo.io
- **Support** : contact@melo.io

---

**Dernière mise à jour** : 05/11/2025
