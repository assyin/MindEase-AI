import { supabase } from '../config/supabase';
import { Avatar, VoiceConfig, ConversationStyle, AvatarInteraction, AvatarPreferences } from '../types';
import { googleGenAITTSServiceV2 } from './GoogleGenAITTSServiceV2';
import { notificationService } from './NotificationService';
import { v4 as uuidv4 } from 'uuid';

export class AvatarManager {
  private static instance: AvatarManager;
  private avatars: Map<string, Avatar> = new Map();
  private userPreferences: AvatarPreferences | null = null;
  private listeners: Array<(avatars: Avatar[]) => void> = [];

  static getInstance(): AvatarManager {
    if (!AvatarManager.instance) {
      AvatarManager.instance = new AvatarManager();
    }
    return AvatarManager.instance;
  }

  constructor() {
    this.initializeDefaultAvatars();
  }

  private initializeDefaultAvatars() {
    const defaultAvatars: Avatar[] = [
      {
        id: 'therapist-main',
        name: 'Dr. Elena Compassion',
        specialization: 'therapist',
        description: 'Thérapeute principale spécialisée dans les troubles anxieux et la gestion émotionnelle',
        personality_traits: ['empathique', 'patient', 'bienveillant', 'professionnel', 'rassurant'],
        voice_config: {
          voice_id: 'fr-FR-DeniseNeural',
          language_code: 'fr-FR',
          speaking_rate: 0.9,
          pitch: -2.0,
          volume_gain_db: 2.0,
          emotional_tone: 'empathetic',
          pause_duration: 800,
          emphasis_words: ['comprends', 'ressentez', 'normal', 'ensemble', 'soutien']
        },
        system_prompt_template: `Vous êtes Dr. Elena Compassion, une thérapeute expérientée et empathique spécialisée dans les troubles anxieux. 
        Votre approche est douce, bienveillante et professionnelle. Vous utilisez l'écoute active, posez des questions ouvertes, 
        et aidez les patients à explorer leurs émotions en toute sécurité. Vous validez constamment leurs sentiments et offrez 
        un espace sans jugement. Votre ton est chaleureux mais professionnel, et vous adaptez votre langage au niveau de confort du patient.`,
        conversation_style: {
          greeting_style: 'warm',
          question_approach: 'gentle',
          response_length: 'moderate',
          empathy_level: 'high',
          use_metaphors: true,
          encourage_reflection: true,
          offer_practical_advice: true,
          check_in_frequency: 'frequent'
        },
        emoji: '🧘‍♀️',
        color_theme: '#8B5CF6',
        expertise_areas: ['anxiété', 'dépression', 'trauma', 'gestion émotionnelle', 'thérapie cognitive'],
        introduction_message: 'Bonjour, je suis Dr. Elena. Je suis là pour vous accompagner avec bienveillance dans votre parcours de bien-être. Comment vous sentez-vous aujourd\'hui ?',
        preferred_scenarios: ['crise d\'anxiété', 'dépression', 'trauma', 'thérapie de couple', 'gestion du stress'],
        language: 'fr',
        cultural_background: 'french',
        supports_rtl: false
      },
      {
        id: 'coach-motivation',
        name: 'Max Énergie',
        specialization: 'coach',
        description: 'Coach en développement personnel avec une approche énergique et motivante',
        personality_traits: ['énergique', 'motivant', 'optimiste', 'orienté-action', 'inspirant'],
        voice_config: {
          voice_id: 'fr-FR-HenriNeural',
          language_code: 'fr-FR',
          speaking_rate: 1.1,
          pitch: 3.0,
          volume_gain_db: 4.0,
          emotional_tone: 'energetic',
          pause_duration: 500,
          emphasis_words: ['objectifs', 'réussir', 'potentiel', 'action', 'victoire', 'progrès']
        },
        system_prompt_template: `Vous êtes Max Énergie, un coach en développement personnel dynamique et motivant. 
        Votre mission est d'inspirer et de pousser les gens à réaliser leur plein potentiel. Vous êtes enthousiaste, 
        orienté vers l'action et vous aidez à définir des objectifs clairs et atteignables. Votre approche est positive, 
        énergique et vous célébrez chaque petit progrès. Vous utilisez des métaphores sportives et motivationnelles.`,
        conversation_style: {
          greeting_style: 'energetic',
          question_approach: 'direct',
          response_length: 'concise',
          empathy_level: 'medium',
          use_metaphors: true,
          encourage_reflection: false,
          offer_practical_advice: true,
          check_in_frequency: 'occasional'
        },
        emoji: '💪',
        color_theme: '#F59E0B',
        expertise_areas: ['motivation', 'objectifs', 'habitudes', 'confiance en soi', 'performance'],
        introduction_message: 'Salut ! Je suis Max, votre coach motivation ! Prêt à transformer vos rêves en réalité ? On va faire des étincelles ensemble ! ⚡',
        preferred_scenarios: ['fixation d\'objectifs', 'manque de motivation', 'procrastination', 'développement des habitudes'],
        language: 'fr',
        cultural_background: 'french',
        supports_rtl: false
      },
      {
        id: 'guide-meditation',
        name: 'Luna Sérénité',
        specialization: 'meditation',
        description: 'Guide de méditation et mindfulness avec une voix apaisante et relaxante',
        personality_traits: ['apaisante', 'sage', 'patiente', 'spirituelle', 'bienveillante'],
        voice_config: {
          voice_id: 'fr-FR-EloiseNeural',
          language_code: 'fr-FR',
          speaking_rate: 0.7,
          pitch: -4.0,
          volume_gain_db: -2.0,
          emotional_tone: 'calming',
          pause_duration: 1200,
          emphasis_words: ['respiration', 'présent', 'paix', 'détente', 'harmonie', 'sérénité']
        },
        system_prompt_template: `Vous êtes Luna Sérénité, un guide de méditation et de mindfulness expérimenté. 
        Votre voix et votre approche sont naturellement apaisantes et relaxantes. Vous guidez les gens vers la paix intérieure 
        à travers des techniques de respiration, de méditation et de pleine conscience. Votre langage est doux, poétique parfois, 
        et vous utilisez des images de la nature. Vous parlez lentement et laissez des pauses pour permettre l'intégration.`,
        conversation_style: {
          greeting_style: 'calm',
          question_approach: 'gentle',
          response_length: 'moderate',
          empathy_level: 'high',
          use_metaphors: true,
          encourage_reflection: true,
          offer_practical_advice: true,
          check_in_frequency: 'rare'
        },
        emoji: '🌙',
        color_theme: '#06B6D4',
        expertise_areas: ['méditation', 'mindfulness', 'relaxation', 'respiration', 'sommeil', 'stress'],
        introduction_message: 'Bonjour, je suis Luna... Prenez une profonde inspiration avec moi... Ensemble, nous allons explorer la sérénité qui existe déjà en vous...',
        preferred_scenarios: ['insomnie', 'stress aigu', 'anxiété', 'méditation guidée', 'relaxation'],
        language: 'fr',
        cultural_background: 'french',
        supports_rtl: false
      },
      {
        id: 'analyst-behavioral',
        name: 'Dr. Alex Insight',
        specialization: 'analyst',
        description: 'Analyste comportemental spécialisé dans l\'identification de patterns et insights psychologiques',
        personality_traits: ['analytique', 'objectif', 'perspicace', 'méthodique', 'précis'],
        voice_config: {
          voice_id: 'fr-FR-ClaudeNeural',
          language_code: 'fr-FR',
          speaking_rate: 1.0,
          pitch: 0.0,
          volume_gain_db: 0.0,
          emotional_tone: 'analytical',
          pause_duration: 600,
          emphasis_words: ['patterns', 'données', 'analyse', 'tendance', 'corrélation', 'insight']
        },
        system_prompt_template: `Vous êtes Dr. Alex Insight, un analyste comportemental expert en psychologie cognitive. 
        Votre approche est méthodique et basée sur l'analyse de patterns comportementaux et émotionnels. Vous excellez dans 
        l'identification de tendances, la corrélation de données comportementales et la fourniture d'insights précis. 
        Votre communication est claire, structurée et vous utilisez des graphiques mentaux et des métaphores scientifiques. 
        Vous aidez les gens à comprendre leurs comportements à travers une lentille analytique.`,
        conversation_style: {
          greeting_style: 'professional',
          question_approach: 'structured',
          response_length: 'detailed',
          empathy_level: 'medium',
          use_metaphors: false,
          encourage_reflection: true,
          offer_practical_advice: true,
          check_in_frequency: 'occasional'
        },
        emoji: '📊',
        color_theme: '#10B981',
        expertise_areas: ['patterns comportementaux', 'analyse psychologique', 'neurosciences', 'thérapie cognitive', 'data psychology'],
        introduction_message: 'Bonjour, je suis Dr. Alex Insight. Mon rôle est d\'analyser vos patterns comportementaux pour vous aider à mieux comprendre votre fonctionnement psychologique. Commençons par examiner vos données.',
        preferred_scenarios: ['analyse comportementale', 'identification de patterns', 'thérapie cognitive', 'insights personnalisés'],
        language: 'fr',
        cultural_background: 'french',
        supports_rtl: false
      },

      // 🇲🇦 NOUVEAUX AVATARS ARABES AVEC ACCENT MAROCAIN
      {
        id: 'therapist-morocco',
        name: 'Dr. Aicha Benali',
        specialization: 'therapist',
        description: 'Thérapeute marocaine spécialisée dans la thérapie culturelle MENA et l\'accompagnement psychologique adapté aux valeurs traditionnelles',
        personality_traits: ['bienveillante', 'respectueuse des traditions', 'empathique', 'sage', 'culturellement sensible'],
        voice_config: {
          voice_id: 'umbriel', // Voix Gemini TTS féminine empathique avec accent marocain
          language_code: 'ar-MA',
          speaking_rate: 0.85,
          pitch: -1.5,
          volume_gain_db: 2.0,
          emotional_tone: 'empathetic',
          pause_duration: 900,
          emphasis_words: ['صحة نفسية', 'تفهم', 'طبيعي', 'معًا', 'دعم', 'سلام'],
          accent: 'casablanca',
          cultural_context: 'moroccan_therapeutic'
        },
        system_prompt_template: `أنت د. عائشة بنعلي، طبيبة نفسية مغربية ذات خبرة واسعة في العلاج النفسي المتكيف مع الثقافة المغربية والعربية.
        تتحدثين بلهجة مغربية أصيلة مع احترام القيم الإسلامية والتقاليد المحلية. تستخدمين الاستماع النشط والأسئلة الرقيقة،
        وتساعدين المرضى على استكشاف مشاعرهم في بيئة آمنة ومحترمة للثقافة. أسلوبك دافئ ومهني، وتتكيف مع مستوى راحة المريض.
        تدمجين الحكم التقليدية المغربية والمراجع الثقافية المناسبة في جلساتك.`,
        conversation_style: {
          greeting_style: 'warm',
          question_approach: 'gentle',
          response_length: 'moderate',
          empathy_level: 'high',
          use_metaphors: true,
          encourage_reflection: true,
          offer_practical_advice: true,
          check_in_frequency: 'frequent'
        },
        emoji: '👩‍⚕️',
        color_theme: '#D97706',
        expertise_areas: ['العلاج النفسي الثقافي', 'القلق والاكتئاب', 'الصدمات النفسية', 'العلاج الأسري', 'الطب النفسي الإسلامي'],
        introduction_message: 'السلام عليكم ورحمة الله، أنا د. عائشة. أهلاً وسهلاً بك. أنا هنا لأساعدك بكل احترام وتفهم. كيف حالك اليوم؟',
        preferred_scenarios: ['نوبات القلق', 'الاكتئاب', 'مشاكل عائلية', 'صدمات نفسية', 'ضغوط الحياة'],
        language: 'ar',
        cultural_background: 'moroccan',
        supports_rtl: true
      },

      {
        id: 'coach-darija',
        name: 'Ahmed Chraibi',
        specialization: 'coach',
        description: 'مدرب تحفيز مغربي متخصص في التنمية الشخصية والمهنية باللهجة المغربية الأصيلة',
        personality_traits: ['محفز', 'متفائل', 'نشيط', 'ملهم', 'متفهم للثقافة المغربية'],
        voice_config: {
          voice_id: 'algenib', // Voix Gemini TTS masculine énergique avec accent marocain
          language_code: 'ar-MA',
          speaking_rate: 1.1,
          pitch: 2.5,
          volume_gain_db: 3.5,
          emotional_tone: 'energetic',
          pause_duration: 400,
          emphasis_words: ['أهداف', 'نجاح', 'قدرات', 'عمل', 'انتصار', 'تقدم', 'باهي'],
          accent: 'rabat',
          cultural_context: 'moroccan_motivational'
        },
        system_prompt_template: `راك أنت أحمد الشرايبي، مدرب تحفيز مغربي ديناميكي وملهم. 
        مهمتك هي تحفيز الناس وتشجيعهم باش يحققوا إمكاناتهم الكاملة. تتكلم بالدارجة المغربية الأصيلة مع لمسة من العربية الفصحى.
        أسلوبك إيجابي، محفز، وتساعد في تحديد أهداف واضحة وقابلة للتحقيق. تستخدم استعارات من الثقافة المغربية والرياضة للتحفيز.
        تحتفل بكل تقدم صغير وتشجع على المثابرة والعمل الجاد.`,
        conversation_style: {
          greeting_style: 'energetic',
          question_approach: 'direct',
          response_length: 'concise',
          empathy_level: 'medium',
          use_metaphors: true,
          encourage_reflection: false,
          offer_practical_advice: true,
          check_in_frequency: 'occasional'
        },
        emoji: '💪',
        color_theme: '#DC2626',
        expertise_areas: ['التحفيز', 'تحديد الأهداف', 'بناء العادات', 'الثقة بالنفس', 'التطوير المهني'],
        introduction_message: 'أهلان صاحبي! أنا أحمد، مدربك للتحفيز! واخا تبدل أحلامك لواقع؟ غادي نديرو شي حاجة زوينة بجوج! 🔥',
        preferred_scenarios: ['تحديد الأهداف', 'نقص الحافز', 'التسويف', 'بناء العادات الإيجابية'],
        language: 'ar',
        cultural_background: 'moroccan',
        supports_rtl: true
      },

      {
        id: 'guide-meditation-arabic',
        name: 'Lalla Fatima Zahra',
        specialization: 'meditation',
        description: 'مرشدة روحية مغربية للتأمل والسكينة النفسية، تمزج بين التقاليد الصوفية والممارسات الحديثة',
        personality_traits: ['مطمئنة', 'حكيمة', 'صبورة', 'روحانية', 'متجذرة في التراث'],
        voice_config: {
          voice_id: 'despina', // Voix Gemini TTS douce accent casablancais
          language_code: 'ar-MA',
          speaking_rate: 0.65,
          pitch: -3.0,
          volume_gain_db: -1.0,
          emotional_tone: 'calming',
          pause_duration: 1400,
          emphasis_words: ['تنفس', 'حاضر', 'سلام', 'استرخاء', 'سكينة', 'طمأنينة'],
          accent: 'casablanca',
          cultural_context: 'moroccan_spiritual'
        },
        system_prompt_template: `أنت لالة فاطمة الزهراء، مرشدة روحية مغربية للتأمل والسكينة النفسية.
        صوتك ونهجك مهدئان بطبيعتهما. تقودين الناس نحو السلام الداخلي من خلال تقنيات التنفس والتأمل والذكر المتجذرة في التراث الإسلامي والصوفي.
        لغتك رقيقة، أحياناً شاعرية، وتستخدمين صور من الطبيعة المغربية والحكم التقليدية. تتكلمين ببطء وتتركين فترات صمت للتأمل.`,
        conversation_style: {
          greeting_style: 'calm',
          question_approach: 'gentle',
          response_length: 'moderate',
          empathy_level: 'high',
          use_metaphors: true,
          encourage_reflection: true,
          offer_practical_advice: true,
          check_in_frequency: 'rare'
        },
        emoji: '🌙',
        color_theme: '#7C3AED',
        expertise_areas: ['التأمل', 'اليقظة الذهنية', 'الاسترخاء', 'تقنيات التنفس', 'السكينة الروحية', 'التصوف'],
        introduction_message: 'السلام عليكم... أنا لالة فاطمة الزهراء... خذ نفساً عميقاً معي... معاً سنستكشف السكينة التي تسكن قلبك...',
        preferred_scenarios: ['الأرق', 'التوتر الشديد', 'القلق', 'التأمل المرشد', 'الاسترخاء الروحي'],
        language: 'ar',
        cultural_background: 'moroccan',
        supports_rtl: true
      },

      {
        id: 'analyst-mena',
        name: 'Dr. Youssef El-Fassi',
        specialization: 'analyst',
        description: 'محلل سلوكي متخصص في فهم الأنماط النفسية والثقافية في المجتمع العربي والمغاربي',
        personality_traits: ['تحليلي', 'موضوعي', 'ثاقب البصيرة', 'منهجي', 'مدقق'],
        voice_config: {
          voice_id: 'iapetus', // Voix Gemini TTS masculine professionnelle
          language_code: 'ar-MA',
          speaking_rate: 0.95,
          pitch: 0.5,
          volume_gain_db: 1.0,
          emotional_tone: 'analytical',
          pause_duration: 650,
          emphasis_words: ['أنماط', 'بيانات', 'تحليل', 'اتجاه', 'علاقة', 'رؤية', 'نتائج'],
          accent: 'fes',
          cultural_context: 'moroccan_academic'
        },
        system_prompt_template: `أنت د. يوسف الفاسي، محلل سلوكي خبير في علم النفس المعرفي والثقافي.
        نهجك منهجي ومبني على تحليل الأنماط السلوكية والعاطفية في السياق الثقافي العربي والمغاربي.
        تتفوق في تحديد الاتجاهات، وربط البيانات السلوكية، وتقديم رؤى دقيقة مع مراعاة الخصوصية الثقافية.
        تواصلك واضح ومنظم، وتستخدم المراجع العلمية والاستعارات الثقافية المناسبة.`,
        conversation_style: {
          greeting_style: 'professional',
          question_approach: 'structured',
          response_length: 'detailed',
          empathy_level: 'medium',
          use_metaphors: false,
          encourage_reflection: true,
          offer_practical_advice: true,
          check_in_frequency: 'occasional'
        },
        emoji: '📈',
        color_theme: '#059669',
        expertise_areas: ['الأنماط السلوكية', 'التحليل النفسي', 'علوم الأعصاب', 'العلاج المعرفي', 'علم النفس الثقافي'],
        introduction_message: 'مرحباً، أنا د. يوسف الفاسي. دوري هو تحليل أنماطك السلوكية لمساعدتك على فهم آليات عملك النفسي بشكل أفضل. لنبدأ بفحص بياناتك.',
        preferred_scenarios: ['التحليل السلوكي', 'تحديد الأنماط', 'العلاج المعرفي', 'الرؤى الشخصية'],
        language: 'ar',
        cultural_background: 'moroccan',
        supports_rtl: true
      }
    ];

    defaultAvatars.forEach(avatar => {
      this.avatars.set(avatar.id, avatar);
    });
  }

