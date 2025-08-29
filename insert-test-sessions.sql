-- Insérer des sessions de test pour le programme thérapeutique existant
INSERT INTO therapy_sessions (
  therapy_program_id,
  session_number,
  scheduled_date,
  session_theme,
  therapeutic_objective,
  techniques_taught,
  concepts_covered,
  session_status,
  attendance_status,
  expert_notes
) VALUES
(
  'd9905e2b-d0ef-42de-a058-d56178837645',
  1,
  NOW() + INTERVAL '1 day',
  'Première session - Introduction et évaluation',
  'Faire connaissance et établir les objectifs thérapeutiques',
  '["Introduction aux techniques de base", "Évaluation initiale"]',
  '["Présentation du programme", "Établissement des objectifs"]',
  'planned',
  'present',
  'Première session programmée - introduction au programme thérapeutique'
),
(
  'd9905e2b-d0ef-42de-a058-d56178837645',
  2,
  NOW() + INTERVAL '8 days',
  'Comprendre votre anxiété',
  'Identifier les déclencheurs et comprendre les mécanismes de l''anxiété',
  '["Psychoéducation", "Identification des déclencheurs"]',
  '["Mécanismes de l''anxiété", "Types d''anxiété"]',
  'planned',
  'present',
  'Session axée sur la compréhension des mécanismes anxieux'
),
(
  'd9905e2b-d0ef-42de-a058-d56178837645',
  3,
  NOW() + INTERVAL '15 days',
  'Techniques de respiration et relaxation',
  'Apprendre des techniques de gestion immédiate de l''anxiété',
  '["Respiration profonde", "Relaxation progressive", "Cohérence cardiaque"]',
  '["Gestion du stress", "Techniques de relaxation"]',
  'planned',
  'present',
  'Session pratique sur les techniques de relaxation immédiate'
),
(
  'd9905e2b-d0ef-42de-a058-d56178837645',
  4,
  NOW() + INTERVAL '22 days',
  'Restructuration cognitive',
  'Modifier les pensées négatives et catastrophistes',
  '["Identification des pensées automatiques", "Questionnement socratique", "Restructuration cognitive"]',
  '["Pensées automatiques", "Distorsions cognitives", "Pensée rationnelle"]',
  'planned',
  'present',
  'Session sur la modification des schémas de pensée négatifs'
),
(
  'd9905e2b-d0ef-42de-a058-d56178837645',
  5,
  NOW() + INTERVAL '29 days',
  'Exposition graduelle',
  'Faire face progressivement aux situations anxiogènes',
  '["Hiérarchie d''exposition", "Exercices d''exposition in vivo", "Désensibilisation"]',
  '["Principes de l''exposition", "Gestion de l''évitement"]',
  'planned',
  'present',
  'Session d''exposition progressive aux situations anxiogènes'
);

-- Insérer quelques devoirs de test
INSERT INTO homework_assignments (
  therapy_session_id,
  therapy_program_id,
  assignment_title,
  assignment_description,
  assignment_type,
  detailed_instructions,
  expected_duration_minutes,
  difficulty_level,
  completion_status,
  due_date
) VALUES
(
  (SELECT id FROM therapy_sessions WHERE therapy_program_id = 'd9905e2b-d0ef-42de-a058-d56178837645' AND session_number = 1 LIMIT 1),
  'd9905e2b-d0ef-42de-a058-d56178837645',
  'Journal quotidien de l''humeur',
  'Noter votre niveau d''anxiété quotidien sur une échelle de 1 à 10',
  'monitoring',
  'Chaque soir, notez votre niveau d''anxiété général de la journée et les événements marquants.',
  10,
  'facile',
  'assigned',
  NOW() + INTERVAL '3 days'
),
(
  (SELECT id FROM therapy_sessions WHERE therapy_program_id = 'd9905e2b-d0ef-42de-a058-d56178837645' AND session_number = 2 LIMIT 1),
  'd9905e2b-d0ef-42de-a058-d56178837645',
  'Exercice de respiration quotidien',
  'Pratiquer la respiration profonde 2 fois par jour',
  'practice',
  'Matin et soir, pratiquez 5 minutes de respiration profonde (4 temps inspiration, 4 temps rétention, 6 temps expiration).',
  10,
  'facile',
  'assigned',
  NOW() + INTERVAL '10 days'
),
(
  (SELECT id FROM therapy_sessions WHERE therapy_program_id = 'd9905e2b-d0ef-42de-a058-d56178837645' AND session_number = 1 LIMIT 1),
  'd9905e2b-d0ef-42de-a058-d56178837645',
  'Identifier 3 déclencheurs d''anxiété',
  'Observer et noter vos principales situations anxiogènes',
  'reflection',
  'Pendant la semaine, identifiez et notez 3 situations qui déclenchent votre anxiété. Pour chacune, décrivez le contexte et l''intensité ressentie.',
  15,
  'modéré',
  'in_progress',
  NOW() + INTERVAL '5 days'
);