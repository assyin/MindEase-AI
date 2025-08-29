MISSION : Refactoriser la création de conversation avec sélection thématique + experts IA spécialisés

CONTEXTE : Remplacer le système actuel de templates par une approche en 2 étapes : sélection du thème thérapeutique puis choix d'expert IA spécialisé avec voix Gemini TTS dédiée.

NOUVELLE ARCHITECTURE REQUISE :

1. **ÉTAPE 1 : SÉLECTION DU THÈME (Interface améliorée)**
   - Remplacer les 5 templates actuels par une liste complète de sujets thérapeutiques
   - Interface de recherche/filtrage pour trouver rapidement un thème
   - Catégorisation visuelle des sujets par couleurs/icônes

2. **ÉTAPE 2 : CHOIX D'EXPERT IA SPÉCIALISÉ**
   - Après sélection du thème, proposer 2-3 experts IA spécialisés
   - Chaque expert a sa propre personnalité, approche et voix Gemini TTS
   - Un expert par défaut pré-sélectionné pour chaque thème

LISTE COMPLÈTE DES THÈMES THÉRAPEUTIQUES :
const therapyThemes = [
// Troubles psychologiques principaux
"Dépression", "Anxiété", "Stress", "TOC", "Bipolaire", "Traumatisme",

// Relations et émotions
"Relations", "Estime de soi", "Colère", "Deuil et perte", "Attachement", "Codépendance",

// Développement personnel
"Développement personnel", "Transitions de vie", "Procrastination", "Existentiel",

// Problématiques spécialisées
"Troubles de l'alimentation", "Abus de substances", "Santé sexuelle", "Image du corps",

// Vie quotidienne
"Sommeil", "Douleur chronique", "Éducation des enfants", "Enfance",

// Famille et travail
"Gestion du stress au travail", "Relations familiales", "Communication"
];

text

3. **EXPERTS IA SPÉCIALISÉS PAR THÈME :**

Créer des profils d'experts avec voix Gemini TTS distinctes :

// Exemple pour thème "Anxiété"
const anxietyExperts = [
{
id: "dr-sarah-anxiety",
name: "Dr. Sarah Compassion",
specialty: "Spécialiste troubles anxieux & TCC",
approach: "Thérapie cognitivo-comportementale, techniques de relaxation",
voice: "umbriel", // Voix Gemini TTS douce et rassurante
language: "fr-FR",
isDefault: true
},
{
id: "dr-alex-mindfulness",
name: "Dr. Alex Sérénité",
specialty: "Mindfulness & méditation thérapeutique",
approach: "Pleine conscience, techniques de respiration",
voice: "aoede", // Voix calme et méditative
language: "fr-FR"
},
{
id: "dr-aicha-anxiety-ar",
name: "Dr. Aicha Benali",
specialty: "مختصة في القلق والعلاج النفسي",
approach: "Approche culturelle maghrebine + TCC moderne",
voice: "despina", // Voix marocaine authentique
language: "ar-MA"
}
];

text

4. **INTERFACE UTILISATEUR CIBLE :**

**Écran 1 - Sélection Thème :**
🔍 [Barre de recherche : "Rechercher un sujet..."]

📱 CATÉGORIES PRINCIPALES
├── 😰 Troubles émotionnels (Anxiété, Dépression, Stress...)
├── 💑 Relations & Famille (Relations, Éducation, Communication...)
├── 🌱 Développement personnel (Estime de soi, Transitions...)
├── 🏥 Problématiques spécialisées (Addictions, Troubles alimentaires...)
└── 💼 Vie quotidienne (Travail, Sommeil, Douleur...)

[Liste complète alphabétique avec filtrage]

text

**Écran 2 - Choix Expert :**
Thème sélectionné : "Anxiété" 🔙

👩‍⚕️ Dr. Sarah Compassion (RECOMMANDÉ)
Spécialiste TCC - Voix douce - 🔊 Écouter

👨‍⚕️ Dr. Alex Sérénité
Mindfulness - Voix calme - 🔊 Écouter

👩‍⚕️ Dr. Aicha Benali (العربية)
Approche culturelle - Voix marocaine - 🔊 Écouter

[Continuer avec Dr. Sarah] [Personnaliser]

text

5. **FONCTIONNALITÉS REQUISES :**
- Recherche instantanée dans les thèmes
- Prévisualisation voix de chaque expert (bouton "Écouter")
- Expert par défaut intelligent selon le thème
- Support multilingue (FR/AR) selon préférences
- Sauvegarde des préférences utilisateur
- Interface responsive mobile/desktop

6. **MAPPING THÈME → EXPERTS :**
Créer un système intelligent qui propose automatiquement les meilleurs experts selon :
- Le thème sélectionné
- La langue préférée de l'utilisateur  
- L'historique des conversations précédentes
- La spécialisation de chaque expert

OBJECTIF FINAL : Expérience utilisateur fluide et personnalisée pour trouver l'expert thérapeutique idéal selon le besoin spécifique, avec voix authentiques et approches adaptées.

Implémente cette architecture complète pour révolutionner l'expérience de création de conversation dans MindEase AI.


Ci dessous une complement & clarification des intructions : 


🎭 MISSION : Refactoriser la création de conversation dans MindEase AI avec sélection thématique et experts IA spécialisés.

CONTESXE ET OBJECTIFS :

1. **SÉLECTION DU THÈME** :
   - Liste complète de sujets thérapeutiques (recherche + filtrage)
   - Catégorisation visuelle

2. **SÉLECTION D’UN EXPERT IA SPÉCIALISÉ** :
   - Proposer 2-3 experts IA selon le thème, chacun avec sa personnalité, spécialité, et voix Gemini TTS.
   - Un expert par défaut est proposé.
   - Sélection ou confirmation par l’utilisateur.

3. **OUVERTURE DE LA CONVERSATION PAR L’EXPERT IA** :
   - Après sélection du thème et de l’expert, **c’est l’expert IA qui DOIT ouvrir la conversation** automatiquement.
   - Le message d’ouverture doit rendre la conversation chaleureuse et montrer que l’expert est actif, disponible, à l’écoute :
     - Exemples :
       - "Bonjour, je suis Dr. Sarah. Tu peux me parler en toute confiance, je suis là pour t’accompagner."
       - "Salam, je suis Dr. Aicha, à l’écoute de tes questions et préoccupations. Comment puis-je t’aider aujourd’hui ?"
       - "Je suis prêt(e) à commencer notre échange, n’hésite pas à partager ce qui te préoccupe."
   - Ce message doit correspondre à la personnalité et spécialité de l’expert : empathique, professionnelle, encourageante, culturelle…

4. **FONCTIONNEMENT** :
   - L’utilisateur choisit le thème et l’expert
   - Après validation, le système ouvre la conversation avec le message d’accueil de l’expert IA
   - L’utilisateur peut alors répondre et débuter la discussion

5. **FONCTIONNALITÉS SUPPLÉMENTAIRES**
   - Design UX avec affichage distinct du message d’ouverture (avatar expert, voix associée)
   - Le bouton « Commencer la conversation » déclenche systématiquement le message de l’expert

OBJECTIF : Fluidifier l’entrée en relation, rassurer et engager l’utilisateur dès l’ouverture, tout en personnalisant l’expérience selon le thème et l’expert choisi.

Implémente cette séquence conversationnelle pour une expérience MindEase AI plus humaine, empathique et professionnelle.


