import React, { useState, KeyboardEvent } from 'react';
import { AudioRecorder } from './AudioRecorder';
import { TranscriptionService } from '../services/TranscriptionService';
import { useLanguage } from '../contexts/LanguageContext';

interface MessageInputProps {
  onSend: (message: string, mode: 'text' | 'voice') => void;
  disabled: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const { languageSettings, getTextDirection, shouldUseRtl } = useLanguage();
  const transcriptionService = new TranscriptionService();

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

  const handleAudioRecorded = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      const transcription = await transcriptionService.transcribeAudio(audioBlob);
      if (transcription.trim()) {
        onSend(transcription, 'voice');
      }
    } catch (error) {
      console.error('Erreur transcription:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sélecteur de mode */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={() => setInputMode('text')}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            inputMode === 'text' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          💬 Texte
        </button>
        <button
          onClick={() => setInputMode('voice')}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            inputMode === 'voice' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🎤 Vocal
        </button>
      </div>

      {/* Interface selon le mode */}
      {inputMode === 'text' ? (
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                languageSettings.current_language === 'ar' 
                  ? 'اكتب رسالتك... (اضغط Enter للإرسال)'
                  : 'Écrivez votre message... (Entrée pour envoyer)'
              }
              className={`w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                shouldUseRtl('input') ? 'text-right' : 'text-left'
              }`}
              dir={getTextDirection()}
              rows={Math.max(1, Math.min(4, message.split('\n').length))}
              maxLength={1000}
              disabled={disabled}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {message.length}/1000
            </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              !message.trim() || disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {disabled ? '...' : 'Envoyer'}
          </button>
        </div>
      ) : (
        <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
          {isTranscribing ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Transcription en cours...</p>
            </div>
          ) : (
            <AudioRecorder
              onAudioRecorded={handleAudioRecorded}
              isDisabled={disabled}
            />
          )}
        </div>
      )}
    </div>
  );
};
