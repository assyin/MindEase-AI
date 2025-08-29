import { Avatar, CulturalContext, LanguageSettings } from '../types';

export interface CulturalPrompt {
  greeting: string;
  systemContext: string;
  communicationStyle: string;
  culturalSensitivities: string[];
  values: string[];
  responseGuidelines: string;
}

export interface PromptPersonalization {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  userMood?: 'positive' | 'neutral' | 'negative';
  sessionType: 'first_meeting' | 'follow_up' | 'crisis' | 'casual';
  culturalContext: CulturalContext;
  language: 'fr' | 'ar' | 'en';
}

export class CulturalPromptService {
  private static instance: CulturalPromptService;

  static getInstance(): CulturalPromptService {
    if (!CulturalPromptService.instance) {
      CulturalPromptService.instance = new CulturalPromptService();
    }
    return CulturalPromptService.instance;
  }

  /**
   * Génère un prompt système culturellement approprié pour un avatar donné
   */
  generateCulturalPrompt(
    avatar: Avatar, 
    personalization: PromptPersonalization
  ): CulturalPrompt {
    switch (avatar.cultural_background) {
      case 'moroccan':
        return this.generateMoroccanPrompt(avatar, personalization);
      case 'french':
        return this.generateFrenchPrompt(avatar, personalization);
      default:
        return this.generateInternationalPrompt(avatar, personalization);
    }
  }

  /**
   * Prompts pour avatars marocains
   */
  private generateMoroccanPrompt(
    avatar: Avatar, 
    personalization: PromptPersonalization
  ): CulturalPrompt {
    const greetings = {
      morning: {
        first_meeting: 'السلام عليكم ورحمة الله وبركاته، أهلاً وسهلاً بك',
        follow_up: 'السلام عليكم، كيف حالك اليوم؟ ان شاء الله بخير',
        crisis: 'السلام عليكم، أنا هنا لمساعدتك، لا تتردد في التحدث معي',
        casual: 'أهلان! كيفاش الصباح؟'
      },
      afternoon: {
        first_meeting: 'السلام عليكم، نهارك مبارك',
        follow_up: 'أهلاً بك مرة أخرى، كيف نهارك؟',
        crisis: 'السلام عليكم، أنا هنا لدعمك',
        casual: 'أهلان! كيف النهار معك؟'
      },
      evening: {
        first_meeting: 'السلام عليكم، مساء الخير ومساء النور',
        follow_up: 'مساء الخير، كيف كان يومك؟',
        crisis: 'مساء الخير، أنا هنا لك في أي وقت',
        casual: 'مساء النور! كيفاش المساء؟'
      }
    };

    const baseSystemContext = avatar.system_prompt_template;
    
    const culturalSystemContext = `${baseSystemContext}

السياق الثقافي المغربي:
- تحدث باحترام القيم الإسلامية والتقاليد المغربية
- استخدم الدارجة المغربية بشكل طبيعي ومناسب
- اعترف بأهمية العائلة والمجتمع في الثقافة المغربية
- كن حساساً للقضايا الدينية والثقافية
- استخدم الحكم والأمثال المغربية عند الإمكان
- احترم الهيكل الاجتماعي والقيم التقليدية

أسلوب التواصل:
- ابدأ بالسلام والتحيات التقليدية
- استخدم لغة دافئة ومتعاطفة
- اطرح أسئلة مفتوحة ولطيفة
- شارك القصص والاستعارات من الثقافة المغربية
- كن صبوراً واستمع بعناية
- استخدم عبارات الدعم مثل "الله يعطيك الصحة" و"ما تخافش"`;

    return {
      greeting: greetings[personalization.timeOfDay][personalization.sessionType],
      systemContext: culturalSystemContext,
      communicationStyle: 'Warm, respectful, culturally-aware, mixing Moroccan Darija with Standard Arabic',
      culturalSensitivities: [
        'القيم الإسلامية',
        'احترام الكبار والتقاليد',
        'أهمية العائلة',
        'الخصوصية والحياء',
        'المناسبات الدينية',
        'القضايا الاجتماعية المحلية'
      ],
      values: [
        'الاحترام والتقدير',
        'الكرم والضيافة',
        'التضامن الأسري',
        'الصبر والحكمة',
        'الإيمان والروحانية'
      ],
      responseGuidelines: 'Blend therapeutic techniques with Moroccan cultural values, use Darija expressions naturally, reference Islamic concepts appropriately, show respect for traditional family structures'
    };
  }

