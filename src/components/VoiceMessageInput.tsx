import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Send, Mic, Square, Loader2 } from 'lucide-react';

interface VoiceMessageInputProps {
  onSend: (message: string, mode: 'text' | 'voice') => void;
  disabled: boolean;
}

export const VoiceMessageInput: React.FC<VoiceMessageInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const { languageSettings } = useLanguage();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Fonctions RTL simplifiées
  const getTextDirection = () => languageSettings.current_language === 'ar' ? 'rtl' : 'ltr';
  const shouldUseRtl = () => languageSettings.current_language === 'ar';

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = languageSettings.current_language === 'ar' ? 'ar-MA' : 'fr-FR';
        
        recognitionRef.current.onstart = () => {
          setIsRecording(true);
          setRecordingTime(0);
          startTimer();
        };
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim() && !disabled) {
            onSend(transcript.trim(), 'voice');
          }
          setIsRecording(false);
          setRecordingTime(0);
          stopTimer();
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            console.log('No speech detected, please try speaking again');
          }
          setIsRecording(false);
          setIsTranscribing(false);
          setRecordingTime(0);
          stopTimer();
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
          setRecordingTime(0);
          stopTimer();
        };
      }
    }

    return () => {
      stopTimer();
    };
  }, [languageSettings.current_language]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

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

  const startVoiceRecording = async () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not supported');
      return;
    }

    try {
      setIsTranscribing(true);
      setIsRecording(false);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsTranscribing(false);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current && (isRecording || isTranscribing)) {
      recognitionRef.current.stop();
    }
    setIsTranscribing(false);
    setIsRecording(false);
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isVoiceSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  return (
    <div className="flex items-end space-x-3">
      {/* Message Input */}
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            disabled && !isRecording
              ? (languageSettings.current_language === 'ar' ? 'حدد محادثة للكتابة...' : 'Select a conversation to type...')
              : isRecording 
              ? (languageSettings.current_language === 'ar' ? 'استمع...' : 'Listening...')
              : (languageSettings.current_language === 'ar' ? 'اكتب رسالتك...' : 'Type Message...')
          }
          className={`w-full p-4 border-2 rounded-2xl resize-none focus:outline-none focus:ring-0 placeholder-gray-400 text-base transition-all duration-200 ${
            shouldUseRtl() ? 'text-right' : 'text-left'
          } ${
            isRecording 
              ? 'border-red-300 bg-red-50 text-red-700' 
              : disabled && !isRecording
              ? 'border-gray-100 bg-gray-50 text-gray-400'
              : 'border-gray-100 bg-white focus:border-blue-400'
          }`}
          dir={getTextDirection()}
          rows={1}
          maxLength={1000}
          disabled={disabled || isRecording}
          style={{
            minHeight: '60px',
            maxHeight: '140px'
          }}
        />
        
        {/* Recording visual feedback */}
        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-6 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-4 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-8 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-5 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
            </div>
            <span className="text-red-600 font-mono text-sm font-medium">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>
      
      {/* Voice Button */}
      {isVoiceSupported && (
        <button
          onClick={handleVoiceClick}
          disabled={disabled && !isRecording}
          className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 border-2 min-w-[80px] justify-center ${
            isRecording
              ? 'bg-red-500 text-white border-red-500 shadow-lg'
              : isTranscribing
              ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg'
              : disabled
              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          title={
            isRecording 
              ? (languageSettings.current_language === 'ar' ? 'إيقاف التسجيل' : 'Stop Recording')
              : (languageSettings.current_language === 'ar' ? 'تسجيل صوتي' : 'Voice')
          }
        >
          {isTranscribing && !isRecording ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                {languageSettings.current_language === 'ar' ? 'معالجة' : 'Processing'}
              </span>
            </>
          ) : isRecording ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">
                {languageSettings.current_language === 'ar' ? 'إيقاف' : 'Stop'}
              </span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">
                {languageSettings.current_language === 'ar' ? 'صوت' : 'Voice'}
              </span>
            </>
          )}
        </button>
      )}
      
      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled || isRecording}
        className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 border-2 min-w-[80px] justify-center ${
          !message.trim() || disabled || isRecording
            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
        }`}
      >
        <Send className="w-4 h-4" />
        <span className="text-sm font-medium">
          {languageSettings.current_language === 'ar' ? 'إرسال' : 'Send'}
        </span>
      </button>
    </div>
  );
};