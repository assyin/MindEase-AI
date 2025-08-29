import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LanguageSettings } from '../types';

interface Language {
  code: 'fr' | 'ar' | 'en';
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

interface LanguageSelectorProps {
  currentLanguage: 'fr' | 'ar' | 'en';
  onLanguageChange: (language: 'fr' | 'ar' | 'en') => void;
  onSettingsChange?: (settings: Partial<LanguageSettings>) => void;
  className?: string;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  onSettingsChange,
  className = '',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>({
    current_language: currentLanguage,
    preferred_languages: [currentLanguage],
    auto_detect_language: false,
    rtl_enabled: currentLanguage === 'ar',
    arabic_keyboard_enabled: false
  });

  const languages: Language[] = [
    {
      code: 'fr',
      name: 'Français',
      nativeName: 'Français',
      flag: '🇫🇷',
      rtl: false
    },
    {
      code: 'ar',
      name: 'العربية',
      nativeName: 'العربية (المغربية)',
      flag: '🇲🇦',
      rtl: true
    },
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      rtl: false
    }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  useEffect(() => {
    // Update HTML dir attribute when language changes
    document.documentElement.dir = currentLang.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang.code;
    
    // Apply RTL styles if Arabic
    if (currentLang.rtl) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [currentLang]);

  const handleLanguageSelect = (language: Language) => {
    const newSettings: LanguageSettings = {
      ...languageSettings,
      current_language: language.code,
      rtl_enabled: language.rtl,
      arabic_keyboard_enabled: language.code === 'ar'
    };

    setLanguageSettings(newSettings);
    onLanguageChange(language.code);
    onSettingsChange?.(newSettings);
    setIsOpen(false);
  };

  const toggleAutoDetect = () => {
    const newSettings = {
      ...languageSettings,
      auto_detect_language: !languageSettings.auto_detect_language
    };
    setLanguageSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const toggleArabicKeyboard = () => {
    const newSettings = {
      ...languageSettings,
      arabic_keyboard_enabled: !languageSettings.arabic_keyboard_enabled
    };
    setLanguageSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          dir="ltr"
        >
          <span className="text-lg">{currentLang.flag}</span>
          <span className="text-sm font-medium">{currentLang.code.toUpperCase()}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
            <div className="p-2">
              {languages.map(language => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                    language.code === currentLanguage
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50'
                  }`}
                  dir={language.rtl ? 'rtl' : 'ltr'}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{language.flag}</span>
                    <div className="text-left">
                      <div className="font-medium">{language.name}</div>
                      <div className="text-sm text-gray-500">{language.nativeName}</div>
                    </div>
                  </div>
                  {language.code === currentLanguage && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-xl">
        <div className="flex items-center space-x-3" dir="ltr">
          <Globe className="w-6 h-6" />
          <div>
            <h3 className="text-lg font-semibold">Sélection de langue</h3>
            <p className="text-sm opacity-90">Choisissez votre langue préférée</p>
          </div>
        </div>
      </div>

      {/* Language Options */}
      <div className="p-4 space-y-3">
        {languages.map(language => (
          <button
            key={language.code}
            onClick={() => handleLanguageSelect(language)}
            className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
              language.code === currentLanguage
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            dir={language.rtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{language.flag}</span>
              <div className="text-left">
                <div className="font-semibold text-gray-900">{language.name}</div>
                <div className="text-sm text-gray-600">{language.nativeName}</div>
                {language.code === 'ar' && (
                  <div className="text-xs text-orange-600 mt-1">اللهجة المغربية • Accent marocain</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {language.rtl && (
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                  RTL
                </span>
              )}
              {language.code === currentLanguage && (
                <Check className="w-5 h-5 text-indigo-600" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Paramètres linguistiques</h4>
        
        <div className="space-y-3">
          {/* Auto-detect */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={languageSettings.auto_detect_language}
              onChange={toggleAutoDetect}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Détection automatique de la langue</span>
          </label>

          {/* Arabic keyboard */}
          {currentLanguage === 'ar' && (
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={languageSettings.arabic_keyboard_enabled}
                onChange={toggleArabicKeyboard}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">تفعيل الكيبورد العربي • Clavier arabe virtuel</span>
            </label>
          )}

          {/* RTL Status */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-600">Mode d'écriture :</span>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              languageSettings.rtl_enabled 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {languageSettings.rtl_enabled ? 'من اليمين لليسار (RTL)' : 'Gauche vers droite (LTR)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};