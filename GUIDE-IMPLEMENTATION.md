# 🚀 Guide d'implémentation - Système de profil utilisateur v2

## ✅ Ce qui a été fait

### 📦 Code développé et pushé sur GitHub

Tous les changements ont été commités et pushés sur la branche :
**`claude/lumineai-user-profile-system-011CUxYTPqBwZMQNk46CNNo7`**

#### Backend
- ✅ **Migration SQL v2** : 19 critères structurés dans `conversational_profiles`
- ✅ **Edge Function `gemini-chat-structured`** : Chat intelligent avec 19 questions
- ✅ **Edge Function `calculate-score` modifiée** : Intégration des préférences utilisateur
- ✅ **Enrichissement automatique** : Vision + extraction description en parallèle

#### Frontend
- ✅ **Composant `CriteriaChecklist`** : Checklist visuelle des 19 critères
- ✅ **ChatModal refondu** : Input texte libre + boutons réponses rapides
- ✅ **Composant `EnrichedBadge`** : Badge "✨ Enrichi par LUMINᵉ"
- ✅ **Filtrage strict** : Logique de filtrage basée sur profil utilisateur v2
- ✅ **Affichage données enrichies** : Section dédiée sur page détail

---

## 📋 Actions à effectuer de ton côté (5-10 min)

### 1️⃣ Exécuter la migration SQL dans Supabase

**Étape :**
1. Va sur https://supabase.com et connecte-toi
2. Sélectionne ton projet LUMINᵉ
3. Clique sur **SQL Editor** dans le menu de gauche
4. Va sur GitHub à ce chemin : `supabase-migrations-v2.sql`
5. Copie TOUT le contenu du fichier
6. Colle-le dans le SQL Editor de Supabase
7. Clique sur **Run** (bouton en bas à droite)
8. Vérifie qu'il n'y a pas d'erreurs (devrait afficher "Success" en vert)

**Vérification :**
```sql
-- Exécute cette requête pour vérifier que les colonnes ont été créées
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'conversational_profiles'
ORDER BY ordinal_position;
```

Tu devrais voir toutes les nouvelles colonnes comme :
- `search_type`
- `property_type_filter`
- `budget_max`
- `surface_min`
- `neighborhoods_filter`
- etc.

---

### 2️⃣ Déployer les Edge Functions sur Supabase

**Prérequis :** Avoir le Supabase CLI installé

#### Option A : Déployer toutes les fonctions

```bash
# Depuis la racine du projet
supabase functions deploy gemini-chat-structured
supabase functions deploy calculate-score
```

#### Option B : Si tu n'as pas le CLI installé

1. Va sur GitHub → `supabase/functions/gemini-chat-structured/index.ts`
2. Copie tout le contenu
3. Va sur Supabase Dashboard → Edge Functions
4. Clique sur **New Function**
5. Nomme-la `gemini-chat-structured`
6. Colle le code
7. Clique sur **Deploy**
8. Répète pour `calculate-score` (modifier la fonction existante)

---

### 3️⃣ Vérifier les variables d'environnement

Assure-toi que ces variables sont définies dans Supabase Edge Functions :
- `GEMINI_API_KEY` : Ta clé API Google Gemini
- `SUPABASE_URL` : URL de ton projet Supabase
- `SUPABASE_ANON_KEY` : Clé anonyme Supabase

**Comment vérifier :**
1. Supabase Dashboard → Settings → Edge Functions
2. Vérifie que `GEMINI_API_KEY` est bien définie
3. Les autres devraient être automatiques

---

### 4️⃣ Tester le nouveau système

#### Test 1 : Chat conversationnel structuré

1. Lance l'application en local : `npm run dev`
2. Va sur la page Feed
3. Clique sur le bouton chat (en bas à droite)
4. Le chat doit afficher la checklist à gauche (desktop)
5. Réponds aux questions (max 19)
6. Vérifie que :
   - Les boutons de réponse rapide apparaissent
   - Les réponses évasives ("Peu importe") sont proposées
   - La checklist se remplit en temps réel
   - La barre de progression avance

#### Test 2 : Filtrage strict

1. Dans le chat, définis des critères stricts :
   - Budget max : 350 000€
   - Surface min : 100m²
   - Quartiers : Centre-ville
2. Retourne sur le feed
3. Vérifie que seules les annonces correspondantes s'affichent

#### Test 3 : Enrichissement automatique

1. Va sur une page de détail d'annonce
2. Clique sur "Analyser avec IA"
3. Attends l'analyse (peut prendre 10-20 secondes)
4. Vérifie que :
   - L'analyse vision est affichée
   - La section "Informations enrichies par LUMINᵉ" apparaît
   - Les badges "✨ Enrichi par LUMINᵉ" sont visibles
5. Retourne sur le feed
6. Vérifie qu'un badge apparaît sur la card de cette annonce

---

## 🎯 Fonctionnalités implémentées

### ✨ Nouveau chat structuré
- 19 questions maximum (vs conversation infinie avant)
- Input texte libre toujours disponible
- Boutons de réponse rapide pour chaque question
- Réponses évasives ("Peu importe", "Les 3 me vont")
- Checklist visuelle avec progression en temps réel
- Score de complétion 0-100%

