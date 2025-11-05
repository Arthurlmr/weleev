# Architecture de l'Application Weleev

Ce document décrit l'architecture technique de Weleev, ses choix de conception et ses patterns.

## Vue d'Ensemble

Weleev est une application React moderne construite avec une architecture client-serveur où :
- **Frontend** : React + TypeScript (SPA)
- **Backend** : Supabase (BaaS - Backend as a Service)
- **IA** : Google Gemini API

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Pages    │  │ Components │  │   Hooks    │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│         │                │                │             │
│         └────────────────┴────────────────┘             │
│                          │                              │
│                   ┌──────▼──────┐                       │
│                   │  Lib Layer  │                       │
│                   └──────┬──────┘                       │
└──────────────────────────┼──────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
    ┌────▼─────┐                       ┌────▼─────┐
    │ Supabase │                       │  Gemini  │
    │   API    │                       │   API    │
    └──────────┘                       └──────────┘
```

---

## Structure des Dossiers

```
src/
├── components/          # Composants réutilisables
│   ├── ListingCard.tsx
│   ├── ListingDetailModal.tsx
│   └── MainLayout.tsx
│
├── pages/              # Pages de l'application
│   ├── AuthPage.tsx
│   ├── OnboardingPage.tsx
│   ├── FeedPage.tsx
│   ├── FavoritesPage.tsx
│   └── AccountPage.tsx
│
├── hooks/              # Hooks personnalisés
│   ├── useAuth.ts
│   └── useProfile.ts
│
├── lib/                # Couche de services et configuration
│   ├── supabase.ts
│   ├── gemini.ts
│   ├── database.types.ts
│   └── mockData.ts
│
├── types/              # Définitions TypeScript
│   └── index.ts
│
├── styles/             # Styles globaux
│   └── index.css
│
├── App.tsx             # Routing et logique racine
└── main.tsx            # Point d'entrée
```

---

## Flux de Données

### 1. Authentification

```
User Input (Email)
    │
    ▼
Check if user exists (Supabase)
    │
    ├─► New User: Send Magic Link
    │       │
    │       ▼
    │   User clicks link
    │       │
    │       ▼
    │   Supabase creates auth.users entry
    │       │
    │       ▼
    │   Trigger creates profiles entry
    │
    └─► Existing User: Show password form
            │
            ▼
        Sign in with password
            │
            ▼
        Session created (JWT)
            │
            ▼
        Redirect to /onboarding or /feed
```

### 2. Onboarding

```
User enters onboarding
    │
    ▼
Phase 1: Collect basic criteria
    │
    ▼
Send criteria to Gemini API
    │
    ▼
Phase 2: Show AI-generated questions
    │
    ▼
Collect refined preferences
    │
    ▼
Save to searches table
    │
    ▼
Update profile.onboarded = true
    │
    ▼
Redirect to /feed
```

### 3. Enrichissement d'Annonce

```
User clicks on listing
    │
    ▼
Open ListingDetailModal
    │
    ▼
Send listing data to Gemini API
    │
    ▼
Gemini generates:
    ├─► AI Summary
    ├─► Financial Analysis
    ├─► Market Comparison
    └─► Amenities Analysis
    │
    ▼
Display enriched data in modal
```

---

## Patterns et Principes

### 1. Custom Hooks

L'application utilise des hooks personnalisés pour encapsuler la logique métier :

```typescript
// useAuth.ts - Gestion de l'authentification
const { user, session, loading } = useAuth();

// useProfile.ts - Gestion du profil utilisateur
const { profile, loading, error, updateProfile } = useProfile(userId);
```

**Avantages** :
- Réutilisabilité du code
- Séparation des préoccupations
- Tests plus faciles

### 2. Protected Routes

Les routes sont protégées par des composants wrapper :

```typescript
<ProtectedRoute>
  <MainLayout />
</ProtectedRoute>
```

**Fonctionnement** :
1. Vérification de la session Supabase
2. Si non authentifié → redirection vers `/auth`
3. Si authentifié mais non onboardé → redirection vers `/onboarding`
4. Sinon → affichage du contenu

### 3. Optimistic UI Updates

Les mises à jour de profil sont optimistes :

```typescript
const updateProfile = async (updates) => {
  setProfile(prev => ({ ...prev, ...updates })); // Mise à jour immédiate
  try {
    await supabase.from('profiles').update(updates); // Sauvegarde backend
  } catch (err) {
    setProfile(prev); // Rollback en cas d'erreur
  }
};
```

### 4. Fallback Handling

Toutes les fonctions IA ont des fallbacks :

```typescript
try {
  const aiData = await generateEnrichmentData(listing);
  return aiData;
} catch (error) {
  console.error(error);
  return mockEnrichmentData; // Données par défaut
}
```

---

## Sécurité

### Row Level Security (RLS)

Toutes les tables Supabase utilisent RLS :

```sql
-- Exemple : politique pour profiles
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Principe** : Un utilisateur ne peut accéder qu'à ses propres données.

