# 🚀 Guide de déploiement v2.1 - Système de quartiers dynamiques IA

## ✅ Ce qui a été développé et pushé sur GitHub

### 🏗️ Architecture complète

**Branche** : `claude/lumineai-user-profile-system-011CUxYTPqBwZMQNk46CNNo7`

#### Backend
- ✅ **Migration SQL v2.1** : Tables pour quartiers dynamiques (`city_neighborhoods`, `user_custom_neighborhoods`)
- ✅ **Edge Function `generate-neighborhoods`** : Génération IA des quartiers avec Gemini 2.5 Pro
- ✅ **Trigger automatique** : Génération quartiers lors de la sélection ville en onboarding

#### Frontend
- ✅ **ProfileFormPage** : Formulaire pur structuré avec 19 critères
- ✅ **NeighborhoodsSelector** : Composant autocomplete + quartiers custom
- ✅ **Navigation modifiée** : Bouton "Affiner mes critères" (remplace chat)
- ✅ **Onboarding modifié** : Sauvegarde v2 + génération quartiers + redirection vers /profile

---

## 📋 Étapes de déploiement (dans l'ordre)

### 1️⃣ RESET COMPLET pour tests de bout en bout

**⚠️ ATTENTION : Cette commande supprime TOUS les utilisateurs et leurs données**

```sql
-- Supprimer les quartiers custom
DELETE FROM user_custom_neighborhoods;

-- Supprimer les profils conversationnels
DELETE FROM conversational_profiles;

-- Supprimer les analyses IA
DELETE FROM ai_property_analysis;

-- Supprimer les recherches Melo
DELETE FROM melo_searches;

-- Supprimer les recherches
DELETE FROM searches;

-- Supprimer les propriétés Melo
DELETE FROM melo_properties;

-- Supprimer les favoris
DELETE FROM favorites;

-- Reset les quartiers générés (pour forcer la régénération)
DELETE FROM city_neighborhoods;

-- Supprimer les utilisateurs via Supabase Dashboard > Authentication
-- (Impossible via SQL direct sur auth.users)
```

**Comment faire** :
1. Va sur Supabase Dashboard → SQL Editor
2. Copie-colle le SQL ci-dessus
3. Clique sur "Run"
4. Va sur Authentication → Users
5. Supprime tous les utilisateurs manuellement

---

### 2️⃣ Exécuter la migration SQL v2.1

**Fichier** : `supabase-migrations-v2.1-neighborhoods.sql`

**Actions** :
1. Va sur Supabase Dashboard → SQL Editor
2. Copie tout le contenu du fichier `supabase-migrations-v2.1-neighborhoods.sql`
3. Colle dans l'éditeur SQL
4. Clique sur "Run"
5. Vérifie qu'il n'y a pas d'erreurs (devrait afficher "Success" ✅)

**Vérification** :
```sql
-- Vérifie que les tables ont été créées
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('city_neighborhoods', 'user_custom_neighborhoods');

-- Vérifie la fonction helper
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_neighborhoods_for_city';
```

Tu devrais voir les 2 tables + la fonction.

---

### 3️⃣ Déployer l'Edge Function `generate-neighborhoods`

**Fichier** : `supabase/functions/generate-neighborhoods/index.ts`

**Option A : Via Dashboard (recommandé pour tester)**

1. Va sur Supabase Dashboard → Edge Functions
2. Clique sur "New Function"
3. Nom : `generate-neighborhoods`
4. Copie tout le contenu du fichier `supabase/functions/generate-neighborhoods/index.ts`
5. Colle dans l'éditeur
6. Clique sur "Deploy"

**Option B : Via CLI**
```bash
supabase functions deploy generate-neighborhoods
```

**Vérification** :
Après déploiement, tu devrais voir la fonction listée dans Edge Functions avec le statut "Active".

---

### 4️⃣ Vérifier les variables d'environnement

**Obligatoire** : `GEMINI_API_KEY` doit être configurée

1. Va sur Supabase Dashboard → Settings → Edge Functions
2. Section "Secrets" ou "Environment Variables"
3. Vérifie que `GEMINI_API_KEY` existe
4. Si non, ajoute-la :
   - Nom : `GEMINI_API_KEY`
   - Valeur : Ta clé API Google Gemini (commence par `AIza...`)

