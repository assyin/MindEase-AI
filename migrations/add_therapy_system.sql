-- ============================================================================
-- SYSTÈME DE SUIVI THÉRAPEUTIQUE MINDEASE AI - MIGRATION BASE DE DONNÉES
-- ============================================================================
-- Cette migration ajoute le système thérapeutique complet selon les spécifications
-- Documents de référence: Plan logique complet + Guide technique
-- Date: 29/08/2025
-- ============================================================================

-- ============================================================================
-- TABLE 1: THERAPY_PROGRAMS - Programme thérapeutique principal par utilisateur
-- ============================================================================
CREATE TABLE therapy_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_name VARCHAR(255) NOT NULL,
  
  -- Diagnostic et évaluation
  primary_diagnosis VARCHAR(100) NOT NULL, -- ex: "Anxiété sociale modérée"
  secondary_diagnoses JSONB DEFAULT '[]', -- ex: ["Estime de soi faible"]
  severity_level VARCHAR(20) CHECK (severity_level IN ('léger', 'modéré', 'sévère')),
  
  -- Profil utilisateur
  personality_profile JSONB DEFAULT '{}', -- Introverti/Extraverti, style d'apprentissage
  risk_factors JSONB DEFAULT '[]',
  protective_factors JSONB DEFAULT '[]',
  motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
  availability_per_week INTEGER, -- heures disponibles par semaine
  
  -- Expert assigné
  assigned_expert_id VARCHAR(100) NOT NULL, -- 'dr_sarah_empathie', 'dr_alex_mindfulness', 'dr_aicha_culturelle'
  expert_approach VARCHAR(100) NOT NULL, -- 'TCC', 'Pleine conscience + TCC', 'TCC adaptée culturellement'
  gemini_voice_id VARCHAR(50) NOT NULL, -- 'umbriel', 'aoede', 'despina'
  
  -- Programme thérapeutique
  treatment_protocol_id UUID, -- référence vers treatment_protocols
  total_planned_sessions INTEGER DEFAULT 8,
  sessions_completed INTEGER DEFAULT 0,
  current_session_number INTEGER DEFAULT 0,
  program_duration_weeks INTEGER DEFAULT 8,
  session_frequency_per_week INTEGER DEFAULT 1,
  
  -- Statut et suivi
  program_status VARCHAR(20) DEFAULT 'active' CHECK (program_status IN ('active', 'paused', 'completed', 'discontinued')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  next_session_scheduled TIMESTAMPTZ,
  
  -- Objectifs personnels
  personal_goals JSONB DEFAULT '[]', -- ["Améliorer confiance en soi", "Gérer stress au travail"]
  success_definition TEXT, -- "À quoi ressemblerait le succès pour vous ?"
  
  -- Contexte culturel et linguistique
  cultural_context VARCHAR(50) DEFAULT 'français', -- 'français', 'arabe', 'marocain'
  preferred_language VARCHAR(10) DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'ar')),
  
  -- Adaptation dynamique
  adaptation_history JSONB DEFAULT '[]', -- Historique des adaptations du programme
  current_adaptations JSONB DEFAULT '{}', -- Adaptations actuelles actives
  
  -- Métriques globales
  initial_assessment_scores JSONB DEFAULT '{}', -- Scores d'évaluation initiale
  current_scores JSONB DEFAULT '{}', -- Scores actuels
  improvement_percentage INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour therapy_programs
CREATE INDEX idx_therapy_programs_user_id ON therapy_programs(user_id);
CREATE INDEX idx_therapy_programs_status ON therapy_programs(program_status);
CREATE INDEX idx_therapy_programs_expert ON therapy_programs(assigned_expert_id);
CREATE INDEX idx_therapy_programs_next_session ON therapy_programs(next_session_scheduled);
CREATE INDEX idx_therapy_programs_updated_at ON therapy_programs(updated_at DESC);

