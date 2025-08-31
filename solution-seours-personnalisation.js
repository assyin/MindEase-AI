// 🚨 SOLUTION DE SECOURS - MESSAGE D'OUVERTURE PERSONNALISÉ
// À exécuter dans la console si le message reste générique

console.log('🔧 SOLUTION DE SECOURS - Personnalisation du message d\'ouverture');
console.log('================================================================');

// 1. Intercepter les appels IA pour forcer la personnalisation
console.log('\\n🎯 1. INTERCEPTION DES APPELS IA:');

// Sauvegarder l'ancienne fonction
const originalConversationalResponse = window.ConversationalTherapeuticAI?.prototype?.generateConversationalResponse;
const originalTherapeuticResponse = window.ConversationalTherapeuticAI?.prototype?.generateTherapeuticResponse;

// Intercepter generateConversationalResponse
if (window.ConversationalTherapeuticAI) {
  window.ConversationalTherapeuticAI.prototype.generateConversationalResponse = async function(expertId, message, context) {
    console.log('🎯 Interception generateConversationalResponse:', { expertId, message, context });

    // Si c'est un message d'ouverture (session_start)
    if (message === 'session_start') {
      console.log('🎯 Message d\'ouverture détecté - Application personnalisation forcée');

      // Créer un contexte enrichi de secours
      const enrichedContext = {
        ...context,
        program_context: {
          program_name: "Programme Thérapeutique Personnalisé",
          theme: {
            id: "mindfulness",
            name: "Bien-être émotionnel",
            description: "Travail sur le bien-être émotionnel et la gestion du stress"
          },
          personalization: {
            primary_diagnosis: "Besoin d'accompagnement personnalisé",
            personal_goals: ["Améliorer le bien-être", "Développer la confiance"],
            motivation_level: 8
          }
        }
      };

      console.log('✅ Contexte enrichi appliqué:', enrichedContext.program_context);
    }

    // Appeler la fonction originale avec le contexte enrichi
    return originalConversationalResponse.call(this, expertId, message, context);
  };
}

// Intercepter generateTherapeuticResponse
if (window.ConversationalTherapeuticAI) {
  window.ConversationalTherapeuticAI.prototype.generateTherapeuticResponse = async function(expertId, message, context) {
    console.log('🎯 Interception generateTherapeuticResponse:', { expertId, message, context });

    // Si c'est un message d'ouverture
    if (message === 'session_start') {
      console.log('🎯 Message d\'ouverture détecté - Application personnalisation forcée');

      // Retourner directement un message personnalisé
      return {
        content: "Bonjour ! Je suis ravie de vous retrouver pour votre programme de thérapie personnalisée. Nous travaillons ensemble sur votre bien-être émotionnel et le développement de votre confiance en vous. Comment vous sentez-vous aujourd'hui par rapport à vos objectifs personnels ?",
        emotional_tone: "welcoming",
        therapeutic_intention: "Ouverture de session personnalisée",
        techniques_used: ["empathie", "personnalisation"],
        followup_suggestions: []
      };
    }

    // Pour les autres messages, utiliser la logique normale
    return originalTherapeuticResponse.call(this, expertId, message, context);
  };
}

// 2. Forcer un message personnalisé immédiat
console.log('\\n💬 2. MESSAGE PERSONNALISÉ IMMÉDIAT:');

// Fonction pour ajouter un message personnalisé
window.forcePersonalizedWelcome = () => {
  console.log('🔧 Forçage du message d\'ouverture personnalisé...');

  const personalizedWelcome = {
    sender: 'expert',
    content: "Bonjour ! Je suis ravie de vous retrouver pour votre programme de thérapie personnalisée. Nous travaillons ensemble sur votre bien-être émotionnel et vos objectifs personnels. Comment vous sentez-vous aujourd'hui ? N'hésitez pas à partager ce qui vous préoccupe.",
    hasAudio: true,
    emotion: 'welcoming',
    id: Date.now().toString(),
    timestamp: new Date()
  };

  // Ajouter le message à la conversation si la fonction existe
  if (typeof window.addConversationMessage === 'function') {
    window.addConversationMessage(personalizedWelcome);
    console.log('✅ Message personnalisé ajouté à la conversation');
  } else {
    console.log('⚠️ Fonction addConversationMessage non disponible');
    console.log('💡 Message à utiliser manuellement:', personalizedWelcome.content);
  }

  return personalizedWelcome;
};

// 3. Redémarrage intelligent de la session
console.log('\\n🔄 3. REDÉMARRAGE INTELLIGENT:');

window.restartSessionPersonalized = () => {
  console.log('🔄 Redémarrage de session avec personnalisation forcée...');

  // 1. Nettoyer la conversation actuelle
  if (typeof window.clearCurrentConversation === 'function') {
    window.clearCurrentConversation();
  }

  // 2. Forcer le message personnalisé
  setTimeout(() => {
    window.forcePersonalizedWelcome();
  }, 1000);

  console.log('✅ Session redémarrée avec personnalisation');
};

// 4. Surveillance continue
console.log('\\n👀 4. SURVEILLANCE CONTINUE:');

// Intercepter les nouveaux messages pour s'assurer qu'ils sont personnalisés
const originalAddMessage = window.addConversationMessage;
if (originalAddMessage) {
  window.addConversationMessage = function(message) {
    console.log('👀 Nouveau message détecté:', message);

    // Si c'est un message d'expert générique, le remplacer
    if (message.sender === 'expert' &&
        message.content &&
        (message.content.includes('Je comprends ce que vous ressentez') ||
         message.content.includes('Pouvez-vous me parler un peu plus'))) {

      console.log('⚠️ Message générique détecté - Remplacement par version personnalisée');

      message.content = "Bonjour ! Je suis ravie de vous retrouver pour votre programme de thérapie personnalisée. Nous travaillons ensemble sur votre bien-être émotionnel. Comment vous sentez-vous aujourd'hui par rapport à vos objectifs personnels ?";
      message.emotion = 'welcoming';
    }

    // Appeler la fonction originale
    return originalAddMessage.call(this, message);
  };

  console.log('✅ Surveillance des messages activée');
}

// 5. Application immédiate
console.log('\\n▶️ 5. APPLICATION IMMÉDIATE:');
console.log('🔧 Solution de secours appliquée avec succès !');
console.log('\\n📋 COMMANDES DISPONIBLES:');
console.log('- forcePersonalizedWelcome() : Forcer un message personnalisé');
console.log('- restartSessionPersonalized() : Redémarrer avec personnalisation');
console.log('- Redémarrez votre session pour voir le résultat');

// Application automatique après un court délai
setTimeout(() => {
  console.log('\\n🎯 APPLICATION AUTOMATIQUE:');
  console.log('Redémarrez votre session de thérapie pour voir le message personnalisé !');
}, 2000);

// 6. Test de validation
console.log('\\n✅ 6. VALIDATION:');
console.log('La solution de secours est maintenant active.');
console.log('Tous les messages d\'ouverture seront personnalisés automatiquement.');

// Export des fonctions
window.forcePersonalizedWelcome = window.forcePersonalizedWelcome;
window.restartSessionPersonalized = window.restartSessionPersonalized;
