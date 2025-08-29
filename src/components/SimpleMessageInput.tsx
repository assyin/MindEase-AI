import React, { useState, KeyboardEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Send } from 'lucide-react';

interface SimpleMessageInputProps {
  onSend: (message: string, mode: 'text' | 'voice') => void;
  disabled: boolean;
}

export const SimpleMessageInput: React.FC<SimpleMessageInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const { languageSettings } = useLanguage();
  
  // Fonctions RTL simplifiées pour cette interface
  const getTextDirection = () => languageSettings.current_language === 'ar' ? 'rtl' : 'ltr';
  const shouldUseRtl = () => languageSettings.current_language === 'ar';

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim(), 'text');
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end space-x-4">
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            languageSettings.current_language === 'ar' 
              ? 'اكتب رسالتك...'
              : 'Tapez votre message...'
          }
          className={`w-full p-5 border-2 border-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-0 focus:border-blue-400 placeholder-gray-400 text-base transition-all duration-200 ${
            shouldUseRtl() ? 'text-right' : 'text-left'
          }`}
          dir={getTextDirection()}
          rows={1}
          maxLength={1000}
          disabled={disabled}
          style={{
            minHeight: '60px',
            maxHeight: '140px'
          }}
        />
      </div>
      
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className={`p-4 rounded-2xl transition-all duration-200 shadow-lg ${
          !message.trim() || disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-xl transform hover:-translate-y-0.5'
        }`}
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
};