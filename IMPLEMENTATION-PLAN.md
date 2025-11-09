# Plan d'implémentation - Refonte profil utilisateur

## Vue d'ensemble

**Objectif** : Remplacer le chat conversationnel infini par un système structuré de 19 critères avec mise à jour temps réel et filtrage intelligent.

**Priorité** : Backend → Frontend → Intégration enrichissement

---

## Phase 1 : Backend & Base de données (⏱️ ~2-3h)

### 1.1 Migration SQL
```bash
# Fichier : /supabase-migrations-v2.sql
```
- [ ] Exécuter migration SQL complète (voir DATA-STRUCTURE.md)
- [ ] Vérifier que toutes les colonnes sont créées
- [ ] Tester le trigger de calcul auto du profile_completeness_score
- [ ] Créer index pour performance

### 1.2 Edge Function : `gemini-chat-structured`
```bash
# Nouveau fichier : /supabase/functions/gemini-chat-structured/index.ts
```

**Responsabilités** :
1. Reçoit message utilisateur (texte libre)
2. Identifie quel(s) critère(s) sont concernés via Gemini
3. Extrait la valeur et la normalise
4. Met à jour conversational_profiles en temps réel
5. Retourne la prochaine question (parmi les 19 - celles déjà remplies)
6. Inclut suggestions de réponses rapides + réponses évasives

**Prompt Gemini** :
```typescript
const STRUCTURED_QUESTIONS = [
  {
    id: 1,
    key: 'property_type_filter',
    question: "Recherchez-vous un appartement ou une maison ?",
    quickReplies: ['Appartement', 'Maison', 'Les deux me conviennent'],
    dbField: 'property_type_filter',
    extraction: 'array of ["apartment", "house", "both"]'
  },
  {
    id: 2,
    key: 'city_filter',
    question: "Dans quelle ville recherchez-vous ?",
    quickReplies: ['Niort', 'Niort + communes limitrophes'],
    dbField: 'city_filter',
    extraction: 'string'
  },
  {
    id: 3,
    key: 'neighborhoods_filter',
    question: "Avez-vous des quartiers préférés ? (plusieurs possibles)",
    quickReplies: ['Centre-ville', 'Quartier Nord', 'Quartier Sud', 'Tous les quartiers me vont'],
    dbField: 'neighborhoods_filter',
    extraction: 'array of strings'
  },
  // ... 16 autres questions
]

const prompt = `
Tu es un assistant immobilier intelligent. L'utilisateur a dit : "${userMessage}"

Questions déjà remplies : ${filledCriteria}
Prochaine question à poser : ${nextQuestion}

Tâche 1 : Extraire de "${userMessage}" les critères mentionnés et leurs valeurs
Tâche 2 : Déterminer la prochaine question pertinente à poser

Réponds en JSON :
{
  "extractedCriteria": {
    "property_type_filter": ["apartment"],
    "budget_max": 350000,
    ...
  },
  "nextQuestion": {
    "id": 4,
    "text": "Quel est votre budget maximum ?",
    "quickReplies": ["300k€", "350k€", "400k€", "Flexible"],
    "evasiveReplies": ["Je ne sais pas encore", "Pas de limite stricte"]
  },
  "allCriteriaFilled": false
}
`
```

**Structure réponse** :
```typescript
interface ChatStructuredResponse {
  extractedCriteria: Record<string, any>
  nextQuestion: {
    id: number
    text: string
    quickReplies: string[]
    evasiveReplies: string[]
  }
  allCriteriaFilled: boolean
  profileCompleteness: number
}
```

### 1.3 Logique de filtrage Feed
```bash
# Fichier à modifier : /src/pages/FeedPage.tsx
```

**Fonction de filtrage strict** :
```typescript
function applyStrictFilters(properties: Property[], profile: UserProfile): Property[] {
  return properties.filter(prop => {
    // Type de bien
    if (profile.property_type_filter && !profile.property_type_filter.includes('both')) {
      if (!profile.property_type_filter.includes(prop.property_type)) return false
    }

    // Budget
    if (profile.budget_max && prop.price > profile.budget_max) return false

    // Surface
    if (profile.surface_min && prop.surface < profile.surface_min) return false

    // Chambres
    if (profile.bedrooms_min && prop.bedrooms < profile.bedrooms_min) return false

    // Quartiers
    if (profile.neighborhoods_filter?.length > 0) {
      if (!profile.neighborhoods_filter.includes(prop.neighborhood)) return false
    }

    // Jardin obligatoire
    if (profile.must_have_garden && !prop.has_garden) return false

    // Garage obligatoire
    if (profile.must_have_garage && !prop.has_garage) return false

    // État du bien
    if (profile.state_filter?.length > 0) {
      if (!profile.state_filter.includes(prop.state)) return false
    }

    // Pas de travaux si spécifié
    if (profile.no_renovation_needed && prop.needs_work) return false

    return true
  })
}
```

