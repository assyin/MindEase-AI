# 🔧 GUIDE DE RÉSOLUTION DU PROBLÈME DE SCHÉMA THÉRAPEUTIQUE

## 🚨 Problème Identifié

L'erreur suivante se produit lors de la création d'un programme thérapeutique :

```
Error creating first session: {code: '23502', details: null, hint: null, message: 'null value in column "session_type" of relation "therapy_sessions" violates not-null constraint'}
```

## 🔍 Cause du Problème

Il y a une **incohérence entre le schéma de base de données et le code TypeScript** :

1. **Le schéma actuel** (`install-clean-simple.sql`) est **simplifié** et ne contient que les champs de base
2. **Le code TypeScript** utilise le **schéma étendu** qui attend des champs supplémentaires
3. **La colonne `session_type`** est requise (`NOT NULL`) mais n'est pas fournie par le code

## 🛠️ Solution

### Option 1: Migration du Schéma (Recommandée)

Exécuter le script de migration pour ajouter toutes les colonnes manquantes :

```sql
-- Dans Supabase SQL Editor, exécuter (version simplifiée recommandée) :
\i database/complete-therapy-schema-migration-simple.sql
```

**Ou exécuter directement le contenu du fichier** `database/complete-therapy-schema-migration-simple.sql`

**Note :** Si vous rencontrez des erreurs de syntaxe, utilisez la version simplifiée qui évite les problèmes de `UNION` et `ORDER BY`.

### Option 2: Correction Temporaire du Code

Si vous préférez ne pas modifier la base de données, adapter le code pour utiliser uniquement les champs disponibles :

```typescript
// Dans TherapeuticIntegrationService.ts, ligne ~530
const sessionData = {
  therapy_program_id: programId,
  user_id: userId,
  session_number: 1,
  scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  session_type: 'initial_assessment', // ✅ REQUIS
  status: 'scheduled',
  attendance_status: 'present',
  session_notes: 'Première session - Introduction et évaluation'
};
```

## 📋 Colonnes Manquantes à Ajouter

### Table `therapy_sessions`

| Colonne | Type | Description |
|---------|------|-------------|
| `checkin_data` | JSONB | Données de check-in (1-3 min) |
| `homework_review` | JSONB | Évaluation des devoirs (4-7 min) |
| `main_content` | JSONB | Contenu principal (8-18 min) |
| `practical_application` | JSONB | Application pratique (19-23 min) |
| `session_summary` | JSONB | Résumé et devoirs (24-25 min) |
| `session_theme` | VARCHAR(255) | Thème de la session |
| `therapeutic_objective` | TEXT | Objectif thérapeutique |
| `techniques_taught` | JSONB | Techniques enseignées |
| `concepts_covered` | JSONB | Concepts couverts |
| `pre_session_mood_score` | INTEGER | Score humeur pré-session |
| `post_session_mood_score` | INTEGER | Score humeur post-session |
| `session_effectiveness_score` | INTEGER | Score d'efficacité |
| `user_engagement_level` | INTEGER | Niveau d'engagement |
| `user_reaction_type` | VARCHAR(50) | Type de réaction utilisateur |
| `adaptations_made` | JSONB | Adaptations faites |
| `expert_notes` | TEXT | Notes de l'expert IA |
| `homework_instructions` | TEXT | Instructions pour devoirs |
| `audio_recording_url` | TEXT | URL enregistrement audio |
| `session_transcript` | TEXT | Transcription de session |
| `conversation_id` | UUID | ID de conversation |
| `ai_model_used` | VARCHAR(50) | Modèle IA utilisé |
| `scheduled_date` | TIMESTAMPTZ | Date planifiée (compatibilité) |
| `session_status` | VARCHAR(20) | Statut de session (compatibilité) |

### Table `therapy_programs`

