# Session Handoff - Instructions pour la prochaine session

## 🎯 Prompt à copier-coller

```
Bonjour ! Je continue le développement du projet LUMINᵉ (application immobilière avec IA).

Lis ces 4 documents dans l'ordre pour récupérer le contexte complet :

1. **/home/user/weleev/CONTEXT.md** : Contexte général, état actuel, stack technique
2. **/home/user/weleev/DATA-STRUCTURE.md** : Structure BDD, 19 critères, migration SQL
3. **/home/user/weleev/IMPLEMENTATION-PLAN.md** : Plan détaillé phase par phase
4. **/home/user/weleev/BACKLOG.md** : Backlog complet, user stories, bugs résolus

## Mission de cette session

**Objectif** : Implémenter le système de profil utilisateur structuré avec 19 critères et chat intelligent.

**Ordre d'exécution recommandé** :

### Phase 1 : Backend & BDD (Priorité MAX)
1. Exécuter migration SQL complète (voir DATA-STRUCTURE.md)
2. Créer Edge Function `gemini-chat-structured` (voir IMPLEMENTATION-PLAN.md Phase 1.2)
3. Implémenter logique filtrage strict dans FeedPage
4. Modifier calculate-score pour intégrer préférences

### Phase 2 : Frontend
5. Créer composant `CriteriaChecklist` (checklist visuelle 19 critères)
6. Refondre `ChatModal` avec input texte libre + boutons
7. Ajouter filtre "État du bien" dans UI
8. Ajouter badges "✨ Enrichi par LUMINᵉ"

### Phase 3 : Intégration enrichissement
9. Retirer bouton debug "Enrichir depuis la description"
10. Intégrer enrichissement dans `triggerAIAnalysis`
11. Afficher données enrichies sur page détail

### Phase 4 : Tests
12. Tester conversation 19 questions
13. Tester filtres stricts + préférences
14. Vérifier badges et enrichissement auto

**Important** : Commence par la Phase 1 (Backend), c'est la base de tout.

Prêt à démarrer ?
```

---

## 📋 Checklist avant de commencer la nouvelle session

- [ ] Créer nouvelle branche : `git checkout -b feature/structured-profile-chat`
- [ ] Lire les 4 documents de contexte
- [ ] Vérifier que Supabase Dashboard est accessible
- [ ] Vérifier que les Edge Functions actuelles fonctionnent
- [ ] S'assurer que maxOutputTokens = 8192 est déployé

---

## 🔑 Informations clés à retenir

### Priorités absolues
1. **Question propriétaire actuel** = ULTRA importante (modèle économique)
2. **Quartiers/zones** = ULTRA important (impact score direct)
3. **19 critères max** = Stop conversation infinie
4. **Filtres stricts vs Préférences** = Distinction cruciale

### Décisions techniques
- **Gemini 2.5-flash** partout (pas 2.0-flash-exp)
- **maxOutputTokens = 8192** (résout problème thoughts tokens)
- **Cache 30 jours** pour analyses IA
- **Trigger auto** pour création conversational_profiles

### Conventions code
- Tables BDD : `snake_case`
- Composants React : `PascalCase`
- Edge Functions : `kebab-case`
- Brand : **LUMINᵉ** (avec exposant ᵉ)
- Couleurs : `lumine-primary`, `lumine-accent`, `lumine-neutral-*`

---

## 📁 Structure des documents

```
/home/user/weleev/
├── CONTEXT.md                 # Contexte projet, état actuel, problèmes résolus
├── DATA-STRUCTURE.md          # Structure BDD, 19 critères, migration SQL
├── IMPLEMENTATION-PLAN.md     # Plan phase par phase, code examples
├── BACKLOG.md                 # User stories, bugs, améliorations futures
└── SESSION-HANDOFF.md         # Ce fichier (instructions session suivante)
```

---

## 🚀 Points de départ code

### Backend
- Migration SQL : `DATA-STRUCTURE.md` ligne ~40
- Edge Function template : `IMPLEMENTATION-PLAN.md` Phase 1.2
- Logique filtrage : `IMPLEMENTATION-PLAN.md` Phase 1.3

### Frontend
- CriteriaChecklist : `IMPLEMENTATION-PLAN.md` Phase 2.1
- ChatModal : `IMPLEMENTATION-PLAN.md` Phase 2.2
- Badges : `IMPLEMENTATION-PLAN.md` Phase 2.4

### Tests
- Liste complète : `IMPLEMENTATION-PLAN.md` Phase 4

---

## ⚠️ Pièges à éviter

1. **Ne pas réinitialiser maxOutputTokens** : Doit rester 8192
2. **Ne pas oublier questions conditionnelles** : Étage si appart, mitoyenneté si maison
3. **Ne pas mélanger filtres stricts et préférences** : Logiques différentes
4. **Normaliser les valeurs** : Toujours utiliser les enums standardisés
5. **Input texte toujours disponible** : Même avec boutons quick replies

---

## 📞 Contacts & Ressources

- **Supabase Project** : sykyszxukyambsxxmesf
- **Gemini Model** : gemini-2.5-flash
- **GitHub Branch** : À créer → `feature/structured-profile-chat`
- **Deploy** : Netlify (auto-deploy depuis main)

---

Bonne chance pour la suite du développement ! 🚀
