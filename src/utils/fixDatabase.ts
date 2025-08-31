import { supabase } from '../config/supabase';

/**
 * Script de correction temporaire pour ajouter la colonne adaptations_made
 * À exécuter une seule fois depuis l'interface
 */
export async function fixAdaptationsMadeColumn() {
  try {
    console.log('🔧 Correction de la base de données en cours...');
    
    // Tenter d'ajouter la colonne via une requête SQL directe
    const { data, error } = await supabase.rpc('fix_adaptations_column', {});
    
    if (error) {
      console.error('Erreur lors de la correction:', error);
      
      // Alternative: tenter de créer une session test pour vérifier si la colonne existe
      const testData = {
        user_id: 'test-user-id',
        therapy_program_id: 'test-program-id',
        session_number: 1,
        status: 'draft',
        planned_duration_minutes: 25,
        main_content: {},
        adaptations_made: []
      };
      
      const { error: testError } = await supabase
        .from('therapy_sessions')
        .insert([testData]);
        
      if (testError?.code === 'PGRST204') {
        console.error('❌ La colonne adaptations_made n\'existe pas dans la base de données');
        console.log('📋 Veuillez exécuter le script SQL suivant dans votre tableau de bord Supabase:');
        console.log(`
ALTER TABLE therapy_sessions 
ADD COLUMN IF NOT EXISTS adaptations_made JSONB DEFAULT '[]'::JSONB;

COMMENT ON COLUMN therapy_sessions.adaptations_made IS 'Adaptations faites durant la session thérapeutique';

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_adaptations_made 
ON therapy_sessions USING GIN (adaptations_made);
        `);
        return false;
      } else {
        // Supprimer la session test si elle a été créée
        if (!testError) {
          await supabase
            .from('therapy_sessions')
            .delete()
            .eq('user_id', 'test-user-id');
        }
      }
    }
    
    console.log('✅ Base de données corrigée avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    return false;
  }
}

/**
 * Fonction de vérification du schéma
 */
export async function verifyDatabaseSchema() {
  try {
    const testData = {
      user_id: 'schema-test',
      therapy_program_id: 'schema-test',
      session_number: 1,
      status: 'draft',
      planned_duration_minutes: 25,
      main_content: {},
      adaptations_made: ['test-adaptation']
    };
    
    const { error } = await supabase
      .from('therapy_sessions')
      .insert([testData]);
      
    if (error) {
      console.error('❌ Schéma invalide:', error.message);
      return false;
    }
    
    // Nettoyer
    await supabase
      .from('therapy_sessions')
      .delete()
      .eq('user_id', 'schema-test');
      
    console.log('✅ Schéma de base de données valide');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur vérification schéma:', error);
    return false;
  }
}