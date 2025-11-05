# 🚀 Déploiement Melo.io - Actions à faire

**Date :** 2025-11-05
**Branche :** `claude/fix-missing-auth-trigger-011CUpcKQUbFbeQyvazmFNPm`

---

## ✅ Ce qui a été implémenté

### 1. **Nouvel Onboarding Hybride**
- ✅ 5 questions fixes rapides (30 secondes)
  1. Localisation avec autocomplete Melo
  2. Acheter ou Louer
  3. Type de bien (Appartement/Maison/Les deux)
  4. Budget max (slider intelligent)
  5. Pièces minimum
- ✅ Affinement IA optionnel (3-5 questions contextuelles via Gemini 2.0 Flash Thinking)
- ✅ Composants UI dynamiques (toggle, slider, chips, text)

### 2. **Service Melo.io**
- ✅ API complète dans `src/lib/melo.ts`
- ✅ Fonctions : searchLocation, createSearch, getProperties, etc.
- ✅ Mapping automatique Melo ↔ Weleev

### 3. **Base de données**
- ✅ Tables `melo_searches` et `melo_properties`
- ✅ Script SQL complet : `supabase/003_melo_integration.sql`

### 4. **Flux complet**
- ✅ Création recherche Melo après onboarding
- ✅ Récupération automatique des 10 premières annonces
- ✅ Stockage dans Supabase

---

## 📋 ACTIONS À FAIRE (VOUS)

### ⚠️ **Étape 1 : Créer les tables Supabase (5 min)**

1. Allez sur **Supabase** → **SQL Editor**
2. Cliquez sur **New query**
3. Copiez TOUT le contenu du fichier : **`supabase/003_melo_integration.sql`**
4. Collez et cliquez **Run**
5. ✅ Vérifiez qu'il n'y a pas d'erreur

**Résultat attendu :** Message "Success" + Les tables `melo_searches` et `melo_properties` apparaissent dans la liste des tables.

---

### ✅ **Étape 2 : API Key déjà dans Netlify**

Vous avez déjà ajouté `VITE_MELO_API_KEY` dans Netlify → **Rien à faire ici** ✅

---

### 🧪 **Étape 3 : Tester en local (Optionnel mais recommandé)**

Si vous avez Node.js installé localement :

```bash
# 1. Récupérer les dernières modifications
git pull origin claude/fix-missing-auth-trigger-011CUpcKQUbFbeQyvazmFNPm

# 2. Ajouter .env local (si pas déjà fait)
# Créer un fichier .env à la racine avec :
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle
VITE_GEMINI_API_KEY=votre_cle
VITE_MELO_API_KEY=votre_cle

# 3. Installer et lancer
npm install
npm run dev

# 4. Tester l'onboarding complet
# Ouvrir http://localhost:5173
```

---

### 🌐 **Étape 4 : Déployer sur Netlify**

**Option A : Automatique** (Recommandé)

Netlify devrait déjà redéployer automatiquement la branche `claude/fix-missing-auth-trigger-011CUpcKQUbFbeQyvazmFNPm`.

Vérifiez dans :
- **Netlify Dashboard** → **Deploys**
- Le dernier deploy doit contenir le commit : `"feat: Implement Melo.io integration"`

**Option B : Manuel**

Si le deploy automatique ne se lance pas :
1. Allez sur Netlify Dashboard
2. Cliquez sur **"Trigger deploy"**
3. **"Deploy site"**

---

## 🧪 TESTER L'APPLICATION

### Test 1 : Nouvel utilisateur

1. **Déconnectez-vous** (si connecté)
2. Allez sur `https://weleev.netlify.app/`
3. Créez un nouveau compte avec un nouvel email
4. **Onboarding - Partie 1 : Questions fixes**
   - Entrez une ville (ex: "Paris") → Autocomplete devrait afficher des suggestions
   - Sélectionnez la ville
   - Choisissez "Acheter" ou "Louer"
   - Choisissez le type de bien
   - Ajustez le budget avec le slider
   - Choisissez le nombre de pièces
5. **Onboarding - Partie 2 : Affinement (optionnel)**
   - Cliquez "Oui, affiner"
   - **IA devrait générer 3-5 questions contextuelles**
   - Répondez aux questions (vous pouvez "Passer")
6. **Résultat attendu :**
   - Loading "Recherche en cours..."
   - Redirection vers `/feed`
   - **Affichage de 10 annonces réelles** (si disponibles pour vos critères)

---

### Test 2 : Utilisateur existant

1. **Reconnectez-vous** avec arthur@lestudio.ai
2. Vous devriez être **redirigé automatiquement vers /feed**
3. **Problème attendu :** Les annonces affichées sont encore les MOCK DATA (anciennes annonces de test)

