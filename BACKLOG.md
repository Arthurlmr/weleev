# Backlog LUMINᵉ

## 🚀 Sprint actuel : Refonte profil utilisateur & chat structuré

**Objectif** : Système structuré de 19 critères avec filtrage intelligent et enrichissement automatique

### User Stories prioritaires

#### US-001 : Chat conversationnel structuré (P0)
**En tant qu'** utilisateur
**Je veux** répondre à 19 questions claires et structurées
**Afin de** définir mes critères de recherche sans conversation infinie

**Critères d'acceptation** :
- [ ] Maximum 19 questions posées
- [ ] Questions conditionnelles (étage si appart, etc.)
- [ ] Input texte libre + boutons réponses rapides
- [ ] Réponses évasives proposées ("Peu importe", "Les 3 me vont")
- [ ] Mise à jour BDD en temps réel après chaque réponse
- [ ] Checklist visuelle (✅/⏳) avec valeurs collectées
- [ ] Score de complétion 0-100%

#### US-002 : Filtrage intelligent (P0)
**En tant qu'** utilisateur
**Je veux** que mes critères obligatoires excluent les annonces non pertinentes
**Afin de** ne voir que les biens qui correspondent vraiment

**Critères d'acceptation** :
- [ ] Filtres stricts excluent annonces (type, budget, surface, chambres, quartiers, jardin obligatoire, garage obligatoire, état, travaux)
- [ ] Préférences influencent score uniquement (étage, orientation, vis-à-vis, proximités, charges)
- [ ] Ajout filtre "État du bien" dans UI
- [ ] Quartiers/zones = filtre ULTRA important

#### US-003 : Enrichissement automatique des annonces (P0)
**En tant qu'** utilisateur
**Je veux** que les annonces soient enrichies automatiquement par l'IA
**Afin de** avoir toutes les infos importantes sans effort

**Critères d'acceptation** :
- [ ] Retrait du bouton debug "Enrichir depuis la description"
- [ ] Intégration dans bouton principal "Analyser avec IA"
- [ ] Analyse en parallèle : vision + extraction description
- [ ] Sauvegarde automatique dans BDD
- [ ] Affichage badges "✨ Enrichi par LUMINᵉ"
- [ ] Correction/remplacement infos erronées

#### US-004 : Visibilité valeur ajoutée LUMINᵉ (P1)
**En tant qu'** utilisateur
**Je veux** voir clairement ce que LUMINᵉ a amélioré
**Afin de** comprendre la valeur de l'outil

**Critères d'acceptation** :
- [ ] Badges visuels sur données enrichies (cuisine, chauffage, parking, etc.)
- [ ] Indicateurs sur données corrigées (si surface/chambres modifiés)
- [ ] Section "Informations enrichies par LUMINᵉ" sur page détail
- [ ] Icône ✨ sur cards du feed pour annonces enrichies

#### US-005 : Support achat ET location (P1)
**En tant qu'** utilisateur
**Je veux** chercher en achat ou en location
**Afin de** utiliser l'outil selon ma situation

**Critères d'acceptation** :
- [ ] Choix achat/location dans onboarding
- [ ] Adaptation questions (budget = prix achat OU loyer mensuel)
- [ ] Questions spécifiques location (meublé, durée, charges comprises)
- [ ] Différenciation importance critères achat vs location

---

## 📋 Backlog général

### Critiques (P0)

#### BACK-001 : Question propriétaire actuel
**Importance** : ULTRA HAUTE (modèle économique)
**Description** : Collecter l'info si l'utilisateur est déjà propriétaire
**Impact** : Stratégie commerciale, scoring, recommandations
**Status** : TODO (inclus dans 19 critères)

#### BACK-002 : Quartiers/zones en onboarding
**Importance** : ULTRA HAUTE
**Description** : Ajouter choix multiple des quartiers préférés
**Impact** : Filtrage direct, impact score majeur
**Status** : TODO (inclus dans 19 critères)

### Importantes (P1)

#### BACK-003 : Trigger auto création profil
**Description** : Créer automatiquement une ligne dans conversational_profiles à l'inscription
**Status** : ✅ DONE (trigger SQL créé)

#### BACK-004 : Cache analyses IA
**Description** : Stocker analyses IA 30 jours pour éviter re-calcul
**Status** : ✅ DONE (vision_analyzed_at, nlp_analyzed_at)

#### BACK-005 : Géocodage villes françaises
**Description** : Fallback coordonnées pour 60+ villes françaises
**Status** : ✅ DONE (/src/lib/geocoding.ts)

#### BACK-006 : Carte centrée sur annonces
**Description** : Centroid géographique au lieu de Paris
**Status** : ✅ DONE

#### BACK-007 : Marqueurs colorés selon score
**Description** : Vert/jaune/orange/rouge selon qualité
**Status** : ✅ DONE

