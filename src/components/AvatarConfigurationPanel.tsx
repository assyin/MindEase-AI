import React, { useState, useEffect } from 'react';
import { Avatar, VoiceConfig, AvatarPreferences } from '../types';
import { avatarManager } from '../services/AvatarManager';
import { googleGenAITTSServiceV2 } from '../services/GoogleGenAITTSServiceV2';
import { multiAvatarDialogueService } from '../services/MultiAvatarDialogueService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw,
  Save,
  Users,
  MessageCircle,
  Sliders,
  Mic,
  Clock,
  Zap,
  TestTube,
  X,
  Plus,
  Trash2
} from 'lucide-react';

interface AvatarConfigurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

export const AvatarConfigurationPanel: React.FC<AvatarConfigurationPanelProps> = ({
  isOpen,
  onClose,
  conversationId
}) => {
  const { user } = useAuth();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('therapist-main');
  const [preferences, setPreferences] = useState<AvatarPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const [currentTestAudio, setCurrentTestAudio] = useState<HTMLAudioElement | null>(null);
  const [activeTab, setActiveTab] = useState<'voice' | 'dialogue' | 'preferences'>('voice');

  // Voice configuration state
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    voice_id: 'fr-FR-DeniseNeural',
    language_code: 'fr-FR',
    speaking_rate: 1.0,
    pitch: 0.0,
    volume_gain_db: 0.0,
    emotional_tone: 'empathetic',
    pause_duration: 500,
    emphasis_words: []
  });

  const [newEmphasisWord, setNewEmphasisWord] = useState('');
  const [dialogueCombinations, setDialogueCombinations] = useState<string[][]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      // Nettoyer l'audio au moment de fermer le panel
      if (currentTestAudio) {
        console.log('🧹 Nettoyage audio test lors de la fermeture');
        currentTestAudio.pause();
        currentTestAudio.currentTime = 0;
        setCurrentTestAudio(null);
        setTestingVoice(null);
      }
    }
  }, [isOpen, user, currentTestAudio]);

  useEffect(() => {
    const selectedAvatar = avatars.find(a => a.id === selectedAvatarId);
    if (selectedAvatar) {
      setVoiceConfig(selectedAvatar.voice_config);
    }
  }, [selectedAvatarId, avatars]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load avatars
      const allAvatars = avatarManager.getAllAvatars();
      setAvatars(allAvatars);

      // Load user preferences
      if (user) {
        const userPrefs = await avatarManager.loadUserPreferences(user.id);
        if (userPrefs) {
          setPreferences(userPrefs);
          setDialogueCombinations(userPrefs.preferred_dialogue_combinations || []);
          if (userPrefs.preferred_avatar_id) {
            setSelectedAvatarId(userPrefs.preferred_avatar_id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading avatar configuration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceConfigChange = (key: keyof VoiceConfig, value: any) => {
    setVoiceConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const testVoiceConfiguration = async () => {
    if (!selectedAvatarId) return;

    // Arrêter tout audio de test en cours
    if (currentTestAudio) {
      console.log('🛑 Arrêt audio test précédent');
      currentTestAudio.pause();
      currentTestAudio.currentTime = 0;
      setCurrentTestAudio(null);
    }

    setTestingVoice(selectedAvatarId);
    try {
      const selectedAvatar = avatars.find(a => a.id === selectedAvatarId);
      if (!selectedAvatar) return;

      console.log('🎙️ Testing voice configuration for:', selectedAvatar.name);

      // Appliquer temporairement la nouvelle configuration vocale pour le test
      const originalVoiceConfig = selectedAvatar.voice_config;
      try {
        // Sauvegarder temporairement la nouvelle config pour le test
        await avatarManager.customizeAvatarVoice(selectedAvatarId, voiceConfig);
        
        // Utiliser l'AvatarManager qui gère déjà Google GenAI TTS + fallback correctement
        // selon notre guide d'implémentation complète
        const response = await avatarManager.generateAvatarVoiceResponse(
          selectedAvatarId,
          "Voici un test de ma nouvelle configuration vocale avec les nouveaux paramètres. Comment trouvez-vous ma voix maintenant ?",
          conversationId
        );

        console.log('✅ Test voice generated successfully');

        // Créer nouvel élément audio avec gestion propre
        const audio = new Audio(response.audioUrl);
        setCurrentTestAudio(audio);

        // Gestionnaires d'événements pour nettoyer proprement
        audio.onended = () => {
          console.log('🎵 Test audio finished playing');
          URL.revokeObjectURL(response.audioUrl);
          setTestingVoice(null);
          setCurrentTestAudio(null);
        };

        audio.onerror = (error) => {
          console.error('❌ Test audio playback error:', error);
          URL.revokeObjectURL(response.audioUrl);
          setTestingVoice(null);
          setCurrentTestAudio(null);
        };

        // Volume contrôlé pour éviter l'écho
        audio.volume = 0.8;

        await audio.play();
        
      } finally {
        // Restaurer la configuration originale après le test
        // (ne sauvegarde que si l'utilisateur clique "Sauvegarder Voix")
        await avatarManager.customizeAvatarVoice(selectedAvatarId, originalVoiceConfig);
      }
    } catch (error) {
      console.error('❌ Error testing voice configuration:', error);
      setTestingVoice(null);
      setCurrentTestAudio(null);
    }
  };

  const saveVoiceConfiguration = async () => {
    if (!selectedAvatarId) return;

    setLoading(true);
    try {
      await avatarManager.customizeAvatarVoice(selectedAvatarId, voiceConfig);
      console.log('✅ Voice configuration saved');
    } catch (error) {
      console.error('Error saving voice configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEmphasisWord = () => {
    if (newEmphasisWord.trim() && !voiceConfig.emphasis_words.includes(newEmphasisWord.trim())) {
      handleVoiceConfigChange('emphasis_words', [...voiceConfig.emphasis_words, newEmphasisWord.trim()]);
      setNewEmphasisWord('');
    }
  };

  const removeEmphasisWord = (word: string) => {
    handleVoiceConfigChange('emphasis_words', voiceConfig.emphasis_words.filter(w => w !== word));
  };

  const addDialogueCombination = () => {
    if (avatars.length >= 2) {
      const newCombination = [avatars[0].id, avatars[1].id];
      setDialogueCombinations(prev => [...prev, newCombination]);
    }
  };

  const updateDialogueCombination = (index: number, avatarIndex: number, avatarId: string) => {
    setDialogueCombinations(prev => {
      const updated = [...prev];
      updated[index][avatarIndex] = avatarId;
      return updated;
    });
  };

  const removeDialogueCombination = (index: number) => {
    setDialogueCombinations(prev => prev.filter((_, i) => i !== index));
  };

  const testDialogueCombination = async (combination: string[]) => {
    setLoading(true);
    try {
      const result = await multiAvatarDialogueService.generatePredefinedDialogue(
        conversationId,
        'anxiety_support' // Test scenario
      );
      
      console.log('✅ Dialogue test generated:', result.dialogue);
      // Here you could play the dialogue or show it in a modal
    } catch (error) {
      console.error('Error testing dialogue:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user || !preferences) return;

    setLoading(true);
    try {
      const updatedPreferences: Partial<AvatarPreferences> = {
        preferred_avatar_id: selectedAvatarId,
        preferred_dialogue_combinations: dialogueCombinations,
        auto_play_audio: preferences.auto_play_audio,
        dialogue_mode_enabled: preferences.dialogue_mode_enabled,
        voice_speed_multiplier: preferences.voice_speed_multiplier
      };

      await avatarManager.updateUserPreferences(user.id, updatedPreferences);
      console.log('✅ Preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    const selectedAvatar = avatars.find(a => a.id === selectedAvatarId);
    if (selectedAvatar) {
      setVoiceConfig(selectedAvatar.voice_config);
    }
  };

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
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">Configuration des Avatars</h2>
                <p className="text-sm opacity-90">Personnalisez vos assistants IA thérapeutiques</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex">
            {/* Avatar Selection Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Sélectionner un Avatar</h3>
              <div className="space-y-2">
                {avatars.map(avatar => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatarId(avatar.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      selectedAvatarId === avatar.id
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-lg">{avatar.emoji}</span>
                    <div className="text-left">
                      <div className="font-medium text-sm">{avatar.name}</div>
                      <div className="text-xs opacity-75 capitalize">{avatar.specialization}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Configuration Panel */}
            <div className="flex-1">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex px-6">
                  {[
                    { id: 'voice', label: 'Configuration Vocale', icon: Mic },
                    { id: 'dialogue', label: 'Dialogues Multi-Avatars', icon: Users },
                    { id: 'preferences', label: 'Préférences', icon: Sliders }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {activeTab === 'voice' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Configuration Vocale - {avatars.find(a => a.id === selectedAvatarId)?.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={resetToDefaults}
                          className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Réinitialiser</span>
                        </button>
                        <button
                          onClick={() => {
                            if (testingVoice === selectedAvatarId && currentTestAudio) {
                              // Arrêter l'audio en cours
                              console.log('⏹️ Arrêt du test vocal par l\'utilisateur');
                              currentTestAudio.pause();
                              currentTestAudio.currentTime = 0;
                              setCurrentTestAudio(null);
                              setTestingVoice(null);
                            } else {
                              // Démarrer un nouveau test
                              testVoiceConfiguration();
                            }
                          }}
                          className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {testingVoice === selectedAvatarId ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          <span>{testingVoice === selectedAvatarId ? 'Arrêter' : 'Test Vocal'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Voice Parameters */}
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-800">Paramètres Vocaux</h4>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vitesse de parole: {voiceConfig.speaking_rate}x
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={voiceConfig.speaking_rate}
                            onChange={(e) => handleVoiceConfigChange('speaking_rate', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hauteur de voix: {voiceConfig.pitch > 0 ? '+' : ''}{voiceConfig.pitch}
                          </label>
                          <input
                            type="range"
                            min="-10"
                            max="10"
                            step="0.5"
                            value={voiceConfig.pitch}
                            onChange={(e) => handleVoiceConfigChange('pitch', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Volume: {voiceConfig.volume_gain_db > 0 ? '+' : ''}{voiceConfig.volume_gain_db} dB
                          </label>
                          <input
                            type="range"
                            min="-10"
                            max="10"
                            step="1"
                            value={voiceConfig.volume_gain_db}
                            onChange={(e) => handleVoiceConfigChange('volume_gain_db', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ton émotionnel
                          </label>
                          <select
                            value={voiceConfig.emotional_tone}
                            onChange={(e) => handleVoiceConfigChange('emotional_tone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="empathetic">Empathique</option>
                            <option value="energetic">Énergique</option>
                            <option value="calming">Apaisant</option>
                            <option value="analytical">Analytique</option>
                            <option value="supportive">Soutien</option>
                          </select>
                        </div>
                      </div>

                      {/* Advanced Settings */}
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-800">Paramètres Avancés</h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Durée des pauses: {voiceConfig.pause_duration}ms
                          </label>
                          <input
                            type="range"
                            min="200"
                            max="2000"
                            step="100"
                            value={voiceConfig.pause_duration}
                            onChange={(e) => handleVoiceConfigChange('pause_duration', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mots à accentuer
                          </label>
                          <div className="flex space-x-2 mb-2">
                            <input
                              type="text"
                              value={newEmphasisWord}
                              onChange={(e) => setNewEmphasisWord(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addEmphasisWord()}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Mot à accentuer..."
                            />
                            <button
                              onClick={addEmphasisWord}
                              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {voiceConfig.emphasis_words.map(word => (
                              <span
                                key={word}
                                className="inline-flex items-center px-2 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full"
                              >
                                {word}
                                <button
                                  onClick={() => removeEmphasisWord(word)}
                                  className="ml-1 text-indigo-500 hover:text-indigo-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'dialogue' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Combinaisons de Dialogues</h3>
                      <button
                        onClick={addDialogueCombination}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter Combinaison</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {dialogueCombinations.map((combination, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Combinaison {index + 1}</h4>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => testDialogueCombination(combination)}
                                disabled={loading}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                              >
                                <TestTube className="w-4 h-4 inline mr-1" />
                                Tester
                              </button>
                              <button
                                onClick={() => removeDialogueCombination(index)}
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {combination.map((avatarId, avatarIndex) => (
                              <select
                                key={avatarIndex}
                                value={avatarId}
                                onChange={(e) => updateDialogueCombination(index, avatarIndex, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                {avatars.map(avatar => (
                                  <option key={avatar.id} value={avatar.id}>
                                    {avatar.emoji} {avatar.name}
                                  </option>
                                ))}
                              </select>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {dialogueCombinations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucune combinaison de dialogue configurée.</p>
                        <p className="text-sm">Ajoutez des combinaisons pour créer des dialogues entre avatars.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'preferences' && preferences && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Préférences Générales</h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            Lecture automatique de l'audio
                          </label>
                          <input
                            type="checkbox"
                            checked={preferences.auto_play_audio}
                            onChange={(e) => setPreferences(prev => prev ? { ...prev, auto_play_audio: e.target.checked } : null)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            Mode dialogue activé
                          </label>
                          <input
                            type="checkbox"
                            checked={preferences.dialogue_mode_enabled}
                            onChange={(e) => setPreferences(prev => prev ? { ...prev, dialogue_mode_enabled: e.target.checked } : null)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Multiplicateur de vitesse vocale: {preferences.voice_speed_multiplier}x
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={preferences.voice_speed_multiplier}
                            onChange={(e) => setPreferences(prev => prev ? { ...prev, voice_speed_multiplier: parseFloat(e.target.value) } : null)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Avatar préféré par défaut
                          </label>
                          <select
                            value={preferences.preferred_avatar_id}
                            onChange={(e) => setPreferences(prev => prev ? { ...prev, preferred_avatar_id: e.target.value } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            {avatars.map(avatar => (
                              <option key={avatar.id} value={avatar.id}>
                                {avatar.emoji} {avatar.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end px-6 py-4 bg-gray-50 border-t border-gray-200 space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                
                {activeTab === 'voice' && (
                  <button
                    onClick={saveVoiceConfiguration}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>Sauvegarder Voix</span>
                  </button>
                )}

                {(activeTab === 'dialogue' || activeTab === 'preferences') && (
                  <button
                    onClick={savePreferences}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>Sauvegarder Préférences</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};