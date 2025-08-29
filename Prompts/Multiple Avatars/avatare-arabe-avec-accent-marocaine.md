MISSION : Intégrer des avatars arabes avec accent marocain dans MindEase AI

CONTEXTE : Expansion de MindEase AI pour inclure des avatars spécialisés parlant arabe avec accent marocain local (darija). Google Gemini TTS excelle dans la reproduction d'accents locaux authentiques.

OBJECTIFS D'IMPLÉMENTATION :

1. **CRÉER NOUVEAUX AVATARS ARABES :**
   - Thérapeute marocain(e) spécialisé(e) culture MENA
   - Coach motivation parlant darija marocaine
   - Guide bien-être avec accent maghrébin authentique

2. **INTÉGRER VOIX GEMINI TTS MAROCAINES :**
   Les voix suivantes dans Gemini TTS sont excellentes pour l'arabe marocain :
   - `orus` - Voix masculine, accent marocain naturel
   - `aoede` - Voix féminine, intonation maghrebine
   - `enceladus` - Voix neutre, darija claire
   - `iapetus` - Voix masculine, registre professionnel
   - `umbriel` - Voix féminine, ton empathique
   - `despina` - Voix douce, accent casablancais
   - `algenib` - Voix énergique, motivation
   - `rasalgethi` - Voix sage, conseil traditionnel

3. **SÉLECTEUR DE LANGUE MULTILINGUE :**
   - Français (actuel)
   - Arabe standard (`ar-EG`)
   - Darija marocaine (détection automatique Gemini)
   - Anglais (expansion future)

4. **FONCTIONNALITÉS SPÉCIFIQUES :**
   - Configuration voix par avatar avec accent local
   - Détection automatique langue du prompt utilisateur
   - Réponses culturellement appropriées (contexte MENA)
   - Interface RTL pour texte arabe
   - Prompts système adaptés culture marocaine

CONFIGURATION TECHNIQUE REQUISE :

// Nouveaux avatars arabes
const moroccanAvatars = [
{
id: 'therapist-morocco',
name: 'Dr. Aicha Benali',
specialty: 'Thérapie culturelle MENA',
voice: 'umbriel',
language: 'ar-MA', // Marocain
accent: 'casablanca'
},
{
id: 'coach-darija',
name: 'Ahmed Chraibi',
specialty: 'Motivation & développement',
voice: 'algenib',
language: 'ar-MA',
accent: 'rabat'
}
];

// Support multilingue Gemini TTS
speechConfig: {
voiceConfig: {
prebuiltVoiceConfig: {
voiceName: avatar.voice // orus, aoede, etc.
}
},
audioConfig: {
audioEncoding: "LINEAR16"
}
}

text

SPÉCIFICATIONS INTERFACE :
- Sélecteur langue dans header (FR/AR/EN)
- Avatars avec noms et photos appropriés
- Direction RTL automatique pour arabe
- Clavier virtuel arabe optionnel
- Réponses culturellement contextualisées

PROMPTS SYSTÈME ADAPTÉS :
- Salutations traditionnelles ("As-salamu alaykum")
- Références culturelles marocaines appropriées
- Respect des valeurs et traditions locales
- Expressions darija intégrées naturellement

TESTS REQUIS :
- Validation accent marocain authentique
- Test compréhension darija vs arabe standard
- Vérification interface RTL
- Qualité audio voix maghrebines

Implémente cette extension culturelle complète pour MindEase AI avec focus sur l'authenticité linguistique et culturelle marocaine.
Ce prompt guide Claude pour créer une extension culturellement appropriée avec les vraies voix Google Gemini optimisées pour l'accent marocain ! 🇲🇦🎭