### Variables d'Environnement

Les clés API ne sont jamais exposées dans le code :

```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

Les variables commençant par `VITE_` sont les seules incluses dans le build.

### HTTPS Only

En production, toutes les requêtes doivent passer par HTTPS.

---

## Performance

### 1. Code Splitting

React Router charge les composants à la demande :

```typescript
const FeedPage = lazy(() => import('./pages/FeedPage'));
```

### 2. Memoization

Les composants coûteux sont mémorisés :

```typescript
const MemoizedListingCard = memo(ListingCard);
```

### 3. Images Optimisées

Les images utilisent le lazy loading natif :

```tsx
<img loading="lazy" src={listing.images[0]} alt={listing.title} />
```

### 4. Indexation Base de Données

Les colonnes fréquemment requêtées sont indexées :

```sql
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX searches_user_id_idx ON searches(user_id);
```

---

## État Global

L'application évite Redux/Context en utilisant :

1. **Supabase Auth State** : Session utilisateur
2. **URL State** : Paramètres de route
3. **Local State** : React useState/useReducer

Cette approche réduit la complexité et améliore les performances.

---

## Gestion des Erreurs

### Niveaux d'Erreur

1. **Erreur API** : Catch et fallback automatique
2. **Erreur Auth** : Message d'erreur à l'utilisateur
3. **Erreur Réseau** : Retry automatique (pour Supabase)

### Exemple

```typescript
try {
  const data = await supabase.from('profiles').select();
  return data;
} catch (error) {
  if (error.code === 'PGRST116') {
    // Pas de résultat → OK
    return null;
  }
  console.error('Unexpected error:', error);
  throw error; // Remonter l'erreur
}
```

---

## Tests (À Implémenter)

### Architecture de Test Recommandée

```
tests/
├── unit/               # Tests unitaires
│   ├── hooks/
│   ├── lib/
│   └── components/
├── integration/        # Tests d'intégration
│   ├── auth.test.ts
│   └── onboarding.test.ts
└── e2e/               # Tests end-to-end
    └── user-flow.test.ts
```

### Stack de Test Suggérée

- **Unit** : Vitest + React Testing Library
- **E2E** : Playwright ou Cypress

---

## Évolutivité

### Ajout d'une Nouvelle Page

1. Créer le composant dans `src/pages/`
2. Ajouter la route dans `App.tsx`
3. Ajouter le lien de navigation si nécessaire

### Ajout d'une Fonctionnalité IA

1. Créer la fonction dans `src/lib/gemini.ts`
2. Définir les types dans `src/types/index.ts`
3. Utiliser la fonction dans le composant concerné

### Ajout d'une Table Supabase

1. Créer la migration SQL
2. Ajouter les types dans `src/lib/database.types.ts`
3. Créer les hooks nécessaires

---

## Best Practices

### Code Style

- **Nommage** : camelCase pour les variables, PascalCase pour les composants
- **Types** : Toujours typer les props et les fonctions
- **Commentaires** : Expliquer le "pourquoi", pas le "quoi"

### Git Workflow

```bash
# Feature branch
git checkout -b feature/nouvelle-fonctionnalite

# Commits atomiques
git commit -m "Add: nouvelle fonctionnalité"

# Pull request avec review
gh pr create --title "Feature: Nouvelle fonctionnalité"
```

### Code Review Checklist

- [ ] Types TypeScript corrects
- [ ] Gestion d'erreurs appropriée
- [ ] Tests ajoutés (si applicable)
- [ ] Documentation mise à jour
- [ ] Pas de console.log inutiles
- [ ] Performance vérifiée

---

## Roadmap Technique

### Court Terme

- [ ] Ajouter des tests unitaires
- [ ] Implémenter le système de favoris
- [ ] Améliorer la gestion des erreurs réseau

### Moyen Terme

- [ ] Ajouter un système de cache
- [ ] Implémenter les notifications push
- [ ] Optimiser les requêtes Supabase

### Long Terme

- [ ] Migration vers React Server Components
- [ ] Implémenter un CDN pour les images
- [ ] Ajouter l'internationalisation (i18n)

---

## Ressources

- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

Dernière mise à jour : 2025-11-05
