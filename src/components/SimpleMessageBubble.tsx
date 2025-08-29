import React from 'react';
import { detectLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
}

interface SimpleMessageBubbleProps {
  message: Message;
}

export const SimpleMessageBubble: React.FC<SimpleMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Détecter la langue du contenu du message pour appliquer RTL si c'est de l'arabe
  const messageLanguage = detectLanguage(message.content);
  const isArabicContent = messageLanguage === 'ar';
  const messageDirection = isArabicContent ? 'rtl' : 'ltr';
  const shouldApplyRtl = isArabicContent;
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8`}>
      <div 
        className={`max-w-lg px-5 py-4 rounded-3xl shadow-sm ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-white text-gray-800 border border-gray-100'
        }`}
      >
        <div 
          className={`text-base leading-relaxed whitespace-pre-wrap ${
            shouldApplyRtl ? 'text-right arabic-text' : 'text-left'
          }`}
          dir={messageDirection}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};