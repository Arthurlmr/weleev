# 🚀 Déploiement Rapide - 10 Minutes

Guide ultra-simplifié pour déployer Weleev en production.

---

## ✅ Prérequis (5 min)

### 1. Obtenir vos Clés API

#### Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un projet (ou utilisez un existant)
3. Allez dans **Settings** → **API**
4. Copiez :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon/public key** : `eyJhbG...` (longue clé)

#### Google Gemini
1. Allez sur [ai.google.dev](https://ai.google.dev/aistudio)
2. Cliquez sur **Get API key**
3. Créez une clé API
4. Copiez la clé : `AIzaSy...`

---

## 🚀 Déploiement sur Netlify (5 min)

### Étapes Visuelles

```
1. netlify.com → Sign up with GitHub
2. Add new site → Import from GitHub
3. Sélectionner : Arthurlmr/weleev
4. Branch : claude/weleev-real-estate-app-011CUpWv1vJhCfxFvxRYomhU
5. ⚠️ AVANT de deployer : Cliquer "Show advanced"
6. Ajouter les 3 variables :

   VITE_SUPABASE_URL          = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY     = eyJhbG...xxxxx
   VITE_GEMINI_API_KEY        = AIzaSy...xxxxx

7. Deploy site ! ✨
```

### Votre Site Sera Disponible

`https://random-name-123456.netlify.app`

**Personnaliser l'URL** :
- Domain settings → Edit site name → `weleev`
- Nouvelle URL : `https://weleev.netlify.app`

---

## 🔐 Configurer Supabase (2 min)

Une fois votre site déployé :

1. Retournez sur [supabase.com](https://supabase.com)
2. **Authentication** → **URL Configuration**
3. Ajoutez :

```
Site URL:
https://weleev.netlify.app

Redirect URLs:
https://weleev.netlify.app/onboarding
https://weleev.netlify.app/auth
```

4. **Sauvegardez**

---

## 🗄️ Créer la Base de Données (3 min)

1. Dans Supabase, allez dans **SQL Editor**
2. Cliquez sur **New query**
3. Copiez TOUT le contenu de `supabase/schema.sql`
4. Collez et cliquez **Run**
5. ✅ Message "Success" = C'est bon !

---

## ✨ Tester Votre Application

1. Ouvrez `https://weleev.netlify.app`
2. Testez l'inscription avec votre email
3. Vérifiez votre boîte mail
4. Cliquez sur le Magic Link
5. Complétez l'onboarding
6. Explorez les annonces ! 🏠

---

## 📱 Commandes Rapides

### Redéployer après des modifications

```bash
# Faire vos modifications dans le code
git add .
git commit -m "Update: description"
git push

# Netlify redéploie automatiquement ! 🎉
```

### Build local pour tester

```bash
npm run build
npm run preview
```

### Voir les logs de déploiement

Netlify Dashboard → Deploys → Cliquez sur le dernier → Deploy log

---

## ❌ Problèmes Courants

### "Missing environment variables"
→ Vous avez oublié d'ajouter les variables sur Netlify
→ Site settings → Environment variables → Ajoutez-les

### Le Magic Link redirige vers localhost
→ Vous avez oublié de mettre à jour les URLs dans Supabase
→ Authentication → URL Configuration

### Erreur 404 sur les pages
→ Le fichier `public/_redirects` est déjà dans le projet ✅

### L'IA ne répond pas
→ Vérifiez que `VITE_GEMINI_API_KEY` est bien configurée
→ Vérifiez vos quotas sur [ai.google.dev](https://ai.google.dev)

---

## 🎯 Checklist Complète

- [ ] Compte Netlify créé et connecté à GitHub
- [ ] Projet importé depuis GitHub
- [ ] 3 variables d'environnement ajoutées
- [ ] Site déployé avec succès
- [ ] Script SQL exécuté dans Supabase
- [ ] URLs de redirection configurées dans Supabase
- [ ] Test d'inscription réussi
- [ ] Magic Link fonctionne
- [ ] Onboarding fonctionne
- [ ] Annonces affichées
- [ ] Enrichissement IA fonctionne

---

## 🆘 Besoin d'Aide ?

Consultez le guide détaillé : [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

**C'est tout ! Votre application est en production ! 🎉**
