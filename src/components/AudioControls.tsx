import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  SkipForward,
  Loader2,
  Headphones,
  Settings
} from 'lucide-react';

interface AudioControlsProps {
  // Contrôles TTS
  isMuted: boolean;
  onToggleMute: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  audioProgress?: number;
  
  // Contrôles STT
  isRecording: boolean;
  onToggleRecording: () => void;
  isSTTSupported: boolean;
  recordingQuality?: 'good' | 'fair' | 'poor';
  
  // États
  isProcessing?: boolean;
  expertVoice?: string;
  
  // Callbacks
  onSettingsClick?: () => void;
  onSkipAudio?: () => void;
  
  // Style
  variant?: 'compact' | 'full';
  className?: string;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isMuted,
  onToggleMute,
  isPlaying = false,
  onTogglePlay,
  audioProgress = 0,
  isRecording,
  onToggleRecording,
  isSTTSupported,
  recordingQuality = 'good',
  isProcessing = false,
  expertVoice,
  onSettingsClick,
  onSkipAudio,
  variant = 'full',
  className = ''
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  // Timer enregistrement
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingQualityColor = (quality: string) => {
    switch (quality) {
      case 'good': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Contrôle Audio Principal */}
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-full transition-colors ${
            isMuted 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Contrôle Micro */}
        {isSTTSupported && (
          <button
            onClick={onToggleRecording}
            disabled={isProcessing}
            className={`p-2 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement vocal'}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 ${className}`}>
      {/* Header avec info expert */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Headphones className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">
            Audio - {expertVoice || 'Expert'}
          </span>
        </div>
        
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Paramètres audio"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Contrôles principaux */}
      <div className="flex items-center justify-between">
        {/* Section TTS */}
        <div className="flex items-center space-x-3">
          {/* Bouton Muet/Son */}
          <div className="relative">
            <button
              onClick={onToggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              className={`p-3 rounded-full transition-all duration-200 ${
                isMuted 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 shadow-md' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 shadow-md'
              }`}
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Slider Volume */}
            <AnimatePresence>
              {showVolumeSlider && !isMuted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-xs text-gray-500">Volume</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-600">{Math.round(volume * 100)}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contrôle Lecture */}
          {onTogglePlay && (
            <button
              onClick={onTogglePlay}
              className={`p-3 rounded-full transition-all duration-200 ${
                isPlaying
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 shadow-md'
                  : 'bg-green-100 text-green-600 hover:bg-green-200 shadow-md'
              }`}
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          )}

          {/* Skip Audio */}
          {onSkipAudio && (
            <button
              onClick={onSkipAudio}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Passer l'audio"
            >
              <SkipForward className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Barre de progression audio */}
        {audioProgress > 0 && (
          <div className="flex-1 mx-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${audioProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Section STT */}
        {isSTTSupported && (
          <div className="flex items-center space-x-3">
            {/* Indicateur qualité */}
            {isRecording && (
              <div className="flex flex-col items-center">
                <div className={`text-xs font-medium ${getRecordingQualityColor(recordingQuality)}`}>
                  {recordingQuality === 'good' && '●●●'}
                  {recordingQuality === 'fair' && '●●○'}
                  {recordingQuality === 'poor' && '●○○'}
                </div>
                <span className="text-xs text-gray-500">Signal</span>
              </div>
            )}

            {/* Timer enregistrement */}
            {isRecording && (
              <div className="flex flex-col items-center">
                <span className="text-sm font-mono text-red-600">{formatTime(recordingTime)}</span>
                <span className="text-xs text-gray-500">Durée</span>
              </div>
            )}

            {/* Bouton Micro */}
            <div className="relative">
              <button
                onClick={onToggleRecording}
                disabled={isProcessing}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isRecording 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200 shadow-md animate-pulse' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-md'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement vocal'}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Indicateur enregistrement actif */}
              {isRecording && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* État de traitement */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-200"
          >
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">Traitement en cours...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicateur STT non supporté */}
      {!isSTTSupported && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-amber-600">
            <MicOff className="w-4 h-4" />
            <span className="text-xs">Reconnaissance vocale non disponible</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioControls;