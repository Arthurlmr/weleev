# Weleev - Real Estate Finder

Une application SaaS moderne pour trouver votre bien immobilier idéal en France, enrichie par l'intelligence artificielle.

## 🚀 Fonctionnalités

- **Authentification Hybride** : Connexion par Magic Link ou mot de passe via Supabase Auth
- **Onboarding Conversationnel** : Interface de chat intelligente pour collecter vos préférences
- **Recherche Enrichie par IA** : Analyses et recommandations personnalisées via Google Gemini
- **Feed d'Annonces** : Navigation fluide dans les biens immobiliers
- **Enrichissement IA** : Analyses financières, comparaison marché, et évaluation des commodités
- **Interface Moderne** : Design épuré avec animations et thème responsive

## 🛠 Stack Technique

- **Frontend** : React 18 + TypeScript
- **Build Tool** : Vite
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **IA** : Google Gemini API
- **Routing** : React Router v6
- **Animations** : Framer Motion
- **Icons** : Lucide React
- **Styling** : CSS Custom Properties avec architecture moderne

## 📋 Prérequis

- Node.js 18+ et npm
- Un compte Supabase
- Une clé API Google Gemini

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
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. **Configuration de Supabase**

Exécutez le script SQL dans votre projet Supabase :
- Allez dans le SQL Editor de votre projet Supabase
- Copiez le contenu de `supabase/schema.sql`
- Exécutez le script

Cela créera :
- Les tables `profiles` et `searches`
- Les politiques RLS (Row Level Security)
- Les triggers pour la création automatique de profils
- Le bucket storage pour les avatars

5. **Configuration de l'authentification Supabase**

Dans votre dashboard Supabase :
- Allez dans Authentication > Settings
- Activez "Enable email confirmations" si vous voulez que les utilisateurs confirment leur email
- Dans "Email Templates", personnalisez le template du Magic Link si nécessaire
- Dans "Auth Providers", assurez-vous que "Email" est activé

6. **Obtenir une clé API Gemini**

- Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
- Créez une nouvelle clé API
- Ajoutez-la dans votre fichier `.env`

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

### Authentification Hybride

Le système d'authentification combine deux méthodes :
1. **Magic Link** : Pour les nouveaux utilisateurs, envoi d'un lien sécurisé par email
2. **Mot de passe** : Pour les utilisateurs existants, connexion traditionnelle

Le flux :
- L'utilisateur entre son email
- L'app vérifie si l'email existe dans la base
- Nouveau → Magic Link | Existant → Formulaire de mot de passe

### Onboarding Conversationnel

Interface de type chat qui collecte :
- **Phase 1 - Critères de base** :
  - Localisation
  - Type de bien (appartement/maison)
  - Budget maximum
  - Nombre de pièces
  - Besoin de parking

- **Phase 2 - Affinage IA** :
  - Questions personnalisées générées par Gemini
  - Basées sur les réponses précédentes
  - Stockage dans `refinements` JSONB

### Enrichissement par IA

Pour chaque annonce, Gemini génère :
- **Résumé intelligent** : Analyse contextuelle du bien
- **Analyse financière** : Mensualités, apport, charges
- **Comparaison marché** : Prix au m², positionnement
- **Commodités** : Transports, commerces, écoles à proximité

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
