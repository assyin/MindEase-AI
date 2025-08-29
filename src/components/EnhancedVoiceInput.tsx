import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useLanguage } from '../contexts/LanguageContext';
import { Send, Mic, MicOff } from 'lucide-react';

interface EnhancedVoiceInputProps {
  onSend: (message: string, mode: 'text' | 'voice') => void;
  disabled: boolean;
}

export const EnhancedVoiceInput: React.FC<EnhancedVoiceInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const { languageSettings } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Fonctions RTL
  const getTextDirection = () => languageSettings.current_language === 'ar' ? 'rtl' : 'ltr';
  const shouldUseRtl = () => languageSettings.current_language === 'ar';

  // Langue pour la reconnaissance vocale
  const getLanguageCode = () => {
    switch (languageSettings.current_language) {
      case 'ar': return 'ar-MA';
      case 'en': return 'en-US';
      default: return 'fr-FR';
    }
  };

  // Mettre à jour le message avec le transcript
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [message]);

  const startListening = async () => {
    if (!browserSupportsSpeechRecognition) {
      alert(languageSettings.current_language === 'ar' 
        ? 'متصفحك لا يدعم التعرف على الصوت'
        : 'Votre navigateur ne supporte pas la reconnaissance vocale');
      return;
    }

    if (!isMicrophoneAvailable) {
      alert(languageSettings.current_language === 'ar'
        ? 'الميكروفون غير متاح. يرجى التحقق من الأذونات.'
        : 'Microphone non disponible. Vérifiez les permissions.');
      return;
    }

    try {
      resetTranscript();
      setMessage('');
      
      SpeechRecognition.startListening({
        continuous: true,
        language: getLanguageCode()
      });
    } catch (error) {
      console.error('Erreur démarrage reconnaissance vocale:', error);
      alert(languageSettings.current_language === 'ar'
        ? 'خطأ في بدء التعرف على الصوت'
        : 'Erreur lors du démarrage de la reconnaissance vocale');
    }
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const handleMicClick = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSend = () => {
    const finalMessage = message.trim();
    if (finalMessage && !disabled) {
      onSend(finalMessage, transcript ? 'voice' : 'text');
      setMessage('');
      resetTranscript();
      if (listening) {
        stopListening();
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Gestion permission microphone
  const checkMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Permission microphone refusée:', error);
      return false;
    }
  };

  const getMicrophoneIcon = () => {
    if (listening) {
      return (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
          <span className="text-red-500 text-xs font-medium">
            {languageSettings.current_language === 'ar' ? 'استمع...' : 'Écoute...'}
          </span>
        </div>
      );
    }
    
    return (
      <Mic className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-gray-600 hover:text-blue-500'}`} />
    );
  };

  const getPlaceholder = () => {
    if (disabled) {
      return languageSettings.current_language === 'ar' 
        ? 'حدد محادثة للكتابة...' 
        : 'Sélectionnez une conversation pour écrire...';
    }
    if (listening) {
      return languageSettings.current_language === 'ar' 
        ? 'استمع... تحدث الآن' 
        : 'Écoute... Parlez maintenant';
    }
    return languageSettings.current_language === 'ar' 
      ? 'اكتب رسالتك أو استخدم الميكروفون...' 
      : 'Tapez votre message ou utilisez le microphone...';
  };

  return (
    <div className="flex items-end space-x-3 rtl:space-x-reverse">
      {/* Zone de saisie avec microphone intégré */}
      <div className="flex-1 relative">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            className={`w-full p-4 pr-12 border-2 rounded-2xl resize-none focus:outline-none focus:ring-0 placeholder-gray-400 text-base transition-all duration-200 ${
              shouldUseRtl() ? 'text-right pl-12 pr-4' : 'text-left pr-12 pl-4'
            } ${
              listening 
                ? 'border-red-300 bg-red-50 text-red-700' 
                : disabled
                ? 'border-gray-100 bg-gray-50 text-gray-400'
                : 'border-gray-100 bg-white focus:border-blue-400'
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
          
          {/* Bouton microphone intégré */}
          <button
            onClick={handleMicClick}
            disabled={disabled}
            className={`absolute top-4 ${shouldUseRtl() ? 'left-3' : 'right-3'} p-2 rounded-full transition-all duration-200 ${
              listening
                ? 'bg-red-100 text-red-500 hover:bg-red-200'
                : disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-500'
            }`}
            title={
              listening 
                ? (languageSettings.current_language === 'ar' ? 'إيقاف الاستماع' : 'Arrêter l\'écoute')
                : (languageSettings.current_language === 'ar' ? 'بدء الاستماع' : 'Commencer l\'écoute')
            }
          >
            {getMicrophoneIcon()}
          </button>
          
          {/* Animation de pulsation pendant l'enregistrement */}
          {listening && (
            <div className={`absolute top-2 ${shouldUseRtl() ? 'left-1' : 'right-1'} w-8 h-8 border-2 border-red-300 rounded-full animate-ping`}></div>
          )}
        </div>
        
        {/* Indicateur de transcription en temps réel */}
        {transcript && listening && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-600 font-medium mb-1">
              {languageSettings.current_language === 'ar' ? 'التعرف على الصوت:' : 'Reconnaissance vocale:'}
            </div>
            <div className={`text-sm text-blue-800 ${shouldUseRtl() ? 'text-right' : 'text-left'}`} dir={getTextDirection()}>
              {transcript}
            </div>
          </div>
        )}
        
        {/* Support navigateur */}
        {!browserSupportsSpeechRecognition && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-xs text-yellow-600">
              {languageSettings.current_language === 'ar' 
                ? 'التعرف على الصوت غير مدعوم في هذا المتصفح'
                : 'Reconnaissance vocale non supportée par ce navigateur'}
            </div>
          </div>
        )}
      </div>
      
      {/* Bouton Envoyer */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className={`px-6 py-4 rounded-xl transition-all duration-200 flex items-center space-x-2 border-2 min-w-[100px] justify-center ${
          !message.trim() || disabled
            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
        }`}
      >
        <Send className="w-5 h-5" />
        <span className="text-sm font-medium">
          {languageSettings.current_language === 'ar' ? 'إرسال' : 'Envoyer'}
        </span>
      </button>
    </div>
  );
};