// 🚨 SCRIPT DE CORRECTION - DUPLICATION AUDIO ET MESSAGES
// Exécuter dans la console du navigateur pour corriger temporairement

console.log('🔧 Début correction duplication audio...');

// 1. CORRECTION IMMÉDIATE - Arrêter toute lecture audio en cours
if (window.speechSynthesis) {
  window.speechSynthesis.cancel();
  console.log('✅ Synthèse vocale arrêtée');
}

// 2. CORRECTION IMMÉDIATE - Arrêter tous les éléments audio
document.querySelectorAll('audio').forEach(audio => {
  audio.pause();
  audio.currentTime = 0;
  console.log('✅ Audio arrêté:', audio.src);
});

// 3. CORRECTION IMMÉDIATE - Nettoyer le localStorage des sessions dupliquées
const keys = Object.keys(localStorage);
const sessionKeys = keys.filter(key => key.startsWith('conversational_session_'));
console.log('🗑️ Sessions trouvées:', sessionKeys.length);

sessionKeys.forEach(key => {
  try {
    const session = JSON.parse(localStorage.getItem(key));
    if (session && session.conversation) {
      // Supprimer les messages dupliqués
      const uniqueMessages = [];
      const seenContents = new Set();
      
      session.conversation.forEach(msg => {
        const contentKey = `${msg.sender}-${msg.content.substring(0, 100)}`;
        if (!seenContents.has(contentKey)) {
          seenContents.add(contentKey);
          uniqueMessages.push(msg);
        } else {
          console.log('⚠️ Message dupliqué supprimé:', msg.content.substring(0, 50));
        }
      });
      
      if (uniqueMessages.length !== session.conversation.length) {
        session.conversation = uniqueMessages;
        localStorage.setItem(key, JSON.stringify(session));
        console.log(`✅ Session ${key} nettoyée: ${session.conversation.length} messages uniques`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur nettoyage session:', key, error);
  }
});

// 4. CORRECTION IMMÉDIATE - Redémarrer la session proprement
console.log('🔄 Redémarrage de la session...');
window.location.reload();

console.log('✅ Correction terminée - page en cours de rechargement');