### Moyennes (P2)

#### BACK-008 : Historique des recherches
**Description** : Sauvegarder les recherches précédentes de l'utilisateur
**Impact** : Reprendre recherche, analyser patterns
**Status** : TODO

#### BACK-009 : Comparateur de biens
**Description** : Comparer 2-3 propriétés côte à côte
**Impact** : Aide à la décision
**Status** : TODO

#### BACK-010 : Alertes nouvelles annonces
**Description** : Notifier quand nouvelle annonce match critères
**Impact** : Réactivité, engagement
**Status** : TODO

#### BACK-011 : Export PDF rapport bien
**Description** : Exporter analyse complète en PDF
**Impact** : Partage, impression
**Status** : TODO

#### BACK-012 : Simulateur de crédit avancé
**Description** : Simulateur avec taux actuels, assurance, frais
**Impact** : Aide décision financière
**Status** : TODO

### Basses (P3)

#### BACK-013 : Mode sombre
**Description** : Thème dark pour l'application
**Status** : TODO

#### BACK-014 : PWA / App mobile
**Description** : Installation comme app native
**Status** : TODO

#### BACK-015 : Multi-langues
**Description** : Support EN, ES
**Status** : TODO

---

## 🐛 Bugs connus

### BUG-001 : ✅ FIXED - conversational_profiles 406
**Description** : Erreur 406 lors de la lecture du profil
**Cause** : Ligne inexistante pour nouveaux utilisateurs
**Fix** : Trigger SQL auto-création + INSERT manuel

### BUG-002 : ✅ FIXED - Gemini MAX_TOKENS
**Description** : Erreur "Empty response from Gemini", finishReason: MAX_TOKENS
**Cause** : maxOutputTokens trop bas (1024-2048), thoughts tokens utilisent l'espace
**Fix** : maxOutputTokens = 8192 pour toutes les Edge Functions

### BUG-003 : ✅ FIXED - Carte centrée sur Paris
**Description** : Map se charge toujours sur Paris
**Cause** : Center hardcodé au lieu de calculer centroid
**Fix** : Calcul centroid basé sur toutes les propriétés

### BUG-004 : ✅ FIXED - Analyse IA "Cannot read '0'"
**Description** : Erreur lors de l'analyse d'images
**Cause** : Accès à candidates[0] sans vérifier existence
**Fix** : Checks + debug logging dans Edge Functions

---

## 🎨 Améliorations UI/UX

### UX-001 : ✅ DONE - Popup carte enrichi
**Description** : Popup avec image, score, données clés
**Impact** : Meilleure expérience carte

### UX-002 : ✅ DONE - Retrait année construction
**Description** : Info pas clé, encombre l'UI
**Impact** : Clarté, focus sur l'essentiel

### UX-003 : TODO - Skeleton loaders
**Description** : Loaders pendant chargement annonces
**Impact** : Perception performance

### UX-004 : TODO - Animations micro-interactions
**Description** : Feedback visuel actions (favoris, filtres)
**Impact** : Feeling moderne, réactivité

### UX-005 : TODO - Empty states
**Description** : Messages quand pas de résultats
**Impact** : Guidage utilisateur

---

## 📊 Analytics & Tracking (Futur)

### ANALYTICS-001 : Tracking critères populaires
**Description** : Quels critères sont les plus importants pour les users
**Impact** : Amélioration produit data-driven

### ANALYTICS-002 : Taux conversion profil → favoris
**Description** : Mesurer impact complétude profil sur engagement
**Impact** : Optimisation onboarding

### ANALYTICS-003 : Analyse patterns recherche
**Description** : Identifier typologies d'acheteurs
**Impact** : Segmentation, personnalisation

---

## 🔐 Sécurité & Performance (Futur)

### SECURITY-001 : Rate limiting Edge Functions
**Description** : Limiter appels Gemini API par user
**Impact** : Protection coûts, abus

### SECURITY-002 : Validation inputs
**Description** : Sanitize tous les inputs utilisateur
**Impact** : Protection XSS, injection

### PERF-001 : Lazy loading images
**Description** : Charger images à la demande
**Impact** : Performance feed

### PERF-002 : Pagination annonces
**Description** : Charger 20 annonces à la fois
**Impact** : Performance, scalabilité

---

## Notes & Idées en vrac

- **Indicateur "Neuf / À construire / Ancien"** : À ajouter visuellement sur cards
- **Scoring pondéré par usage** : Investissement locatif ≠ résidence principale
- **Photos de quartier** : Enrichir avec photos/infos quartier (Google Places API ?)
- **Estimation loyer potentiel** : Si achat investissement locatif
- **Timeline travaux** : Si travaux acceptés, timeline + coûts estimés
- **Compatibilité profil couple** : Fusionner critères 2 utilisateurs