**C'est normal !** Il reste à implémenter :
- [ ] Modification de FeedPage pour charger depuis `melo_properties`
- [ ] Bouton "Voir nouvelles annonces"
- [ ] Gestion des favoris

---

## ⚠️ PROBLÈMES POSSIBLES

### **Problème 1 : Erreur "VITE_MELO_API_KEY is not defined"**

**Solution :**
- Vérifier que la clé est bien dans Netlify
- Redéployer le site après ajout de la variable

### **Problème 2 : Erreur lors de la création des tables SQL**

**Solutions possibles :**
1. Les tables existent déjà → Supprimez-les d'abord :
   ```sql
   DROP TABLE IF EXISTS melo_properties CASCADE;
   DROP TABLE IF EXISTS melo_searches CASCADE;
   ```
2. Problème de permissions → Vérifiez que vous êtes admin du projet Supabase

### **Problème 3 : Autocomplete location ne fonctionne pas**

**Vérifier :**
- API Key Melo valide
- Console navigateur pour voir les erreurs
- Endpoint `/indicators/locations` accessible

### **Problème 4 : Aucune annonce après onboarding**

**Raisons possibles :**
1. Aucune annonce ne correspond aux critères (ville rare, budget trop bas/haut)
2. Problème API Melo
3. Erreur lors du fetch des propriétés

**Solution :** Tester avec des critères larges (ex: Paris, budget 200k-500k€)

### **Problème 5 : Questions IA ne se génèrent pas**

**Vérifier :**
- `VITE_GEMINI_API_KEY` est bien configurée
- Quota Gemini pas dépassé
- Console pour voir l'erreur

**Fallback :** L'app continue avec des questions par défaut (Surface min, Meublé, Étage, etc.)

---

## 📊 VÉRIFICATIONS POST-DÉPLOIEMENT

### ✅ Checklist

- [ ] Tables Supabase créées (`melo_searches`, `melo_properties`)
- [ ] Déploiement Netlify réussi
- [ ] Onboarding accessible
- [ ] Autocomplete location fonctionne
- [ ] Questions fixes fonctionnent
- [ ] Questions IA se génèrent (ou fallback si erreur)
- [ ] Recherche Melo créée dans Supabase
- [ ] 10 annonces insérées dans `melo_properties`
- [ ] Redirection vers /feed après onboarding

### 🔍 Vérifier dans Supabase

**Table `melo_searches` :**
```sql
SELECT * FROM melo_searches;
```
Devrait contenir au moins 1 ligne avec votre recherche.

**Table `melo_properties` :**
```sql
SELECT COUNT(*) as nb_annonces FROM melo_properties;
```
Devrait retourner 10 (ou moins si moins d'annonces disponibles).

**Voir vos annonces :**
```sql
SELECT title, price, city, property_type
FROM melo_properties
WHERE user_id = '[votre_user_id]'
ORDER BY melo_created_at DESC;
```

---

## 🚧 CE QUI RESTE À FAIRE (MOI)

### Phase suivante (à implémenter après vos tests) :

1. **Modifier FeedPage**
   - Charger depuis `melo_properties` au lieu de MOCK_LISTINGS
   - Transformer les données Melo → Listing Weleev
   - Garder l'enrichissement IA Gemini

2. **Bouton "Voir nouvelles annonces"**
   - Appel API Melo pour refresh
   - Insertion nouvelles annonces uniquement
   - Toast notification

3. **Gestion favoris**
   - Actions save/unsave
   - Update `is_favorite` dans `melo_properties`
   - Page Favoris fonctionnelle

---

## 📞 RETOURS ATTENDUS

**Dites-moi :**

1. ✅ Les tables Supabase sont créées ?
2. ✅ Le déploiement Netlify a réussi ?
3. ✅ L'onboarding fonctionne ?
4. ✅ L'autocomplete location marche ?
5. ✅ Les questions IA se génèrent ?
6. ✅ Les annonces sont stockées dans Supabase ?
7. ❓ Des bugs ou problèmes rencontrés ?
8. ❓ Des ajustements UX souhaités ?

**Une fois validé, je continue avec le FeedPage et les favoris !** 🚀

---

## 🎯 RÉSUMÉ RAPIDE

```
1. Exécuter SQL dans Supabase (supabase/003_melo_integration.sql)
2. Vérifier que Netlify déploie automatiquement
3. Tester l'onboarding complet avec un nouveau compte
4. Vérifier dans Supabase que les données sont bien insérées
5. Me donner vos retours !
```

---

**Bon test ! 🎉**
