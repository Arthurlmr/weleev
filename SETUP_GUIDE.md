# Guide de Configuration - Weleev

Ce guide vous accompagne pas à pas dans la configuration complète de l'application Weleev.

## Table des Matières

1. [Installation des Prérequis](#installation-des-prérequis)
2. [Configuration de Supabase](#configuration-de-supabase)
3. [Configuration de Google Gemini](#configuration-de-google-gemini)
4. [Configuration de l'Application](#configuration-de-lapplication)
5. [Lancement en Développement](#lancement-en-développement)
6. [Déploiement](#déploiement)

---

## Installation des Prérequis

### 1. Node.js et npm

Assurez-vous d'avoir Node.js version 18 ou supérieure installée :

```bash
node --version  # Doit afficher v18.x.x ou supérieur
npm --version   # Doit afficher 9.x.x ou supérieur
```

Si besoin, téléchargez Node.js depuis [nodejs.org](https://nodejs.org/)

### 2. Git

Vérifiez que Git est installé :

```bash
git --version
```

---

## Configuration de Supabase

### Étape 1 : Créer un Projet Supabase

1. Rendez-vous sur [supabase.com](https://supabase.com)
2. Connectez-vous ou créez un compte
3. Cliquez sur "New Project"
4. Remplissez les informations :
   - **Name** : weleev (ou le nom de votre choix)
   - **Database Password** : Choisissez un mot de passe fort
   - **Region** : Choisissez la région la plus proche (ex: "West EU (Ireland)")
5. Cliquez sur "Create new project"
6. Attendez quelques minutes que le projet soit créé

### Étape 2 : Récupérer les Clés API

1. Dans votre projet, allez dans "Settings" (icône engrenage dans le menu latéral)
2. Cliquez sur "API"
3. Vous verrez deux informations importantes :
   - **Project URL** : Commençant par `https://xxxxx.supabase.co`
   - **anon/public key** : Une longue chaîne de caractères

⚠️ **Important** : Ne partagez jamais ces clés publiquement !

### Étape 3 : Exécuter le Script SQL

1. Dans votre projet Supabase, allez dans "SQL Editor" dans le menu latéral
2. Cliquez sur "New Query"
3. Copiez l'intégralité du contenu du fichier `supabase/schema.sql` de ce projet
4. Collez-le dans l'éditeur SQL
5. Cliquez sur "Run" (ou Ctrl+Enter)
6. Vérifiez qu'il n'y a pas d'erreur (le message "Success. No rows returned" est normal)

Ce script créera automatiquement :
- La table `profiles` pour les profils utilisateurs
- La table `searches` pour les préférences de recherche
- Les politiques de sécurité (RLS)
- Les triggers pour la création automatique de profils
- Le bucket storage pour les avatars

### Étape 4 : Configurer l'Authentification

1. Allez dans "Authentication" > "Settings"
2. Dans la section "Auth Providers", vérifiez que "Email" est activé
3. Dans "Email Templates" :
   - Personnalisez le template "Magic Link" si souhaité
   - Vous pouvez modifier le texte pour qu'il soit en français
4. Dans "URL Configuration" :
   - **Site URL** : `http://localhost:5173` (pour le développement)
   - **Redirect URLs** : Ajoutez `http://localhost:5173/onboarding`

### Étape 5 : Configurer le Storage

Le bucket `avatars` a été créé automatiquement par le script SQL. Vérifiez sa création :

1. Allez dans "Storage" dans le menu latéral
2. Vous devriez voir un bucket nommé "avatars"
3. Les politiques de sécurité sont déjà configurées

---

## Configuration de Google Gemini

### Étape 1 : Obtenir une Clé API

1. Rendez-vous sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Sélectionnez un projet Google Cloud (ou créez-en un nouveau)
5. Copiez la clé API générée

### Étape 2 : Vérifier les Quotas

1. Par défaut, Gemini offre un quota gratuit généreux
2. Consultez les limites sur [ai.google.dev/pricing](https://ai.google.dev/pricing)
3. Pour le développement, le quota gratuit est largement suffisant

---

## Configuration de l'Application

### Étape 1 : Cloner et Installer

```bash
# Cloner le dépôt
git clone <votre-repo>
cd weleev

# Installer les dépendances
npm install
```

### Étape 2 : Créer le Fichier d'Environnement

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Puis éditez le fichier `.env` avec vos clés :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
VITE_GEMINI_API_KEY=votre_cle_api_gemini
```

⚠️ **Important** : Le fichier `.env` ne doit JAMAIS être commité dans Git

### Étape 3 : Vérifier la Configuration

Vérifiez que tout est en ordre :

```bash
npm run build
```

Si le build réussit sans erreur, votre configuration est correcte !

---

## Lancement en Développement

### Démarrer le Serveur de Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Tester l'Authentification

1. Ouvrez `http://localhost:5173` dans votre navigateur
2. Vous devriez voir la page d'authentification
3. Essayez de créer un compte avec votre email
4. Vérifiez votre boîte mail pour le Magic Link
5. Cliquez sur le lien pour vous connecter

### Tester l'Onboarding

1. Après connexion, vous serez redirigé vers `/onboarding`
2. Répondez aux questions de l'interface de chat
3. Les questions d'affinage devraient être générées par Gemini
4. Une fois terminé, vous serez redirigé vers `/feed`

### Tester le Feed

1. Sur la page `/feed`, vous verrez des annonces de test
2. Cliquez sur une annonce pour ouvrir la modale de détails
3. L'enrichissement IA devrait se charger automatiquement

---

## Déploiement

### Prérequis de Production

Avant de déployer en production, assurez-vous de :

1. **Mettre à jour les URL de redirection dans Supabase** :
   - Allez dans Authentication > Settings > URL Configuration
   - Ajoutez votre domaine de production
   - Exemple : `https://weleev.com`, `https://weleev.com/onboarding`

2. **Sécuriser les variables d'environnement** :
   - Ne commitez JAMAIS le fichier `.env`
   - Utilisez les variables d'environnement de votre hébergeur

3. **Configurer un domaine personnalisé dans Supabase** (optionnel) :
   - Allez dans Settings > API
   - Configurez un domaine personnalisé pour l'API

### Déploiement sur Vercel

1. Connectez votre dépôt GitHub à Vercel
2. Ajoutez les variables d'environnement dans Vercel :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
3. Déployez !

### Déploiement sur Netlify

1. Connectez votre dépôt GitHub à Netlify
2. Configurez le build :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
3. Ajoutez les variables d'environnement
4. Déployez !

---

## Résolution de Problèmes

### L'authentification ne fonctionne pas

- Vérifiez que les URL de redirection sont correctes dans Supabase
- Vérifiez que le trigger `handle_new_user` est bien créé
- Consultez les logs dans Supabase Dashboard > Logs

### L'API Gemini ne répond pas

- Vérifiez que votre clé API est valide
- Vérifiez que vous n'avez pas dépassé les quotas
- L'application a des fallbacks en cas d'erreur

### Les images ne s'affichent pas

- Les images actuelles sont des exemples depuis Unsplash
- En production, configurez le bucket storage et téléversez vos images

### Erreurs de build TypeScript

- Essayez `npm install` à nouveau
- Vérifiez que vous utilisez Node 18+
- Consultez les logs d'erreur détaillés

---

## Support

Pour toute question ou problème :

1. Consultez d'abord ce guide
2. Vérifiez la documentation de [Supabase](https://supabase.com/docs)
3. Consultez la documentation de [Google Gemini](https://ai.google.dev/docs)
4. Ouvrez une issue sur le dépôt GitHub

---

Bon développement ! 🚀
