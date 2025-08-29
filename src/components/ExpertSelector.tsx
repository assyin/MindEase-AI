import React, { useState, useCallback } from 'react';
import { ArrowLeft, Volume2, Play, Star, Globe } from 'lucide-react';
import { AIExpert, getExpertsByTheme, getDefaultExpertForTheme } from '../data/aiExperts';
import { TherapyTheme } from '../data/therapyThemes';
import { geminiTTSService } from '../services/GeminiTTSService';

interface ExpertSelectorProps {
  selectedTheme: TherapyTheme;
  onExpertSelect: (expert: AIExpert) => void;
  onBack: () => void;
  selectedExpert?: AIExpert;
}

export const ExpertSelector: React.FC<ExpertSelectorProps> = ({
  selectedTheme,
  onExpertSelect,
  onBack,
  selectedExpert
}) => {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const availableExperts = getExpertsByTheme(selectedTheme.id);
  const defaultExpert = getDefaultExpertForTheme(selectedTheme.id);
  const currentSelected = selectedExpert || defaultExpert || availableExperts[0];

  const handleVoicePreview = useCallback(async (expert: AIExpert) => {
    if (playingVoice === expert.id) {
      // Stop current playback
      setPlayingVoice(null);
      return;
    }

    try {
      setPlayingVoice(expert.id);
      setVoiceError(null);

      // Use the expert's opening message for preview
      const previewText = expert.openingMessages[0];
      
      await geminiTTSService.speak(previewText, {
        voice_id: expert.voice,
        language_code: expert.language,
        speaking_rate: 1.0,
        pitch: 0,
        volume_gain_db: 0,
        emotional_tone: expert.personality.communicationStyle as any
      });

    } catch (error) {
      console.error('Voice preview error:', error);
      setVoiceError(`Impossible de lire la voix de ${expert.name}`);
    } finally {
      setPlayingVoice(null);
    }
  }, [playingVoice]);

  const handleExpertSelect = (expert: AIExpert) => {
    onExpertSelect(expert);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Choisis ton expert IA
          </h2>
          <p className="text-gray-600">
            Thème sélectionné : <span className="font-medium">{selectedTheme.name}</span>
          </p>
        </div>
      </div>

      {/* Experts List */}
      <div className="space-y-4">
        {availableExperts.map((expert, index) => {
          const isSelected = currentSelected?.id === expert.id;
          const isDefault = defaultExpert?.id === expert.id;
          const isPlaying = playingVoice === expert.id;

          return (
            <div
              key={expert.id}
              className={`p-6 border-2 rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleExpertSelect(expert)}
              style={{ backgroundColor: isSelected ? expert.backgroundColor : undefined }}
            >
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                  {expert.avatar}
                </div>

                {/* Expert Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {expert.name}
                        </h3>
                        {isDefault && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            <Star className="w-3 h-3 mr-1" />
                            RECOMMANDÉ
                          </span>
                        )}
                        {expert.culturalBackground && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            <Globe className="w-3 h-3 mr-1" />
                            {expert.culturalBackground === 'moroccan' ? 'Maroc' : expert.culturalBackground}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium text-blue-600 mb-1">
                        {expert.specialty}
                      </p>

                      <p className="text-sm text-gray-600 mb-3">
                        {expert.approach}
                      </p>

                      {/* Voice Info */}
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Voix : {expert.personality.communicationStyle}</span>
                        <span>•</span>
                        <span>{expert.language === 'fr-FR' ? 'Français' : 
                              expert.language === 'ar-MA' ? 'العربية المغربية' : 
                              expert.language}</span>
                      </div>
                    </div>

                    {/* Voice Preview Button */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoicePreview(expert);
                        }}
                        disabled={isPlaying}
                        className={`p-2 rounded-lg transition-colors ${
                          isPlaying
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                        title="Écouter un aperçu de la voix"
                      >
                        {isPlaying ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      
                      {isSelected && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sample Message Preview */}
                  <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 italic">
                      "{expert.openingMessages[0]}"
                    </p>
                  </div>

                  {/* Personality Traits */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {expert.personality.greetingStyle}
                    </span>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {expert.personality.responseLength}
                    </span>
                    {expert.personality.useMetaphors && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        métaphores
                      </span>
                    )}
                    {expert.personality.culturalReferences && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        références culturelles
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {voiceError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{voiceError}</p>
        </div>
      )}

      {/* No Experts Available */}
      {availableExperts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun expert disponible
          </h3>
          <p className="text-gray-600">
            Nous n'avons pas encore d'experts spécialisés pour ce thème.
            Un expert généraliste sera assigné automatiquement.
          </p>
        </div>
      )}

      {/* Additional Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-sm">ℹ️</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">À propos des voix</p>
            <p>
              Chaque expert dispose d'une voix unique optimisée pour son style de communication. 
              Tu peux prévisualiser chaque voix en cliquant sur le bouton d'écoute.
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {currentSelected && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6">
          <button
            onClick={() => handleExpertSelect(currentSelected)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Commencer avec {currentSelected.name}
          </button>
        </div>
      )}
    </div>
  );
};