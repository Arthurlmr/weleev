# Guide de Déploiement des Edge Functions

Ce guide vous explique comment déployer les Edge Functions Supabase pour permettre l'intégration avec l'API Melo.io.

## 📋 Prérequis

1. Compte Supabase avec un projet actif
2. Supabase CLI installé (`npm install -g supabase`)
3. Clé API Melo.io (déjà ajoutée dans Netlify)

## 🚀 Étapes de Déploiement

### 1. Installer Supabase CLI (si pas déjà fait)

```bash
npm install -g supabase
```

### 2. Se connecter à Supabase

```bash
supabase login
```

Cela ouvrira votre navigateur pour authentification.

### 3. Lier le projet local à votre projet Supabase

```bash
supabase link --project-ref VOTRE_PROJECT_REF
```

**Comment trouver votre PROJECT_REF ?**
- Allez sur https://supabase.com/dashboard
- Sélectionnez votre projet "weleev"
- L'URL sera : `https://supabase.com/dashboard/project/VOTRE_PROJECT_REF`
- Copiez la partie `VOTRE_PROJECT_REF`

### 4. Ajouter la clé API Melo.io comme secret Supabase

```bash
supabase secrets set MELO_API_KEY="votre_cle_api_melo_ici"
```

**Important** : Utilisez la même clé API que celle configurée dans Netlify.

### 5. Déployer les Edge Functions

```bash
supabase functions deploy search-location
supabase functions deploy create-melo-search
supabase functions deploy get-properties
```

Ou déployez toutes les fonctions en une seule commande :

```bash
supabase functions deploy
```

### 6. Vérifier le déploiement

Après le déploiement, vous devriez voir :

```
Deployed Function search-location
Deployed Function create-melo-search
Deployed Function get-properties
```

## 🧪 Tester les Edge Functions

### Tester search-location

```bash
curl -i --location --request POST \
  'https://VOTRE_PROJECT_REF.supabase.co/functions/v1/search-location' \
  --header 'Authorization: Bearer VOTRE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"search":"Paris","type":"city"}'
```

**Résultat attendu :** Liste de villes correspondant à "Paris"

### Tester create-melo-search

```bash
curl -i --location --request POST \
  'https://VOTRE_PROJECT_REF.supabase.co/functions/v1/create-melo-search' \
  --header 'Authorization: Bearer VOTRE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "Test Search",
    "transactionType": 0,
    "propertyTypes": [0, 1],
    "budgetMax": 500000,
    "includedCities": ["/cities/75056"]
  }'
```

**Résultat attendu :** Objet search créé avec uuid et token

### Tester get-properties

```bash
curl -i --location --request POST \
  'https://VOTRE_PROJECT_REF.supabase.co/functions/v1/get-properties' \
  --header 'Authorization: Bearer VOTRE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "transactionType": 0,
    "propertyTypes": [0, 1],
    "budgetMax": 500000,
    "includedCities": ["/cities/75056"],
    "itemsPerPage": 10
  }'
```

**Résultat attendu :** Liste de propriétés avec `hydra:member` et `hydra:totalItems`

## 📍 Où trouver vos identifiants Supabase ?

### PROJECT_REF
Dashboard Supabase → URL de votre projet
```
https://supabase.com/dashboard/project/abcdefghijklmno
                                      └─── PROJECT_REF ───┘
```

### ANON_KEY
Dashboard Supabase → Settings → API → Project API keys → `anon` `public`

### URL
Dashboard Supabase → Settings → API → Project URL
```
https://abcdefghijklmno.supabase.co
```

## ⚙️ Configuration Frontend (déjà fait)

Le code frontend est déjà configuré pour utiliser ces Edge Functions via `src/lib/melo.ts` :

```typescript
// ✅ Déjà implémenté
const { data, error } = await supabase.functions.invoke('search-location', {
  body: { search: query, type },
});
```

## 🔍 Vérifier que tout fonctionne

1. **Déployez les Edge Functions** (étapes ci-dessus)
2. **Vérifiez le secret MELO_API_KEY** :
   ```bash
   supabase secrets list
   ```
   Vous devriez voir `MELO_API_KEY` dans la liste

3. **Testez l'onboarding** :
   - Allez sur votre app Netlify
   - Déconnectez-vous et reconnectez-vous
   - Commencez l'onboarding
   - Tapez "Paris" dans le champ location
   - **Attendu** : Autocomplete fonctionne sans erreur CORS
   - Complétez l'onboarding
   - **Attendu** : Redirection vers le feed avec 10 propriétés

## 🐛 Dépannage

### Erreur "Function not found"
```
Edge Function 'search-location' not found
```
**Solution** : Vérifiez que vous avez bien déployé les fonctions avec `supabase functions deploy`

### Erreur "MELO_API_KEY not configured"
```
{"error": "MELO_API_KEY not configured"}
```
**Solution** : Ajoutez le secret avec `supabase secrets set MELO_API_KEY="votre_cle"`

### Erreur CORS persiste
```
Access to fetch has been blocked by CORS policy
```
**Solution** :
1. Vérifiez que les Edge Functions sont bien déployées
2. Vérifiez que le code frontend appelle bien les Edge Functions (pas l'API Melo directement)
3. Effacez le cache du navigateur et rechargez

### Erreur "Invalid API key" dans les logs Edge Function
```
Melo API error: Unauthorized
```
**Solution** :
1. Vérifiez que votre clé API Melo est valide
2. Testez directement avec curl :
   ```bash
   curl -H "X-API-KEY: votre_cle" https://api.notif.immo/indicators/locations?search=Paris
   ```

### Voir les logs des Edge Functions

```bash
supabase functions logs search-location
supabase functions logs create-melo-search
supabase functions logs get-properties
```

Ou en temps réel :
```bash
supabase functions logs --follow
```

## 📊 Vérifier l'utilisation

Dashboard Supabase → Edge Functions → Vous verrez :
- Nombre d'invocations
- Temps d'exécution
- Erreurs éventuelles
- Logs en temps réel

## ✅ Checklist finale

- [ ] Supabase CLI installé
- [ ] Connecté à Supabase (`supabase login`)
- [ ] Projet lié (`supabase link`)
- [ ] Secret MELO_API_KEY ajouté (`supabase secrets set`)
- [ ] Edge Functions déployées (`supabase functions deploy`)
- [ ] Test curl réussi pour search-location
- [ ] Test curl réussi pour get-properties
- [ ] Onboarding fonctionne sans erreur CORS
- [ ] 10 propriétés s'affichent dans le feed

## 🎯 Prochaines étapes après déploiement

Une fois les Edge Functions déployées et testées :

1. **Modifier FeedPage** pour charger depuis `melo_properties`
2. **Implémenter le bouton refresh** ("Voir nouvelles annonces")
3. **Tester les favoris** avec la table mise à jour
4. **Monitorer les logs** pour identifier d'éventuels problèmes

---

**Questions ou problèmes ?** Vérifiez d'abord les logs des Edge Functions avec `supabase functions logs`.
