import { supabase } from '../config/supabase';

export interface DatabaseSetupResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Vérifie la connexion à la base de données Supabase
 */
export async function testDatabaseConnection(): Promise<DatabaseSetupResult> {
  try {
    // Test simple de connexion
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (error) {
      // Si la table n'existe pas, c'est probablement que la BDD n'est pas configurée
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Tables de base de données non trouvées. Veuillez exécuter les scripts de migration.',
          details: error
        };
      }
      
      return {
        success: false,
        message: `Erreur de connexion à la base de données: ${error.message}`,
        details: error
      };
    }

    return {
      success: true,
      message: 'Connexion à la base de données réussie',
      details: data
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur inattendue: ${error}`,
      details: error
    };
  }
}

/**
 * Crée un programme thérapeutique de démonstration pour un utilisateur
 */
export async function createSampleTherapyProgram(userId: string): Promise<DatabaseSetupResult> {
  try {
    // 1. Créer le programme thérapeutique
    const { data: program, error: programError } = await supabase
      .from('therapy_programs')
      .insert([{
        user_id: userId,
        name: 'Programme de Gestion du Stress',
        description: 'Un programme personnalisé pour apprendre à gérer le stress quotidien',
        program_type: 'stress',
        total_sessions: 12,
        completed_sessions: 3,
        expert_profile: {
          name: 'Dr. Sarah Martin',
          specialty: 'Thérapie Comportementale',
          experience: '10 ans d\'expérience'
        }
      }])
      .select()
      .single();

    if (programError) {
      return {
        success: false,
        message: `Erreur création programme: ${programError.message}`,
        details: programError
      };
    }

    // 2. Créer une session planifiée
    const { error: sessionError } = await supabase
      .from('therapy_sessions')
      .insert([{
        therapy_program_id: program.id,
        user_id: userId,
        session_number: 4,
        scheduled_for: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        session_type: 'Techniques de Relaxation',
        status: 'scheduled',
        duration_minutes: 25
      }]);

    if (sessionError) {
      console.warn('Erreur création session:', sessionError);
    }

    // 3. Créer des données de progrès
    const { error: progressError } = await supabase
      .from('progress_tracking')
      .insert([{
        therapy_program_id: program.id,
        user_id: userId,
        overall_progress: 25,
        weekly_sessions: 1,
        homework_completion: 80,
        mood_improvement: 15
      }]);

    if (progressError) {
      console.warn('Erreur création progrès:', progressError);
    }

    // 4. Créer un devoir
    const { error: homeworkError } = await supabase
      .from('homework_assignments')
      .insert([{
        user_id: userId,
        title: 'Exercices de Respiration',
        description: 'Pratiquer 5 minutes de respiration profonde chaque matin',
        assignment_type: 'breathing',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false
      }]);

    if (homeworkError) {
      console.warn('Erreur création devoir:', homeworkError);
    }

    return {
      success: true,
      message: 'Programme thérapeutique de démonstration créé avec succès',
      details: program
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur inattendue: ${error}`,
      details: error
    };
  }
}

/**
 * Initialise les données de base nécessaires au fonctionnement de l'app
 */
export async function initializeBasicData(): Promise<DatabaseSetupResult> {
  try {
    // Vérifier s'il y a déjà des modèles d'évaluation
    const { data: existingTemplates, error } = await supabase
      .from('assessment_templates')
      .select('id')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: `Erreur vérification données: ${error.message}`,
        details: error
      };
    }

    // Si pas de templates, en créer
    if (!existingTemplates || existingTemplates.length === 0) {
      const { error: insertError } = await supabase
        .from('assessment_templates')
        .insert([
          {
            name: 'Évaluation d\'Accueil Rapide',
            description: 'Évaluation initiale simplifiée',
            assessment_type: 'intake',
            questions: {
              sections: [
                {
                  title: 'Informations de base',
                  questions: [
                    {
                      id: 'main_concern',
                      type: 'text',
                      question: 'Quelle est votre principale préoccupation ?',
                      required: true
                    }
                  ]
                }
              ]
            },
            scoring_rules: {}
          }
        ]);

      if (insertError) {
        console.warn('Erreur création template:', insertError);
      }
    }

    return {
      success: true,
      message: 'Données de base initialisées',
      details: { templatesCount: existingTemplates?.length || 0 }
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur inattendue: ${error}`,
      details: error
    };
  }
}

/**
 * Fonction complète de configuration de la base de données pour un utilisateur
 */
export async function setupUserDatabase(userId: string): Promise<DatabaseSetupResult> {
  try {
    // 1. Tester la connexion
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest.success) {
      return connectionTest;
    }

    // 2. Initialiser les données de base
    const basicDataResult = await initializeBasicData();
    if (!basicDataResult.success) {
      return basicDataResult;
    }

    // 3. Créer un programme de démonstration
    const sampleProgramResult = await createSampleTherapyProgram(userId);
    if (!sampleProgramResult.success) {
      return sampleProgramResult;
    }

    return {
      success: true,
      message: 'Base de données configurée avec succès pour l\'utilisateur',
      details: {
        connection: connectionTest.details,
        basicData: basicDataResult.details,
        sampleProgram: sampleProgramResult.details
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur configuration utilisateur: ${error}`,
      details: error
    };
  }
}