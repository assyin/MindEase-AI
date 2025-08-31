import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import { webSpeechSTTService, STTResponse } from '../services/WebSpeechSTTService';

interface VoiceInputProps {
  onTranscript: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'idle' | 'listening' | 'processing' | 'error') => void;
  
  // Configuration
  expertId?: string;
  emotionalContext?: string;
  autoSend?: boolean;
  showTranscript?: boolean;
  
  // Style
  variant?: 'button' | 'inline' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  
  // États externes
  disabled?: boolean;
  placeholder?: string;
}

type VoiceInputStatus = 'idle' | 'listening' | 'processing' | 'error';

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onError,
  onStatusChange,
  expertId,
  emotionalContext = 'neutral',
  autoSend = false,
  showTranscript = true,
  variant = 'inline',
  size = 'md',
  className = '',
  disabled = false,
  placeholder = 'Appuyez pour parler...'
}) => {
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lastError, setLastError] = useState('');
  const [emotionalAnalysis, setEmotionalAnalysis] = useState<any>(null);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const sessionRef = useRef<any>(null);

  // Vérifier support reconnaissance vocale
  const isSupported = webSpeechSTTService.isRecognitionSupported();

  useEffect(() => {
    // Notifier changement statut
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    // Timer pour enregistrement
    if (status === 'listening') {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  // Démarrage reconnaissance vocale
  const startListening = async () => {
    if (!isSupported || disabled || status === 'listening') {
      return;
    }

    try {
      setStatus('listening');
      setTranscript('');
      setInterimTranscript('');
      setConfidence(0);
      setLastError('');
      setEmotionalAnalysis(null);

      // Configuration reconnaissance selon expert
      const config = {
        language: 'fr-FR',
        continuous: true,
        interimResults: true,
        maxAlternatives: 2,
        expertId,
        emotionalContext
      };

      // Démarrer session reconnaissance
      sessionRef.current = await webSpeechSTTService.startTherapeuticRecognition(
        expertId || 'default',
        emotionalContext,
        {
          onResult: handleRecognitionResult,
          onError: handleRecognitionError,
          onEnd: handleRecognitionEnd
        }
      );

      if (!sessionRef.current) {
        throw new Error('Impossible de démarrer la reconnaissance vocale');
      }

    } catch (error) {
      console.error('Erreur démarrage reconnaissance vocale:', error);
      handleRecognitionError(error.message || 'Erreur inconnue');
    }
  };

  // Arrêt reconnaissance vocale
  const stopListening = async () => {
    if (status !== 'listening') return;

    try {
      setStatus('processing');
      await webSpeechSTTService.stopRecognitionSession();
      
      // Finaliser transcript si disponible
      if (transcript && !autoSend) {
        // Attendre validation manuelle
        setStatus('idle');
      } else if (transcript && autoSend) {
        // Envoyer automatiquement
        handleSendTranscript();
      } else {
        setStatus('idle');
      }

    } catch (error) {
      console.error('Erreur arrêt reconnaissance:', error);
      handleRecognitionError('Erreur lors de l\'arrêt');
    }
  };

  // Traitement résultat reconnaissance
  const handleRecognitionResult = (result: STTResponse) => {
    if (result.isFinal) {
      // Transcript final
      setTranscript(result.transcript);
      setInterimTranscript('');
      setConfidence(result.confidence);

      // Analyse thérapeutique si disponible
      if (expertId) {
        const analysis = webSpeechSTTService.analyzeTherapeuticSentiment(result.transcript);
        setEmotionalAnalysis(analysis);

        // Alerte si détresse détectée
        if (analysis.needsAttention) {
          onError?.(`⚠️ Indicateurs de détresse détectés: ${analysis.therapeuticIndicators.join(', ')}`);
        }
      }

      // Auto-envoi si configuré
      if (autoSend && result.transcript.trim()) {
        setTimeout(() => {
          handleSendTranscript(result.transcript, result.confidence);
        }, 500);
      }

    } else {
      // Transcript intermédiaire
      setInterimTranscript(result.transcript);
    }
  };

  // Gestion erreurs reconnaissance
  const handleRecognitionError = (error: string) => {
    console.error('Erreur reconnaissance vocale:', error);
    setStatus('error');
    setLastError(error);
    setInterimTranscript('');
    onError?.(error);
  };

  // Fin reconnaissance
  const handleRecognitionEnd = () => {
    if (status === 'listening') {
      setStatus('idle');
    }
  };

  // Envoi transcript
  const handleSendTranscript = (finalTranscript?: string, finalConfidence?: number) => {
    const textToSend = finalTranscript || transcript;
    const confidenceToSend = finalConfidence || confidence;

    if (!textToSend.trim()) return;

    onTranscript(textToSend, confidenceToSend);
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setEmotionalAnalysis(null);
    setStatus('idle');
  };

  // Réinitialisation
  const handleReset = () => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setLastError('');
    setEmotionalAnalysis(null);
    setStatus('idle');
  };

  // Formatage temps
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Classes CSS selon variant et size
  const getButtonClasses = () => {
    const sizeClasses = {
      sm: 'p-2 w-8 h-8',
      md: 'p-3 w-12 h-12',
      lg: 'p-4 w-16 h-16'
    };

    const baseClasses = 'rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    if (status === 'listening') {
      return `${baseClasses} ${sizeClasses[size]} bg-red-100 text-red-600 hover:bg-red-200 shadow-lg animate-pulse`;
    } else if (status === 'processing') {
      return `${baseClasses} ${sizeClasses[size]} bg-yellow-100 text-yellow-600 cursor-not-allowed`;
    } else if (status === 'error') {
      return `${baseClasses} ${sizeClasses[size]} bg-red-100 text-red-600 hover:bg-red-200`;
    } else {
      return `${baseClasses} ${sizeClasses[size]} bg-gray-100 text-gray-600 hover:bg-gray-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    }
  };

  const getIconSize = () => {
    return size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  };

  // Interface non supportée
  if (!isSupported) {
    return (
      <div className={`flex items-center space-x-2 text-amber-600 ${className}`}>
        <MicOff className="w-4 h-4" />
        <span className="text-sm">Reconnaissance vocale non disponible</span>
      </div>
    );
  }

  // Variant bouton flottant
  if (variant === 'floating') {
    return (
      <div className={`relative ${className}`}>
        <motion.button
          onClick={status === 'listening' ? stopListening : startListening}
          disabled={disabled || status === 'processing'}
          className={getButtonClasses()}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          {status === 'processing' ? (
            <Loader2 className={`${getIconSize()} animate-spin`} />
          ) : status === 'listening' ? (
            <MicOff className={getIconSize()} />
          ) : status === 'error' ? (
            <AlertCircle className={getIconSize()} />
          ) : (
            <Mic className={getIconSize()} />
          )}
        </motion.button>

        {/* Timer enregistrement */}
        <AnimatePresence>
          {status === 'listening' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs font-mono"
            >
              {formatTime(recordingTime)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Variant bouton simple
  if (variant === 'button') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={status === 'listening' ? stopListening : startListening}
          disabled={disabled || status === 'processing'}
          className={getButtonClasses()}
        >
          {status === 'processing' ? (
            <Loader2 className={`${getIconSize()} animate-spin`} />
          ) : status === 'listening' ? (
            <MicOff className={getIconSize()} />
          ) : status === 'error' ? (
            <AlertCircle className={getIconSize()} />
          ) : (
            <Mic className={getIconSize()} />
          )}
        </button>

        {/* Statut textuel */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            {status === 'listening' ? 'En écoute...' :
             status === 'processing' ? 'Traitement...' :
             status === 'error' ? 'Erreur' :
             'Appuyer pour parler'}
          </span>
          {status === 'listening' && (
            <span className="text-xs text-gray-500">{formatTime(recordingTime)}</span>
          )}
        </div>
      </div>
    );
  }

  // Variant inline (complet)
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Zone de transcription */}
      {showTranscript && (transcript || interimTranscript) && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Transcript final */}
              {transcript && (
                <p className="text-gray-800 mb-1">{transcript}</p>
              )}
              
              {/* Transcript intermédiaire */}
              {interimTranscript && (
                <p className="text-gray-500 italic">{interimTranscript}</p>
              )}
              
              {/* Informations de confiance */}
              {confidence > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500">
                    Confiance: {Math.round(confidence * 100)}%
                  </span>
                  {confidence >= 0.8 && (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  )}
                  {confidence < 0.6 && (
                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                  )}
                </div>
              )}

              {/* Analyse émotionnelle */}
              {emotionalAnalysis && emotionalAnalysis.primaryEmotion !== 'neutre' && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <span className="text-blue-600">
                    Émotion détectée: {emotionalAnalysis.primaryEmotion} 
                    (Intensité: {emotionalAnalysis.emotionalIntensity}/10)
                  </span>
                </div>
              )}
            </div>

            {/* Actions transcript */}
            {transcript && !autoSend && (
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => handleSendTranscript()}
                  className="p-1 rounded hover:bg-gray-200 text-green-600"
                  title="Envoyer"
                >
                  <Send className="w-3 h-3" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-1 rounded hover:bg-gray-200 text-gray-500"
                  title="Effacer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contrôles principaux */}
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          {/* Bouton micro principal */}
          <button
            onClick={status === 'listening' ? stopListening : startListening}
            disabled={disabled || status === 'processing'}
            className={getButtonClasses()}
          >
            {status === 'processing' ? (
              <Loader2 className={`${getIconSize()} animate-spin`} />
            ) : status === 'listening' ? (
              <MicOff className={getIconSize()} />
            ) : status === 'error' ? (
              <AlertCircle className={getIconSize()} />
            ) : (
              <Mic className={getIconSize()} />
            )}
          </button>

          {/* Statut et timer */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              {status === 'listening' ? 'En écoute...' :
               status === 'processing' ? 'Traitement...' :
               status === 'error' ? 'Erreur détectée' :
               placeholder}
            </span>
            
            {status === 'listening' && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-red-600 font-mono">{formatTime(recordingTime)}</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-3 bg-red-500 rounded animate-pulse"></div>
                  <div className="w-1 h-2 bg-red-400 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-4 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions secondaires */}
        <div className="flex items-center space-x-2">
          {/* Bouton reset */}
          {(transcript || lastError) && (
            <button
              onClick={handleReset}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              title="Réinitialiser"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Erreur */}
      <AnimatePresence>
        {lastError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{lastError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;