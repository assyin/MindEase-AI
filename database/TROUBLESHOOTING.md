# Résolution de Problèmes - MindEase AI Database

## 🚨 Problèmes Courants et Solutions

### 1. **"syntax error at or near RAISE"**
```
ERROR: 42601: syntax error at or near "RAISE"
```

**Solution :**
- Utilisez `install-clean-simple.sql` au lieu de `install-clean.sql`
- Le script simplifié évite les commandes incompatibles avec l'interface web Supabase
- ✅ `install-clean-simple.sql` est optimisé pour l'interface web

---

### 2. **"relation already exists"**
```
ERROR: 42P07: relation "user_profiles" already exists
```

**Solution :**
- Le script `schema.sql` est maintenant mis à jour avec `DROP TABLE IF EXISTS`
- Exécutez simplement le nouveau `schema.sql` - il supprime et recrée automatiquement

---

### 2. **"column does not exist"**
```
ERROR: 42703: column therapy_programs.program_status does not exist
```

**Cause :** Décalage entre le code et le schéma de base de données

**Solutions appliquées :**
- ✅ `program_status` → `status` dans `TherapyProgramManager.ts`
- ✅ `subscription_type` et `total_sessions` supprimés de `UserProfile`
- ✅ Interfaces TypeScript alignées avec le schéma SQL

---

### 3. **"invalid input syntax for type uuid"**
```
ERROR: 22P02: invalid input syntax for type uuid: "demo-program-1"
```

**Solution appliquée :**
- ✅ IDs de démonstration remplacés par des UUIDs valides
- ✅ `demo-program-1` → `550e8400-e29b-41d4-a716-446655440000`

---

### 4. **"Missing Supabase configuration"**
```
Error: Missing Supabase configuration
```

**Solution :**
1. Vérifiez que votre fichier `.env` contient :
```env
VITE_SUPABASE_URL=https://miqeoteohumyxfsngjvt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Redémarrez le serveur de développement après modification du `.env`

---

### 5. **Page blanche après connexion**

**Diagnostic :**
1. Ouvrez la console du navigateur (F12)
2. Regardez les erreurs dans l'onglet Console
3. Vérifiez l'onglet Network pour les erreurs API

**Solutions :**
- Si erreurs 400/406 → Problème de schéma (voir points 2 et 3)
- Si "Mode démonstration" affiché → Base de données pas encore configurée
- Si "BDD connectée" mais erreurs → Vérifiez les politiques RLS

---

### 6. **Erreurs d'authentification (400/406)**

**Symptômes :**
```
POST /rest/v1/user_profiles 400 (Bad Request)
GET /rest/v1/user_profiles 406 (Not Acceptable)
```

**Solutions (toutes appliquées) :**
- ✅ Schéma `user_profiles` corrigé
- ✅ Interface `UserProfile` alignée
- ✅ Politiques RLS configurées
- ✅ Types TypeScript cohérents

---

### 7. **Erreurs RLS (Row Level Security)**
```
permission denied for relation user_profiles
```

**Solution :**
1. Exécutez `database/rls-policies.sql` dans Supabase
2. Vérifiez que l'utilisateur est authentifié
3. Testez avec `database/test-auth.sql`

---

## 🔧 Scripts de Diagnostic

### Test Complet
```sql
-- Exécutez dans Supabase SQL Editor
\i database/test-integration.sql
```

### Test d'Authentification
```sql
-- Test spécifique auth
\i database/test-auth.sql
```

### Vérification des Tables
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

### Vérification des Politiques RLS
```sql
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

---

## 📋 Liste de Vérification d'Installation

### ✅ Base de Données
- [ ] Scripts SQL exécutés dans l'ordre
- [ ] 23+ tables créées
- [ ] Politiques RLS activées  
- [ ] Test d'intégration réussi

### ✅ Application
- [ ] Fichier `.env` configuré
- [ ] Serveur redémarré après config
- [ ] Page d'accueil visible
- [ ] Connexion/inscription fonctionnel

### ✅ Indicateurs de Succès
- [ ] "BDD connectée" dans le dashboard
- [ ] Pas d'erreurs 400/406 dans la console
- [ ] Profil utilisateur créé automatiquement
- [ ] Dashboard Thérapie affiche des données

---

## 🆘 Si Rien ne Marche

### Option 1: Réinstallation Propre
```sql
-- Dans Supabase SQL Editor
\i database/schema.sql      -- Supprime et recrée tout
\i database/rls-policies.sql
\i database/seed-data.sql
```

### Option 2: Installation Automatique
```sql
-- Script tout-en-un
\i database/install-clean.sql
```

### Option 3: Vérification Manuelle
1. Vérifiez les erreurs dans la console navigateur
2. Exécutez `database/test-integration.sql`
3. Comparez les messages avec ce guide
4. Corrigez étape par étape

---

## 📞 Informations de Debug

### Variables d'Environnement Importantes
```javascript
// Dans la console du navigateur
console.log({
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  HAS_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  GEMINI_KEY: !!import.meta.env.VITE_GEMINI_API_KEY
});
```

### État de l'Application  
```javascript
// Fonctions de debug disponibles (mode dev)
window.testNotifications.getDebugInfo();
window.googleGenAI.getDebugInfo();
```

---

## ✅ État Actuel (Résolu)

Tous les problèmes majeurs identifiés ont été corrigés :

1. ✅ **Schéma SQL** - Suppression/recréation propre
2. ✅ **Types TypeScript** - Interfaces alignées  
3. ✅ **IDs UUID** - Remplacés les IDs demo invalides
4. ✅ **Colonnes manquantes** - `program_status` → `status`
5. ✅ **Authentification** - Profils utilisateur compatibles
6. ✅ **Mode démo/prod** - Basculement automatique
7. ✅ **Tests intégration** - Scripts de validation

**L'application devrait maintenant fonctionner correctement après exécution des scripts SQL.**