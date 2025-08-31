import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Clock, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Heart, 
  Mic,
  MicOff,
  RotateCcw,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import SessionManager from '../services/SessionManager';
import TherapeuticIntegrationService from '../services/TherapeuticIntegrationService';
import TherapeuticTTSService from '../services/TherapeuticTTSService';
import { useAuth } from '../contexts/AuthContext';

interface SessionPhase {
  id: string;
  name: string;
  duration: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface Message {
  id: string;
  sender: 'user' | 'expert';
  content: string;
  timestamp: Date;
  hasAudio?: boolean;
  audioUrl?: string;
  emotion?: string;
}

interface SessionState {
  id: string;
  currentPhase: string;
  phaseStartTime: Date;
  totalElapsed: number;
  isActive: boolean;
  expertProfile: any;
  currentHomework?: any;
  sessionContent?: any;
}

const SESSION_PHASES: SessionPhase[] = [
  {
    id: 'checkin',
    name: 'Check-in',
    duration: 3,
    color: 'bg-blue-500',
    icon: Heart,
    description: 'Comment vous sentez-vous aujourd\'hui ?'
  },
  {
    id: 'homework',
    name: 'Devoirs',
    duration: 4,
    color: 'bg-purple-500',
    icon: BookOpen,
    description: 'Revue des exercices précédents'
  },
  {
    id: 'content',
    name: 'Contenu Principal',
    duration: 10,
    color: 'bg-green-500',
    icon: MessageCircle,
    description: 'Exploration du sujet thérapeutique'
  },
  {
    id: 'practice',
    name: 'Pratique',
    duration: 5,
    color: 'bg-orange-500',
    icon: RotateCcw,
    description: 'Exercice pratique guidé'
  },
  {
    id: 'summary',
    name: 'Résumé',
    duration: 2,
    color: 'bg-indigo-500',
    icon: CheckCircle,
    description: 'Points clés et prochaines étapes'
  }
];

interface TherapySessionProps {
  sessionId: string;
  onComplete: () => void;
}

const TherapySession: React.FC<TherapySessionProps> = ({ 
  sessionId, 
  onComplete 
}) => {
  const { user } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [wellBeingScore, setWellBeingScore] = useState<number>(5);
  const [showWellBeingPrompt, setShowWellBeingPrompt] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionManagerRef = useRef<SessionManager>();
  const integrationServiceRef = useRef<TherapeuticIntegrationService>();
  const ttsServiceRef = useRef<TherapeuticTTSService>();

  useEffect(() => {
    sessionManagerRef.current = new SessionManager();
    integrationServiceRef.current = new TherapeuticIntegrationService();
    ttsServiceRef.current = new TherapeuticTTSService();
    initializeSession();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (sessionState?.isActive) {
      const interval = setInterval(() => {
        updatePhaseProgress();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionState]);

  const initializeSession = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const sessionManager = new SessionManager();
      const session = await sessionManager.getSessionById(sessionId);
      
      if (!session) return;

      const expertProfile = session.expert_profile;
      
      setSessionState({
        id: session.id,
        currentPhase: 'checkin',
        phaseStartTime: new Date(),
        totalElapsed: 0,
        isActive: true,
        expertProfile,
        currentHomework: session.current_homework,
        sessionContent: session.content
      });

      // Initial expert message
      try {
        const welcomeMessage = await generateExpertResponse('session_start', '');
        if (welcomeMessage.text) {
          addMessage({
            sender: 'expert',
            content: welcomeMessage.text,
            hasAudio: true,
            audioUrl: welcomeMessage.audioUrl,
            emotion: 'welcoming'
          });
        }
      } catch (error) {
        console.log('Error generating welcome message, using fallback');
        addMessage({
          sender: 'expert',
          content: 'Bonjour ! Je suis ravi de commencer cette session avec vous. Comment vous sentez-vous aujourd\'hui ?',
          hasAudio: false,
          emotion: 'welcoming'
        });
      }

      // Show well-being prompt after 1 second (always show regardless of AI response)
      setTimeout(() => setShowWellBeingPrompt(true), 1000);
      
    } catch (error) {
      console.error('Error initializing session:', error);
      // Show well-being prompt even if session initialization fails
      setTimeout(() => setShowWellBeingPrompt(true), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePhaseProgress = () => {
    if (!sessionState) return;

    const currentPhase = SESSION_PHASES.find(p => p.id === sessionState.currentPhase);
    if (!currentPhase) return;

    const elapsed = (Date.now() - sessionState.phaseStartTime.getTime()) / 1000;
    const progress = Math.min((elapsed / (currentPhase.duration * 60)) * 100, 100);
    
    setPhaseProgress(progress);

    // Auto-advance phase when time is up (but allow expert to control timing)
    if (progress >= 100 && sessionState.isActive) {
      // Don't auto-advance, let expert guide the session
      // The expert will suggest moving to next phase
    }
  };

  const generateExpertResponse = async (context: string, userMessage: string) => {
    if (!integrationServiceRef.current || !sessionState) return { text: '', audioUrl: '' };

    try {
      const response = await integrationServiceRef.current.processTherapeuticMessage(
        sessionState.id,
        userMessage,
        {
          currentPhase: sessionState.currentPhase,
          phaseProgress,
          wellBeingScore,
          totalElapsed: sessionState.totalElapsed
        }
      );

      return response;
    } catch (error) {
      console.error('Error generating expert response:', error);
      return { text: 'Je comprends. Pouvez-vous me parler un peu plus de cela ?', audioUrl: '' };
    }
  };

  const addMessage = (messageData: Partial<Message>) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...messageData
    } as Message;

    setMessages(prev => [...prev, newMessage]);

    // Auto-play audio if available and not muted
    if (newMessage.hasAudio && newMessage.audioUrl && !isMuted) {
      playAudio(newMessage.audioUrl);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionState) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message immediately
    addMessage({
      sender: 'user',
      content: userMessage
    });

    // Generate expert response
    try {
      const response = await generateExpertResponse('user_message', userMessage);
      
      // Simulate thinking delay
      setTimeout(() => {
        addMessage({
          sender: 'expert',
          content: response.text,
          hasAudio: true,
          audioUrl: response.audioUrl
        });
      }, 1500);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  };

  const playAudio = async (audioUrl: string) => {
    if (!audioRef.current) return;

    try {
      setAudioPlaying(audioUrl);
      audioRef.current.src = audioUrl;
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioPlaying(null);
    }
  };

  const toggleAudio = () => {
    if (audioPlaying && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  const moveToNextPhase = () => {
    if (!sessionState) return;

    const currentIndex = SESSION_PHASES.findIndex(p => p.id === sessionState.currentPhase);
    const nextPhase = SESSION_PHASES[currentIndex + 1];

    if (nextPhase) {
      setSessionState(prev => ({
        ...prev!,
        currentPhase: nextPhase.id,
        phaseStartTime: new Date()
      }));
      setPhaseProgress(0);

      // Generate phase transition message
      generatePhaseTransitionMessage(nextPhase);
    } else {
      // Session complete
      completeSession();
    }
  };

  const generatePhaseTransitionMessage = async (phase: SessionPhase) => {
    const transitionMessages = {
      homework: "Maintenant, parlons des exercices que vous avez pratiqués cette semaine.",
      content: "Parfait, explorons maintenant le cœur de notre session d'aujourd'hui.",
      practice: "Il est temps de mettre en pratique ce que nous venons de discuter.",
      summary: "Récapitulons ensemble les points importants de notre session."
    };

    const message = transitionMessages[phase.id as keyof typeof transitionMessages] || phase.description;
    
    const response = await generateExpertResponse('phase_transition', `Moving to ${phase.name}: ${message}`);
    
    addMessage({
      sender: 'expert',
      content: response.text,
      hasAudio: true,
      audioUrl: response.audioUrl,
      emotion: 'transitioning'
    });
  };

  const completeSession = async () => {
    if (!sessionState || !sessionManagerRef.current) return;

    try {
      await sessionManagerRef.current.completeSession(
        sessionState.id,
        wellBeingScore,
        {
          total_duration: sessionState.totalElapsed,
          phases_completed: SESSION_PHASES.map(p => p.id),
          user_engagement: calculateEngagement()
        }
      );

      onComplete();
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const calculateEngagement = (): number => {
    // Simple engagement calculation based on message exchange
    const userMessages = messages.filter(m => m.sender === 'user').length;
    return Math.min(userMessages / 5 * 10, 10); // Max score of 10
  };

  const handleWellBeingSubmit = () => {
    setShowWellBeingPrompt(false);
    
    addMessage({
      sender: 'user',
      content: `Je me sens ${wellBeingScore}/10 aujourd'hui.`
    });

    // Generate contextual response
    setTimeout(async () => {
      const context = wellBeingScore >= 7 ? 'positive_mood' : wellBeingScore >= 4 ? 'neutral_mood' : 'low_mood';
      const response = await generateExpertResponse(context, `Wellbeing score: ${wellBeingScore}`);
      
      addMessage({
        sender: 'expert',
        content: response.text,
        hasAudio: true,
        audioUrl: response.audioUrl
      });
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (!sessionState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session introuvable</h2>
          <p className="text-gray-600">Impossible de charger cette session thérapeutique.</p>
        </div>
      </div>
    );
  }

  const currentPhase = SESSION_PHASES.find(p => p.id === sessionState.currentPhase);
  const currentPhaseIndex = SESSION_PHASES.findIndex(p => p.id === sessionState.currentPhase);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Session Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-200 p-4"
      >
        <div className="max-w-4xl mx-auto">
          {/* Phase Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {sessionState.expertProfile?.avatar && (
                  <img 
                    src={sessionState.expertProfile.avatar} 
                    alt={sessionState.expertProfile.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <h2 className="font-semibold text-gray-800">
                    Session avec {sessionState.expertProfile?.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {sessionState.expertProfile?.specialty}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-full ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200 transition-colors`}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <div className="text-right">
                <div className="text-sm text-gray-500">Phase {currentPhaseIndex + 1}/5</div>
                <div className="font-semibold text-gray-800">{currentPhase?.name}</div>
              </div>
            </div>
          </div>

          {/* Phase Indicators */}
          <div className="flex items-center space-x-2 mb-4">
            {SESSION_PHASES.map((phase, index) => {
              const isActive = phase.id === sessionState.currentPhase;
              const isCompleted = index < currentPhaseIndex;
              const Icon = phase.icon;
              
              return (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex-1 flex items-center space-x-2 p-2 rounded-lg transition-all ${
                    isActive
                      ? `${phase.color} text-white shadow-md`
                      : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{phase.name}</div>
                    <div className="text-xs opacity-75 truncate">{phase.duration} min</div>
                  </div>
                  
                  {isActive && (
                    <div className="w-8 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        style={{ width: `${phaseProgress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Current Phase Description */}
          {currentPhase && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-600 text-sm"
            >
              {currentPhase.description}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto p-4 h-screen-minus-header flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  
                  {message.hasAudio && message.audioUrl && (
                    <button
                      onClick={() => playAudio(message.audioUrl!)}
                      className={`mt-2 flex items-center space-x-1 text-xs ${
                        message.sender === 'user' 
                          ? 'text-blue-100 hover:text-white' 
                          : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      <Play className="w-3 h-3" />
                      <span>Écouter</span>
                    </button>
                  )}
                  
                  <div className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Tapez votre réponse ici..."
                className="w-full resize-none border-0 outline-none text-gray-800 placeholder-gray-400"
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-2 rounded-full transition-colors ${
                  isRecording 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <span>Envoyer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Phase Controls */}
        {phaseProgress >= 80 && currentPhaseIndex < SESSION_PHASES.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <button
              onClick={moveToNextPhase}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 mx-auto"
            >
              <span>Passer à la phase suivante</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {currentPhaseIndex === SESSION_PHASES.length - 1 && phaseProgress >= 80 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <button
              onClick={completeSession}
              className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center space-x-2 mx-auto"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Terminer la session</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Well-being Score Modal */}
      <AnimatePresence>
        {showWellBeingPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                Comment vous sentez-vous aujourd'hui ?
              </h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {wellBeingScore}/10
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={wellBeingScore}
                    onChange={(e) => setWellBeingScore(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Très mal</span>
                    <span>Excellent</span>
                  </div>
                </div>
                
                <button
                  onClick={handleWellBeingSubmit}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Player */}
      <audio
        ref={audioRef}
        onEnded={() => setAudioPlaying(null)}
        className="hidden"
      />
    </div>
  );
};

export default TherapySession;