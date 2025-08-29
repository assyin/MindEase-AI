import React from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, Volume2 } from 'lucide-react';

export const MicrophoneTest: React.FC = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <MicOff className="w-5 h-5 text-red-500" />
          <span className="text-red-700">
            Votre navigateur ne supporte pas la reconnaissance vocale.
          </span>
        </div>
      </div>
    );
  }

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ 
      continuous: true, 
      language: 'fr-FR' 
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-blue-800">Test du Microphone</h3>
        <div className="flex items-center space-x-2">
          {isMicrophoneAvailable ? (
            <div className="flex items-center space-x-1 text-green-600">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm">Microphone disponible</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600">
              <MicOff className="w-4 h-4" />
              <span className="text-sm">Microphone indisponible</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 mb-4">
        <button
          onClick={listening ? stopListening : startListening}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            listening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {listening ? (
            <>
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              <span>Arrêter</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Commencer</span>
            </>
          )}
        </button>

        <button
          onClick={resetTranscript}
          disabled={!transcript}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Effacer
        </button>
      </div>

      {listening && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-4 bg-green-500 animate-pulse rounded-full"></div>
              <div className="w-2 h-6 bg-green-400 animate-pulse rounded-full" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-5 bg-green-500 animate-pulse rounded-full" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-green-700 font-medium">Écoute en cours...</span>
          </div>
        </div>
      )}

      <div className="p-3 bg-white border border-gray-200 rounded-lg min-h-[100px]">
        <div className="text-sm text-gray-600 mb-2">Transcription:</div>
        <div className="text-gray-800">
          {transcript || (
            <span className="italic text-gray-400">
              Cliquez sur "Commencer" et parlez...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};