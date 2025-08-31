# MindEase AI - Configuration Base de Données Supabase

Ce dossier contient tous les scripts nécessaires pour configurer la base de données Supabase pour MindEase AI.

## 📋 Fichiers

- **`schema.sql`** - Schéma complet de la base de données (tables, indexes, fonctions, triggers) ✅ **Mis à jour avec DROP automatiques**
- **`rls-policies.sql`** - Politiques de sécurité Row Level Security (RLS) 
- **`seed-data.sql`** - Données de test et configuration système
- **`install-clean.sql`** - Installation complète automatisée (recommandé)
- **`test-integration.sql`** - Test de validation complète ✅ **Nouveau**
- **`test-auth.sql`** - Test spécifique authentification ✅ **Nouveau**  
- **`TROUBLESHOOTING.md`** - Guide de résolution de problèmes ✅ **Nouveau**

## 🚀 Installation

### Option 1: Installation Propre (Recommandée) ⭐

**Si vous avez déjà des tables existantes ou voulez repartir à zéro :**

1. **Connectez-vous à votre projet Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Sélectionnez votre projet `miqeoteohumyxfsngjvt`

2. **Exécutez l'installation complète**
   - Allez dans `SQL Editor`
   - **RECOMMANDÉ**: Copiez le contenu de `install-clean-simple.sql`
   - Exécutez une seule fois (fait tout automatiquement)
   
   OU étape par étape :
   - Copiez le contenu de `schema.sql` (version mise à jour avec DROP)
   - Exécutez le script complet

3. **Si vous utilisez schema.sql séparément :**
   - Exécutez ensuite `rls-policies.sql`
   - Puis `seed-data.sql`

### Option 2: Installation Manuel par Étapes

1. **Connectez-vous à votre projet Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Sélectionnez votre projet `miqeoteohumyxfsngjvt`

2. **Exécutez le schéma principal**
   - Allez dans `SQL Editor`
   - Copiez le contenu de `schema.sql`
   - Exécutez le script (supprime et recrée automatiquement)

3. **Configurez les politiques de sécurité**
   - Copiez le contenu de `rls-policies.sql`
   - Exécutez le script

4. **Ajoutez les données de base**
   - Copiez le contenu de `seed-data.sql`
   - Exécutez le script

### Option 2: Installation via CLI Supabase

```bash
# Installez la CLI Supabase si nécessaire
npm install -g supabase

# Connectez-vous à votre projet
supabase login
supabase link --project-ref miqeoteohumyxfsngjvt

# Exécutez les migrations
supabase db push

# Ou exécutez manuellement
supabase db reset --db-url "postgresql://postgres:[PASSWORD]@db.miqeoteohumyxfsngjvt.supabase.co:5432/postgres"
```

## 📊 Structure de la Base de Données

### Tables Principales

#### 👤 **Gestion Utilisateurs**
- `user_profiles` - Profils utilisateurs étendus
- `therapeutic_profiles` - Profils psychologiques

#### 💬 **Système de Chat**
- `conversations` - Conversations utilisateurs
- `sessions` - Sessions de chat
- `messages` - Messages échangés

#### 🏥 **Système Thérapeutique**
- `therapy_programs` - Programmes thérapeutiques
- `therapy_sessions` - Sessions thérapeutiques
- `progress_tracking` - Suivi des progrès
- `homework_assignments` - Devoirs thérapeutiques

#### 📋 **Évaluations**
- `assessment_templates` - Modèles d'évaluation
- `assessment_sessions` - Sessions d'évaluation

#### 🤖 **IA & Interactions**
- `ai_contexts` - Contextes IA personnalisés
- `therapeutic_interactions` - Interactions thérapeutiques détaillées
- `avatar_preferences` - Préférences d'avatar
- `avatar_interactions` - Interactions avec avatars

#### 📊 **Analytics**
- `user_interactions` - Interactions utilisateurs
- `conversation_patterns` - Motifs de conversation
- `conversation_insights` - Insights de conversation

#### 🔔 **Notifications**
- `notifications` - Notifications système
- `mood_entries` - Entrées d'humeur

## 🔒 Sécurité (RLS)

Toutes les tables sont protégées par Row Level Security (RLS) :

- **Principe de base** : Les utilisateurs ne peuvent accéder qu'à leurs propres données
- **Authentification** : Basée sur `auth.uid()` de Supabase Auth
- **Isolation** : Séparation complète des données entre utilisateurs
- **Audit** : Toutes les modifications sont tracées

### Exemple de politique RLS
```sql
-- Les utilisateurs ne voient que leurs propres conversations
CREATE POLICY "Users can view own conversations" 
ON conversations FOR SELECT 
USING (auth.uid() = user_id);
```

## 🔧 Fonctions Utilitaires

### Fonctions de Développement
- `clean_dev_data()` - Nettoie les données de test
- `create_sample_therapy_program(user_id)` - Crée un programme de test
- `user_owns_therapy_program()` / `user_owns_therapy_session()` - Vérifications de propriété

### Triggers Automatiques
- `update_updated_at_column()` - Met à jour automatiquement `updated_at`
- Appliqué sur toutes les tables avec `updated_at`

## 📈 Index de Performance

Les index sont optimisés pour :
- **Requêtes par utilisateur** (`user_id`)
- **Recherches temporelles** (`created_at`, `updated_at`)
- **Filtres de statut** (`status`, `is_active`)
- **Relations** (clés étrangères)

## 🧪 Données de Test

Le fichier `seed-data.sql` contient :
- **Modèles d'évaluation** pré-configurés
- **Fonctions de test** pour créer des données sample
- **Vues utilitaires** pour le développement

## ⚠️ Important

### Environnement de Production
- Ne pas exécuter les sections commentées de `seed-data.sql`
- Vérifier que toutes les politiques RLS sont actives
- Effectuer des sauvegardes régulières

### Variables d'Environnement
Assurez-vous que votre `.env` contient :
```env
VITE_SUPABASE_URL=https://miqeoteohumyxfsngjvt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔍 Vérification de l'Installation

Après installation, vérifiez que :

1. **Tables créées** : 23 tables principales + vues
2. **RLS activé** : `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;`
3. **Politiques actives** : Vérifiez dans l'interface Supabase
4. **Données de base** : Modèles d'évaluation présents

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans l'interface Supabase
2. Assurez-vous que les scripts sont exécutés dans l'ordre
3. Vérifiez les permissions de votre utilisateur Supabase

## 🔄 Mises à Jour

Pour les futures mises à jour :
1. Créez des fichiers de migration dans `database/migrations/`
2. Utilisez `ALTER TABLE` plutôt que `DROP/CREATE`
3. Testez en développement avant production