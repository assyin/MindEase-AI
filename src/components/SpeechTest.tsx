import React, { useState } from 'react';
import { RobustTextToSpeech } from '../services/RobustTextToSpeech';
import { SpeechDiagnostic } from '../utils/speechDiagnostic';

export const SpeechTest: React.FC = () => {
  const [message, setMessage] = useState('');
  const [robustTTS] = useState(() => new RobustTextToSpeech());
  const [diagnostic] = useState(() => new SpeechDiagnostic());



  const testWithSpecificVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(v => v.lang.includes('fr')) || voices[0];
    
    console.log('Voix utilisée:', frenchVoice);
    
    const utterance = new SpeechSynthesisUtterance('Bonjour test vocal');
    utterance.voice = frenchVoice;
    utterance.lang = 'fr-FR';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => console.log('▶️ Audio démarré');
    utterance.onend = () => console.log('⏹️ Audio terminé');
    utterance.onerror = (e) => console.error('❌ Erreur audio:', e);
    
    window.speechSynthesis.speak(utterance);
  };
  

  const initializeAudio = () => {
    // Créer un AudioContext pour activer l'audio
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
          console.log('✅ AudioContext activé');
          // Puis tester la synthèse
          testSystemAudio();
        });
      } else {
        testSystemAudio();
      }
    } catch (error) {
      console.error('Erreur AudioContext:', error);
    }
  };
  


  const testSystemAudio = () => {
    // Test avec une synthèse très courte
    const utterance = new SpeechSynthesisUtterance('Test');
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0; // Volume maximum
    
    console.log('Test audio système démarré');
    window.speechSynthesis.speak(utterance);
  };

  const testBasicSpeech = () => {
    console.log('Test speech démarré');
    
    if (!('speechSynthesis' in window)) {
      console.error('SpeechSynthesis non supporté');
      setMessage('❌ SpeechSynthesis non supporté');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance('Bonjour, test de synthèse vocale');
      utterance.lang = 'fr-FR';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        console.log('🔊 Synthèse démarrée');
        setMessage('✅ Lecture en cours...');
      };

      utterance.onend = () => {
        console.log('✅ Synthèse terminée');
        setMessage('✅ Lecture terminée');
      };

      utterance.onerror = (event) => {
        console.error('❌ Erreur synthèse:', event);
        setMessage(`❌ Erreur: ${event.error}`);
      };

      window.speechSynthesis.speak(utterance);
      console.log('Utterance envoyée');
    } catch (error) {
      console.error('Erreur lors du test:', error);
      setMessage(`❌ Exception: ${error}`);
    }
  };

  const testVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log('Voix disponibles:', voices);
    setMessage(`🎤 ${voices.length} voix disponibles`);
  };

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-yellow-800 mb-4">🔧 Test Synthèse Vocale</h3>
      
      <div className="space-y-3">
        <button
          onClick={testBasicSpeech}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mr-2"
        >
          🔊 Test Speech
        </button>

        <button
          onClick={testVoices}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mr-2"
        >
          🎤 Liste Voix
        </button>

        <button
          onClick={() => {
            window.speechSynthesis.cancel();
            setMessage('🛑 Speech annulé');
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          🛑 Stop
        </button>

        <button
            onClick={testSystemAudio}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
            🔊 Test Audio Système
        </button>

        <button
          onClick={async () => {
            setMessage('🔍 Diagnostic en cours...');
            const result = await diagnostic.runFullDiagnostic();
            setMessage(`📊 Diagnostic terminé. Voir console pour détails.`);
          }}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
        >
          🔍 Diagnostic Complet
        </button>

        <button
          onClick={async () => {
            setMessage('🚀 Test robuste en cours...');
            const success = await robustTTS.speak('Bonjour, ceci est un test de synthèse vocale robuste avec fallbacks multiples.');
            setMessage(success ? '✅ Test robuste réussi!' : '❌ Échec même avec fallbacks');
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
        >
          🚀 TEST ROBUSTE
        </button>
      </div>

      {message && (
        <div className="mt-4 p-3 bg-white rounded border">
          <p className="font-medium">{message}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-yellow-700">
        <p>⚠️ <strong>Important :</strong> Cliquez sur le bouton pour déclencher la synthèse.</p>
        <p>Chrome bloque la synthèse vocale sans interaction utilisateur directe.</p>
      </div>
    </div>
  );
};


  

  