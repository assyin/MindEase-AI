🧹 MISSION : Nettoyer et simplifier la page de chat MindEase AI avec sélection de langue automatique

CONTEXTE : La page de chat actuelle est encombrée avec trop de paramètres et options. L'utilisateur veut une interface épurée focalisée uniquement sur la conversation, avec les paramètres déplacés dans un modal dédié incluant la sélection de langue.

MODIFICATIONS URGENTES REQUISES :

1. **NETTOYER LA PAGE CHAT PRINCIPALE :**
   - ✅ GARDER : Zone de conversation, input message, sélection avatar
   - ❌ SUPPRIMER : Tous les boutons de test ("Test Speech", "Liste Voix", "Stop", etc.)
   - ❌ SUPPRIMER : Section "Test Synthèse Vocale" complète
   - ❌ SUPPRIMER : Boutons diagnostic ("Test Audio Système", "Diagnostic Complet")
   - ❌ SUPPRIMER : Avertissements et messages techniques
   - ❌ SUPPRIMER : Sélection langue FR/MA dans la zone de conversation
   - ✅ GARDER : Juste le chat propre et les avatars

2. **REFACTORISER LE MODAL "Configuration des Avatars" :**
   - ❌ CHANGER LE TITRE : "Configuration des Avatars" → "Paramètres de Conversation"
   - ❌ SUPPRIMER L'ONGLET : "Dialogues Multi-Avatars" (complet)
   - ❌ SUPPRIMER L'ONGLET : "Préférences" (complet)
   - ✅ GARDER SEULEMENT : Onglet unique "Conversation & Avatars"

3. **AJOUTER SÉLECTION DE LANGUE DANS LE MODAL :**
   ✅ SECTION "Langue de Conversation" :
const languageOptions = [
{ code: 'fr', name: 'Français', flag: '🇫🇷' },
{ code: 'ar-MA', name: 'العربية المغربية (Darija)', flag: '🇲🇦' },
{ code: 'ar', name: 'العربية (Arabe Standard)', flag: '🇸🇦' },
{ code: 'en', name: 'English', flag: '🇺🇸' }
];

text

- Interface de sélection avec drapeaux et noms
- Application automatique à toute la conversation
- L'IA répond dans la langue sélectionnée
- Filtrage des avatars selon la langue choisie

4. **SIMPLIFIER LES PARAMÈTRES VOCAUX :**
❌ SUPPRIMER CES CONTRÔLES COMPLEXES :
Vitesse de parole: 0.9x

Hauteur de voix: -2

Volume: +2 dB

Ton émotionnel (Empathique/Énergique/Apaisant/Analytique/Soutien)

Durée des pauses: 800ms

Paramètres Avancés

text

✅ REMPLACER PAR :
- Liste simple des voix avec bouton "🔊 Écouter"
- Sélection radio pour choisir la voix
- Affichage automatique SEULEMENT des voix 5 étoiles
- Filtrage des voix selon la langue sélectionnée

5. **LOGIQUE DE LANGUE AUTOMATIQUE :**
// Implémentation requise
const setConversationLanguage = (languageCode: string) => {
// 1. Filtrer avatars compatibles avec la langue
const compatibleAvatars = avatars.filter(a => a.supportedLanguages.includes(languageCode));

text
 // 2. Filtrer voix 5⭐ pour la langue
 const availableVoices = allVoices.filter(v => 
   v.rating === 5 && v.language === languageCode
 );
 
 // 3. Mettre à jour contexte IA
 setAIContext(`Réponds uniquement en ${getLanguageName(languageCode)}`);
 
 // 4. Appliquer à toutes les conversations futures
 updateConversationSettings({ language: languageCode });
};

text

6. **STRUCTURE CIBLE MODAL "Paramètres de Conversation" :**
- **Section 1** : "Langue de Conversation"
  - Sélecteur de langue avec drapeaux
  - Application automatique à l'IA
- **Section 2** : "Avatar & Voix"
  - Avatars filtrés par langue sélectionnée
  - Voix 5⭐ compatibles avec la langue
  - Bouton "🔊 Écouter" par voix
  - Sélection simple par radio button

7. **SYSTÈME DE FILTRAGE AUTOMATIQUE :**
// Auto-filtrage basé sur langue + note
const getAvailableContent = (language: string) => ({
avatars: avatars.filter(a => a.supportedLanguages.includes(language)),
voices: voices.filter(v => v.rating === 5 && v.language === language)
});

text

8. **INTERFACE CHAT ÉPURÉE :**
[Header avec avatar actuel + langue détectée]
[Zone messages propre]
[Input + bouton envoi]
[Footer minimal sans sélecteurs]

text

SPÉCIFICATIONS TECHNIQUES :
- Langue sélectionnée persiste dans localStorage
- L'IA répond automatiquement dans la langue choisie
- Filtrage temps réel avatars/voix selon langue
- Aucun sélecteur de langue dans la zone de chat
- Modal unique pour tous les paramètres


**GESTION RTL SÉLECTIVE POUR L'ARABE :**
   ✅ APPLIQUER RTL UNIQUEMENT AUX ZONES DE TEXTE :

SPÉCIFICATIONS RTL :
- RTL automatique quand langue arabe détectée
- Basculement instantané lors du changement de langue
- Interface globale reste toujours LTR (pas de mirror)
- Seulement les zones de texte passent en RTL
- Réversible automatiquement pour autres langues

✅ ÉLÉMENTS À PASSER EN RTL (quand arabe sélectionné) :
- Zone de saisie de message (input)
- Contenu des messages (texte conversation)
- Placeholder du input
- Nom des avatars arabes (si en arabe)

❌ ÉLÉMENTS À GARDER EN LTR (toujours) :
- Navigation principale (sidebar, header)
- Boutons d'interface (paramètres, fermer, etc.)
- Layout général de l'application
- Position des éléments UI (pas de mirror)
- Icônes et boutons d'action

OBJECTIF : Interface chat ultra-propre avec gestion intelligente multilingue automatique via modal de paramètres.

Implémente ce système complet pour une expérience utilisateur fluide et internationale