| Colonne | Type | Description |
|---------|------|-------------|
| `primary_diagnosis` | VARCHAR(100) | Diagnostic principal |
| `secondary_diagnoses` | JSONB | Diagnostics secondaires |
| `severity_level` | VARCHAR(20) | Niveau de sévérité |
| `personality_profile` | JSONB | Profil de personnalité |
| `risk_factors` | JSONB | Facteurs de risque |
| `protective_factors` | JSONB | Facteurs de protection |
| `motivation_level` | INTEGER | Niveau de motivation |
| `availability_per_week` | INTEGER | Disponibilité hebdomadaire |
| `assigned_expert_id` | VARCHAR(100) | ID expert assigné |
| `expert_approach` | VARCHAR(100) | Approche de l'expert |
| `gemini_voice_id` | VARCHAR(50) | ID voix Gemini |
| `treatment_protocol_id` | UUID | ID protocole de traitement |
| `total_planned_sessions` | INTEGER | Sessions planifiées totales |
| `sessions_completed` | INTEGER | Sessions complétées |
| `current_session_number` | INTEGER | Numéro session actuelle |
| `program_duration_weeks` | INTEGER | Durée programme en semaines |
| `session_frequency_per_week` | INTEGER | Fréquence sessions par semaine |
| `program_status` | VARCHAR(20) | Statut du programme |
| `start_date` | TIMESTAMPTZ | Date de début |
| `end_date` | TIMESTAMPTZ | Date de fin |
| `completion_date` | TIMESTAMPTZ | Date de completion |
| `next_session_scheduled` | TIMESTAMPTZ | Prochaine session planifiée |
| `personal_goals` | JSONB | Objectifs personnels |
| `success_definition` | TEXT | Définition du succès |
| `cultural_context` | VARCHAR(50) | Contexte culturel |
| `preferred_language` | VARCHAR(10) | Langue préférée |
| `adaptation_history` | JSONB | Historique des adaptations |
| `current_adaptations` | JSONB | Adaptations actuelles |
| `initial_assessment_scores` | JSONB | Scores évaluation initiale |
| `current_scores` | JSONB | Scores actuels |
| `improvement_percentage` | INTEGER | Pourcentage d'amélioration |
| `program_name` | TEXT | Nom du programme (compatibilité) |

## 🚀 Étapes de Résolution

### 1. Sauvegarder la Base de Données

```bash
# Créer une sauvegarde avant modification
pg_dump your_database > backup_before_migration.sql
```

### 2. Exécuter la Migration

```sql
-- Dans Supabase SQL Editor
\i database/complete-therapy-schema-migration.sql
```

### 3. Vérifier la Migration

```sql
-- Vérifier que toutes les colonnes sont présentes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'therapy_sessions' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'therapy_programs' 
ORDER BY ordinal_position;
```

### 4. Tester la Création de Programme

Essayer de créer un nouveau programme thérapeutique pour vérifier que l'erreur est résolue.

## 🔧 Scripts Disponibles

- **`complete-therapy-schema-migration-simple.sql`** : Migration complète simplifiée (recommandé - évite les problèmes de syntaxe)
- **`complete-therapy-schema-migration.sql`** : Migration complète (version originale)
- **`add-missing-therapy-columns.sql`** : Migration therapy_sessions uniquement
- **`add-missing-therapy-program-columns.sql`** : Migration therapy_programs uniquement

## ⚠️ Notes Importantes

1. **La migration est sécurisée** : elle vérifie l'existence des colonnes avant de les ajouter
2. **Compatibilité préservée** : les données existantes ne sont pas perdues
3. **Valeurs par défaut** : les nouvelles colonnes reçoivent des valeurs par défaut appropriées
4. **Index créés** : des index sont créés pour optimiser les performances

## 🆘 En Cas de Problème

Si la migration échoue :

1. Vérifier les logs d'erreur dans Supabase
2. S'assurer que les tables `therapy_sessions` et `therapy_programs` existent
3. Vérifier les permissions de l'utilisateur de base de données
4. Restaurer la sauvegarde si nécessaire

## 📞 Support

Pour toute question ou problème, consulter :
- Les logs Supabase
- La documentation du projet
- Les fichiers de migration dans le dossier `database/`
