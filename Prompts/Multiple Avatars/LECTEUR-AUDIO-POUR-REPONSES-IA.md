MISSION : Ajouter un lecteur audio intégré pour chaque réponse de l'IA dans MindEase AI

CONTEXTE : Actuellement, l'utilisateur peut poser des questions vocales et reçoit des réponses textuelles. Il faut maintenant permettre d'écouter ces réponses via un lecteur audio intégré.

FONCTIONNALITÉS REQUISES :

1. **LECTEUR AUDIO SOUS CHAQUE RÉPONSE IA :**
   - Barre de lecture audio située directement sous chaque message de l'expert IA
   - Bouton Play/Pause, barre de progression, durée totale
   - Design moderne et minimaliste (style Spotify/Apple Music)

2. **GÉNÉRATION AUDIO AUTOMATIQUE :**
   - Chaque réponse textuelle de l'IA doit automatiquement générer sa version audio
   - Utiliser la voix Gemini TTS de l'expert sélectionné
   - Cache audio pour éviter la re-génération si déjà créé

3. **CONTRÔLES UTILISATEUR :**
[▶️ Play] [⏸️ Pause] [⏹️ Stop]
████████████████████▒▒▒▒ 2:14 / 3:42
🔊 [Volume slider]

text

4. **INTERFACE INTÉGRÉE :**
💬 Message de l'expert IA (texte complet)

🎵 ────────────────────────────────────
[▶️] ████████████▒▒▒▒▒▒▒ 1:23 / 2:45
Dr. Sarah Compassion - Voix douce
────────────────────────────────────

text

5. **PARAMÈTRE GLOBAL "LECTURE AUDIO" :**
- Toggle dans les paramètres : "Activer la lecture audio automatique"
- Si activé : génération audio de toutes les réponses
- Si désactivé : bouton "🔊 Écouter" à côté de chaque réponse

6. **FONCTIONNALITÉS AVANCÉES :**
- **Auto-play optionnel** : démarrage automatique de la lecture après réponse
- **Vitesse de lecture** : 0.5x, 1x, 1.25x, 1.5x, 2x
- **Indicateur de chargement** : "Génération audio..." pendant synthèse TTS
- **Gestion multi-langues** : utiliser la langue de l'expert (FR/AR)

7. **ÉTATS VISUELS :**
- **En attente** : Bouton "🔊 Générer audio"
- **Génération** : "⏳ Génération audio..." avec spinner
- **Prêt** : Lecteur audio complet avec contrôles
- **Lecture** : Animation de la barre de progression
- **Erreur** : "❌ Audio indisponible" avec bouton retry

8. **INTÉGRATION TECHNIQUE :**
interface AudioPlayer {
messageId: string;
audioUrl: string;
duration: number;
isPlaying: boolean;
currentTime: number;
volume: number;
playbackRate: number;
}

// Générer audio pour chaque réponse
const generateResponseAudio = async (text: string, expert: Expert) => {
const audioBlob = await geminiTTS.generate(text, expert.voice);
return URL.createObjectURL(audioBlob);
};

text

9. **PARAMÈTRES UTILISATEUR :**
- Activer/désactiver lecture audio
- Auto-play des réponses
- Vitesse de lecture préférée
- Volume par défaut
- Voix préférée par langue

OBJECTIF FINAL : 
Transformer MindEase AI en assistant vocal complet où l'utilisateur peut :
- Parler à l'IA (déjà fonctionnel)
- Recevoir des réponses texte + audio
- Contrôler la lecture audio de manière intuitive
- Personnaliser son expérience d'écoute

Implémente cette fonctionnalité complète pour une expérience utilisateur immersive et accessible.