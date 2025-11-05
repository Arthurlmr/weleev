# Weleev - Real Estate Finder

Une application SaaS moderne pour trouver votre bien immobilier idéal en France, propulsée par l'API Melo.io.

## 🚀 Fonctionnalités

- **Authentification Magic Link** : Connexion sécurisée sans mot de passe via Supabase Auth
- **Onboarding Moderne** : Interface fluide avec animations pour collecter vos préférences
- **Annonces Réelles** : Intégration avec l'API Melo.io pour des milliers d'annonces immobilières
- **Recherche Avancée** : Filtres par ville, type de bien, budget, nombre de pièces
- **Feed d'Annonces** : Navigation fluide dans les biens avec images et détails
- **Interface Moderne** : Design épuré avec Tailwind CSS, shadcn/ui et Framer Motion

## 🛠 Stack Technique

- **Frontend** : React 18 + TypeScript + Vite
- **Styling** : Tailwind CSS v3 + shadcn/ui components
- **Backend** : Supabase (PostgreSQL + Auth + Edge Functions)
- **API Immobilière** : Melo.io (annonces réelles)
- **Routing** : React Router v6
- **Animations** : Framer Motion
- **Icons** : Lucide React

## 📋 Prérequis

- Node.js 18+ et npm
- Un compte Supabase
- Un compte Melo.io avec clé API
- Un compte Netlify (pour le déploiement)

## 🔧 Installation

1. **Cloner le dépôt**
```bash
git clone <votre-repo>
cd weleev
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**

Créez un fichier `.env` à la racine du projet :
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

⚠️ **Note** : La clé API Melo est configurée côté serveur dans Supabase Edge Functions (pas dans le frontend).

4. **Configuration complète**

Voir le guide de déploiement complet : **[DEPLOYMENT.md](./DEPLOYMENT.md)**

Ce guide couvre :
- Configuration Supabase (tables, Edge Functions, authentication)
- Déploiement Netlify
- Configuration Melo.io
- Tests et vérification

## 🚀 Démarrage

```bash
# Mode développement
npm run dev

# Build production
npm run build

# Preview du build
npm run preview
```

L'application sera disponible sur `http://localhost:5173`

## 📁 Structure du Projet

```
weleev/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── ListingCard.tsx
│   │   ├── ListingDetailModal.tsx
│   │   └── MainLayout.tsx
│   ├── hooks/               # Hooks personnalisés
│   │   ├── useAuth.ts
│   │   └── useProfile.ts
│   ├── lib/                 # Configurations et utilitaires
│   │   ├── supabase.ts
│   │   ├── gemini.ts
│   │   ├── database.types.ts
│   │   └── mockData.ts
│   ├── pages/               # Pages de l'application
│   │   ├── AuthPage.tsx
│   │   ├── OnboardingPage.tsx
│   │   ├── FeedPage.tsx
│   │   ├── FavoritesPage.tsx
│   │   └── AccountPage.tsx
│   ├── styles/              # Styles globaux
│   │   └── index.css
│   ├── types/               # Définitions TypeScript
│   │   └── index.ts
│   ├── App.tsx              # Composant racine avec routing
│   └── main.tsx             # Point d'entrée
├── supabase/
│   └── schema.sql           # Schéma de base de données
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 Fonctionnalités Détaillées

### Authentification Magic Link

Le système d'authentification utilise Supabase Auth :
- L'utilisateur entre son email
- Un Magic Link sécurisé est envoyé par email
- Clic sur le lien → authentification automatique
- Redirection vers l'onboarding

### Onboarding Moderne

Interface avec animations qui collecte les critères :
- **Localisation** : Autocomplete avec recherche de villes via Melo.io
- **Type de transaction** : Achat ou location
- **Type de bien** : Appartement, maison, ou tous
- **Budget** : Slider interactif avec affichage dynamique
- **Nombre de pièces** : Sélection rapide par boutons

Les préférences sont enregistrées dans :
- Table `searches` (Supabase) : Critères utilisateur
- Table `melo_searches` : Référence de la recherche Melo.io
- Table `melo_properties` : Annonces importées

### Intégration Melo.io

L'application utilise 3 Edge Functions Supabase pour communiquer avec Melo.io :

1. **search-location** : Autocomplete des villes
2. **create-melo-search** : Création d'une recherche sauvegardée
3. **get-properties** : Récupération des annonces immobilières

Voir la documentation complète : **[MELO_API.md](./MELO_API.md)**

## 🔒 Sécurité

- **Row Level Security (RLS)** : Toutes les tables sont protégées
- **Politiques granulaires** : Les utilisateurs n'accèdent qu'à leurs données
- **Variables d'environnement** : Clés sensibles non commitées
- **Validation côté serveur** : Supabase valide les requêtes

## 🎯 Prochaines Étapes

- [ ] Implémenter la fonctionnalité de favoris
- [ ] Ajouter des filtres de recherche avancés
- [ ] Intégrer une vraie API d'annonces immobilières
- [ ] Implémenter la géolocalisation
- [ ] Ajouter des notifications push
- [ ] Système de messagerie avec agents
- [ ] Tableau de bord avec statistiques

## 🐛 Debugging

### Problème : L'authentification ne fonctionne pas
- Vérifiez que les variables d'environnement sont correctes
- Vérifiez que le trigger `handle_new_user` est créé
- Regardez les logs dans Supabase Dashboard

### Problème : L'API Gemini retourne des erreurs
- Vérifiez que la clé API est valide
- Vérifiez les quotas dans Google AI Studio
- Les fallbacks sont activés en cas d'erreur

### Problème : Les images ne s'affichent pas
- Les images actuelles viennent d'Unsplash (mock data)
- En production, configurez le bucket storage Supabase

## 📝 License

MIT

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📧 Contact

Pour toute question : [votre-email]

---

Fait avec ❤️ pour trouver votre maison idéale