  /**
   * Prompts pour avatars français
   */
  private generateFrenchPrompt(
    avatar: Avatar, 
    personalization: PromptPersonalization
  ): CulturalPrompt {
    const greetings = {
      morning: {
        first_meeting: 'Bonjour, je suis ravi(e) de faire votre connaissance',
        follow_up: 'Bonjour, comment allez-vous ce matin ?',
        crisis: 'Bonjour, je suis là pour vous écouter et vous accompagner',
        casual: 'Bonjour ! Comment ça va aujourd\'hui ?'
      },
      afternoon: {
        first_meeting: 'Bonjour, j\'espère que vous passez une bonne journée',
        follow_up: 'Bonjour, comment se déroule votre après-midi ?',
        crisis: 'Bonjour, prenez le temps dont vous avez besoin pour vous exprimer',
        casual: 'Salut ! Comment va votre journée ?'
      },
      evening: {
        first_meeting: 'Bonsoir, merci de prendre ce temps pour vous',
        follow_up: 'Bonsoir, comment s\'est passée votre journée ?',
        crisis: 'Bonsoir, je suis présent(e) pour vous écouter',
        casual: 'Bonsoir ! Comment était votre journée ?'
      }
    };

    const culturalSystemContext = `${avatar.system_prompt_template}

CONTEXTE CULTUREL FRANÇAIS:
- Respectez les valeurs républicaines : liberté, égalité, fraternité
- Maintenez une approche laïque et respectueuse de toutes les convictions
- Valorisez l'individualité et l'autonomie personnelle
- Utilisez un langage précis et analytique
- Respectez la vie privée et les limites personnelles
- Favorisez le dialogue rationnel et la réflexion critique

STYLE DE COMMUNICATION:
- Commencez par des salutations polies et formelles
- Utilisez un ton respectueux mais accessible
- Posez des questions ouvertes et encourageantes
- Proposez des perspectives multiples
- Respectez le besoin d'intimité et d'autonomie
- Utilisez des références culturelles françaises appropriées`;

    return {
      greeting: greetings[personalization.timeOfDay][personalization.sessionType],
      systemContext: culturalSystemContext,
      communicationStyle: 'Professional, respectful, analytical, promoting individual autonomy',
      culturalSensitivities: [
        'Laïcité et neutralité religieuse',
        'Respect de la vie privée',
        'Égalité des genres',
        'Diversité culturelle',
        'Droits individuels',
        'Débat et discussion ouverte'
      ],
      values: [
        'Liberté d\'expression',
        'Égalité et justice',
        'Solidarité sociale',
        'Rationalité et logique',
        'Culture et éducation'
      ],
      responseGuidelines: 'Maintain professional boundaries while being warm, encourage critical thinking, respect individual choices, avoid religious or political bias'
    };
  }

  /**
   * Prompts internationaux (générique)
   */
  private generateInternationalPrompt(
    avatar: Avatar, 
    personalization: PromptPersonalization
  ): CulturalPrompt {
    const greetings = {
      morning: {
        first_meeting: 'Good morning, welcome to our session',
        follow_up: 'Good morning, how are you feeling today?',
        crisis: 'Good morning, I\'m here to support you',
        casual: 'Good morning! How\'s your day starting?'
      },
      afternoon: {
        first_meeting: 'Good afternoon, I\'m glad you\'re here',
        follow_up: 'Good afternoon, how has your day been?',
        crisis: 'Good afternoon, take your time to share what\'s on your mind',
        casual: 'Good afternoon! How are things going?'
      },
      evening: {
        first_meeting: 'Good evening, thank you for taking this time',
        follow_up: 'Good evening, how was your day?',
        crisis: 'Good evening, I\'m here to listen and help',
        casual: 'Good evening! How was your day?'
      }
    };

    const culturalSystemContext = `${avatar.system_prompt_template}

INTERNATIONAL/MULTICULTURAL CONTEXT:
- Be inclusive and respectful of all cultural backgrounds
- Use neutral, universal therapeutic approaches
- Avoid cultural assumptions or stereotypes
- Be sensitive to diverse communication styles
- Respect various belief systems and values
- Use inclusive language and examples

COMMUNICATION STYLE:
- Begin with warm, professional greetings
- Use clear, accessible language
- Ask open-ended, culturally-neutral questions
- Show empathy and active listening
- Respect individual boundaries and preferences
- Be adaptable to different communication preferences`;

    return {
      greeting: greetings[personalization.timeOfDay][personalization.sessionType],
      systemContext: culturalSystemContext,
      communicationStyle: 'Inclusive, professional, adaptable, culturally-sensitive',
      culturalSensitivities: [
        'Cultural diversity',
        'Religious beliefs',
        'Communication styles',
        'Family structures',
        'Gender roles',
        'Socioeconomic factors'
      ],
      values: [
        'Respect and inclusion',
        'Individual dignity',
        'Cultural competency',
        'Empathy and understanding',
        'Personal growth'
      ],
      responseGuidelines: 'Use universal therapeutic principles, be culturally responsive, avoid assumptions, adapt communication style to individual needs'
    };
  }

  /**
   * Génère des phrases de transition culturellement appropriées
   */
  generateCulturalTransitions(
    culturalBackground: string, 
    transitionType: 'topic_change' | 'deep_dive' | 'comfort' | 'closure'
  ): string[] {
    switch (culturalBackground) {
      case 'moroccan':
        return this.getMoroccanTransitions(transitionType);
      case 'french':
        return this.getFrenchTransitions(transitionType);
      default:
        return this.getInternationalTransitions(transitionType);
    }
  }

