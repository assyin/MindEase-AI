import React, { useState, useEffect } from 'react';
import { Avatar, VoiceConfig } from '../types';
import { avatarManager } from '../services/AvatarManager';
import { enhancedTTSService } from '../services/EnhancedTTSService';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  User, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw,
  Settings,
  Star,
  Sparkles,
  Heart,
  Brain,
  Zap,
  Moon,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

interface AvatarSelectorProps {
  currentAvatarId?: string;
  conversationId: string;
  onAvatarSelect: (avatar: Avatar) => void;
  showVoicePreview?: boolean;
  showQuickSwitch?: boolean;
  filterByLanguage?: boolean;
  className?: string;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatarId,
  conversationId,
  onAvatarSelect,
  showVoicePreview = true,
  showQuickSwitch = false,
  filterByLanguage = false,
  className = ''
}) => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(currentAvatarId || 'therapist-main');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<Record<string, boolean>>({});
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});
  const [expandedAvatarId, setExpandedAvatarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { languageSettings, isRtl, getLocalizedText } = useLanguage();

  useEffect(() => {
    // Load avatars
    const loadAvatars = () => {
      let allAvatars = avatarManager.getAllAvatars();
      
      // Filter by language if enabled
      if (filterByLanguage) {
        allAvatars = allAvatars.filter(avatar => {
          // Show avatars that match current language or don't specify a language
          return !avatar.language || avatar.language === languageSettings.current_language;
        });
      }
      
      setAvatars(allAvatars);
    };

    loadAvatars();

    // Subscribe to avatar updates
    const unsubscribe = avatarManager.subscribe(loadAvatars);

    return () => {
      unsubscribe();
      // Cleanup audio elements
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      });
    };
  }, [filterByLanguage, languageSettings.current_language]);

  useEffect(() => {
    if (currentAvatarId) {
      setSelectedAvatarId(currentAvatarId);
    }
  }, [currentAvatarId]);

  const getAvatarIcon = (specialization: Avatar['specialization']) => {
    switch (specialization) {
      case 'therapist':
        return <Heart className="w-6 h-6" />;
      case 'coach':
        return <Zap className="w-6 h-6" />;
      case 'meditation':
        return <Moon className="w-6 h-6" />;
      case 'analyst':
        return <BarChart3 className="w-6 h-6" />;
      default:
        return <User className="w-6 h-6" />;
    }
  };

  const handleAvatarSelect = (avatar: Avatar) => {
    setSelectedAvatarId(avatar.id);
    onAvatarSelect(avatar);
    setExpandedAvatarId(null);
  };

  const playVoicePreview = async (avatar: Avatar) => {
    if (isPreviewPlaying[avatar.id]) {
      stopVoicePreview(avatar.id);
      return;
    }

    try {
      setLoading(true);
      setIsPreviewPlaying(prev => ({ ...prev, [avatar.id]: true }));

      // Generate and play preview audio directly with Enhanced TTS
      await enhancedTTSService.generateAvatarSpeech(
        avatar,
        avatar.introduction_message,
        conversationId
      );

      // Since Enhanced TTS uses Web Speech API directly, we just need to handle the playing state
      setTimeout(() => {
        setIsPreviewPlaying(prev => ({ ...prev, [avatar.id]: false }));
      }, Math.round((avatar.introduction_message.split(' ').length / 150) * 60 * 1000));
    } catch (error) {
      console.error('Error generating voice preview:', error);
      setIsPreviewPlaying(prev => ({ ...prev, [avatar.id]: false }));
    } finally {
      setLoading(false);
    }
  };

  const stopVoicePreview = (avatarId: string) => {
    // Stop Web Speech API synthesis
    speechSynthesis.cancel();
    setIsPreviewPlaying(prev => ({ ...prev, [avatarId]: false }));
  };

  const toggleAvatarDetails = (avatarId: string) => {
    setExpandedAvatarId(expandedAvatarId === avatarId ? null : avatarId);
  };

  const getSpecializationColor = (specialization: Avatar['specialization']) => {
    switch (specialization) {
      case 'therapist':
        return 'from-purple-500 to-pink-500';
      case 'coach':
        return 'from-orange-500 to-yellow-500';
      case 'meditation':
        return 'from-blue-500 to-cyan-500';
      case 'analyst':
        return 'from-green-500 to-teal-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getSpecializationLabel = (specialization: Avatar['specialization']) => {
    if (languageSettings.current_language === 'ar') {
      switch (specialization) {
        case 'therapist':
          return 'طبيب نفسي';
        case 'coach':
          return 'مدرب';
        case 'meditation':
          return 'مرشد روحي';
        case 'analyst':
          return 'محلل';
        default:
          return 'متخصص';
      }
    } else {
      switch (specialization) {
        case 'therapist':
          return 'Thérapeute';
        case 'coach':
          return 'Coach';
        case 'meditation':
          return 'Guide Méditation';
        case 'analyst':
          return 'Analyste';
        default:
          return 'Spécialiste';
      }
    }
  };

  if (showQuickSwitch) {
    // Quick switch mode - compact horizontal layout
    return (
      <div className={`flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-200 ${className}`}>
        <span className="text-sm text-gray-600 font-medium">Avatar:</span>
        <div className="flex items-center space-x-1">
          {avatars.map(avatar => {
            const isSelected = avatar.id === selectedAvatarId;
            return (
              <button
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isSelected
                    ? `bg-gradient-to-r ${getSpecializationColor(avatar.specialization)} text-white shadow-md`
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={avatar.name}
              >
                <span className="text-lg">{avatar.emoji}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Full selector mode
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`} dir={isRtl() ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`p-4 bg-gradient-to-r ${languageSettings.current_language === 'ar' ? 'from-orange-500 to-red-600' : 'from-indigo-500 to-purple-600'} text-white`}>
        <div className={`flex items-center space-x-3 ${isRtl() ? 'space-x-reverse' : ''}`}>
          <Sparkles className="w-6 h-6" />
          <div>
            <h3 className="text-lg font-semibold">
              {languageSettings.current_language === 'ar' ? 'اختر أفاتار الذكاء الاصطناعي' : 'Choisissez votre Avatar IA'}
            </h3>
            <p className="text-sm opacity-90">
              {languageSettings.current_language === 'ar' ? 'شخصيات علاجية بأصوات مميزة' : 'Personnages thérapeutiques avec voix distinctes'}
            </p>
          </div>
        </div>
      </div>

      {/* Avatar Grid */}
      <div className="p-4 space-y-3">
        {avatars.map(avatar => {
          const isSelected = avatar.id === selectedAvatarId;
          const isExpanded = expandedAvatarId === avatar.id;
          const isPlaying = isPreviewPlaying[avatar.id];

          return (
            <div
              key={avatar.id}
              className={`relative border-2 rounded-lg transition-all duration-300 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {/* Avatar Card */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => handleAvatarSelect(avatar)}
              >
                <div className={`flex items-center space-x-4 ${isRtl() ? 'space-x-reverse' : ''}`}>
                  {/* Avatar Visual */}
                  <div className={`relative w-16 h-16 rounded-full bg-gradient-to-r ${getSpecializationColor(avatar.specialization)} flex items-center justify-center text-white shadow-lg ${avatar.cultural_background === 'moroccan' ? 'ring-2 ring-orange-400' : ''}`}>
                    <span className="text-2xl">{avatar.emoji}</span>
                    {isSelected && (
                      <div className={`absolute -top-1 ${isRtl() ? '-left-1' : '-right-1'} w-6 h-6 bg-green-500 rounded-full flex items-center justify-center`}>
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Avatar Info */}
                  <div className={`flex-1 ${isRtl() ? 'text-right' : 'text-left'}`}>
                    <div className={`flex items-center space-x-2 mb-1 ${isRtl() ? 'space-x-reverse' : ''}`}>
                      <h4 className={`text-lg font-semibold text-gray-900 ${avatar.language === 'ar' ? 'arabic-text' : ''}`}>
                        {avatar.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${getSpecializationColor(avatar.specialization)} text-white`}>
                        {getSpecializationLabel(avatar.specialization)}
                      </span>
                      {avatar.cultural_background === 'moroccan' && (
                        <span className="text-sm">🇲🇦</span>
                      )}
                    </div>
                    <p className={`text-sm text-gray-600 mb-2 ${avatar.language === 'ar' ? 'arabic-text' : ''}`}>
                      {avatar.description}
                    </p>
                    
                    {/* Expertise Tags */}
                    <div className="flex flex-wrap gap-1">
                      {avatar.expertise_areas.slice(0, 3).map(area => (
                        <span
                          key={area}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                      {avatar.expertise_areas.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{avatar.expertise_areas.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {showVoicePreview && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoicePreview(avatar);
                        }}
                        disabled={loading}
                        className={`p-2 rounded-lg transition-colors ${
                          isPlaying
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        } disabled:opacity-50`}
                        title={isPlaying ? 'Arrêter aperçu' : 'Écouter aperçu vocal'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAvatarDetails(avatar.id);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Traits de personnalité</h5>
                      <div className="flex flex-wrap gap-1">
                        {avatar.personality_traits.map(trait => (
                          <span
                            key={trait}
                            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Configuration vocale</h5>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Vitesse:</span>
                          <span>{avatar.voice_config.speaking_rate}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ton émotionnel:</span>
                          <span className="capitalize">{avatar.voice_config.emotional_tone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hauteur:</span>
                          <span>{avatar.voice_config.pitch > 0 ? '+' : ''}{avatar.voice_config.pitch}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Introduction Message */}
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Message d'introduction</h5>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-700 italic">"{avatar.introduction_message}"</p>
                    </div>
                  </div>

                  {/* Scenarios Préférés */}
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Scénarios recommandés</h5>
                    <div className="flex flex-wrap gap-1">
                      {avatar.preferred_scenarios.map(scenario => (
                        <span
                          key={scenario}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                        >
                          {scenario}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            <span>Les avatars s'adaptent automatiquement au contexte de votre conversation</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                // Reset to recommended avatar based on conversation context
                const recommended = avatarManager.recommendAvatarForContext();
                handleAvatarSelect(recommended);
              }}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Auto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};