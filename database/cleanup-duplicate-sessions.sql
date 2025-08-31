-- ============================================================================
-- NETTOYAGE DES SESSIONS EN DOUBLE
-- ============================================================================
-- Ce script supprime les sessions en double en gardant seulement
-- la première session créée pour chaque numéro de session par programme
-- Date: 30/08/2025
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🧹 Début du nettoyage des sessions en double...';
    
    -- Compter les sessions avant nettoyage
    RAISE NOTICE '📊 Sessions avant nettoyage: %', (SELECT COUNT(*) FROM therapy_sessions);
    
    -- Supprimer les doublons en gardant la première session créée pour chaque combinaison
    -- (therapy_program_id, session_number)
    WITH duplicates AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY therapy_program_id, session_number 
                   ORDER BY created_at ASC
               ) as rn
        FROM therapy_sessions
    )
    DELETE FROM therapy_sessions 
    WHERE id IN (
        SELECT id 
        FROM duplicates 
        WHERE rn > 1
    );
    
    -- Compter les sessions après nettoyage
    RAISE NOTICE '📊 Sessions après nettoyage: %', (SELECT COUNT(*) FROM therapy_sessions);
    
    RAISE NOTICE '✅ Nettoyage terminé !';
END $$;

-- Vérifier le résultat final
SELECT 
    therapy_program_id,
    session_number, 
    session_type, 
    session_theme,
    created_at
FROM therapy_sessions 
ORDER BY therapy_program_id, session_number;
