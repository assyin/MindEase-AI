import React, { useState, useEffect } from 'react';

interface SpeechControlsProps {
  text: string;
  isVisible: boolean;
  autoPlay?: boolean;
}

export const SpeechControls: React.FC<SpeechControlsProps> = ({ 
  text, 
  isVisible, 
  autoPlay = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Nettoyer le texte pour la synthèse
  const cleanText = (rawText: string): string => {
    return rawText
      .replace(/\*\*(.*?)\*\*/g, '$1') // Enlever markdown bold
      .replace(/\*(.*?)\*/g, '$1') // Enlever markdown italic
      .replace(/#{1,6}\s/g, '') // Enlever headers markdown
      .replace(/``````/g, '') // Enlever code blocks
      .replace(/`([^`]+)`/g, '$1') // Enlever inline code
      .replace(/💙|🌱|✨|😊|🔧|💬|📊|⚙️/g, '') // Enlever emojis
      .replace(/\n\n/g, '. ') // Double retours ligne = pause
      .replace(/\n/g, ', ') // Simple retour = virgule
      .replace(/\s+/g, ' ') // Espaces multiples
      .replace(/---.*?---/g, '') // Enlever séparateurs
      .trim();
  };

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech Synthesis non supporté');
      return;
    }

    const synth = window.speechSynthesis;
    
    // Annuler toute synthèse en cours
    if (synth.speaking) {
      synth.cancel();
    }

    const cleanedText = cleanText(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      console.log('🔊 Synthèse démarrée');
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      console.log('✅ Synthèse terminée');
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    };

    utterance.onerror = (event) => {
      console.error('❌ Erreur synthèse:', event);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    };

    synth.speak(utterance);
    setCurrentUtterance(utterance);
  };

  const handlePause = () => {
    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setIsPaused(true);
    } else if (synth.paused) {
      synth.resume();
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentUtterance(null);
  };

  if (!isVisible || !('speechSynthesis' in window)) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <button
        onClick={handlePlay}
        disabled={isPlaying && !isPaused}
        className={`p-2 rounded-full text-white transition-colors ${
          isPlaying && !isPaused 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        title="Lire le texte"
      >
        🔊
      </button>

      {isPlaying && (
        <>
          <button
            onClick={handlePause}
            className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
            title={isPaused ? "Reprendre" : "Pause"}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>

          <button
            onClick={handleStop}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            title="Arrêter"
          >
            ⏹️
          </button>

          <div className="text-sm text-blue-700">
            {isPaused ? '⏸️ En pause' : '🔊 Lecture...'}
          </div>
        </>
      )}
    </div>
  );
};
