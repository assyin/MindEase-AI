/**
 * UTILITAIRE DEBUG POUR PROGRAMME THÉRAPEUTIQUE
 * Permet de tester et déboguer la création de programmes
 */

import { supabase } from '../config/supabase';

// Test de création de programme simple
export const testProgramCreation = async (userId: string) => {
  console.log('🔧 Test de création programme thérapeutique...');
  
  try {
    // Données minimales pour test
    const testProgramData = {
      user_id: userId,
      program_name: 'Programme Test Debug',
      primary_diagnosis: 'anxiety',
      severity_level: 'moderate',
      assigned_expert_id: 'dr_sarah_empathie',
      total_planned_sessions: 8,
      program_duration_weeks: 8,
      session_frequency_per_week: 1,
      cultural_context: 'français',
      preferred_language: 'fr',
      status: 'active'
    };
    
    console.log('📋 Tentative avec données minimales:', testProgramData);
    
    const { data, error } = await supabase
      .from('therapy_programs')
      .insert([testProgramData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur création programme test:', error);
      console.error('📋 Détails erreur:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Vérifier la structure de la table
      await checkTableStructure();
      
      return null;
    }
    
    console.log('✅ Programme test créé avec succès:', data);
    
    // Nettoyer le programme test
    await supabase
      .from('therapy_programs')
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 Programme test nettoyé');
    return data;
    
  } catch (error) {
    console.error('❌ Erreur inattendue lors du test:', error);
    return null;
  }
};

// Vérifier la structure de la table therapy_programs
export const checkTableStructure = async () => {
  try {
    console.log('🔍 Vérification structure table therapy_programs...');
    
    // Essayer de récupérer une ligne existante pour voir les colonnes
    const { data, error } = await supabase
      .from('therapy_programs')
      .select('*')
      .limit(1);
    
    if (error && !error.message.includes('0 rows')) {
      console.error('❌ Erreur accès table therapy_programs:', error);
    } else {
      console.log('✅ Table therapy_programs accessible');
      if (data && data.length > 0) {
        console.log('📋 Colonnes disponibles:', Object.keys(data[0]));
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification structure:', error);
  }
};

// Vérifier les données utilisateur
export const checkUserExists = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('❌ Utilisateur non trouvé:', error);
      return false;
    }
    
    console.log('✅ Utilisateur trouvé:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur vérification utilisateur:', error);
    return false;
  }
};

// Test complet de debug
export const runFullDebugTest = async (userId: string) => {
  console.log('🚀 === DÉBUT TEST DEBUG COMPLET ===');
  
  // 1. Vérifier utilisateur
  const userExists = await checkUserExists(userId);
  if (!userExists) {
    console.error('❌ Test arrêté - utilisateur non valide');
    return false;
  }
  
  // 2. Vérifier structure table
  await checkTableStructure();
  
  // 3. Test création programme
  const testResult = await testProgramCreation(userId);
  
  console.log('🏁 === FIN TEST DEBUG COMPLET ===');
  
  return testResult !== null;
};

// Export par défaut pour utilisation facile
export default {
  testProgramCreation,
  checkTableStructure,
  checkUserExists,
  runFullDebugTest
};