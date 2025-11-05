# 🧹 Guide de Nettoyage Supabase

Ce guide vous explique comment nettoyer complètement votre base de données Supabase pour repartir de zéro.

---

## ⚠️ ATTENTION

Ce script va **SUPPRIMER TOUTES VOS DONNÉES** :
- ❌ Toutes les tables (profiles, searches)
- ❌ Toutes les policies RLS
- ❌ Tous les triggers
- ❌ Toutes les functions
- ❌ Le bucket storage (si vous décommentez la ligne)

**Utilisez uniquement en développement !**

---

## 🚀 Procédure en 3 Étapes

### Étape 1 : Exécuter le Script de Nettoyage

1. **Allez dans Supabase** → **SQL Editor**

2. **Cliquez sur "New query"**

3. **Copiez TOUT le contenu du fichier** `supabase/cleanup.sql`

4. **Collez-le dans l'éditeur**

5. **Cliquez sur "Run"** (ou Ctrl+Enter)

6. **Attendez le message** :
   ```
   ✅ "Nettoyage terminé ! Vous pouvez maintenant exécuter schema.sql"
   ```

**Temps estimé** : 5-10 secondes

---

### Étape 2 : Exécuter le Nouveau Schéma

1. **Dans le même SQL Editor**, créez une **nouvelle query**

2. **Copiez TOUT le contenu du fichier** `supabase/schema.sql`

3. **Collez-le dans l'éditeur**

4. **Cliquez sur "Run"** (ou Ctrl+Enter)

5. **Attendez le message** :
   ```
   ✅ "Success. No rows returned"
   ```

**Temps estimé** : 10-15 secondes

---

### Étape 3 : Vérifier que Tout est OK

1. **Allez dans "Table Editor"** dans le menu de gauche

2. **Vérifiez que vous voyez** :
   - ✅ Table `profiles`
   - ✅ Table `searches`

3. **Cliquez sur la table `profiles`**
   - Vérifiez les colonnes : id, email, full_name, avatar_url, onboarded, created_at, updated_at

4. **Allez dans "Authentication" → "Policies"**
   - Vérifiez que les policies RLS sont créées

5. **Allez dans "Database" → "Functions"**
   - Vérifiez que vous voyez :
     - `handle_new_user`
     - `handle_updated_at`

6. **Allez dans "Database" → "Triggers"**
   - Vérifiez que vous voyez :
     - `on_auth_user_created`
     - `set_updated_at_profiles`
     - `set_updated_at_searches`

---

## 📝 Commandes Rapides

### Version Copy-Paste

```sql
-- 1. Exécutez d'abord ceci (cleanup.sql)
-- Copiez le contenu de supabase/cleanup.sql

-- 2. Puis exécutez ceci (schema.sql)
-- Copiez le contenu de supabase/schema.sql
```

---

## 🔄 Alternative : Script Tout-en-Un

Si vous voulez tout faire en une seule fois, vous pouvez créer un script combiné :

```sql
-- Cleanup + Schema en une seule requête
-- (Copiez d'abord cleanup.sql, puis schema.sql à la suite)
```

Mais je recommande de faire en **2 étapes séparées** pour mieux voir les erreurs éventuelles.

---

## ❓ Que Faire en Cas d'Erreur ?

### Erreur : "relation does not exist"

**Solution** : C'est normal si c'est lors du cleanup. Cela signifie que la table n'existait pas. Continuez.

### Erreur : "policy already exists"

**Solution** : Le cleanup n'a pas tout supprimé. Relancez le script cleanup.sql.

### Erreur : "permission denied"

**Solution** : Vous devez être administrateur du projet Supabase. Vérifiez que vous êtes bien connecté avec le bon compte.

---

## 🗑️ Supprimer Aussi le Bucket Storage ?

Par défaut, le script **NE SUPPRIME PAS** le bucket `avatars` pour éviter de perdre les images uploadées.

Si vous voulez aussi le supprimer :

1. **Dans `cleanup.sql`**, trouvez cette ligne :
   ```sql
   -- DELETE FROM storage.buckets WHERE id = 'avatars';
   ```

2. **Décommentez-la** (retirez les `--`) :
   ```sql
   DELETE FROM storage.buckets WHERE id = 'avatars';
   ```

3. **Exécutez le cleanup.sql**

Le bucket sera recréé par `schema.sql`.

---

## ✅ Checklist de Nettoyage

Après avoir exécuté les 2 scripts :

- [ ] Tables `profiles` et `searches` existent
- [ ] Les colonnes sont correctes dans chaque table
- [ ] Les policies RLS sont présentes
- [ ] Les triggers sont créés
- [ ] Les functions existent
- [ ] Le type `property_type` existe
- [ ] Le bucket `avatars` existe

**Vérification rapide** : Allez dans SQL Editor et exécutez :

```sql
-- Vérifier les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Devrait retourner :
-- profiles
-- searches
```

---

## 🎯 Que Faire Après le Nettoyage ?

1. **Testez l'inscription** sur votre site : https://weleev.netlify.app

2. **Le compte sera recréé automatiquement** grâce au trigger `handle_new_user`

3. **Complétez l'onboarding**

4. **Vérifiez que les données sont bien sauvegardées** :
   - Allez dans Supabase → Table Editor → `profiles`
   - Vous devriez voir votre profil
   - Allez dans `searches`
   - Vous devriez voir vos préférences

---

## 💡 Tips

### Sauvegarder Avant de Nettoyer (Optionnel)

Si vous avez des données importantes :

```sql
-- Exporter les profils
COPY public.profiles TO '/tmp/profiles_backup.csv' CSV HEADER;

-- Exporter les recherches
COPY public.searches TO '/tmp/searches_backup.csv' CSV HEADER;
```

### Voir Toutes les Tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Voir Toutes les Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 🔄 Workflow Complet

```
1. Ouvrir Supabase SQL Editor
   ↓
2. New query → Coller cleanup.sql → Run
   ↓
3. Voir "Nettoyage terminé !" ✅
   ↓
4. New query → Coller schema.sql → Run
   ↓
5. Voir "Success" ✅
   ↓
6. Vérifier dans Table Editor
   ↓
7. Tester sur weleev.netlify.app
   ↓
8. ✅ Tout fonctionne !
```

---

## 📞 Support

Si vous rencontrez un problème :

1. Vérifiez les erreurs dans le SQL Editor
2. Copiez le message d'erreur complet
3. Vérifiez que vous êtes admin du projet
4. Réessayez le cleanup si nécessaire

---

**Prêt ? Allez dans Supabase SQL Editor et lancez cleanup.sql ! 🚀**
