// 🚨 SCRIPT DE DIAGNOSTIC - MESSAGE D'OUVERTURE GÉNÉRIQUE
// À exécuter dans la console du navigateur pour diagnostiquer le problème

console.log('🔍 DIAGNOSTIC COMPLET - Message d\'ouverture générique');
console.log('================================================');

// 1. Vérifier l'état de l'utilisateur
console.log('\\n👤 1. ÉTAT UTILISATEUR:');
console.log('- User ID:', window.user?.id);
console.log('- User email:', window.user?.email);
console.log('- User object:', window.user);
console.log('- Authentifié:', !!window.user?.id);

// 2. Vérifier le programme thérapeutique
console.log('\\n📋 2. PROGRAMME THÉRAPEUTIQUE:');
const checkProgram = async () => {
  try {
    // Vérifier si le service existe
    if (typeof window.TherapyProgramManager === 'undefined') {
      console.log('❌ TherapyProgramManager non disponible dans window');
      return null;
    }

    const manager = new window.TherapyProgramManager();
    console.log('✅ Manager créé');

    const program = await manager.getCurrentProgram(window.user?.id);
    console.log('📋 Programme récupéré:', program);

    if (program) {
      console.log('✅ PROGRAMME TROUVÉ:', {
        id: program.id,
        name: program.program_name || program.name,
        diagnosis: program.primary_diagnosis,
        goals: program.personal_goals,
        severity: program.severity_level,
        completed_sessions: program.sessions_completed || program.completed_sessions,
        total_sessions: program.total_planned_sessions || program.total_sessions
      });
      return program;
    } else {
      console.log('❌ AUCUN PROGRAMME TROUVÉ');
      return null;
    }
  } catch (error) {
    console.error('🚨 ERREUR récupération programme:', error);
    return null;
  }
};

// 3. Vérifier les thèmes disponibles
console.log('\\n🎨 3. THÈMES DISPONIBLES:');
const checkThemes = async () => {
  try {
    if (typeof window.getThemeById === 'undefined') {
      console.log('❌ getThemeById non disponible dans window');
      return null;
    }

    // Tester quelques thèmes courants
    const themes = ['anxiety', 'depression', 'stress', 'confidence'];
    console.log('🎨 Test thèmes:');
    themes.forEach(themeId => {
      try {
        const theme = window.getThemeById(themeId);
        console.log(`  ${themeId}:`, theme ? theme.name : '❌ non trouvé');
      } catch (error) {
        console.log(`  ${themeId}: ❌ erreur -`, error.message);
      }
    });
  } catch (error) {
    console.error('🚨 ERREUR récupération thèmes:', error);
  }
};

// 4. Test de génération de message personnalisé
console.log('\\n💬 4. TEST GÉNÉRATION MESSAGE:');
const testPersonalizedMessage = async () => {
  try {
    const program = await checkProgram();
    if (!program) {
      console.log('❌ Impossible de tester - pas de programme');
      return;
    }

    // Simuler le contexte d'expert
    const expertProfile = {
      id: 'dr_sarah_empathie',
      name: 'Dr. Sarah',
      approach: 'Approche empathique et bienveillante'
    };

    // Générer message personnalisé
    const theme = window.getThemeById ? window.getThemeById(program.program_name || 'anxiety') : null;
    const personalizedMessage = `Bonjour ! Je suis ravie de vous retrouver pour votre programme "${program.program_name || program.name}". ${theme ? `Nous travaillons ensemble sur ${theme.name.toLowerCase()}.` : ''} Comment vous sentez-vous aujourd'hui par rapport à vos objectifs personnels ?`;

    console.log('💬 MESSAGE PERSONNALISÉ GÉNÉRÉ:');
    console.log(personalizedMessage);

    return personalizedMessage;
  } catch (error) {
    console.error('🚨 ERREUR génération message:', error);
  }
};

// 5. Solution de secours
console.log('\\n🔧 5. SOLUTION DE SECOURS:');
const applyFallback = () => {
  console.log('🔧 Application de la solution de secours...');

  // Forcer un message personnalisé
  const fallbackMessage = "Bonjour ! Je suis ravie de vous retrouver pour votre programme de thérapie. Nous travaillons ensemble sur votre bien-être émotionnel. Comment vous sentez-vous aujourd'hui ?";

  console.log('✅ Message de secours appliqué:', fallbackMessage);

  // Simuler l'ajout du message
  if (typeof window.addFallbackMessage !== 'undefined') {
    window.addFallbackMessage(fallbackMessage);
  }

  return fallbackMessage;
};

// 6. Diagnostic automatique
console.log('\\n🚨 6. DIAGNOSTIC AUTOMATIQUE:');
const runFullDiagnostic = async () => {
  console.log('🔍 Démarrage diagnostic complet...');

  const program = await checkProgram();
  await checkThemes();
  const message = await testPersonalizedMessage();

  console.log('\\n📊 RÉSULTATS DU DIAGNOSTIC:');
  console.log('- Programme trouvé:', !!program);
  console.log('- Thèmes disponibles:', typeof window.getThemeById !== 'undefined');
  console.log('- Message généré:', !!message);

  if (program && message) {
    console.log('✅ SYSTÈME FONCTIONNEL');
    console.log('🎯 SOLUTION: Redémarrer la session');
  } else {
    console.log('❌ PROBLÈME DÉTECTÉ');
    console.log('🔧 APPLICATION SOLUTION DE SECOURS');
    applyFallback();
  }

  return { program, message };
};

// Exécuter le diagnostic
console.log('\\n▶️ EXÉCUTION DU DIAGNOSTIC...');
runFullDiagnostic().then(results => {
  console.log('\\n🎯 DIAGNOSTIC TERMINÉ');
  console.log('Résultats:', results);
});

// Fonction pour redémarrer la session avec diagnostic
window.restartSessionWithDiagnostic = () => {
  console.log('🔄 Redémarrage session avec diagnostic...');
  runFullDiagnostic();
};

// Instructions pour l'utilisateur
console.log('\\n📋 INSTRUCTIONS:');
console.log('1. Vérifiez les résultats ci-dessus');
console.log('2. Si programme trouvé: redémarrez la session');
console.log('3. Si pas de programme: créez-en un d\'abord');
console.log('4. Pour relancer le diagnostic: restartSessionWithDiagnostic()');

// Export des fonctions pour utilisation future
window.diagnosticResults = null;
window.checkProgram = checkProgram;
window.checkThemes = checkThemes;
window.testPersonalizedMessage = testPersonalizedMessage;
window.applyFallback = applyFallback;