### 1.4 Amélioration du scoring
```bash
# Fichier à modifier : /supabase/functions/calculate-score/index.ts
```

**Intégrer les préférences** :
```typescript
// Bonus pour orientation
if (profile.orientation_importance === 'important' && property.orientation === 'south') {
  score += 0.5
}

// Bonus pour vis-à-vis
if (profile.vis_a_vis_importance === 'important' && property.clear_view) {
  score += 0.3
}

// Bonus proximités
profile.proximity_priorities?.forEach(priority => {
  if (property.proximities?.includes(priority)) {
    score += 0.2
  }
})

// Bonus charges
if (profile.max_charges && property.charges <= profile.max_charges) {
  score += 0.3
}
```

---

## Phase 2 : Frontend (⏱️ ~3-4h)

### 2.1 Composant `CriteriaChecklist`
```bash
# Nouveau fichier : /src/components/CriteriaChecklist.tsx
```

**Design** :
```tsx
<div className="bg-white rounded-xl p-4 shadow-sm">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-semibold text-lumine-primary">
      Profil de recherche
    </h3>
    <div className="text-sm text-lumine-neutral-700">
      {filledCount}/19 critères
    </div>
  </div>

  {/* Barre de progression */}
  <div className="w-full h-2 bg-lumine-neutral-200 rounded-full mb-4">
    <div
      className="h-full bg-lumine-accent rounded-full transition-all"
      style={{ width: `${(filledCount / 19) * 100}%` }}
    />
  </div>

  {/* Liste des critères */}
  <div className="space-y-2">
    {CRITERIA.map(criterion => (
      <div key={criterion.id} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {criterion.filled ? (
            <CheckCircle className="text-green-600" size={16} />
          ) : (
            <Circle className="text-lumine-neutral-400" size={16} />
          )}
          <span className={criterion.filled ? 'text-lumine-primary' : 'text-lumine-neutral-500'}>
            {criterion.label}
          </span>
        </div>
        {criterion.filled && (
          <Badge variant="secondary" className="text-xs">
            {criterion.value}
          </Badge>
        )}
      </div>
    ))}
  </div>
</div>
```

### 2.2 Nouveau `ChatModal` structuré
```bash
# Fichier à modifier : /src/components/ChatModal.tsx
```

**Changements** :
- Afficher `CriteriaChecklist` à gauche/dessus
- Input texte libre toujours visible
- Boutons de réponse rapide en dessous
- Inclure réponses évasives ("Peu importe", "Les 3 me vont", "Pas important")
- Mise à jour temps réel de la checklist après chaque réponse
- Affichage immédiat de la valeur extraite (✅ Type: Maison)

### 2.3 Filtres dans FeedPage
```bash
# Fichier à modifier : /src/pages/FeedPage.tsx
```

**Ajouter section filtres** :
```tsx
<div className="flex gap-2 overflow-x-auto">
  {/* Filtre État du bien */}
  <Select value={stateFilter} onValueChange={setStateFilter}>
    <SelectTrigger className="w-40">
      <SelectValue placeholder="État du bien" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Tous</SelectItem>
      <SelectItem value="new">Neuf</SelectItem>
      <SelectItem value="recent">Récent (&lt;10 ans)</SelectItem>
      <SelectItem value="old">Ancien</SelectItem>
    </SelectContent>
  </Select>

  {/* Autres filtres... */}
</div>
```

### 2.4 Badges "Enrichi par LUMINᵉ"
```bash
# Fichiers à modifier :
# - /src/pages/PropertyDetailPage.tsx
# - /src/pages/FeedPage.tsx (cards)
```

**Design badge** :
```tsx
<div className="inline-flex items-center gap-1 px-2 py-1 bg-lumine-accent/10 text-lumine-accent rounded-full text-xs">
  <Sparkles size={12} />
  Enrichi par LUMINᵉ
</div>
```

**Où afficher** :
- À côté des infos extraites de la description (cuisine, chauffage, etc.)
- Sur les données corrigées (surface, chambres si modifié)
- Dans la section "Caractéristiques" de la page détail

---

## Phase 3 : Intégration enrichissement (⏱️ ~1-2h)