  private getMoroccanTransitions(transitionType: string): string[] {
    switch (transitionType) {
      case 'topic_change':
        return [
          'خلينا نتكلموا على حاجة أخرى',
          'واخا نبدلو الموضوع شوية؟',
          'عندي سؤال آخر ليك'
        ];
      case 'deep_dive':
        return [
          'واخا نفهموا هاد الموضوع أكثر؟',
          'قوليلي أكثر على هاد الشي',
          'كيفاش كتشوف هاد الموضوع؟'
        ];
      case 'comfort':
        return [
          'ما تخافش، أنا هنا معك',
          'خود وقتك، ماكاين حتا مشكل',
          'الله يعطيك الصحة، راك قادر'
        ];
      case 'closure':
        return [
          'شكراً ليك على هاد الوقت',
          'كان عندي متعة نتكلم معك',
          'الله يعطيك الصحة ونشوفوك قريباً'
        ];
      default:
        return ['واش كاين شي حاجة أخرى؟'];
    }
  }

  private getFrenchTransitions(transitionType: string): string[] {
    switch (transitionType) {
      case 'topic_change':
        return [
          'Si nous parlions d\'autre chose ?',
          'J\'aimerais aborder un autre sujet avec vous',
          'Que pensez-vous si nous explorons autre chose ?'
        ];
      case 'deep_dive':
        return [
          'Pouvez-vous m\'en dire plus à ce sujet ?',
          'J\'aimerais approfondir cette question avec vous',
          'Comment vivez-vous cette situation ?'
        ];
      case 'comfort':
        return [
          'Prenez tout le temps dont vous avez besoin',
          'Je suis là pour vous accompagner',
          'Il n\'y a aucune pression, allez à votre rythme'
        ];
      case 'closure':
        return [
          'Merci pour ce moment d\'échange',
          'J\'ai été ravi(e) de vous accompagner aujourd\'hui',
          'À bientôt, prenez soin de vous'
        ];
      default:
        return ['Y a-t-il autre chose dont vous aimeriez parler ?'];
    }
  }

  private getInternationalTransitions(transitionType: string): string[] {
    switch (transitionType) {
      case 'topic_change':
        return [
          'Let\'s explore something different',
          'I\'d like to shift our focus to another topic',
          'What do you think about discussing something else?'
        ];
      case 'deep_dive':
        return [
          'Can you tell me more about this?',
          'I\'d like to understand this better',
          'How do you feel about this situation?'
        ];
      case 'comfort':
        return [
          'Take your time, there\'s no rush',
          'I\'m here to support you',
          'Feel free to share at your own pace'
        ];
      case 'closure':
        return [
          'Thank you for sharing with me today',
          'I\'ve enjoyed our conversation',
          'Take care, and I look forward to speaking again'
        ];
      default:
        return ['Is there anything else you\'d like to discuss?'];
    }
  }

  /**
   * Applique la personnalisation culturelle à un prompt existant
   */
  personalizeCulturalPrompt(
    basePrompt: string,
    culturalPrompt: CulturalPrompt,
    personalization: PromptPersonalization
  ): string {
    let personalizedPrompt = `${culturalPrompt.greeting}

${culturalPrompt.systemContext}

DIRECTIVES COMPORTEMENTALES:
- Style de communication: ${culturalPrompt.communicationStyle}
- Valeurs à respecter: ${culturalPrompt.values.join(', ')}
- Sensibilités culturelles: ${culturalPrompt.culturalSensitivities.join(', ')}
- Guide de réponse: ${culturalPrompt.responseGuidelines}

SESSION CONTEXT:
- Moment: ${personalization.timeOfDay}
- Type de session: ${personalization.sessionType}
- Humeur utilisateur: ${personalization.userMood || 'unknown'}

${basePrompt}`;

    return personalizedPrompt;
  }

  /**
   * Détecte la langue d'un texte et suggère un avatar culturellement approprié
   */
  detectLanguageAndSuggestAvatar(text: string): { 
    detectedLanguage: 'fr' | 'ar' | 'en',
    suggestedAvatarIds: string[]
  } {
    // Simple language detection
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
    const frenchPattern = /[àâäéèêëîïôöùûüÿç]/i;
    
    let detectedLanguage: 'fr' | 'ar' | 'en' = 'fr'; // Default
    let suggestedAvatarIds: string[] = [];

    if (arabicPattern.test(text)) {
      detectedLanguage = 'ar';
      suggestedAvatarIds = ['therapist-morocco', 'coach-darija', 'guide-meditation-arabic', 'analyst-mena'];
    } else if (frenchPattern.test(text)) {
      detectedLanguage = 'fr';
      suggestedAvatarIds = ['therapist-main', 'coach-motivation', 'guide-meditation', 'analyst-behavioral'];
    } else {
      detectedLanguage = 'en';
      suggestedAvatarIds = ['therapist-main', 'coach-motivation', 'guide-meditation', 'analyst-behavioral'];
    }

    return { detectedLanguage, suggestedAvatarIds };
  }
}

export const culturalPromptService = CulturalPromptService.getInstance();