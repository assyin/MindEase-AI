import React, { useState, useEffect, useRef } from 'react';
import { AIModelManager } from '../services/AIModelManager';
import { MessageBubble } from './MessageBubble';
import { ModelSelector } from './ModelSelector';
import { MessageInput } from './MessageInput';
import { QuickReplies } from './QuickReplies';
import { AvatarSelector } from './AvatarSelector';
import { ConversationSettingsModal } from './ConversationSettingsModal';
import { avatarManager } from '../services/AvatarManager';
import { googleGenAITTSServiceV2 } from '../services/GoogleGenAITTSServiceV2';
import { aiContextManager } from '../services/AIContextManager';
import { useConversations, useActiveConversation } from '../contexts/ConversationsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Avatar } from '../types';
import { Settings, Volume2, VolumeX, Users } from 'lucide-react';



interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
  inputMode?: 'text' | 'voice';
}

export const ChatInterface: React.FC = () => {
  const { activeConversationId, messages: conversationMessages } = useActiveConversation();
  const { addMessage } = useConversations();
  const { languageSettings, isRtl } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'auto' | 'gemini' | 'openai'>('auto');
  const [currentContext, setCurrentContext] = useState<string>('');
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [aiManager] = useState(() => new AIModelManager());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Avatar-related state
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showAvatarConfig, setShowAvatarConfig] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Google GenAI TTS state
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize avatar and load conversation messages
  useEffect(() => {
    const initializeAvatar = async () => {
      try {
        // Get recommended avatar for the current conversation
        let recommendedAvatarId = 'therapist-main';
        
        if (activeConversationId) {
          const recommendation = await aiContextManager.getAvatarRecommendation(activeConversationId);
          if (recommendation) {
            recommendedAvatarId = recommendation;
          }
        }

        const avatar = avatarManager.getAvatarById(recommendedAvatarId);
        if (avatar) {
          setSelectedAvatar(avatar);
        }
      } catch (error) {
        console.error('Error initializing avatar:', error);
        // Fallback to default avatar
        const defaultAvatar = avatarManager.getAvatarById('therapist-main');
        if (defaultAvatar) {
          setSelectedAvatar(defaultAvatar);
        }
      }
    };

    initializeAvatar();

    // Load conversation messages
    if (conversationMessages && conversationMessages.length > 0) {
      setMessages(conversationMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        model: msg.ai_model,
        inputMode: msg.inputMode
      })));
    } else {
      // Show welcome message with selected avatar
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: selectedAvatar?.introduction_message || 'Bonjour ! Je suis votre assistant MindEase AI. Je suis là pour vous écouter et vous accompagner dans votre bien-être mental. Comment vous sentez-vous aujourd\'hui ? 💙',
        timestamp: Date.now(),
        model: 'avatar'
      };
      setMessages([welcomeMessage]);
    }
  }, [activeConversationId, conversationMessages, selectedAvatar?.introduction_message]);

  /**
   * Joue l'audio généré par Google GenAI TTS avec contrôle de progression
   */
  const playGoogleGenAIAudio = async (audioUrl: string, duration: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Arrêter l'audio précédent s'il y en a un
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setIsPlayingAudio(false);
        setAudioProgress(0);
      }

      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setIsPlayingAudio(true);

      audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(progress);
      });

      audio.addEventListener('ended', () => {
        setCurrentAudio(null);
        setIsPlayingAudio(false);
        setAudioProgress(0);
        URL.revokeObjectURL(audioUrl); // Nettoyer l'URL de blob
        resolve();
      });

      audio.addEventListener('error', (error) => {
        setCurrentAudio(null);
        setIsPlayingAudio(false);
        setAudioProgress(0);
        URL.revokeObjectURL(audioUrl);
        reject(error);
      });

      audio.play().catch(reject);
    });
  };

  /**
   * Arrête l'audio en cours de lecture
   */
  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlayingAudio(false);
      setAudioProgress(0);
    }
  };

  const handleSendMessage = async (content: string, mode: 'text' | 'voice') => {
    if (!activeConversationId) {
      console.error('No active conversation selected');
      // Show a user-friendly message in the UI
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: languageSettings.current_language === 'ar' 
          ? 'يرجى إنشاء محادثة جديدة أولاً من الشريط الجانبي 📝'
          : 'Veuillez créer une nouvelle conversation depuis la barre latérale pour commencer 📝',
        timestamp: Date.now(),
        model: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    if (!selectedAvatar) {
      console.error('No avatar selected');
      // Show avatar selection prompt
      const avatarPromptMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: languageSettings.current_language === 'ar' 
          ? 'يرجى اختيار أفاتار من الأسفل للبدء في المحادثة 🤖'
          : 'Veuillez sélectionner un avatar ci-dessous pour commencer la conversation 🤖',
        timestamp: Date.now(),
        model: 'system'
      };
      setMessages(prev => [...prev, avatarPromptMessage]);
      setShowAvatarSelector(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
      inputMode: mode
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentContext(content);
    setIsLoading(true);

    try {
      // Add user message to conversation
      await addMessage(content, 'user', mode);

      // Prepare AI context with selected avatar
      await aiContextManager.adaptContextToAvatar(activeConversationId, selectedAvatar.id);

      const context = {
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        conversationId: activeConversationId, // CRITICAL: Pass conversation ID for expert role consistency
        mode,
        urgency: 'medium' as const,
        avatarContext: {
          avatarId: selectedAvatar.id,
          specialization: selectedAvatar.specialization,
          conversationStyle: selectedAvatar.conversation_style
        }
      };

      const response = await aiManager.generateResponse(
        content, 
        context, 
        selectedModel === 'auto' ? undefined : selectedModel as 'gemini'
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp,
        model: selectedAvatar.id,
        inputMode: mode
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Add assistant message to conversation
      await addMessage(response.content, 'assistant');

      // Generate and play avatar voice if audio is enabled
      if (audioEnabled && autoPlayEnabled && selectedAvatar) {
        try {
          console.log(`🎤 Génération réponse vocale avec Google GenAI TTS pour: ${selectedAvatar.name}`);
          
          // Utiliser le nouveau service Google GenAI TTS V2 selon Multi-Voice-corrective.md
          const audioResponse = await avatarManager.generateAvatarVoiceResponse(
            selectedAvatar.id,
            response.content,
            activeConversationId
          );

          // Jouer l'audio généré par Google GenAI avec les vraies voix Google AI Studio
          await playGoogleGenAIAudio(audioResponse.audioUrl, audioResponse.duration);
          
          console.log(`🔊 Audio Google GenAI joué pour: ${selectedAvatar.name} (${audioResponse.duration}ms)`);

        } catch (audioError) {
          console.error(`❌ Erreur audio Google GenAI pour ${selectedAvatar.name}:`, audioError);
          // Fallback vers Web Speech API si Google GenAI TTS échoue
          console.log('🔄 Fallback vers Web Speech API...');
          const utterance = new SpeechSynthesisUtterance(response.content);
          utterance.lang = 'fr-FR';
          utterance.rate = selectedAvatar.voice_config.speaking_rate;
          speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error('Erreur génération réponse:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Désolé, je rencontre une difficulté technique momentanée. Pouvez-vous reformuler votre message ? 🔧\n\n${selectedAvatar?.name || 'Je'} reste à votre écoute pour vous accompagner.`,
        timestamp: Date.now(),
        model: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelect = async (avatar: Avatar) => {
    setSelectedAvatar(avatar);
    
    if (activeConversationId) {
      try {
        await aiContextManager.switchAvatarContext(activeConversationId, avatar.id);
        
        const switchMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `${avatar.name} rejoint la conversation. ${avatar.introduction_message}`,
          timestamp: Date.now(),
          model: avatar.id
        };
        setMessages(prev => [...prev, switchMessage]);
        
        if (audioEnabled) {
          try {
            // Use Google GenAI TTS for welcome message
            const welcomeResponse = await googleGenAITTSServiceV2.generateAvatarSpeech({
              text: avatar.introduction_message,
              avatarId: avatar.id,
              voiceConfig: avatar.voice_config,
              conversationId: activeConversationId
            });
            
            // Play the Google AI Studio generated welcome audio
            const audio = new Audio(welcomeResponse.audioUrl);
            audio.onended = () => URL.revokeObjectURL(welcomeResponse.audioUrl);
            await audio.play();
            
            console.log(`🔊 Google AI Studio welcome message played for: ${avatar.name}`);
          } catch (error) {
            console.error('Error playing welcome message:', error);
          }
        }
        
      } catch (error) {
        console.error('Error switching avatar:', error);
      }
    }
    
    setShowAvatarSelector(false);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply, 'text');
  };

  const testAvatarVoice = async (avatar: Avatar, testText?: string) => {
    if (!activeConversationId) return;
    
    const text = testText || `Bonjour, je suis ${avatar.name}. Voici un exemple de ma voix spécialisée en ${avatar.specialization}.`;
    
    try {
      console.log(`🎵 Testing Google AI Studio voice for ${avatar.name}`);
      // Use Google GenAI TTS for voice testing
      const ttsResponse = await googleGenAITTSServiceV2.generateAvatarSpeech({
        text,
        avatarId: avatar.id,
        voiceConfig: avatar.voice_config,
        conversationId: activeConversationId
      });
      
      // Play the generated Google AI Studio test audio
      const audio = new Audio(ttsResponse.audioUrl);
      audio.onended = () => URL.revokeObjectURL(ttsResponse.audioUrl);
      await audio.play();
      
      console.log(`✅ Google AI Studio voice test completed for: ${avatar.name}`);
    } catch (error) {
      console.error('Voice test error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col bg-white shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar Display */}
            {selectedAvatar ? (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                style={{ background: `linear-gradient(135deg, ${selectedAvatar.color_theme}, ${selectedAvatar.color_theme}80)` }}
                onClick={() => setShowAvatarSelector(true)}
              >
                <span className="text-2xl">{selectedAvatar.emoji}</span>
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
            )}
            <div>
              <h1 className={`text-xl font-semibold ${
                selectedAvatar && selectedAvatar.language === 'ar-MA' ? 'arabic-heading' : ''
              }`} dir={selectedAvatar && selectedAvatar.language === 'ar-MA' ? 'rtl' : 'ltr'}>
                {selectedAvatar ? selectedAvatar.name : 'MindEase AI'}
              </h1>
              <p className={`text-sm text-white/80 ${
                selectedAvatar && selectedAvatar.language === 'ar-MA' ? 'arabic-text' : ''
              }`} dir={selectedAvatar && selectedAvatar.language === 'ar-MA' ? 'rtl' : 'ltr'}>
                {selectedAvatar ? selectedAvatar.description : 'Votre assistant de bien-être mental'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Avatar Quick Switch */}
            <div className="hidden md:block">
              <AvatarSelector
                currentAvatarId={selectedAvatar?.id}
                conversationId={activeConversationId || 'default'}
                onAvatarSelect={handleAvatarSelect}
                showQuickSwitch={true}
                showVoicePreview={false}
              />
            </div>

            {/* Avatar Controls */}
            <button
              onClick={() => setShowAvatarSelector(true)}
              className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Changer d'avatar"
            >
              <Users className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowAvatarConfig(true)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Paramètres de Conversation"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Audio Controls */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Activer/Désactiver l'audio des avatars"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            <button
              className="text-white/80 hover:text-white text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
              title="Activer/Désactiver la lecture automatique des réponses"
            >
              🔊 {autoPlayEnabled ? 'ON' : 'OFF'}
            </button>

            {/* Contrôles audio Google GenAI */}
            {isPlayingAudio && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                <button
                  onClick={stopCurrentAudio}
                  className="text-white/80 hover:text-white text-xs p-1 rounded"
                  title="Arrêter l'audio"
                >
                  ⏹️
                </button>
                <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/60 transition-all duration-200"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
                <span className="text-xs text-white/60">🎙️</span>
              </div>
            )}
            
            <ModelSelector 
              selected={selectedModel}
              onSelect={setSelectedModel}
            />
            <div className="text-xs bg-white/10 px-3 py-1 rounded-full">
              {messages.length - 1} messages
            </div>
          </div>
        </div>

        {/* Avatar Expertise Bar */}
        {selectedAvatar && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white/60">✨</span>
                <span className="text-xs text-white/80">Expertise:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedAvatar.expertise_areas.slice(0, 3).map(area => (
                    <span
                      key={area}
                      className="px-2 py-0.5 text-xs bg-white/10 text-white/90 rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 text-xs text-white/60">
                  <span>Mode:</span>
                  <span className="capitalize text-white/80">
                    {selectedAvatar.conversation_style.greeting_style}
                  </span>
                </div>
                
              </div>
            </div>
          </div>
        )}
      </div>

      

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {!activeConversationId ? (
          /* Welcome Screen with Language Selector */
          <div className="flex items-center justify-center h-full">
            <div className={`max-w-2xl w-full text-center space-y-8 ${isRtl() ? 'rtl' : 'ltr'}`} dir={isRtl() ? 'rtl' : 'ltr'}>
              {/* Welcome Message */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                <div className="text-6xl mb-4">🧠💙</div>
                <h1 className={`text-3xl font-bold text-gray-800 mb-4 ${languageSettings.current_language === 'ar' ? 'arabic-heading' : ''}`}>
                  {languageSettings.current_language === 'ar' 
                    ? 'مرحباً بك في MindEase AI'
                    : 'Bienvenue dans MindEase AI'
                  }
                </h1>
                <p className={`text-gray-600 mb-6 ${languageSettings.current_language === 'ar' ? 'arabic-text' : ''}`}>
                  {languageSettings.current_language === 'ar' 
                    ? 'مساعدك الذكي للصحة النفسية والرفاهية الشخصية'
                    : 'Votre assistant IA pour le bien-être mental et l\'accompagnement thérapeutique'
                  }
                </p>


                {/* Features */}
                <div className={`grid md:grid-cols-2 gap-4 text-left ${isRtl() ? 'text-right' : 'text-left'}`}>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🇫🇷</div>
                    <h3 className="font-semibold text-blue-800 mb-1">Avatars Français</h3>
                    <p className="text-sm text-blue-600">Dr. Elena, Max Énergie, Luna Sérénité, Dr. Alex Insight</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🇲🇦</div>
                    <h3 className={`font-semibold text-orange-800 mb-1 ${languageSettings.current_language === 'ar' ? 'arabic-text' : ''}`}>
                      {languageSettings.current_language === 'ar' ? 'أفاتار مغربية' : 'Avatars Marocains'}
                    </h3>
                    <p className={`text-sm text-orange-600 ${languageSettings.current_language === 'ar' ? 'arabic-text' : ''}`}>
                      {languageSettings.current_language === 'ar' 
                        ? 'د. عائشة، أحمد، لالة فاطمة الزهراء، د. يوسف'
                        : 'Dr. Aicha, Ahmed, Lalla Fatima Zahra, Dr. Youssef'
                      }
                    </p>
                  </div>
                </div>

                {/* Quick Start */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className={`text-sm text-gray-500 mb-4 ${languageSettings.current_language === 'ar' ? 'arabic-text' : ''}`}>
                    {languageSettings.current_language === 'ar' 
                      ? 'للبدء، يرجى إنشاء محادثة جديدة من الشريط الجانبي'
                      : 'Pour commencer, créez une nouvelle conversation depuis la barre latérale'
                    }
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {languageSettings.current_language === 'ar' ? '🔒 خصوصية مضمونة' : '🔒 Conversations privées'}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {languageSettings.current_language === 'ar' ? '🎤 أصوات طبيعية' : '🎤 Voix naturelles'}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {languageSettings.current_language === 'ar' ? '🌍 متاح 24/7' : '🌍 Disponible 24h/24'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cultural Features */}
              {languageSettings.current_language === 'ar' && (
                <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="text-4xl mb-3">🇲🇦</div>
                  <h2 className="text-xl font-bold text-orange-800 mb-2 arabic-heading">
                    تجربة مغربية أصيلة
                  </h2>
                  <p className="text-orange-700 arabic-text">
                    أفاتار بلهجة مغربية طبيعية مع Google Gemini TTS
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full">الدارجة المغربية</span>
                    <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full">التقاليد المحلية</span>
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">أصوات أصيلة</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="space-y-4">
            {messages.map(message => (
              <MessageBubble 
                key={message.id} 
                message={message}
                autoPlay={autoPlayEnabled}
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg p-4 max-w-xs shadow-sm border">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {languageSettings.current_language === 'ar' ? 'MindEase يفكر...' : 'MindEase réfléchit...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Replies */}
      {!isLoading && messages.length > 1 && (
        <div className="px-4 pb-2 bg-gray-50">
          <QuickReplies 
            onSelect={handleQuickReply}
            context={currentContext}
          />
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-white p-4 shadow-lg">
        {activeConversationId ? (
          <>
            <MessageInput onSend={handleSendMessage} disabled={isLoading} />
            
            {/* Avatar selection prompt when no avatar is selected */}
            {!selectedAvatar && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className={`flex items-center justify-between ${isRtl() ? 'space-x-reverse' : 'space-x-3'}`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600 text-xl">🤖</span>
                    <span className={`text-sm text-yellow-800 ${languageSettings.current_language === 'ar' ? 'arabic-text' : ''}`}>
                      {languageSettings.current_language === 'ar' 
                        ? 'اختر أفاتار للبدء في المحادثة'
                        : 'Sélectionnez un avatar pour commencer'
                      }
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAvatarSelector(true)}
                    className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    {languageSettings.current_language === 'ar' ? 'اختيار' : 'Choisir'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Info bar */}
            <div className={`mt-3 flex items-center justify-center space-x-4 text-xs text-gray-500 ${isRtl() ? 'space-x-reverse' : ''}`}>
              <div className="flex items-center space-x-1">
                <span>🔒</span>
                <span className={languageSettings.current_language === 'ar' ? 'arabic-text' : ''}>
                  {languageSettings.current_language === 'ar' ? 'محادثات خاصة ومحمية' : 'Conversations privées et sécurisées'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>⚕️</span>
                <span className={languageSettings.current_language === 'ar' ? 'arabic-text' : ''}>
                  {languageSettings.current_language === 'ar' ? 'ليس بديلاً عن العلاج الطبي' : 'Ceci n\'est pas un substitut médical'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🌍</span>
                <span className={languageSettings.current_language === 'ar' ? 'arabic-text' : ''}>
                  {languageSettings.current_language === 'ar' ? 'متاح 24/7' : 'Disponible 24h/24'}
                </span>
              </div>
            </div>
          </>
        ) : (
          /* No active conversation - Show create conversation prompt */
          <div className="text-center p-4">
            <div className="mb-4 text-4xl">📝</div>
            <p className={`text-gray-600 mb-4 ${languageSettings.current_language === 'ar' ? 'arabic-text' : ''}`}>
              {languageSettings.current_language === 'ar' 
                ? 'لا توجد محادثة نشطة. أنشئ محادثة جديدة للبدء!'
                : 'Aucune conversation active. Créez une nouvelle conversation pour commencer !'
              }
            </p>
            <div className={`text-xs text-gray-400 ${languageSettings.current_language === 'ar' ? 'arabic-text' : ''}`}>
              {languageSettings.current_language === 'ar' 
                ? 'استخدم الشريط الجانبي لإنشاء محادثة جديدة ←'
                : 'Utilisez la barre latérale pour créer une nouvelle conversation ←'
              }
            </div>
          </div>
        )}
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <AvatarSelector
              currentAvatarId={selectedAvatar?.id}
              conversationId={activeConversationId || 'default'}
              onAvatarSelect={handleAvatarSelect}
              showVoicePreview={true}
              showQuickSwitch={false}
              className="max-h-[90vh] overflow-y-auto"
            />
            <div className="p-4 bg-white border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Settings Modal */}
      {showAvatarConfig && (
        <ConversationSettingsModal
          isOpen={showAvatarConfig}
          conversationId={activeConversationId || 'default'}
          onClose={() => setShowAvatarConfig(false)}
        />
      )}

    </div>
  );
};