**Comment obtenir une clé Gemini** :
- https://aistudio.google.com/app/apikey
- Connecte-toi avec ton compte Google
- Clique sur "Create API Key"
- Copie la clé générée

---

### 5️⃣ Merger sur main et déployer sur Netlify

**Une fois que tout est testé** :

```bash
git checkout main
git merge claude/lumineai-user-profile-system-011CUxYTPqBwZMQNk46CNNo7
git push origin main
```

Netlify redéploiera automatiquement.

---

## 🧪 Tests de bout en bout

### Test 1 : Onboarding complet avec génération quartiers

1. **Créer un nouveau compte** (après reset)
2. **Onboarding** :
   - Tape une ville (ex: "Niort")
   - Sélectionne dans les suggestions
   - 👀 **Vérifie dans la console** : Tu devrais voir "Triggering neighborhood generation for Niort..."
   - Continue l'onboarding (Transaction → Type de bien → Budget → Chambres)
   - Termine l'onboarding
3. **Redirection automatique vers /profile**
4. **Dans le formulaire** :
   - Scroll jusqu'à "Quartiers souhaités"
   - 👀 **Vérifie** : Tu devrais voir "✨ X quartiers suggérés pour Niort"
   - Clique sur quelques quartiers
   - Clique sur "+ Ajouter un quartier personnalisé"
   - Ajoute "Mon quartier custom"
   - Vérifie qu'il apparaît avec une croix pour le supprimer

### Test 2 : Génération quartiers pour différentes villes

**Villes à tester** :
- Niort (petite ville)
- Paris (grande ville, devrait générer 30+ quartiers)
- Lyon (ville moyenne)
- Marseille (grande ville)
- Bordeaux (ville moyenne)

**Comment tester** :
1. Pour chaque ville, crée un nouveau compte
2. Fais l'onboarding avec cette ville
3. Va sur /profile
4. Vérifie le nombre de quartiers générés
5. **Vérifie dans Supabase** :
   ```sql
   SELECT city, COUNT(*) as nb_quartiers
   FROM city_neighborhoods
   GROUP BY city;
   ```

**Résultats attendus** :
- Petites villes : 5-15 quartiers
- Villes moyennes : 15-30 quartiers
- Grandes villes : 30-50+ quartiers

### Test 3 : Cache des quartiers

1. Crée un compte avec ville "Niort"
2. Note le nombre de quartiers générés
3. Crée un DEUXIÈME compte avec ville "Niort"
4. 👀 **Vérifie dans la console** : Tu devrais voir "Returning cached neighborhoods for Niort (X found)"
5. Vérifie que le nombre de quartiers est identique
6. **Temps de chargement** : Devrait être instantané (< 100ms)

### Test 4 : Formulaire profil complet

1. Va sur /profile
2. **Complète tous les critères** :
   - Type de recherche : Achat
   - Type de bien : Maison
   - Ville : Niort
   - Quartiers : Sélectionne 3 quartiers + ajoute 1 custom
   - Budget max : 350 000€
   - Surface min : 100m²
   - Chambres min : 3
   - Espace extérieur : Jardin obligatoire
   - Stationnement : Garage obligatoire
   - Travaux : Petits travaux OK
   - Usage : Résidence principale
   - Orientation : Important
   - Vis-à-vis : Important
   - Proximités : Écoles + Commerces
3. **Vérifie** :
   - Barre de progression atteint 100%
   - "19/19 critères" affiché
   - Message "Sauvegardé à XX:XX:XX" apparaît après chaque modification
4. **Rafraîchis la page** :
   - Vérifie que toutes les valeurs sont conservées
   - Vérifie que les quartiers custom sont toujours là

### Test 5 : Navigation

1. **Depuis /app/feed** :
   - Vérifie le bouton en haut "Affiner mes critères" (icône sliders)
   - Clique dessus → Doit rediriger vers /profile
2. **Bouton floating** :
   - En bas à droite, vérifie l'icône sliders (plus de chat)
   - Clique dessus → Doit rediriger vers /profile
3. **Depuis /profile** :
   - Clique sur "Voir les annonces recommandées" en bas
   - Doit rediriger vers /app/feed