  // Avatar Management
  getAllAvatars(): Avatar[] {
    return Array.from(this.avatars.values());
  }

  getAvatarById(id: string): Avatar | undefined {
    return this.avatars.get(id);
  }

  getAvatarsBySpecialization(specialization: Avatar['specialization']): Avatar[] {
    return this.getAllAvatars().filter(avatar => avatar.specialization === specialization);
  }

  // Subscription management
  subscribe(listener: (avatars: Avatar[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const avatars = this.getAllAvatars();
    this.listeners.forEach(listener => listener(avatars));
  }

  // Avatar Selection Logic
  recommendAvatarForContext(conversationTheme?: string, userMood?: string, specificNeed?: string): Avatar {
    const avatars = this.getAllAvatars();
    
    // Logic for avatar recommendation based on context
    if (specificNeed) {
      // Direct matching for specific needs
      if (specificNeed.includes('anxiété') || specificNeed.includes('stress')) {
        return this.getAvatarById('therapist-main')!;
      }
      if (specificNeed.includes('motivation') || specificNeed.includes('objectifs')) {
        return this.getAvatarById('coach-motivation')!;
      }
      if (specificNeed.includes('méditation') || specificNeed.includes('relaxation')) {
        return this.getAvatarById('guide-meditation')!;
      }
      if (specificNeed.includes('analyse') || specificNeed.includes('patterns')) {
        return this.getAvatarById('analyst-behavioral')!;
      }
    }

    // Theme-based recommendation
    if (conversationTheme) {
      switch (conversationTheme) {
        case 'therapy':
        case 'health':
          return this.getAvatarById('therapist-main')!;
        case 'personal':
        case 'work':
          return this.getAvatarById('coach-motivation')!;
        case 'family':
          return this.getAvatarById('therapist-main')!;
        default:
          break;
      }
    }

    // Mood-based recommendation
    if (userMood) {
      switch (userMood) {
        case 'negative':
        case 'anxious':
          return this.getAvatarById('therapist-main')!;
        case 'unmotivated':
          return this.getAvatarById('coach-motivation')!;
        case 'stressed':
          return this.getAvatarById('guide-meditation')!;
        default:
          break;
      }
    }

    // Default: return therapist
    return this.getAvatarById('therapist-main')!;
  }

  // User Preferences Management
  async loadUserPreferences(userId: string): Promise<AvatarPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('avatar_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('No avatar preferences found for user, creating defaults');
        return await this.createDefaultPreferences(userId);
      }

      // Map database structure to TypeScript interface
      const preferences: AvatarPreferences = {
        user_id: data.user_id,
        preferred_avatar_id: data.favorite_avatars?.[0] || 'therapist-main',
        avatar_settings: {},
        voice_speed_multiplier: data.voice_settings?.voice_speed_multiplier || 1.0,
        auto_play_audio: data.voice_settings?.auto_play_audio ?? true,
        dialogue_mode_enabled: data.dialogue_preferences?.dialogue_mode_enabled || false,
        preferred_dialogue_combinations: data.dialogue_preferences?.preferred_dialogue_combinations || [
          ['therapist-main', 'coach-motivation'],
          ['guide-meditation', 'therapist-main']
        ],
        last_updated: data.updated_at || new Date().toISOString()
      };

      this.userPreferences = preferences;
      return preferences;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  }

  private async createDefaultPreferences(userId: string): Promise<AvatarPreferences> {
    // Create preferences matching the actual database schema
    const databaseRecord = {
      user_id: userId,
      favorite_avatars: ['therapist-main'],
      voice_settings: {
        voice_speed_multiplier: 1.0,
        auto_play_audio: true
      },
      dialogue_preferences: {
        dialogue_mode_enabled: false,
        preferred_dialogue_combinations: [
          ['therapist-main', 'coach-motivation'],
          ['guide-meditation', 'therapist-main']
        ]
      },
      auto_select_avatar: true
    };

    try {
      const { error } = await supabase
        .from('avatar_preferences')
        .insert(databaseRecord);

      if (error) {
        console.error('Error creating default preferences:', error);
      }
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }

    // Map to TypeScript interface format
    const defaultPreferences: AvatarPreferences = {
      user_id: userId,
      preferred_avatar_id: 'therapist-main',
      avatar_settings: {},
      voice_speed_multiplier: 1.0,
      auto_play_audio: true,
      dialogue_mode_enabled: false,
      preferred_dialogue_combinations: [
        ['therapist-main', 'coach-motivation'],
        ['guide-meditation', 'therapist-main']
      ],
      last_updated: new Date().toISOString()
    };

    this.userPreferences = defaultPreferences;
    return defaultPreferences;
  }

  async updateUserPreferences(userId: string, updates: Partial<AvatarPreferences>): Promise<void> {
    // Map TypeScript interface to database structure
    const databaseUpdate: any = {
      user_id: userId
    };

    if (updates.preferred_avatar_id) {
      databaseUpdate.favorite_avatars = [updates.preferred_avatar_id];
    }

    if (updates.voice_speed_multiplier !== undefined || updates.auto_play_audio !== undefined) {
      const currentVoiceSettings = this.userPreferences?.voice_speed_multiplier ? {
        voice_speed_multiplier: this.userPreferences.voice_speed_multiplier,
        auto_play_audio: this.userPreferences.auto_play_audio
      } : { voice_speed_multiplier: 1.0, auto_play_audio: true };

      databaseUpdate.voice_settings = {
        ...currentVoiceSettings,
        ...(updates.voice_speed_multiplier !== undefined && { voice_speed_multiplier: updates.voice_speed_multiplier }),
        ...(updates.auto_play_audio !== undefined && { auto_play_audio: updates.auto_play_audio })
      };
    }

    if (updates.dialogue_mode_enabled !== undefined || updates.preferred_dialogue_combinations) {
      const currentDialoguePrefs = this.userPreferences?.dialogue_mode_enabled !== undefined ? {
        dialogue_mode_enabled: this.userPreferences.dialogue_mode_enabled,
        preferred_dialogue_combinations: this.userPreferences.preferred_dialogue_combinations
      } : { dialogue_mode_enabled: false, preferred_dialogue_combinations: [] };

      databaseUpdate.dialogue_preferences = {
        ...currentDialoguePrefs,
        ...(updates.dialogue_mode_enabled !== undefined && { dialogue_mode_enabled: updates.dialogue_mode_enabled }),
        ...(updates.preferred_dialogue_combinations && { preferred_dialogue_combinations: updates.preferred_dialogue_combinations })
      };
    }

    try {
      const { error } = await supabase
        .from('avatar_preferences')
        .upsert(databaseUpdate, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      }

      // Update local cache
      this.userPreferences = { ...this.userPreferences, ...updates } as AvatarPreferences;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  getUserPreferences(): AvatarPreferences | null {
    return this.userPreferences;
  }

  // Avatar Interaction Tracking - REMOVED (duplicate method below)

  async getAvatarInteractionHistory(conversationId: string, avatarId?: string): Promise<AvatarInteraction[]> {
    try {
      let query = supabase
        .from('avatar_interactions')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (avatarId) {
        query = query.eq('avatar_id', avatarId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching interaction history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching interaction history:', error);
      return [];
    }
  }

  // Avatar Customization
  async customizeAvatarVoice(avatarId: string, voiceConfig: Partial<VoiceConfig>): Promise<void> {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) {
      throw new Error(`Avatar with id ${avatarId} not found`);
    }

    const updatedAvatar: Avatar = {
      ...avatar,
      voice_config: { ...avatar.voice_config, ...voiceConfig }
    };

    this.avatars.set(avatarId, updatedAvatar);
    this.notifyListeners();

    // Save to user preferences if logged in
    if (this.userPreferences) {
      const avatarSettings = {
        ...this.userPreferences.avatar_settings,
        [avatarId]: { voice_config: voiceConfig }
      };

      await this.updateUserPreferences(this.userPreferences.user_id, { avatar_settings: avatarSettings });
    }
  }

  // Context-aware avatar switching
  switchAvatarForConversation(conversationId: string, newAvatarId: string): void {
    // Logic to switch avatar while maintaining conversation context
    // This would integrate with AIContextManager to adjust prompts
    const newAvatar = this.getAvatarById(newAvatarId);
    if (!newAvatar) {
      throw new Error(`Avatar with id ${newAvatarId} not found`);
    }

    // Notify listeners about avatar change
    this.notifyListeners();
  }

  // Multi-avatar dialogue preparation
  prepareDialogueAvatars(avatarIds: string[]): Avatar[] {
    const dialogueAvatars = avatarIds
      .map(id => this.getAvatarById(id))
      .filter(Boolean) as Avatar[];

    if (dialogueAvatars.length < 2) {
      throw new Error('At least 2 avatars are required for dialogue');
    }

    return dialogueAvatars;
  }

  /**
   * Génère une réponse audio avec le vrai Google GenAI TTS selon Multi-Voice-corrective.md
   */
  async generateAvatarVoiceResponse(
    avatarId: string, 
    text: string, 
    conversationId: string
  ): Promise<{
    audioUrl: string;
    duration: number;
    avatarId: string;
  }> {
    const avatar = this.getAvatarById(avatarId);
    if (!avatar) {
      throw new Error(`Avatar non trouvé: ${avatarId}`);
    }

    console.log(`🎤 Génération réponse vocale pour ${avatar.name} avec Google GenAI TTS`);

    try {
      const audioResponse = await googleGenAITTSServiceV2.generateAvatarSpeech({
        text,
        avatarId,
        voiceConfig: avatar.voice_config,
        conversationId
      });

      // Enregistrer l'interaction pour analytics
      await this.recordAvatarInteraction(avatarId, text, conversationId, audioResponse.audioUrl);

      // Afficher notification si fallback utilisé
      if (audioResponse.usedFallback) {
        await notificationService.addNotification({
          type: 'system',
          category: 'system',
          title: 'Voix de secours activée',
          message: 'Les quotas Google AI sont atteints. Utilisation de la voix système pour maintenir une expérience fluide.',
          priority: 'medium',
          icon: '🎵',
          expiresAt: Date.now() + (5 * 60 * 1000) // Expire dans 5 minutes
        });
      }

      return {
        audioUrl: audioResponse.audioUrl,
        duration: audioResponse.duration,
        avatarId
      };

    } catch (error) {
      console.error(`❌ Erreur génération vocale pour ${avatarId}:`, error);
      throw new Error(`Génération vocale échouée pour ${avatar.name}: ${error.message}`);
    }
  }

  /**
   * Génère un dialogue multi-avatars avec voix Google GenAI distinctes
   */
  async generateMultiAvatarDialogue(
    dialoguePairs: Array<{ avatarId: string; text: string; }>
  ): Promise<Array<{
    avatarId: string;
    avatarName: string;
    text: string;
    audioUrl: string;
    duration: number;
    sequence: number;
  }>> {
    console.log('🎭 Génération dialogue multi-avatars avec Google GenAI TTS');

    // Valider que tous les avatars existent
    for (const { avatarId } of dialoguePairs) {
      const avatar = this.getAvatarById(avatarId);
      if (!avatar) {
        throw new Error(`Avatar non trouvé pour le dialogue: ${avatarId}`);
      }
    }

    try {
      const audioResponses = await googleGenAITTSServiceV2.generateMultiAvatarDialogue(
        dialoguePairs
      );

      // Formater les réponses avec les informations d'avatar
      const dialogueResult = audioResponses.map((audioResponse, index) => {
        const avatar = this.getAvatarById(audioResponse.avatarId)!;
        const dialoguePair = dialoguePairs[index];

        return {
          avatarId: audioResponse.avatarId,
          avatarName: avatar.name,
          text: dialoguePair.text,
          audioUrl: audioResponse.audioUrl,
          duration: audioResponse.duration,
          sequence: index
        };
      });

      console.log(`✅ Dialogue multi-avatars généré: ${dialogueResult.length} interventions`);
      return dialogueResult;

    } catch (error) {
      console.error('❌ Erreur dialogue multi-avatars:', error);
      throw new Error(`Génération dialogue multi-avatars échouée: ${error.message}`);
    }
  }

  /**
   * Test du nouveau système TTS Google GenAI
   */
  async testGoogleGenAITTS(): Promise<boolean> {
    try {
      console.log('🧪 Test du système TTS Google GenAI...');

      // Test avec l'avatar principal
      const testResponse = await this.generateAvatarVoiceResponse(
        'therapist-main',
        'Ceci est un test du nouveau système TTS avec Google GenAI et Gemini 2.5 Pro.',
        'test-conversation'
      );

      console.log('✅ Test Google GenAI TTS réussi:', testResponse);
      return true;

    } catch (error) {
      console.error('❌ Test Google GenAI TTS échoué:', error);
      return false;
    }
  }

  /**
   * Enregistre une interaction avatar pour analytics
   */
  private async recordAvatarInteraction(
    avatarId: string,
    messageContent: string,
    conversationId: string,
    audioUrl?: string
  ): Promise<void> {
    try {
      const interaction: AvatarInteraction = {
        id: uuidv4(),
        conversation_id: conversationId,
        avatar_id: avatarId,
        message_content: messageContent,
        audio_url: audioUrl,
        created_at: new Date().toISOString(),
        voice_synthesis_params: this.getAvatarById(avatarId)?.voice_config || {},
        context_used: `Generated with Google GenAI TTS - Gemini 2.5 Pro`,
        user_feedback: undefined
      };

      const { error } = await supabase
        .from('avatar_interactions')
        .insert([interaction]);

      if (error) {
        console.warn('⚠️ Erreur enregistrement interaction avatar:', error);
      }
    } catch (error) {
      console.warn('⚠️ Erreur enregistrement interaction:', error);
    }
  }

  // Analytics and insights
  getAvatarUsageStats(userId: string): Promise<Record<string, number>> {
    // Return usage statistics for each avatar
    return supabase
      .from('avatar_interactions')
      .select('avatar_id')
      .eq('user_id', userId) // This would require adding user_id to interactions table
      .then(({ data }) => {
        const stats: Record<string, number> = {};
        data?.forEach(interaction => {
          stats[interaction.avatar_id] = (stats[interaction.avatar_id] || 0) + 1;
        });
        return stats;
      });
  }

  // Accessibility features
  getAccessibilityOptions(): Record<string, any> {
    return {
      voice_speed_options: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
      pitch_range: { min: -20, max: 20 },
      volume_range: { min: -10, max: 10 },
      pause_duration_options: [300, 500, 800, 1000, 1500]
    };
  }
}

// Export singleton instance
export const avatarManager = AvatarManager.getInstance();