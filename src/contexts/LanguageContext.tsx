import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageSettings, CulturalContext } from '../types';

interface LanguageContextType {
  languageSettings: LanguageSettings;
  culturalContext: CulturalContext;
  setLanguage: (language: 'fr' | 'ar' | 'en') => void;
  updateSettings: (settings: Partial<LanguageSettings>) => void;
  setCulturalContext: (context: Partial<CulturalContext>) => void;
  getLocalizedText: (key: string) => string;
  isRtl: () => boolean;
  formatText: (text: string, isRtl?: boolean) => string;
  getTextDirection: () => 'ltr' | 'rtl';
  shouldUseRtl: (elementType?: 'text' | 'input' | 'interface') => boolean;
}

interface LanguageProviderProps {
  children: ReactNode;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Localized text strings
const localizedStrings = {
  fr: {
    welcome: 'Bienvenue',
    hello: 'Bonjour',
    goodbye: 'Au revoir',
    therapist: 'Thérapeute',
    coach: 'Coach',
    meditation_guide: 'Guide de méditation',
    analyst: 'Analyste',
    language_changed: 'Langue changée vers le français',
    rtl_enabled: 'Mode RTL activé',
    rtl_disabled: 'Mode RTL désactivé',
    select_avatar: 'Choisir un avatar',
    voice_preview: 'Aperçu vocal',
    cultural_therapy: 'Thérapie culturelle',
    motivational_coaching: 'Coaching motivationnel',
    spiritual_guidance: 'Guidance spirituelle',
    behavioral_analysis: 'Analyse comportementale'
  },
  ar: {
    welcome: 'أهلاً وسهلاً',
    hello: 'السلام عليكم',
    goodbye: 'مع السلامة',
    therapist: 'طبيب نفسي',
    coach: 'مدرب تحفيز',
    meditation_guide: 'مرشد روحي',
    analyst: 'محلل سلوكي',
    language_changed: 'تم تغيير اللغة إلى العربية',
    rtl_enabled: 'تم تفعيل الكتابة من اليمين إلى اليسار',
    rtl_disabled: 'تم إلغاء الكتابة من اليمين إلى اليسار',
    select_avatar: 'اختر أفاتار',
    voice_preview: 'استماع للصوت',
    cultural_therapy: 'العلاج النفسي الثقافي',
    motivational_coaching: 'التدريب التحفيزي',
    spiritual_guidance: 'الإرشاد الروحي',
    behavioral_analysis: 'التحليل السلوكي'
  },
  en: {
    welcome: 'Welcome',
    hello: 'Hello',
    goodbye: 'Goodbye',
    therapist: 'Therapist',
    coach: 'Coach',
    meditation_guide: 'Meditation Guide',
    analyst: 'Analyst',
    language_changed: 'Language changed to English',
    rtl_enabled: 'RTL mode enabled',
    rtl_disabled: 'RTL mode disabled',
    select_avatar: 'Select Avatar',
    voice_preview: 'Voice Preview',
    cultural_therapy: 'Cultural Therapy',
    motivational_coaching: 'Motivational Coaching',
    spiritual_guidance: 'Spiritual Guidance',
    behavioral_analysis: 'Behavioral Analysis'
  }
};

// Cultural contexts
const culturalContexts: Record<string, CulturalContext> = {
  fr: {
    region: 'france',
    traditions: ['laïcité', 'république', 'égalité'],
    values: ['liberté', 'égalité', 'fraternité', 'laïcité'],
    greeting_style: 'formal_polite',
    communication_preferences: ['direct', 'rationnel', 'respectueux']
  },
  ar: {
    region: 'morocco',
    traditions: ['hospitalité marocaine', 'respect des aînés', 'solidarité familiale', 'valeurs islamiques'],
    values: ['respect', 'famille', 'foi', 'générosité', 'honneur'],
    greeting_style: 'warm_respectful',
    communication_preferences: ['respectueux', 'patient', 'métaphorique', 'traditionnel']
  },
  en: {
    region: 'international',
    traditions: ['individual freedom', 'diversity', 'innovation'],
    values: ['freedom', 'innovation', 'diversity', 'pragmatism'],
    greeting_style: 'friendly_professional',
    communication_preferences: ['direct', 'efficient', 'inclusive', 'practical']
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>({
    current_language: 'fr',
    preferred_languages: ['fr'],
    auto_detect_language: false,
    rtl_enabled: false,
    arabic_keyboard_enabled: false
  });

  const [culturalContext, setCulturalContextState] = useState<CulturalContext>(
    culturalContexts.fr
  );

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mindease_language_settings');
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setLanguageSettings(parsedSettings);
        setCulturalContextState(culturalContexts[parsedSettings.current_language] || culturalContexts.fr);
      } catch (error) {
        console.warn('Failed to parse stored language settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('mindease_language_settings', JSON.stringify(languageSettings));
  }, [languageSettings]);

  // Update HTML attributes when language changes - BUT keep interface LTR
  useEffect(() => {
    document.documentElement.lang = languageSettings.current_language;
    // Ne plus changer la direction globale - on garde toujours LTR pour l'interface
    document.documentElement.dir = 'ltr';
    
    // Retirer les classes RTL globales pour éviter le mirroring de l'interface
    document.documentElement.classList.remove('rtl');
    document.body.classList.remove('rtl');
  }, [languageSettings]);

  const setLanguage = (language: 'fr' | 'ar' | 'en') => {
    const newSettings: LanguageSettings = {
      ...languageSettings,
      current_language: language,
      rtl_enabled: language === 'ar',
      arabic_keyboard_enabled: language === 'ar'
    };
    
    setLanguageSettings(newSettings);
    setCulturalContextState(culturalContexts[language] || culturalContexts.fr);

    // Show language change notification
    console.log(getLocalizedText('language_changed'));
  };

  const updateSettings = (settings: Partial<LanguageSettings>) => {
    setLanguageSettings(prev => ({ ...prev, ...settings }));
  };

  const setCulturalContext = (context: Partial<CulturalContext>) => {
    setCulturalContextState(prev => ({ ...prev, ...context }));
  };

  const getLocalizedText = (key: string): string => {
    const strings = localizedStrings[languageSettings.current_language];
    return strings?.[key as keyof typeof strings] || key;
  };

  const isRtl = (): boolean => {
    return languageSettings.rtl_enabled;
  };

  const formatText = (text: string, isRtlOverride?: boolean): string => {
    const shouldUseRtl = isRtlOverride !== undefined ? isRtlOverride : isRtl();
    
    if (shouldUseRtl && languageSettings.current_language === 'ar') {
      // Add Arabic/RTL specific formatting if needed
      return text;
    }
    
    return text;
  };

  // Nouvelle fonction pour déterminer la direction du texte
  const getTextDirection = (): 'ltr' | 'rtl' => {
    return languageSettings.current_language === 'ar' ? 'rtl' : 'ltr';
  };

  // Fonction pour déterminer si RTL doit être utilisé selon le type d'élément
  const shouldUseRtl = (elementType: 'text' | 'input' | 'interface' = 'text'): boolean => {
    // RTL seulement pour le texte arabe, jamais pour l'interface
    if (elementType === 'interface') {
      return false; // Interface reste toujours LTR
    }
    
    // RTL pour les zones de texte et input seulement si c'est de l'arabe
    if (elementType === 'text' || elementType === 'input') {
      return languageSettings.current_language === 'ar';
    }
    
    return false;
  };

  const contextValue: LanguageContextType = {
    languageSettings,
    culturalContext,
    setLanguage,
    updateSettings,
    setCulturalContext,
    getLocalizedText,
    isRtl,
    formatText,
    getTextDirection,
    shouldUseRtl
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Utility function to detect text language
export const detectLanguage = (text: string): 'fr' | 'ar' | 'en' => {
  // Simple language detection based on character patterns
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  const frenchPattern = /[àâäéèêëîïôöùûüÿç]/i;
  
  if (arabicPattern.test(text)) {
    return 'ar';
  } else if (frenchPattern.test(text)) {
    return 'fr';
  }
  
  // Default to French for other cases
  return 'fr';
};

// Utility function to get appropriate greeting based on cultural context
export const getCulturalGreeting = (culturalContext: CulturalContext, timeOfDay: 'morning' | 'afternoon' | 'evening' = 'morning'): string => {
  switch (culturalContext.region) {
    case 'morocco':
      return timeOfDay === 'morning' ? 'السلام عليكم ورحمة الله وبركاته' : 
             timeOfDay === 'afternoon' ? 'السلام عليكم' : 'مساء الخير';
    case 'france':
      return timeOfDay === 'morning' ? 'Bonjour' : 
             timeOfDay === 'afternoon' ? 'Bonne après-midi' : 'Bonsoir';
    case 'international':
      return timeOfDay === 'morning' ? 'Good morning' : 
             timeOfDay === 'afternoon' ? 'Good afternoon' : 'Good evening';
    default:
      return 'Bonjour';
  }
};