### 🔍 Filtrage intelligent
**Filtres stricts** (excluent les annonces) :
- Type de bien (appartement/maison)
- Budget maximum
- Surface minimale
- Nombre de chambres
- Quartiers/zones (ULTRA important)
- Jardin obligatoire
- Garage obligatoire
- État du bien (neuf/récent/ancien)
- Pas de travaux
- Maison non mitoyenne

**Préférences** (influencent le score) :
- Étage (pas RDC, dernier étage)
- Extérieur (jardin/balcon)
- Parking
- Orientation (Sud/Sud-Ouest)
- Vis-à-vis
- Proximités (écoles, transports, commerces)
- Charges copropriété max
- Configuration intérieure

### 🤖 Enrichissement automatique
- Analyse vision ET extraction description en parallèle
- Sauvegarde automatique dans la BDD
- Affichage des données enrichies sur page détail
- Badges visuels sur les cards du feed
- Cache des résultats pour éviter re-analyse

---

## 📊 Structure de la base de données

### Table `conversational_profiles` (mise à jour)

**Nouvelles colonnes ajoutées :**

#### Métadonnées
- `search_type` : 'purchase' | 'rental'
- `profile_version` : INTEGER (version 2)
- `criteria_filled` : INTEGER (sur 19)

#### Filtres stricts
- `property_type_filter` : TEXT[]
- `city_filter` : TEXT
- `neighborhoods_filter` : TEXT[]
- `budget_max` : INTEGER
- `surface_min` : INTEGER
- `bedrooms_min` : INTEGER
- `must_have_garden` : BOOLEAN
- `must_have_garage` : BOOLEAN
- `state_filter` : TEXT[]
- `no_renovation_needed` : BOOLEAN
- `detached_house_only` : BOOLEAN

#### Préférences
- `floor_preference` : TEXT
- `outdoor_preference` : TEXT
- `parking_preference` : TEXT
- `orientation_importance` : TEXT
- `vis_a_vis_importance` : TEXT
- `proximity_priorities` : TEXT[]
- `max_charges` : INTEGER
- `interior_config_prefs` : TEXT[]

#### Critères business
- `is_current_owner` : BOOLEAN
- `property_usage` : TEXT
- `renovation_acceptance` : TEXT

### Table `melo_properties` (mise à jour)

**Nouvelles colonnes ajoutées :**
- `ai_enriched_data` : JSONB (données enrichies)
- `ai_enriched_at` : TIMESTAMPTZ (date enrichissement)

---

## 🔧 Dépannage

### Problème : Le chat ne se lance pas

**Solution :**
1. Vérifie que la fonction `gemini-chat-structured` est bien déployée
2. Ouvre la console navigateur (F12)
3. Regarde les erreurs
4. Vérifie que `GEMINI_API_KEY` est définie

### Problème : La migration SQL échoue

**Solution :**
1. Vérifie que tu es bien sur le bon projet Supabase
2. Si erreur "column already exists", c'est normal, continue
3. Si erreur de syntaxe, copie/colle à nouveau depuis GitHub

### Problème : Les filtres ne fonctionnent pas

**Solution :**
1. Vérifie que ton profil utilisateur existe :
```sql
SELECT * FROM conversational_profiles WHERE user_id = 'TON_USER_ID';
```
2. Si pas de ligne, crée-en une manuellement ou via le chat

### Problème : L'enrichissement ne sauvegarde pas

**Solution :**
1. Vérifie la console navigateur
2. Regarde si les colonnes `ai_enriched_data` et `ai_enriched_at` existent :
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'melo_properties' AND column_name LIKE 'ai_enriched%';
```

---

## 📝 Notes importantes

### Cache AI Analysis
- Les analyses IA sont cachées 30 jours
- Pour re-analyser, attends 30 jours OU supprime la ligne dans `ai_property_analysis`

### Questions conditionnelles
- "Étage" : seulement si type = appartement
- "Mitoyenneté" : seulement si type = maison
- "Charges" : seulement si type = appartement

### Valeurs normalisées
Toujours utiliser ces valeurs exactes :
- `property_type_filter` : `['apartment']`, `['house']`, `['both']`
- `state_filter` : `['new']`, `['recent']`, `['old']`, `['construction']`, `['no_new']`
- `orientation_importance` : `'required'`, `'important'`, `'not_important'`
- etc.

---

## 🎉 Prochaines étapes suggérées

1. **Tester en production** avec de vrais utilisateurs
2. **Affiner les questions** selon les retours
3. **Ajouter plus de quartiers** dans les choix multiples
4. **Implémenter les filtres "État du bien"** dans l'UI (déjà dans le backend)
5. **Créer des analytics** pour voir quels critères sont les plus utilisés

---

## 🆘 Besoin d'aide ?

Si tu rencontres un problème :
1. Vérifie les logs Supabase Edge Functions
2. Consulte la console navigateur (F12)
3. Vérifie que toutes les étapes ci-dessus ont été effectuées
4. Fais-moi signe si tu es bloqué !

---

**Développé avec ❤️ par Claude pour LUMINᵉ**
