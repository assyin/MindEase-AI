-- Ajout de la colonne adaptations_made manquante dans therapy_sessions
ALTER TABLE therapy_sessions 
ADD COLUMN IF NOT EXISTS adaptations_made JSONB DEFAULT '[]'::JSONB;

-- Commentaire pour la colonne
COMMENT ON COLUMN therapy_sessions.adaptations_made IS 'Adaptations faites durant la session thérapeutique';

-- Index pour les recherches sur les adaptations
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_adaptations_made 
ON therapy_sessions USING GIN (adaptations_made);