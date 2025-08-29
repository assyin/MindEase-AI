import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void;
  isDisabled: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioRecorded, isDisabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Vérifier les permissions microphone
    checkMicrophonePermission();
    
    return () => {
      cleanup();
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
      
      permissionStatus.onchange = () => {
        setPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
      };
    } catch (error) {
      console.warn('Permission API not supported');
    }
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop());
    }
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
  };

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      stream.current = mediaStream;
      mediaRecorder.current = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm'
      });

      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onAudioRecorded(audioBlob);
        
        // Arrêter les tracks
        if (stream.current) {
          stream.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer d'enregistrement
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erreur accès microphone:', error);
      setPermission('denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (permission === 'denied') {
    return (
      <div className="text-center p-4 bg-red-50 rounded-lg">
        <div className="text-red-600 mb-2">🎤❌</div>
        <p className="text-sm text-red-600">
          Accès microphone refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Bouton d'enregistrement */}
      <div className="relative">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isDisabled}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ${
            isRecording 
              ? 'bg-red-500 text-white animate-pulse' 
              : isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105'
          }`}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>
        
        {/* Indicateur d'enregistrement */}
        {isRecording && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
      </div>

      {/* Timer et statut */}
      <div className="text-center">
        {isRecording && (
          <div className="text-lg font-mono text-red-600 font-bold">
            🔴 {formatTime(recordingTime)}
          </div>
        )}
        
        <p className="text-sm text-gray-600">
          {isRecording 
            ? 'Enregistrement en cours...' 
            : 'Cliquez pour enregistrer votre message'
          }
        </p>
      </div>

      {/* Lecture audio */}
      {audioURL && !isRecording && (
        <div className="w-full max-w-sm">
          <audio 
            controls 
            src={audioURL} 
            className="w-full"
            style={{ height: '40px' }}
          />
          <p className="text-xs text-gray-500 mt-1 text-center">
            Votre enregistrement
          </p>
        </div>
      )}
    </div>
  );
};