-- RLS Policy pour therapy_programs
ALTER TABLE therapy_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY therapy_programs_user_policy ON therapy_programs FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 2: THERAPY_SESSIONS - Sessions individuelles du programme (20-25 min)
-- ============================================================================
CREATE TABLE therapy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapy_program_id UUID NOT NULL REFERENCES therapy_programs(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  
  -- Planification session
  scheduled_date TIMESTAMPTZ,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  session_duration_minutes INTEGER, -- durée réelle
  
  -- Structure session 20-25 minutes
  checkin_data JSONB DEFAULT '{}', -- Minutes 1-3: Score humeur pré-session, événements marquants
  homework_review JSONB DEFAULT '{}', -- Minutes 4-7: Évaluation des devoirs précédents
  main_content JSONB DEFAULT '{}', -- Minutes 8-18: Contenu principal de la session
  practical_application JSONB DEFAULT '{}', -- Minutes 19-23: Application pratique guidée
  session_summary JSONB DEFAULT '{}', -- Minutes 24-25: Résumé + nouveaux devoirs
  
  -- Contenu thérapeutique
  session_theme VARCHAR(255), -- ex: "Comprendre votre anxiété", "Techniques de respiration"
  therapeutic_objective TEXT, -- ex: "Démystifier l'anxiété", "Outils d'urgence"
  techniques_taught JSONB DEFAULT '[]', -- ["Respiration profonde", "Relaxation musculaire"]
  concepts_covered JSONB DEFAULT '[]', -- ["Pensées automatiques", "Lien émotions-comportements"]
  
  -- Scores et évaluation
  pre_session_mood_score INTEGER CHECK (pre_session_mood_score >= 1 AND pre_session_mood_score <= 10),
  post_session_mood_score INTEGER CHECK (post_session_mood_score >= 1 AND post_session_mood_score <= 10),
  session_effectiveness_score INTEGER CHECK (session_effectiveness_score >= 1 AND session_effectiveness_score <= 10),
  user_engagement_level INTEGER CHECK (user_engagement_level >= 1 AND user_engagement_level <= 10),
  
  -- Réaction utilisateur et adaptation temps réel
  user_reaction_type VARCHAR(50), -- 'résistance', 'engagement_élevé', 'confusion', 'détresse_émotionnelle'
  adaptations_made JSONB DEFAULT '[]', -- Adaptations faites en temps réel pendant la session
  expert_notes TEXT, -- Notes de l'expert IA sur la session
  
  -- Statut session
  session_status VARCHAR(20) DEFAULT 'planned' CHECK (session_status IN ('planned', 'in_progress', 'completed', 'missed', 'cancelled')),
  attendance_status VARCHAR(20) DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'partial')),
  
  -- Devoirs générés
  homework_assigned JSONB DEFAULT '[]', -- Devoirs assignés à la fin de cette session
  homework_instructions TEXT, -- Instructions détaillées pour les devoirs
  
  -- Audio et transcription
  audio_recording_url TEXT, -- Enregistrement audio de la session si disponible
  session_transcript TEXT, -- Transcription de la session
  
  -- Métadonnées
  conversation_id UUID, -- Lien avec la conversation dans le système existant
  ai_model_used VARCHAR(50), -- Modèle IA utilisé pendant la session
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour therapy_sessions
CREATE INDEX idx_therapy_sessions_program_id ON therapy_sessions(therapy_program_id);
CREATE INDEX idx_therapy_sessions_number ON therapy_sessions(session_number);
CREATE INDEX idx_therapy_sessions_scheduled_date ON therapy_sessions(scheduled_date);
CREATE INDEX idx_therapy_sessions_status ON therapy_sessions(session_status);
CREATE INDEX idx_therapy_sessions_updated_at ON therapy_sessions(updated_at DESC);

