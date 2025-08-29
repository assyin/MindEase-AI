-- Migration pour corriger le trigger ai_contexts
-- Ce script corrige l'erreur 'record "new" has no field "updated_at"'

-- 1. Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS update_ai_contexts_last_updated ON ai_contexts;

-- 2. Créer la fonction correcte pour last_updated
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Recréer le trigger avec la bonne fonction
CREATE TRIGGER update_ai_contexts_last_updated 
  BEFORE UPDATE ON ai_contexts 
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

-- Vérification
SELECT 'Trigger ai_contexts corrigé avec succès' as status;