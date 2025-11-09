# Contexte du projet LUMINᵉ

## Vue d'ensemble
Application immobilière qui aide les utilisateurs à trouver leur bien idéal en combinant :
- Recherche d'annonces (scraping Melo)
- Analyse IA des propriétés (Gemini 2.5-flash)
- Scoring personnalisé basé sur les préférences utilisateur
- Chat conversationnel pour affiner la recherche

## État actuel du projet

### ✅ Ce qui fonctionne
1. **Authentification** : Supabase Auth
2. **Feed d'annonces** :
   - Affichage liste/carte/hybride
   - Tri par prix décroissant par défaut
   - Marqueurs carte colorés selon score (vert/jaune/orange/rouge)
   - Carte centrée sur centroid géographique des annonces
   - Popup enrichi avec image, score, infos clés
   - Geocoding avec fallback pour 60+ villes françaises
3. **Analyse IA (Gemini 2.5-flash)** :
   - ✅ Vision : Analyse photos (état, travaux, features)
   - ✅ Extract data : Extraction description texte
   - ✅ Enrich property : Enrichissement depuis description (debug)
   - ✅ Cache 30 jours pour éviter re-analyse
   - ✅ maxOutputTokens = 8192 (résout problème thoughts tokens)
4. **Database** :
   - Tables : melo_properties, ai_property_analysis, conversational_profiles, user_favorites, user_property_scores
   - RLS configuré
   - Migrations SQL à jour

### ⚠️ Ce qui nécessite refonte
1. **Chat conversationnel** : Tourne en rond, questions infinies, passage de 75% à 50%
2. **Profil utilisateur** : Pas de structure claire des critères de recherche
3. **Filtrage** : Pas de distinction entre filtres stricts (exclusion) et préférences (scoring)
4. **Enrichissement** : Fonctionnalité debug à intégrer dans flow principal

## Objectifs de la prochaine session

### 1. Refonte complète du système de profil utilisateur
- 19 critères structurés (au lieu de conversation infinie)
- Distinction FILTRE STRICT vs PRÉFÉRENCE
- Support ACHAT et LOCATION
- Questions conditionnelles (étage si appart, mitoyenneté si maison)

### 2. Nouveau chat conversationnel
- 19 questions maximum
- Input texte libre + boutons réponses rapides
- Réponses évasives ("Peu importe", "Les 3 me vont")
- Mise à jour BDD en temps réel après chaque réponse
- Checklist visuelle (✅/⏳) avec valeurs collectées

### 3. Intégration enrichissement automatique
- Retirer bouton debug "Enrichir depuis la description"
- Intégrer dans "Analyser avec IA" principal
- Badges visuels "✨ Enrichi par LUMINᵉ"

### 4. Amélioration du filtrage et scoring
- Filtres stricts excluent annonces (type, budget, surface, etc.)
- Préférences influencent score uniquement
- Quartiers/zones = ULTRA important

## Stack technique
- **Frontend** : React 18.2 + TypeScript 5.2 + Vite 5.0.8
- **UI** : Tailwind CSS + shadcn/ui + Framer Motion
- **Backend** : Supabase (PostgreSQL + Edge Functions Deno)
- **IA** : Google Gemini 2.5-flash
- **Carte** : React Leaflet
- **Déploiement** : Netlify

## Conventions de nommage
- Brand : **LUMINᵉ** (avec exposant ᵉ)
- Couleurs : lumine-primary, lumine-accent, lumine-neutral-*
- Tables : snake_case
- Composants React : PascalCase

## Problèmes résolus récemment
1. ✅ Map centrée sur Paris → Centroid des annonces
2. ✅ Marqueurs tous dorés → Colorés selon score
3. ✅ Année construction affichée → Retirée (pas clé)
4. ✅ Popup carte basic → Enrichi avec image/score/données
5. ✅ conversational_profiles 406 → Ligne créée + trigger auto
6. ✅ Gemini MAX_TOKENS → maxOutputTokens = 8192
7. ✅ AI analysis "Cannot read '0'" → Debug + checks candidates

## Modèle économique
**ULTRA IMPORTANT** : Savoir si l'utilisateur est déjà propriétaire → Impact sur stratégie commerciale