### 3.1 Retirer bouton debug
```bash
# Fichier à modifier : /src/pages/PropertyDetailPage.tsx
```
- [ ] Supprimer `showEnrichmentModal`, `enrichmentResult`, etc.
- [ ] Supprimer `triggerEnrichment()` function
- [ ] Retirer bouton "Enrichir depuis la description"
- [ ] Retirer import `EnrichmentModal`

### 3.2 Intégrer dans `triggerAIAnalysis`
```bash
# Fichier à modifier : /src/pages/PropertyDetailPage.tsx
```

**Modifier la fonction** :
```typescript
const triggerAIAnalysis = async () => {
  if (!property || !user) return

  setLoadingEnrichment(true)
  try {
    const allImages = [/* ... */]
    const imageUrls = allImages.slice(0, 5)
    const description = property.description || ''

    // NOUVEAU : Analyser en parallèle
    const [enrichmentData, propertyEnrichment] = await Promise.all([
      getPropertyEnrichment(property.id, imageUrls, description),
      enrichPropertyFromDescription({
        title: property.title,
        price: property.price,
        surface: property.surface,
        // ... toutes les infos
        description: property.description
      })
    ])

    setEnrichmentData({
      ...enrichmentData,
      extractedInfo: propertyEnrichment.nouvelles_informations
    })

    // Sauvegarder les infos enrichies dans la BDD
    await supabase
      .from('melo_properties')
      .update({
        ai_enriched_data: propertyEnrichment.nouvelles_informations,
        ai_enriched_at: new Date().toISOString()
      })
      .eq('id', property.id)

  } catch (error) {
    console.error('Error triggering AI analysis:', error)
  } finally {
    setLoadingEnrichment(false)
  }
}
```

### 3.3 Afficher données enrichies
```bash
# Fichier à modifier : /src/pages/PropertyDetailPage.tsx
```

**Section "Caractéristiques enrichies"** :
```tsx
{enrichmentData?.extractedInfo && (
  <Card className="border-lumine-accent/20">
    <CardContent className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-lumine-accent" size={20} />
        <h3 className="font-semibold text-lumine-primary">
          Informations enrichies par LUMINᵉ
        </h3>
      </div>
      <div className="space-y-3">
        {enrichmentData.extractedInfo.map((info, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-lumine-accent/5 rounded-lg">
            <Badge variant="secondary" className="text-xs">
              {info.categorie}
            </Badge>
            <p className="text-sm text-lumine-neutral-700 flex-1">
              {info.information}
            </p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

---

## Phase 4 : Tests & Déploiement (⏱️ ~1h)

### 4.1 Tests fonctionnels
- [ ] Conversation chat : 19 questions max
- [ ] Mise à jour BDD temps réel après chaque réponse
- [ ] Checklist visuelle se remplit correctement
- [ ] Filtres stricts excluent bien les annonces
- [ ] Scoring intègre les préférences
- [ ] Enrichissement auto fonctionne
- [ ] Badges "Enrichi par LUMINᵉ" affichés

### 4.2 Tests cas limites
- [ ] Réponse texte libre vs boutons
- [ ] Réponse évasive ("Peu importe")
- [ ] Changement de réponse (mise à jour)
- [ ] Questions conditionnelles (étage si appart)
- [ ] Profil incomplet (< 19 critères)

### 4.3 Déploiement
1. [ ] Exécuter migration SQL sur Supabase prod
2. [ ] Déployer nouvelle Edge Function `gemini-chat-structured`
3. [ ] Redéployer Edge Functions modifiées (calculate-score)
4. [ ] Build & deploy Netlify
5. [ ] Vérifier fonctionnement en prod

---

## Ordre d'exécution recommandé

1. **Migration SQL** (30 min)
2. **Edge Function `gemini-chat-structured`** (2h)
3. **Logique filtrage Feed** (1h)
4. **Composant `CriteriaChecklist`** (1h)
5. **Nouveau ChatModal** (1h30)
6. **Intégration enrichissement** (1h)
7. **Badges visuels** (30 min)
8. **Tests** (1h)

**Total estimé : 8-9h de développement**

---

## Points d'attention

⚠️ **Questions conditionnelles** : Étage seulement si appartement, mitoyenneté seulement si maison
⚠️ **Normalisation valeurs** : Toujours utiliser enum standardisés
⚠️ **Performance** : Index sur neighborhoods_filter, budget_max
⚠️ **UX** : Input texte libre toujours disponible + boutons
⚠️ **Modèle économique** : Question "propriétaire actuel" = ULTRA prioritaire