-- RLS Policy pour therapy_sessions
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY therapy_sessions_user_policy ON therapy_sessions FOR ALL 
USING (
  therapy_program_id IN (
    SELECT id FROM therapy_programs WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- TABLE 3: HOMEWORK_ASSIGNMENTS - Devoirs et exercices entre sessions
-- ============================================================================
CREATE TABLE homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapy_session_id UUID NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  therapy_program_id UUID NOT NULL REFERENCES therapy_programs(id) ON DELETE CASCADE,
  
  -- Description du devoir
  assignment_title VARCHAR(255) NOT NULL,
  assignment_description TEXT NOT NULL,
  assignment_type VARCHAR(50) CHECK (assignment_type IN ('practice', 'reflection', 'exercise', 'monitoring', 'behavioral')),
  
  -- Instructions et contenu
  detailed_instructions TEXT,
  expected_duration_minutes INTEGER, -- Temps estimé pour compléter
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('facile', 'modéré', 'difficile')),
  
  -- Technique associée
  related_technique VARCHAR(100), -- ex: "Respiration profonde", "Journal des pensées"
  therapeutic_goal TEXT, -- Objectif thérapeutique de ce devoir
  
  -- Planification
  assigned_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  recommended_frequency VARCHAR(50), -- "2x par semaine", "quotidien", "avant situations stressantes"
  
  -- Suivi completion
  completion_status VARCHAR(20) DEFAULT 'assigned' CHECK (completion_status IN ('assigned', 'in_progress', 'completed', 'partial', 'not_done')),
  completion_date TIMESTAMPTZ,
  user_feedback TEXT, -- Retour de l'utilisateur sur l'exercice
  completion_notes TEXT, -- Notes sur comment s'est passé l'exercice
  
  -- Évaluation efficacité
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
  difficulty_experienced INTEGER CHECK (difficulty_experienced >= 1 AND difficulty_experienced <= 10),
  obstacles_encountered JSONB DEFAULT '[]', -- ["Manque de temps", "Difficile à comprendre"]
  
  -- Résultats et mesures
  quantitative_results JSONB DEFAULT '{}', -- ex: {"anxiety_level_before": 8, "anxiety_level_after": 5}
  qualitative_observations TEXT, -- Observations qualitatives de l'utilisateur
  
  -- Adaptation future
  suggested_modifications TEXT, -- Modifications suggérées pour futurs devoirs similaires
  repeat_assignment BOOLEAN DEFAULT FALSE, -- Si ce devoir doit être répété
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour homework_assignments
CREATE INDEX idx_homework_assignments_session_id ON homework_assignments(therapy_session_id);
CREATE INDEX idx_homework_assignments_program_id ON homework_assignments(therapy_program_id);
CREATE INDEX idx_homework_assignments_due_date ON homework_assignments(due_date);
CREATE INDEX idx_homework_assignments_status ON homework_assignments(completion_status);
CREATE INDEX idx_homework_assignments_updated_at ON homework_assignments(updated_at DESC);

-- RLS Policy pour homework_assignments
ALTER TABLE homework_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY homework_assignments_user_policy ON homework_assignments FOR ALL 
USING (
  therapy_program_id IN (
    SELECT id FROM therapy_programs WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- TABLE 4: PROGRESS_TRACKING - Métriques de suivi quotidien/hebdomadaire
-- ============================================================================
CREATE TABLE progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapy_program_id UUID NOT NULL REFERENCES therapy_programs(id) ON DELETE CASCADE,
  
  -- Période de mesure
  tracking_date DATE NOT NULL,
  tracking_period VARCHAR(20) CHECK (tracking_period IN ('daily', 'weekly', 'bi_weekly', 'monthly')),
  week_number INTEGER, -- Semaine du programme (1-16)
  
  -- Scores symptomatiques principaux
  primary_symptom_score INTEGER CHECK (primary_symptom_score >= 1 AND primary_symptom_score <= 10),
  secondary_symptoms_scores JSONB DEFAULT '{}', -- {"anxiété": 6, "estime_de_soi": 4}
  overall_wellbeing_score INTEGER CHECK (overall_wellbeing_score >= 1 AND overall_wellbeing_score <= 10),
  
  -- Fonctionnement quotidien
  sleep_quality_score INTEGER CHECK (sleep_quality_score >= 1 AND sleep_quality_score <= 10),
  work_performance_score INTEGER CHECK (work_performance_score >= 1 AND work_performance_score <= 10),
  social_relationships_score INTEGER CHECK (social_relationships_score >= 1 AND social_relationships_score <= 10),
  daily_functioning_score INTEGER CHECK (daily_functioning_score >= 1 AND daily_functioning_score <= 10),
  
  -- Utilisation des techniques
  techniques_used JSONB DEFAULT '[]', -- ["Respiration profonde", "Restructuration cognitive"]
  techniques_effectiveness JSONB DEFAULT '{}', -- {"respiration": 8, "restructuration": 6}
  frequency_technique_use JSONB DEFAULT '{}', -- {"respiration": "3x par jour", "restructuration": "1x par jour"}
  
  -- Engagement et motivation
  therapy_engagement_score INTEGER CHECK (therapy_engagement_score >= 1 AND therapy_engagement_score <= 10),
  motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
  homework_completion_rate INTEGER CHECK (homework_completion_rate >= 0 AND homework_completion_rate <= 100),
  session_attendance_rate INTEGER CHECK (session_attendance_rate >= 0 AND session_attendance_rate <= 100),
  
  -- Événements et contexte
  significant_events JSONB DEFAULT '[]', -- Événements marquants de la période
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  external_stressors JSONB DEFAULT '[]', -- ["Problème au travail", "Conflit familial"]
  
  -- Insights personnels
  personal_insights TEXT, -- Réflexions personnelles de l'utilisateur
  breakthrough_moments TEXT, -- Moments de compréhension importante
  challenges_faced JSONB DEFAULT '[]', -- Défis rencontrés pendant la période
  
  -- Métriques comportementales
  avoidance_behaviors JSONB DEFAULT '[]', -- Comportements d'évitement observés
  positive_behaviors JSONB DEFAULT '[]', -- Nouveaux comportements positifs adoptés
  coping_strategies_used JSONB DEFAULT '[]', -- Stratégies de coping utilisées
  
  -- Transfert dans la vie réelle
  real_life_application JSONB DEFAULT '[]', -- Applications des apprentissages dans la vie réelle
  situations_handled_better JSONB DEFAULT '[]', -- Situations mieux gérées grâce à la thérapie
  
  -- Auto-évaluation globale
  perceived_progress INTEGER CHECK (perceived_progress >= 1 AND perceived_progress <= 10),
  confidence_in_techniques INTEGER CHECK (confidence_in_techniques >= 1 AND confidence_in_techniques <= 10),
  hope_for_future INTEGER CHECK (hope_for_future >= 1 AND hope_for_future <= 10),
  
  -- Métadonnées
  data_source VARCHAR(50) DEFAULT 'self_report', -- 'self_report', 'session_derived', 'automated'
  reliability_score DECIMAL(3,2), -- Fiabilité des données (0.0 à 1.0)
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour progress_tracking
CREATE INDEX idx_progress_tracking_program_id ON progress_tracking(therapy_program_id);
CREATE INDEX idx_progress_tracking_date ON progress_tracking(tracking_date DESC);
CREATE INDEX idx_progress_tracking_period ON progress_tracking(tracking_period);
CREATE INDEX idx_progress_tracking_week ON progress_tracking(week_number);
CREATE INDEX idx_progress_tracking_updated_at ON progress_tracking(updated_at DESC);

-- RLS Policy pour progress_tracking
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY progress_tracking_user_policy ON progress_tracking FOR ALL 
USING (
  therapy_program_id IN (
    SELECT id FROM therapy_programs WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- TABLE 5: ASSESSMENT_TEMPLATES - Questionnaires d'évaluation par trouble
-- ============================================================================
CREATE TABLE assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  
  -- Type et catégorie
  assessment_type VARCHAR(50) CHECK (assessment_type IN ('initial', 'progress', 'completion', 'crisis')),
  disorder_category VARCHAR(100) NOT NULL, -- "anxiété", "dépression", "trauma", "estime_de_soi"
  target_population VARCHAR(100), -- "adultes", "adolescents", "culture_arabe"
  
  -- Échelles standardisées
  standardized_scale VARCHAR(100), -- "GAD-7", "PHQ-9", "Beck Anxiety Inventory"
  scale_description TEXT,
  score_interpretation JSONB DEFAULT '{}', -- Interprétation des scores {"0-5": "léger", "6-10": "modéré"}
  
  -- Questions du questionnaire
  questions JSONB NOT NULL, -- Structure des questions avec logique adaptative
  question_order JSONB DEFAULT '[]', -- Ordre des questions
  adaptive_logic JSONB DEFAULT '{}', -- Logique pour questions adaptatives
  
  -- Scoring et calcul
  scoring_algorithm JSONB DEFAULT '{}', -- Algorithme de calcul des scores
  weighted_scoring BOOLEAN DEFAULT FALSE,
  reverse_scoring_items JSONB DEFAULT '[]', -- Items à score inversé
  
  -- Profil généré
  profile_generation_rules JSONB DEFAULT '{}', -- Règles pour générer le profil thérapeutique
  diagnosis_mapping JSONB DEFAULT '{}', -- Mapping vers diagnostics possibles
  severity_thresholds JSONB DEFAULT '{}', -- Seuils pour déterminer la sévérité
  
  -- Recommandations automatiques
  treatment_recommendations JSONB DEFAULT '{}', -- Recommandations de traitement par score
  expert_assignment_rules JSONB DEFAULT '{}', -- Règles d'assignation d'expert
  program_duration_suggestions JSONB DEFAULT '{}', -- Suggestions de durée de programme
  
  -- Localisation et culture
  language VARCHAR(10) DEFAULT 'fr' CHECK (language IN ('fr', 'ar')),
  cultural_adaptation JSONB DEFAULT '{}', -- Adaptations culturelles spécifiques
  cultural_context VARCHAR(50), -- "français", "marocain", "tunisien"
  
  -- Validation et fiabilité
  validation_data JSONB DEFAULT '{}', -- Données de validation de l'évaluation
  reliability_score DECIMAL(3,2), -- Score de fiabilité (Cronbach's alpha, etc.)
  validity_indicators JSONB DEFAULT '{}', -- Indicateurs de validité
  
  -- Métadonnées
  version VARCHAR(20) DEFAULT '1.0',
  created_by VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour assessment_templates
CREATE INDEX idx_assessment_templates_type ON assessment_templates(assessment_type);
CREATE INDEX idx_assessment_templates_category ON assessment_templates(disorder_category);
CREATE INDEX idx_assessment_templates_language ON assessment_templates(language);
CREATE INDEX idx_assessment_templates_active ON assessment_templates(is_active);
CREATE INDEX idx_assessment_templates_updated_at ON assessment_templates(updated_at DESC);

-- RLS Policy pour assessment_templates (accessible à tous les utilisateurs authentifiés en lecture)
ALTER TABLE assessment_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_templates_read_policy ON assessment_templates FOR SELECT USING (is_active = true);

-- ============================================================================
-- TABLE 6: TREATMENT_PROTOCOLS - Plans de traitement standardisés par pathologie
-- ============================================================================
CREATE TABLE treatment_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_name VARCHAR(255) NOT NULL,
  
  -- Classification
  disorder_category VARCHAR(100) NOT NULL, -- "anxiété", "dépression", "trauma", "estime_de_soi"
  specific_condition VARCHAR(100), -- "anxiété sociale", "dépression majeure", "trouble panique"
  therapeutic_approach VARCHAR(100) NOT NULL, -- "TCC", "Pleine conscience", "TCC + Mindfulness"
  
  -- Expert recommandé
  recommended_expert VARCHAR(100), -- "dr_sarah_empathie", "dr_alex_mindfulness", "dr_aicha_culturelle"
  alternative_experts JSONB DEFAULT '[]', -- Experts alternatifs possibles
  
  -- Structure du programme
  total_sessions INTEGER NOT NULL DEFAULT 8,
  session_duration_minutes INTEGER DEFAULT 25,
  sessions_per_week INTEGER DEFAULT 1,
  total_duration_weeks INTEGER DEFAULT 8,
  
  -- Sessions détaillées
  session_templates JSONB NOT NULL, -- Template pour chaque session du protocole
  session_progression JSONB DEFAULT '[]', -- Progression logique entre les sessions
  
  -- Exemple structure session_templates:
  -- {
  --   "session_1": {
  --     "theme": "Comprendre votre anxiété",
  --     "objective": "Démystifier l'anxiété",
  --     "duration_breakdown": {
  --       "checkin": 3, "homework_review": 4, "main_content": 10, "practice": 5, "summary": 3
  --     },
  --     "content": {...},
  --     "techniques_taught": ["Psychoéducation", "Auto-observation"],
  --     "homework_assignments": [...]
  --   }
  -- }
  
  -- Techniques et méthodes
  core_techniques JSONB DEFAULT '[]', -- ["Respiration profonde", "Restructuration cognitive"]
  techniques_by_session JSONB DEFAULT '{}', -- Techniques spécifiques par session
  skill_building_progression JSONB DEFAULT '[]', -- Progression de l'apprentissage des compétences
  
  -- Critères d'adaptation
  severity_adaptations JSONB DEFAULT '{}', -- Adaptations selon sévérité (léger/modéré/sévère)
  cultural_adaptations JSONB DEFAULT '{}', -- Adaptations culturelles par contexte
  personality_adaptations JSONB DEFAULT '{}', -- Adaptations selon type de personnalité
  
  -- Métriques et évaluation
  success_indicators JSONB DEFAULT '[]', -- Indicateurs de succès du protocole
  progress_milestones JSONB DEFAULT '{}', -- Jalons de progrès par session/semaine
  outcome_measures JSONB DEFAULT '[]', -- Mesures de résultat à suivre
  
  -- Gestion des difficultés
  common_obstacles JSONB DEFAULT '[]', -- Obstacles fréquents et solutions
  crisis_protocols JSONB DEFAULT '{}', -- Protocoles en cas de crise
  adaptation_triggers JSONB DEFAULT '{}', -- Déclencheurs pour adapter le protocole
  
  -- Maintenance et suivi
  maintenance_plan JSONB DEFAULT '{}', -- Plan de maintenance post-traitement
  relapse_prevention JSONB DEFAULT '[]', -- Stratégies de prévention des rechutes
  follow_up_schedule JSONB DEFAULT '{}', -- Planning de suivi à long terme
  
  -- Validation et recherche
  evidence_base TEXT, -- Base de preuves scientifiques
  research_references JSONB DEFAULT '[]', -- Références de recherche
  effectiveness_data JSONB DEFAULT '{}', -- Données d'efficacité si disponibles
  
  -- Métadonnées
  version VARCHAR(20) DEFAULT '1.0',
  created_by VARCHAR(255),
  approved_by VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour treatment_protocols
CREATE INDEX idx_treatment_protocols_category ON treatment_protocols(disorder_category);
CREATE INDEX idx_treatment_protocols_condition ON treatment_protocols(specific_condition);
CREATE INDEX idx_treatment_protocols_approach ON treatment_protocols(therapeutic_approach);
CREATE INDEX idx_treatment_protocols_expert ON treatment_protocols(recommended_expert);
CREATE INDEX idx_treatment_protocols_active ON treatment_protocols(is_active);
CREATE INDEX idx_treatment_protocols_updated_at ON treatment_protocols(updated_at DESC);

-- RLS Policy pour treatment_protocols (accessible à tous les utilisateurs authentifiés en lecture)
ALTER TABLE treatment_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY treatment_protocols_read_policy ON treatment_protocols FOR SELECT USING (is_active = true);

-- ============================================================================
-- RELATIONS ET CONTRAINTES ADDITIONNELLES
-- ============================================================================

-- Contrainte pour s'assurer qu'un utilisateur ne peut pas avoir plus de 3 programmes actifs simultanément
CREATE OR REPLACE FUNCTION check_max_active_programs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.program_status = 'active' THEN
    IF (SELECT COUNT(*) FROM therapy_programs 
        WHERE user_id = NEW.user_id 
        AND program_status = 'active' 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)) >= 3 THEN
      RAISE EXCEPTION 'Un utilisateur ne peut pas avoir plus de 3 programmes thérapeutiques actifs simultanément';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_max_active_programs_trigger 
  BEFORE INSERT OR UPDATE ON therapy_programs 
  FOR EACH ROW EXECUTE FUNCTION check_max_active_programs();

-- Contrainte pour s'assurer que les sessions sont dans l'ordre
CREATE OR REPLACE FUNCTION validate_session_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que le numéro de session est cohérent
  IF NEW.session_number <= 0 THEN
    RAISE EXCEPTION 'Le numéro de session doit être positif';
  END IF;
  
  -- Vérifier qu'on ne saute pas de sessions
  IF NEW.session_number > 1 THEN
    IF NOT EXISTS (
      SELECT 1 FROM therapy_sessions 
      WHERE therapy_program_id = NEW.therapy_program_id 
      AND session_number = NEW.session_number - 1
    ) THEN
      RAISE EXCEPTION 'Cannot create session % without completing session %', NEW.session_number, NEW.session_number - 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_session_order_trigger 
  BEFORE INSERT ON therapy_sessions 
  FOR EACH ROW EXECUTE FUNCTION validate_session_order();

-- ============================================================================
-- FONCTIONS ET TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour toutes les tables thérapeutiques
CREATE TRIGGER update_therapy_programs_updated_at 
  BEFORE UPDATE ON therapy_programs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapy_sessions_updated_at 
  BEFORE UPDATE ON therapy_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_assignments_updated_at 
  BEFORE UPDATE ON homework_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_tracking_updated_at 
  BEFORE UPDATE ON progress_tracking 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_templates_updated_at 
  BEFORE UPDATE ON assessment_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_protocols_updated_at 
  BEFORE UPDATE ON treatment_protocols 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour les statistiques du programme
CREATE OR REPLACE FUNCTION update_program_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le nombre de sessions complétées
  UPDATE therapy_programs 
  SET 
    sessions_completed = (
      SELECT COUNT(*) 
      FROM therapy_sessions 
      WHERE therapy_program_id = COALESCE(NEW.therapy_program_id, OLD.therapy_program_id)
      AND session_status = 'completed'
    ),
    current_session_number = (
      SELECT COALESCE(MAX(session_number), 0)
      FROM therapy_sessions 
      WHERE therapy_program_id = COALESCE(NEW.therapy_program_id, OLD.therapy_program_id)
      AND session_status = 'completed'
    ) + 1,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.therapy_program_id, OLD.therapy_program_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour les stats automatiquement
CREATE TRIGGER update_program_stats_trigger 
  AFTER INSERT OR UPDATE OR DELETE ON therapy_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_program_stats();

-- ============================================================================
-- INTÉGRATION AVEC TABLES EXISTANTES
-- ============================================================================

-- Ajouter une colonne pour lier les conversations existantes aux programmes thérapeutiques
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS therapy_program_id UUID;
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_therapy_program 
  FOREIGN KEY (therapy_program_id) REFERENCES therapy_programs(id) ON DELETE SET NULL;

-- Ajouter une colonne pour indiquer si une conversation fait partie d'une session thérapeutique
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_therapy_session BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS therapy_session_id UUID;
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_therapy_session
  FOREIGN KEY (therapy_session_id) REFERENCES therapy_sessions(id) ON DELETE SET NULL;

-- Ajouter des colonnes thérapeutiques aux ai_contexts existants
ALTER TABLE ai_contexts ADD COLUMN IF NOT EXISTS therapy_program_id UUID;
ALTER TABLE ai_contexts ADD COLUMN IF NOT EXISTS current_session_id UUID;
ALTER TABLE ai_contexts ADD COLUMN IF NOT EXISTS therapeutic_context JSONB DEFAULT '{}';
ALTER TABLE ai_contexts ADD COLUMN IF NOT EXISTS session_progress JSONB DEFAULT '{}';

-- Contraintes pour les nouvelles colonnes
ALTER TABLE ai_contexts ADD CONSTRAINT fk_ai_contexts_therapy_program 
  FOREIGN KEY (therapy_program_id) REFERENCES therapy_programs(id) ON DELETE SET NULL;
ALTER TABLE ai_contexts ADD CONSTRAINT fk_ai_contexts_therapy_session
  FOREIGN KEY (current_session_id) REFERENCES therapy_sessions(id) ON DELETE SET NULL;

-- ============================================================================
-- PERMISSIONS ET SÉCURITÉ
-- ============================================================================

-- Accorder les permissions aux utilisateurs authentifiés
GRANT SELECT, INSERT, UPDATE, DELETE ON therapy_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON therapy_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON homework_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON progress_tracking TO authenticated;
GRANT SELECT ON assessment_templates TO authenticated;
GRANT SELECT ON treatment_protocols TO authenticated;

-- Permissions spéciales pour l'administration des templates et protocoles
-- (À ajouter selon les besoins - pour l'instant en lecture seule)

-- ============================================================================
-- VUES UTILES POUR LES REQUÊTES COURANTES
-- ============================================================================

-- Vue pour obtenir un aperçu rapide des programmes actifs d'un utilisateur
CREATE VIEW user_active_therapy_programs AS
SELECT 
  tp.*,
  (tp.sessions_completed::FLOAT / tp.total_planned_sessions * 100) as completion_percentage,
  CASE 
    WHEN tp.sessions_completed = tp.total_planned_sessions THEN 'ready_to_complete'
    WHEN tp.next_session_scheduled < NOW() THEN 'session_overdue'
    WHEN tp.next_session_scheduled BETWEEN NOW() AND NOW() + INTERVAL '24 hours' THEN 'session_soon'
    ELSE 'on_track'
  END as program_alert_status
FROM therapy_programs tp
WHERE tp.program_status = 'active';

-- Vue pour les sessions à venir
CREATE VIEW upcoming_therapy_sessions AS
SELECT 
  ts.*,
  tp.user_id,
  tp.assigned_expert_id,
  tp.gemini_voice_id,
  tp.cultural_context
FROM therapy_sessions ts
JOIN therapy_programs tp ON ts.therapy_program_id = tp.id
WHERE ts.session_status = 'planned'
AND ts.scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY ts.scheduled_date ASC;

-- Vue pour le tableau de bord de progrès
CREATE VIEW therapy_progress_dashboard AS
SELECT 
  tp.id as program_id,
  tp.user_id,
  tp.program_name,
  tp.assigned_expert_id,
  tp.sessions_completed,
  tp.total_planned_sessions,
  (tp.sessions_completed::FLOAT / tp.total_planned_sessions * 100) as completion_percentage,
  tp.improvement_percentage,
  
  -- Dernière session
  (SELECT scheduled_date FROM therapy_sessions WHERE therapy_program_id = tp.id ORDER BY session_number DESC LIMIT 1) as last_session_date,
  (SELECT next_session_scheduled FROM therapy_programs WHERE id = tp.id) as next_session_date,
  
  -- Devoirs en cours
  (SELECT COUNT(*) FROM homework_assignments ha WHERE ha.therapy_program_id = tp.id AND ha.completion_status IN ('assigned', 'in_progress')) as pending_homework_count,
  
  -- Progrès récent
  (SELECT overall_wellbeing_score FROM progress_tracking WHERE therapy_program_id = tp.id ORDER BY tracking_date DESC LIMIT 1) as current_wellbeing_score,
  (SELECT overall_wellbeing_score FROM progress_tracking WHERE therapy_program_id = tp.id ORDER BY tracking_date ASC LIMIT 1) as initial_wellbeing_score
  
FROM therapy_programs tp
WHERE tp.program_status = 'active';

-- Accorder les permissions de lecture sur les vues
GRANT SELECT ON user_active_therapy_programs TO authenticated;
GRANT SELECT ON upcoming_therapy_sessions TO authenticated;
GRANT SELECT ON therapy_progress_dashboard TO authenticated;

-- RLS sur les vues
ALTER VIEW user_active_therapy_programs SET (security_invoker = true);
ALTER VIEW upcoming_therapy_sessions SET (security_invoker = true);
ALTER VIEW therapy_progress_dashboard SET (security_invoker = true);

-- ============================================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE therapy_programs IS 'Programme thérapeutique principal par utilisateur avec diagnostic, expert assigné, et métriques de progrès';
COMMENT ON TABLE therapy_sessions IS 'Sessions thérapeutiques individuelles structurées 20-25 minutes avec check-in, contenu, pratique et résumé';
COMMENT ON TABLE homework_assignments IS 'Devoirs et exercices assignés entre les sessions avec suivi de completion et efficacité';
COMMENT ON TABLE progress_tracking IS 'Métriques de suivi quotidien/hebdomadaire des symptômes, fonctionnement et utilisation des techniques';
COMMENT ON TABLE assessment_templates IS 'Templates d\'évaluation standardisés par trouble avec questions adaptatives et scoring automatique';
COMMENT ON TABLE treatment_protocols IS 'Protocoles de traitement standardisés avec sessions détaillées et adaptations par sévérité/culture';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Cette migration crée l'infrastructure complète pour le système de suivi thérapeutique
-- selon les spécifications du Plan Logique Complet et du Guide Technique.
-- 
-- Prochaines étapes:
-- 1. Exécuter cette migration dans Supabase
-- 2. Créer des données de test pour les templates et protocoles
-- 3. Développer les services backend correspondants
-- 4. Implémenter les interfaces utilisateur

SELECT 'Migration therapy system completed successfully' as status;