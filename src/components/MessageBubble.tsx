import React from 'react';
import { SpeechControls } from './SpeechControls';
import { useLanguage, detectLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
  inputMode?: 'text' | 'voice';
}

interface MessageBubbleProps {
  message: Message;
  autoPlay?: boolean; // Prop ajoutée pour corriger l'erreur TypeScript
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, autoPlay = false }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  
  // Détecter la langue du contenu du message pour appliquer RTL si c'est de l'arabe
  const messageLanguage = detectLanguage(message.content);
  const isArabicContent = messageLanguage === 'ar';
  const messageDirection = isArabicContent ? 'rtl' : 'ltr';
  const shouldApplyRtl = isArabicContent;
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        <div 
          className={`text-sm whitespace-pre-wrap ${shouldApplyRtl ? 'text-right arabic-text' : 'text-left'}`}
          dir={messageDirection}
        >
          {message.content}
        </div>
        
        {/* Contrôles vocaux pour les réponses de l'assistant */}
        {isAssistant && message.model !== 'system' && (
          <SpeechControls 
            text={message.content}
            isVisible={true}
            autoPlay={autoPlay && message.inputMode === 'voice'} // Utilise la prop autoPlay
          />
        )}
        
        <div className={`text-xs mt-1 flex items-center justify-between ${
          isUser ? 'text-blue-200' : 'text-gray-500'
        }`}>
          <span>
            {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <div className="flex items-center space-x-1">
            {message.inputMode === 'voice' && (
              <span className="text-xs">🎤</span>
            )}
            {message.model && !isUser && (
              <span className="bg-green-100 text-green-800 px-1 rounded text-xs">
                {message.model}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
