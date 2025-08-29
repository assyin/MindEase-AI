import React, { useState, useEffect } from 'react';
import { enhancedTTSService } from '../services/EnhancedTTSService';
import { avatarManager } from '../services/AvatarManager';
import { Avatar } from '../types';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface VoiceSelectorProps {
  onClose: () => void;
  currentAvatarId?: string;
  conversationId: string;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  onClose,
  currentAvatarId,
  conversationId
}) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<string>('');

  useEffect(() => {
    // Load available voices
    const voices = enhancedTTSService.getAvailableVoices();
    setAvailableVoices(voices);
    
    // Load avatars
    const allAvatars = avatarManager.getAllAvatars();
    setAvatars(allAvatars);

    // Get avatar voice mapping
    const mapping = enhancedTTSService.getAvatarVoiceMapping();
    console.log('Current avatar voice mapping:', mapping);
  }, []);

  const testVoice = async (voice: SpeechSynthesisVoice, avatar?: Avatar) => {
    if (isPlaying === voice.name) {
      speechSynthesis.cancel();
      setIsPlaying('');
      return;
    }

    try {
      setIsPlaying(voice.name);
      
      const testText = avatar 
        ? `Bonjour, je suis ${avatar.name}. Voici un exemple de ma voix spécialisée en ${avatar.specialization}.`
        : `Bonjour, ceci est un test de la voix ${voice.name} en français.`;

      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.voice = voice;
      utterance.rate = avatar?.voice_config.speaking_rate || 1;
      utterance.pitch = 1 + (avatar?.voice_config.pitch || 0);
      utterance.volume = 0.8;
      utterance.lang = voice.lang;

      utterance.onend = () => setIsPlaying('');
      utterance.onerror = () => setIsPlaying('');

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Voice test error:', error);
      setIsPlaying('');
    }
  };

  const stopAllSpeech = () => {
    speechSynthesis.cancel();
    setIsPlaying('');
  };

  // Filter French voices
  const frenchVoices = availableVoices.filter(voice => 
    voice.lang.includes('fr') || voice.name.toLowerCase().includes('french')
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-h-[80vh]">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Sélecteur de Voix</h3>
            <p className="text-sm opacity-90">Testez et configurez les voix des avatars</p>
          </div>
          <button
            onClick={stopAllSpeech}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Arrêter toute lecture"
          >
            <VolumeX className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Avatar Voice Mappings */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Configuration Actuelle des Avatars</h4>
          <div className="space-y-2">
            {avatars.map(avatar => {
              const mapping = enhancedTTSService.getAvatarVoiceMapping()[avatar.id];
              const mappedVoice = mapping?.voiceIndex !== undefined 
                ? availableVoices[mapping.voiceIndex]
                : null;
              
              return (
                <div
                  key={avatar.id}
                  className={`p-3 rounded-lg border ${
                    currentAvatarId === avatar.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{avatar.emoji}</span>
                      <div>
                        <div className="font-medium text-gray-900">{avatar.name}</div>
                        <div className="text-sm text-gray-600">
                          Voix: {mappedVoice?.name || 'Non configurée'}
                          {mappedVoice && (
                            <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                              {mappedVoice.lang}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => mappedVoice && testVoice(mappedVoice, avatar)}
                      disabled={!mappedVoice}
                      className={`p-2 rounded-lg transition-colors ${
                        isPlaying === mappedVoice?.name
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      } disabled:opacity-50`}
                      title="Tester cette voix d'avatar"
                    >
                      {isPlaying === mappedVoice?.name ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available French Voices */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Voix Françaises Disponibles ({frenchVoices.length})
          </h4>
          <div className="space-y-2">
            {frenchVoices.map((voice, index) => (
              <div
                key={`${voice.name}-${index}`}
                className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 bg-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{voice.name}</div>
                    <div className="text-sm text-gray-600">
                      {voice.lang} • {voice.localService ? 'Local' : 'Réseau'}
                      {voice.default && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Par défaut
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => testVoice(voice)}
                    className={`p-2 rounded-lg transition-colors ${
                      isPlaying === voice.name
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                    title="Tester cette voix"
                  >
                    {isPlaying === voice.name ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {frenchVoices.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune voix française détectée</p>
            <p className="text-sm mt-1">Vérifiez les paramètres de votre navigateur</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            💡 Les voix locales offrent une meilleure qualité que les voix réseau
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};