# 🚀 Déploiement Weleev

Guide de déploiement complet pour Weleev en production.

---

## ✅ Prérequis

- Compte GitHub
- Compte Netlify
- Compte Supabase
- Compte Melo.io avec clé API

---

## 📦 1. Supabase Setup

### A. Créer le projet

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **Project URL** et **anon key** (Settings → API)

### B. Créer les tables

1. Allez dans **SQL Editor**
2. Copiez tout le contenu de `supabase/schema.sql`
3. Exécutez le script
4. ✅ Vérifiez que les tables sont créées

### C. Déployer les Edge Functions

**Via l'interface web Supabase** :

1. **Edge Functions** → **Deploy a new function**
2. Créez 3 fonctions avec le code suivant :

#### `search-location`
Copiez le contenu de `supabase/functions/search-location/index.ts`
⚠️ Remplacez l'import `corsHeaders` par la définition inline

#### `create-melo-search`
Copiez le contenu de `supabase/functions/create-melo-search/index.ts`

#### `get-properties`
Copiez le contenu de `supabase/functions/get-properties/index.ts`

3. **Pour chaque fonction** :
   - Allez dans **Settings**
   - **Désactivez** "Verify JWT with legacy secret"
   - Ajoutez la variable d'environnement : `MELO_API_KEY = votre_cle_melo`

### D. Configurer Authentication

1. **Authentication** → **URL Configuration**
2. Ajoutez :
   ```
   Site URL: https://votre-site.netlify.app

   Redirect URLs:
   https://votre-site.netlify.app/auth
   https://votre-site.netlify.app/onboarding
   ```

---

## 🌐 2. Netlify Setup

### A. Connecter GitHub

1. Allez sur [netlify.com](https://netlify.com)
2. **Add new site** → **Import an existing project**
3. Sélectionnez votre repo GitHub
4. Sélectionnez la branche : `main`

### B. Configurer les variables d'environnement

**Site settings** → **Environment variables** → **Add a variable**

Ajoutez :
```
VITE_SUPABASE_URL = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbG...
```

⚠️ **Ne PAS ajouter `VITE_GEMINI_API_KEY`** (désactivé pour sécurité)
⚠️ **Ne PAS ajouter `VITE_MELO_API_KEY`** (seulement côté serveur Supabase)

### C. Déployer

1. **Deploy settings** :
   - Build command: `npm run build`
   - Publish directory: `dist`

2. Cliquez sur **Deploy site**

3. Si le build échoue avec "Exposed secrets" :
   - **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## 🔐 3. Melo.io Setup

### A. Obtenir la clé API

1. Créez un compte sur [melo.io](https://melo.io)
2. Dashboard → **API Keys**
3. Créez une nouvelle clé
4. Copiez la clé

### B. Configurer dans Supabase

1. Supabase → **Edge Functions** → **Manage secrets**
2. Ajoutez : `MELO_API_KEY = votre_cle`
3. ✅ Les 3 Edge Functions auront accès à cette clé

---

## ✅ 4. Vérification

### Test complet

1. Ouvrez `https://votre-site.netlify.app`
2. **Test authentification** :
   - Entrez votre email
   - Vérifiez votre boîte mail
   - Cliquez sur le Magic Link
   - ✅ Vous devez être redirigé vers `/onboarding`

3. **Test onboarding** :
   - Tapez "Bordeaux" dans la recherche de ville
   - ✅ Vous devez voir des suggestions : "Bordeaux (33000)", "Bordeaux (33100)", etc.
   - Sélectionnez une ville
   - Complétez le formulaire (type, budget, pièces)
   - Cliquez sur "Continuer sans affiner"
   - ✅ Vous devez être redirigé vers `/feed`

4. **Vérifier la base de données** :
   - Supabase → **Table Editor**
   - Table `profiles` : vérifiez que `onboarded = true`
   - Table `melo_searches` : vérifiez qu'une recherche a été créée
   - Table `melo_properties` : vérifiez que des annonces ont été importées

---

## 🐛 Dépannage

### "Missing environment variables"
→ Vérifiez que les variables sont bien configurées dans Netlify

### "Access Denied" sur Melo API
→ Vérifiez que `MELO_API_KEY` est configurée dans Supabase Edge Functions

### Le Magic Link redirige vers localhost
→ Vérifiez les Redirect URLs dans Supabase Authentication

### "Exposed secrets detected" lors du build
→ Utilisez "Clear cache and deploy site" dans Netlify

### Pas de suggestions de villes
→ Vérifiez que l'Edge Function `search-location` est bien déployée

### "null value in column melo_uuid"
→ Vérifiez que le code extrait bien l'UUID depuis `@id`

---

## 📚 Documentation additionnelle

- **API Melo.io** : Voir [MELO_API.md](./MELO_API.md)
- **Architecture du code** : Voir [ARCHITECTURE.md](./ARCHITECTURE.md)
- **README général** : Voir [README.md](./README.md)

---

**Dernière mise à jour** : 05/11/2025