---

## 🔍 Debugging

### Problème : Pas de quartiers générés

**Vérifications** :
1. Edge Function bien déployée ?
   ```bash
   # Dans Supabase Dashboard → Edge Functions
   # Vérifie que "generate-neighborhoods" est listée
   ```

2. GEMINI_API_KEY configurée ?
   ```bash
   # Dans Supabase Dashboard → Settings → Edge Functions → Secrets
   ```

3. Logs Edge Function :
   ```bash
   # Dans Supabase Dashboard → Edge Functions → generate-neighborhoods → Logs
   # Cherche des erreurs
   ```

4. Test manuel de l'Edge Function :
   - Va sur Edge Functions → generate-neighborhoods
   - Clique sur "Invoke"
   - Body : `{"city": "Paris"}`
   - Vérifie la réponse

### Problème : Quartiers générés mais vides

**Cause** : Gemini n'a pas répondu correctement

**Solution** :
```sql
-- Supprime les quartiers de cette ville
DELETE FROM city_neighborhoods WHERE city = 'NomVille';

-- Force la régénération en retestant l'onboarding
```

### Problème : "Unused '@ts-expect-error' directive"

**Cause** : Types Supabase pas à jour

**Solution** : Ignore cette erreur pour l'instant. Après la migration, les types seront régénérés.

---

## 📊 Données en base après tests

**Tu devrais avoir** :

```sql
-- Quartiers générés par l'IA
SELECT city, COUNT(*) as nb_quartiers
FROM city_neighborhoods
GROUP BY city;

-- Quartiers custom des utilisateurs
SELECT user_id, city, COUNT(*) as nb_custom
FROM user_custom_neighborhoods
GROUP BY user_id, city;

-- Profils v2
SELECT
  search_type,
  city_filter,
  criteria_filled,
  profile_completeness_score
FROM conversational_profiles;
```

---

## 🎯 Critères de succès

✅ Reset complet effectué
✅ Migration SQL v2.1 exécutée sans erreur
✅ Edge Function generate-neighborhoods déployée
✅ GEMINI_API_KEY configurée
✅ Génération quartiers fonctionne pour 5 villes différentes
✅ Cache quartiers fonctionne (2ème compte même ville = instantané)
✅ Quartiers custom peuvent être ajoutés/supprimés
✅ Formulaire profil sauvegarde auto toutes les modifications
✅ Progression 19/19 atteinte en complétant tout
✅ Navigation boutons "Affiner mes critères" fonctionne
✅ Rafraîchissement page conserve toutes les données

---

## 🚨 Notes importantes

### Différences avec v2.0

**Ancien système (v2.0)** :
- Chat conversationnel infini
- 19 questions posées 1 par 1
- Latence à chaque message
- Coût tokens élevé (~10-20¢ par utilisateur)

**Nouveau système (v2.1)** :
- Formulaire pur structuré
- Quartiers générés dynamiquement par IA
- 1 seul appel IA (génération quartiers en onboarding)
- Instantané, pas de latence
- Coût réduit de ~90%

### Quartiers générés

**Le système génère automatiquement** :
- Tous les quartiers officiels de la ville
- Les secteurs géographiques (Nord, Sud, etc.)
- Les communes limitrophes importantes

**L'utilisateur peut** :
- Sélectionner plusieurs quartiers (multi-select)
- Ajouter des quartiers personnalisés
- Supprimer ses quartiers custom

**Important** : Les quartiers sont cachés 30 jours. Pour régénérer :
```sql
DELETE FROM city_neighborhoods WHERE city = 'NomVille';
```

---

## 📝 Prochaines étapes suggérées

1. **Analytics quartiers** : Voir quels quartiers sont les plus recherchés
2. **Améliorer Gemini prompt** : Si certaines villes génèrent mal
3. **Ajouter codes postaux** : Pour affiner encore plus
4. **Exporter profil** : Permettre à l'utilisateur de télécharger son profil
5. **Scoring amélioré** : Utiliser les quartiers dans le scoring des annonces

---

**Développé avec ❤️ par Claude pour LUMINᵉ**

**Date** : 2025-01-09
**Version** : 2.1
**Commit** : `d324c2d`
