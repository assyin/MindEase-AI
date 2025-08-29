import React, { useState, useEffect, useRef } from 'react';
import { AIModelManager } from '../services/AIModelManager';
import { SimpleMessageBubble } from './SimpleMessageBubble';
import { EnhancedVoiceInput } from './EnhancedVoiceInput';
import { ConversationSettingsModal } from './ConversationSettingsModal';
import { avatarManager } from '../services/AvatarManager';
import { aiContextManager } from '../services/AIContextManager';
import { useConversations, useActiveConversation } from '../contexts/ConversationsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Avatar } from '../types';
import { Settings } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
}

export const MinimalChatInterface: React.FC = () => {
  const { activeConversationId, messages: conversationMessages } = useActiveConversation();
  const { addMessage } = useConversations();
  const { languageSettings } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [aiManager] = useState(() => new AIModelManager());
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        const defaultAvatar = avatarManager.getAvatarById('therapist-main');
        if (defaultAvatar) {
          setSelectedAvatar(defaultAvatar);
        }
      }
    };

    initializeAvatar();

    // Load conversation messages
    if (conversationMessages && conversationMessages.length > 0) {
      setMessages(conversationMessages.map((msg, index) => ({
        id: `${msg.id}-${index}`,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        model: msg.ai_model
      })));
    } else {
      setMessages([]);
    }
  }, [activeConversationId, conversationMessages]);

  const handleSendMessage = async (content: string, mode: 'text' | 'voice') => {
    if (!activeConversationId) return;
    if (!selectedAvatar) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${crypto.randomUUID()}`,
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Add user message to conversation
      await addMessage(content, 'user');

      // Prepare AI context with selected avatar
      await aiContextManager.adaptContextToAvatar(activeConversationId, selectedAvatar.id);

      const context = {
        messages: messages.map(m => ({ role: m.role, content: m.content })),
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
        'gemini'
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}-${crypto.randomUUID()}`,
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp,
        model: selectedAvatar.id
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Add assistant message to conversation
      await addMessage(response.content, 'assistant');

    } catch (error) {
      console.error('Erreur génération réponse:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}-${crypto.randomUUID()}`,
        role: 'assistant',
        content: 'Désolé, je rencontre une difficulté technique momentanée. Pouvez-vous reformuler votre message ?',
        timestamp: Date.now(),
        model: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Minimal Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 p-4">
        <div className="flex justify-end">
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
            title="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages or Empty State */}
      <div className="flex-1 overflow-y-auto">
        {!activeConversationId ? (
          /* Empty State */
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className={languageSettings.current_language === 'ar' ? 'arabic-text' : ''}>
                {languageSettings.current_language === 'ar' 
                  ? 'حدد محادثة من اليسار للبدء'
                  : 'Sélectionnez une conversation à gauche pour commencer'
                }
              </p>
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="p-6 space-y-2 max-w-4xl mx-auto w-full">
            {messages.map(message => (
              <SimpleMessageBubble 
                key={message.id} 
                message={message}
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-8">
                <div className="bg-white rounded-3xl p-4 max-w-xs shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-500">...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input - Always visible */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 p-6">
        <div className="max-w-4xl mx-auto w-full">
          <EnhancedVoiceInput onSend={handleSendMessage} disabled={isLoading || !activeConversationId} />
          {!activeConversationId && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-400">
                {languageSettings.current_language === 'ar' 
                  ? 'حدد محادثة للبدء في الكتابة أو التحدث'
                  : 'Select a conversation to start typing or speaking'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <ConversationSettingsModal
          isOpen={showSettings}
          conversationId={activeConversationId || 'default'}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};