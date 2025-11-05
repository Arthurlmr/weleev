# Guide de Déploiement - Weleev

Ce guide vous explique comment déployer votre application de manière sécurisée sur Netlify ou Vercel, et comment gérer vos clés API.

---

## 📋 Table des Matières

1. [Sécuriser les Clés API](#1-sécuriser-les-clés-api)
2. [Déploiement sur Netlify (Recommandé)](#2-déploiement-sur-netlify)
3. [Alternative : Déploiement sur Vercel](#3-alternative-déploiement-sur-vercel)
4. [Configuration Post-Déploiement](#4-configuration-post-déploiement)
5. [GitHub Actions (Optionnel)](#5-github-actions-optionnel)

---

## 1. Sécuriser les Clés API

### ⚠️ IMPORTANT : Ne JAMAIS commiter les clés API

Les clés API ne doivent **JAMAIS** être dans le code source. Voici comment les gérer :

### Vérification de Sécurité

```bash
# Vérifiez que .env est dans .gitignore
cat .gitignore | grep .env

# Vérifiez qu'aucun fichier .env n'est tracké
git ls-files | grep .env

# Si .env apparaît, supprimez-le du tracking :
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

### Variables d'Environnement GitHub (pour les Actions)

Si vous voulez utiliser GitHub Actions pour le déploiement automatique :

1. **Allez dans votre dépôt GitHub**
   - `https://github.com/Arthurlmr/weleev`

2. **Settings → Secrets and variables → Actions**

3. **Cliquez sur "New repository secret"**

4. **Ajoutez vos secrets un par un :**

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Votre clé anon Supabase |
   | `VITE_GEMINI_API_KEY` | Votre clé API Gemini |

⚠️ **Note** : Ces secrets sont uniquement pour GitHub Actions. Pour déployer sur Netlify/Vercel, suivez les sections suivantes.

---

## 2. Déploiement sur Netlify

Netlify est **recommandé** pour les applications React car il gère automatiquement le routing côté client.

### Étape 1 : Créer un Compte Netlify

1. Allez sur [netlify.com](https://www.netlify.com)
2. Cliquez sur "Sign up"
3. **Choisissez "Sign up with GitHub"** (recommandé pour la simplicité)

### Étape 2 : Créer un Nouveau Site

#### Option A : Déploiement via GitHub (Recommandé)

1. **Dans Netlify, cliquez sur "Add new site" → "Import an existing project"**

2. **Choisissez "Deploy with GitHub"**

3. **Autorisez Netlify à accéder à vos dépôts**
   - Vous pouvez limiter l'accès uniquement au dépôt `weleev`

4. **Sélectionnez votre dépôt** : `Arthurlmr/weleev`

5. **Sélectionnez la branche** : `claude/weleev-real-estate-app-011CUpWv1vJhCfxFvxRYomhU`
   - Ou créez une branche `main`/`production` depuis cette branche

6. **Configurez les paramètres de build** :
   ```
   Branch to deploy: claude/weleev-real-estate-app-011CUpWv1vJhCfxFvxRYomhU
   Build command: npm run build
   Publish directory: dist
   ```

7. **⚠️ NE CLIQUEZ PAS ENCORE SUR "Deploy" !**

### Étape 3 : Ajouter les Variables d'Environnement

**AVANT de déployer, ajoutez vos variables d'environnement :**

1. **Cliquez sur "Show advanced" puis "New variable"**

2. **Ajoutez ces 3 variables :**

   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Votre clé anon Supabase |
   | `VITE_GEMINI_API_KEY` | Votre clé API Gemini |

3. **Maintenant cliquez sur "Deploy site"**

### Étape 4 : Attendre le Déploiement

- Le build prend environ 2-3 minutes
- Vous verrez les logs en temps réel
- Une fois terminé, vous aurez une URL du type : `https://random-name-123456.netlify.app`

### Étape 5 : Configurer un Domaine Personnalisé (Optionnel)

1. **Dans Netlify, allez dans "Domain management"**

2. **Option A - Sous-domaine Netlify gratuit** :
   - Cliquez sur "Options" → "Edit site name"
   - Changez `random-name-123456` en `weleev`
   - Votre URL devient : `https://weleev.netlify.app`

3. **Option B - Votre propre domaine** :
   - Cliquez sur "Add custom domain"
   - Suivez les instructions pour configurer vos DNS
   - SSL gratuit via Let's Encrypt

### Étape 6 : Configurer les Redirections pour React Router

Netlify a besoin d'un fichier spécial pour gérer le routing React :

```bash
# Créez un fichier public/_redirects
mkdir -p public
echo "/*    /index.html   200" > public/_redirects
```

**Commitez et poussez ce changement :**

```bash
git add public/_redirects
git commit -m "Add Netlify redirects for SPA routing"
git push
```

Netlify redéploiera automatiquement !

#### Option B : Déploiement Manuel via CLI

Si vous préférez déployer via la ligne de commande :

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Build local
npm run build

# Déployer
netlify deploy --prod

# Suivez les prompts pour :
# 1. Créer un nouveau site ou choisir un existant
# 2. Spécifier le dossier : dist
```

**Ajouter les variables d'environnement via CLI :**

```bash
netlify env:set VITE_SUPABASE_URL "https://xxxxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "votre_cle_anon"
netlify env:set VITE_GEMINI_API_KEY "votre_cle_gemini"
```

---

## 3. Alternative : Déploiement sur Vercel

Vercel est aussi excellent pour les applications React et offre une expérience similaire.

### Étape 1 : Créer un Compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Sign up"
3. **Choisissez "Continue with GitHub"**

### Étape 2 : Importer votre Projet

1. **Cliquez sur "Add New..." → "Project"**

2. **Sélectionnez votre dépôt** : `Arthurlmr/weleev`

3. **Configurez le projet** :
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **⚠️ NE CLIQUEZ PAS ENCORE SUR "Deploy" !**

### Étape 3 : Ajouter les Variables d'Environnement

1. **Cliquez sur "Environment Variables"**

2. **Ajoutez les 3 variables** :

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Votre clé anon Supabase |
   | `VITE_GEMINI_API_KEY` | Votre clé API Gemini |

3. **Pour chaque variable, cochez "Production", "Preview", et "Development"**

4. **Cliquez sur "Deploy"**

### Étape 4 : Attendre le Déploiement

- Build en 1-2 minutes
- URL générée : `https://weleev-xxx.vercel.app`
- Vous pouvez la personnaliser dans les settings

### Option CLI Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel

# Pour production
vercel --prod

# Ajouter des variables d'environnement
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GEMINI_API_KEY
```

---

## 4. Configuration Post-Déploiement

Une fois votre site déployé, vous **DEVEZ** configurer Supabase :

### Mettre à Jour les URLs de Redirection dans Supabase

1. **Allez dans votre projet Supabase**

2. **Authentication → URL Configuration**

3. **Ajoutez vos URLs de production** :

   ```
   Site URL:
   https://weleev.netlify.app
   (ou votre URL Vercel/domaine personnalisé)

   Redirect URLs (une par ligne):
   https://weleev.netlify.app/onboarding
   https://weleev.netlify.app/auth
   http://localhost:5173/onboarding  (gardez pour dev)
   http://localhost:5173/auth         (gardez pour dev)
   ```

4. **Sauvegardez**

### Tester l'Application

1. **Ouvrez votre URL de production**

2. **Testez le flow complet** :
   - ✅ Inscription avec Magic Link
   - ✅ Réception de l'email
   - ✅ Clic sur le lien (doit rediriger vers votre site)
   - ✅ Onboarding
   - ✅ Feed d'annonces
   - ✅ Détails enrichis par IA
   - ✅ Compte utilisateur

### Vérifier les Logs

**Netlify** :
- Allez dans "Deploys" → Cliquez sur le dernier deploy → "Deploy log"

**Vercel** :
- Allez dans votre projet → "Deployments" → Cliquez sur le dernier → "Logs"

---

## 5. GitHub Actions (Optionnel)

Si vous voulez automatiser les tests avant déploiement :

### Créer un Workflow GitHub Actions

```bash
mkdir -p .github/workflows
```

Créez `.github/workflows/ci.yml` :

```yaml
name: CI

on:
  push:
    branches: [ main, claude/* ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}

    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/
```

**Commitez ce fichier :**

```bash
git add .github/workflows/ci.yml
git commit -m "Add GitHub Actions CI workflow"
git push
```

Maintenant, à chaque push, GitHub Actions :
1. Installera les dépendances
2. Tentera de build l'application
3. Vous avertira si le build échoue

---

## 📊 Comparaison Netlify vs Vercel

| Critère | Netlify | Vercel |
|---------|---------|--------|
| **Prix Free Tier** | 100 GB bande passante | 100 GB bande passante |
| **Builds/mois** | 300 min | 6000 min |
| **Facilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Domaine personnalisé** | ✅ Gratuit | ✅ Gratuit |
| **SSL** | ✅ Automatique | ✅ Automatique |
| **Edge Functions** | ✅ Oui | ✅ Oui |
| **Analytics** | Payant | Payant |
| **Recommandation** | **Idéal pour SPA** | **Idéal pour Next.js** |

**Pour Weleev (React SPA) → Netlify est recommandé**

---

## 🚀 Résumé : Déploiement en 5 Minutes

```bash
# 1. Vérifier que .env n'est pas tracké
git status

# 2. Créer le fichier de redirects Netlify
echo "/*    /index.html   200" > public/_redirects
git add public/_redirects
git commit -m "Add Netlify redirects"
git push

# 3. Aller sur netlify.com
# 4. Import project from GitHub
# 5. Ajouter les 3 variables d'environnement
# 6. Deploy !

# 7. Mettre à jour Supabase avec l'URL de production
```

---

## 🔒 Checklist de Sécurité

Avant de déployer, vérifiez :

- [ ] Le fichier `.env` est dans `.gitignore`
- [ ] Aucun fichier `.env` n'est tracké par git
- [ ] Les variables d'environnement sont configurées sur Netlify/Vercel
- [ ] Les URLs de redirection sont configurées dans Supabase
- [ ] Les clés API Supabase sont bien les clés **anon** (pas les clés service)
- [ ] L'URL de production est en HTTPS
- [ ] Le build local fonctionne : `npm run build`

---

## ❓ Résolution de Problèmes

### Le Magic Link ne redirige pas vers mon site

**Solution** : Vérifiez les URLs de redirection dans Supabase Authentication → URL Configuration

### Erreur 404 sur les routes

**Solution Netlify** : Ajoutez `public/_redirects` avec `/*    /index.html   200`

**Solution Vercel** : Créez `vercel.json` :
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### Les variables d'environnement ne sont pas prises en compte

**Solution** :
1. Vérifiez qu'elles commencent par `VITE_`
2. Redéployez complètement (pas juste rebuild)
3. Vérifiez dans les logs de build qu'elles sont bien définies

### Erreur : "Missing Supabase environment variables"

**Solution** : Vous avez oublié d'ajouter les variables sur Netlify/Vercel. Allez dans les settings du projet et ajoutez-les.

---

## 📞 Support

- **Documentation Netlify** : [docs.netlify.com](https://docs.netlify.com)
- **Documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Documentation Supabase** : [supabase.com/docs](https://supabase.com/docs)

---

Bon déploiement ! 🎉
