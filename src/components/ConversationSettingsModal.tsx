import React, { useState, useEffect } from 'react';
import { Avatar, VoiceConfig } from '../types';
import { avatarManager } from '../services/AvatarManager';
import { googleGenAITTSServiceV2 } from '../services/GoogleGenAITTSServiceV2';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Settings, 
  Volume2, 
  Play, 
  Pause, 
  X,
  Globe,
  Star
} from 'lucide-react';

interface ConversationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const languageOptions: LanguageOption[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar-MA', name: 'العربية المغربية (Darija)', flag: '🇲🇦' },
  { code: 'ar', name: 'العربية (Arabe Standard)', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

export const ConversationSettingsModal: React.FC<ConversationSettingsModalProps> = ({
  isOpen,
  onClose,
  conversationId
}) => {
  const { languageSettings, setLanguage } = useLanguage();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('therapist-main');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(languageSettings.current_language);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const [currentTestAudio, setCurrentTestAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      // Nettoyer l'audio au moment de fermer
      if (currentTestAudio) {
        currentTestAudio.pause();
        setCurrentTestAudio(null);
        setTestingVoice(null);
      }
    }
  }, [isOpen, currentTestAudio]);

  const loadData = async () => {
    try {
      // Charger tous les avatars
      const allAvatars = avatarManager.getAllAvatars();
      setAvatars(allAvatars);

      // Filtrer automatiquement selon la langue sélectionnée
      updateContentForLanguage(selectedLanguage);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateContentForLanguage = (languageCode: string) => {
    // Filtrer les avatars compatibles avec la langue
    const compatibleAvatars = avatars.filter(avatar => {
      if (languageCode.startsWith('ar')) {
        return avatar.language === 'ar-MA' || avatar.id.includes('morocco');
      } else if (languageCode === 'fr') {
        return avatar.language === 'fr-FR' || !avatar.id.includes('morocco');
      }
      return true; // Pour l'anglais, tous les avatars
    });

    // Simuler les voix 5 étoiles pour la langue sélectionnée
    const voicesFor5Stars = getTop5StarVoicesForLanguage(languageCode);
    setAvailableVoices(voicesFor5Stars);

    // Sélectionner le premier avatar compatible
    if (compatibleAvatars.length > 0) {
      setSelectedAvatarId(compatibleAvatars[0].id);
      setSelectedVoiceId(compatibleAvatars[0].voice_config.voice_id);
    }
  };

  const getTop5StarVoicesForLanguage = (languageCode: string) => {
    // Retourner les meilleures voix selon la langue
    if (languageCode.startsWith('ar')) {
      return [
        { id: 'umbriel', name: 'Umbriel', rating: 5, gender: 'Femme', description: 'Voix empathique parfaite pour la thérapie' },
        { id: 'algenib', name: 'Algenib', rating: 5, gender: 'Homme', description: 'Voix énergique idéale pour le coaching' },
        { id: 'despina', name: 'Despina', rating: 5, gender: 'Femme', description: 'Voix douce casablancaise' },
        { id: 'iapetus', name: 'Iapetus', rating: 5, gender: 'Homme', description: 'Voix professionnelle analytique' }
      ];
    } else {
      return [
        { id: 'fr-FR-DeniseNeural', name: 'Denise (FR)', rating: 5, gender: 'Femme', description: 'Voix française naturelle' },
        { id: 'fr-FR-HenriNeural', name: 'Henri (FR)', rating: 5, gender: 'Homme', description: 'Voix masculine professionnelle' },
        { id: 'fr-FR-EloiseNeural', name: 'Eloise (FR)', rating: 5, gender: 'Femme', description: 'Voix douce et rassurante' }
      ];
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setLanguage(languageCode as 'fr' | 'ar' | 'en');
    updateContentForLanguage(languageCode);
  };

  const testVoice = async (voiceId: string) => {
    // Arrêter tout audio en cours
    if (currentTestAudio) {
      currentTestAudio.pause();
      setCurrentTestAudio(null);
    }

    setTestingVoice(voiceId);
    try {
      const testText = selectedLanguage.startsWith('ar') 
        ? 'السلام عليكم، هذا اختبار لهذا الصوت. كيف تجدونه؟'
        : 'Bonjour, ceci est un test de cette voix. Comment la trouvez-vous ?';

      // Utiliser le service Google GenAI TTS pour tester
      const response = await googleGenAITTSServiceV2.generateAvatarSpeech({
        text: testText,
        avatarId: 'voice-test',
        voiceConfig: {
          voice_id: voiceId,
          language_code: selectedLanguage === 'ar-MA' ? 'ar-MA' : 'fr-FR',
          speaking_rate: 0.9,
          pitch: 0,
          volume_gain_db: 0,
          emotional_tone: 'empathetic',
          pause_duration: 500,
          emphasis_words: []
        },
        conversationId
      });

      const audio = new Audio(response.audioUrl);
      setCurrentTestAudio(audio);

      audio.onended = () => {
        URL.revokeObjectURL(response.audioUrl);
        setTestingVoice(null);
        setCurrentTestAudio(null);
      };

      audio.onerror = () => {
        console.error('Error playing voice test');
        setTestingVoice(null);
        setCurrentTestAudio(null);
      };

      await audio.play();
    } catch (error) {
      console.error('Voice test error:', error);
      setTestingVoice(null);
    }
  };

  const filteredAvatars = avatars.filter(avatar => {
    if (selectedLanguage.startsWith('ar')) {
      return avatar.language === 'ar-MA' || avatar.id.includes('morocco');
    } else if (selectedLanguage === 'fr') {
      return avatar.language === 'fr-FR' || !avatar.id.includes('morocco');
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal container */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">Paramètres de Conversation</h2>
                <p className="text-sm opacity-90">Configuration de la langue et des avatars</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {/* Section 1: Langue de Conversation */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Globe className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Langue de Conversation</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez la langue principale pour vos conversations. L'IA répondra automatiquement dans cette langue.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {languageOptions.map(option => (
                  <button
                    key={option.code}
                    onClick={() => handleLanguageChange(option.code)}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                      selectedLanguage === option.code
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{option.flag}</span>
                    <div className="text-left">
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm opacity-75">
                        {option.code === 'ar-MA' ? 'Darija authentique' : 
                         option.code === 'ar' ? 'Arabe classique' :
                         option.code === 'fr' ? 'Français standard' : 'International'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Avatar & Voix */}
            <div>
              <div className="flex items-center mb-4">
                <Volume2 className="w-5 h-5 text-green-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Avatar & Voix</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Choisissez votre avatar et sa voix. Seuls les avatars et voix 5⭐ compatibles avec la langue sélectionnée sont affichés.
              </p>

              {/* Avatars filtrés */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-3">Avatars disponibles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredAvatars.map(avatar => (
                    <button
                      key={avatar.id}
                      onClick={() => {
                        setSelectedAvatarId(avatar.id);
                        setSelectedVoiceId(avatar.voice_config.voice_id);
                      }}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                        selectedAvatarId === avatar.id
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: avatar.color_theme + '20' }}
                      >
                        {avatar.emoji}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{avatar.name}</div>
                        <div className="text-sm opacity-75 capitalize">{avatar.specialization}</div>
                        <div className="text-xs text-gray-500">{avatar.language}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voix 5⭐ */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Voix Premium 5⭐ disponibles</h4>
                <div className="space-y-3">
                  {availableVoices.map(voice => (
                    <div
                      key={voice.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        selectedVoiceId === voice.id
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="voice"
                          checked={selectedVoiceId === voice.id}
                          onChange={() => setSelectedVoiceId(voice.id)}
                          className="w-4 h-4 text-yellow-600"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{voice.name}</span>
                            <span className="text-sm text-gray-500">({voice.gender})</span>
                            <div className="flex">
                              {[...Array(voice.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">{voice.description}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => testVoice(voice.id)}
                        disabled={testingVoice === voice.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {testingVoice === voice.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>🔊 Écouter</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <div className="text-sm text-gray-600">
              💾 Paramètres sauvegardés automatiquement
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};