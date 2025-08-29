export interface TherapyContext {
    keywords: string[];
    emotions: string[];
    responses: string[];
    followUpQuestions: string[];
    techniques: string[];
  }
  
  export class TherapyResponseEngine {
    private therapyContexts: TherapyContext[] = [
      {
        keywords: ['école', 'enfant', 'enfants', 'scolarité', 'écolier', 'devoirs', 'classe'],
        emotions: ['frustration', 'stress parental', 'impuissance'],
        responses: [
          "La résistance scolaire chez les enfants peut avoir plusieurs origines. Il est important de comprendre ce qui se cache derrière ce refus. 🏫",
          "Cette situation doit être éprouvante pour vous en tant que parent. Chaque enfant a ses propres raisons de résister à l'école. 💙",
          "Il est normal que vous vous sentiez démuni face à cette situation. Prenons le temps d'explorer les causes possibles ensemble. 🌱"
        ],
        followUpQuestions: [
          "Avez-vous pu identifier ce qui dérange le plus vos enfants dans le fait d'aller à l'école ?",
          "Y a-t-il eu un événement particulier qui a déclenché ce refus ?",
          "Comment se comportent-ils le matin avant de partir à l'école ?",
          "Ont-ils exprimé des peurs ou des préoccupations spécifiques ?"
        ],
        techniques: [
          "🎯 **Technique d'écoute active** : Organisez un moment calme avec chaque enfant pour comprendre leurs préoccupations sans jugement.",
          "📅 **Routine matinale positive** : Créez un rituel matinal agréable (musique, petit-déjeuner spécial) pour améliorer l'association école = plaisir.",
          "🏆 **Système de récompenses progressives** : Établissez des objectifs courts (aller à l'école 2 jours cette semaine) avec des récompenses adaptées.",
          "🤝 **Collaboration avec l'école** : Contactez les enseignants pour identifier d'éventuelles difficultés sociales ou académiques.",
          "💭 **Technique de visualisation** : Aidez vos enfants à imaginer des moments positifs à l'école (récré, activités qu'ils aiment)."
        ]
      },
      {
        keywords: ['stress', 'stressé', 'anxieux', 'angoisse', 'tension', 'pression'],
        emotions: ['anxiété', 'tension', 'surcharge'],
        responses: [
          "Le stress peut être écrasant, mais il existe des techniques efficaces pour le gérer. Vous n'êtes pas seul(e) dans cette épreuve. 🌱",
          "Votre corps et votre esprit vous signalent qu'il est temps de prendre soin de vous. C'est un signal important à écouter. ✨",
          "Le stress est une réaction naturelle, mais quand il devient persistant, il mérite notre attention bienveillante. 💙"
        ],
        followUpQuestions: [
          "Quand ressentez-vous le plus ce stress dans votre journée ?",
          "Y a-t-il des situations spécifiques qui déclenchent cette anxiété ?",
          "Avez-vous remarqué des signes physiques (tension, fatigue, sommeil perturbé) ?"
        ],
        techniques: [
          "🌬️ **Respiration 4-7-8** : Inspirez 4 sec, retenez 7 sec, expirez 8 sec. Répétez 4 fois.",
          "🧘 **Ancrage 5-4-3-2-1** : Nommez 5 choses que vous voyez, 4 que vous entendez, 3 que vous touchez, 2 que vous sentez, 1 que vous goûtez.",
          "💪 **Relaxation musculaire progressive** : Contractez puis relâchez chaque groupe musculaire, des pieds à la tête.",
          "📝 **Journal des inquiétudes** : Écrivez vos préoccupations 10 min par jour, puis rangez le carnet."
        ]
      },
      {
        keywords: ['triste', 'déprimé', 'mal', 'déprime', 'mélancolie', 'chagrin'],
        emotions: ['tristesse', 'mélancolie', 'abattement'],
        responses: [
          "Votre tristesse est légitime et mérite d'être accueillie avec douceur. Il faut du courage pour reconnaître ses émotions. 💙",
          "Les moments difficiles font partie du chemin humain. Vous n'avez pas à traverser cette épreuve seul(e). 🌱",
          "Votre cœur porte quelque chose de lourd en ce moment. Prenons le temps de l'explorer ensemble, à votre rythme. ✨"
        ],
        followUpQuestions: [
          "Depuis quand ressentez-vous cette tristesse ?",
          "Y a-t-il eu des changements récents dans votre vie ?",
          "Qu'est-ce qui vous apportait de la joie auparavant ?"
        ],
        techniques: [
          "☀️ **Exposition à la lumière** : Passez 15-20 min dehors chaque matin, même par temps nuageux.",
          "🚶 **Marche consciente** : 10 minutes de marche lente en observant votre environnement.",
          "💝 **Gratitude quotidienne** : Notez 3 petites choses positives chaque soir, même très simples.",
          "🎨 **Expression créative** : Dessinez, écrivez, ou écoutez de la musique pour exprimer vos émotions."
        ]
      }
    ];
  
    analyzeMessage(message: string): TherapyContext | null {
      const messageLower = message.toLowerCase();
      
      return this.therapyContexts.find(context => 
        context.keywords.some(keyword => messageLower.includes(keyword))
      ) || null;
    }
  
    generateContextualResponse(message: string, conversationHistory: Array<{role: string; content: string}>): string {
      const context = this.analyzeMessage(message);
      
      if (!context) {
        return this.getGenericResponse();
      }
  
      // Sélection intelligente de la réponse
      const response = context.responses[Math.floor(Math.random() * context.responses.length)];
      const followUp = context.followUpQuestions[Math.floor(Math.random() * context.followUpQuestions.length)];
      const technique = context.techniques[Math.floor(Math.random() * context.techniques.length)];
  
      return `${response}\n\n${followUp}\n\nEn attendant, voici une technique qui pourrait vous aider :\n\n${technique}`;
    }
  
    private getGenericResponse(): string {
      const genericResponses = [
        "Je vous écoute attentivement. Pouvez-vous me dire ce qui vous préoccupe le plus en ce moment ? 🌱",
        "Vos sentiments sont importants. Prenons le temps d'explorer ensemble ce que vous ressentez. 💙",
        "Merci de partager cela avec moi. Comment puis-je vous accompagner au mieux aujourd'hui ? ✨",
        "Il me semble que cette situation vous affecte. Voulez-vous me raconter ce qui se passe ? 🌸",
        "Je suis là pour vous écouter sans jugement. Qu'est-ce qui vous amènerait un peu de réconfort ? 😊"
      ];
      
      return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
  }
  