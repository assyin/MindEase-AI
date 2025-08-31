import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Mic,
  MicOff,
  Send,
  User,
  Bot,
  Clock,
  Heart,
  MessageCircle,
  CheckCircle
} from 'lucide-react';
import ConversationalSessionManager from '../services/ConversationalSessionManager';
import ConversationalTherapeuticAI from '../services/ConversationalTherapeuticAI';
import { geminiTTSService } from '../services/GeminiTTSService';
import { PhaseTransitionController } from '../services/PhaseTransitionController';
import { webSpeechSTTService } from '../services/WebSpeechSTTService';
// import AudioControls from './AudioControls'; // Temporairement désactivé
import VoiceInput from './VoiceInput';
import { useAuth } from '../contexts/AuthContext';
import TherapyProgramManager from '../services/TherapyProgramManager';
import { getThemeById } from '../data/therapyThemes';
import './AudioMessageControls.css';

// 🚫 Protection ultime contre les doublons - Flag global de module
const welcomeGenerationFlags = new Map<string, boolean>();

// ⚠️ NOUVEAU : Composant de contrôles audio pour les messages
interface AudioMessageControlsProps {
  audioUrl: string;
  messageId: string;
  onPlay: (audioUrl: string) => void;
}

const AudioMessageControls: React.FC<AudioMessageControlsProps> = ({ 
  audioUrl, 
  messageId, 
  onPlay 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      onPlay(audioUrl);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Bouton Play/Pause */}
      <button
        onClick={handlePlayPause}
        className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        title={isPlaying ? 'Pause' : 'Lecture'}
      >
        {isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3" />
        )}
      </button>

      {/* Bouton Stop */}
      <button
        onClick={handleStop}
        className="p-1.5 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors"
        title="Arrêter"
      >
        <div className="w-3 h-3 bg-white rounded-sm" />
      </button>

      {/* Barre de progression */}
      <div className="flex items-center space-x-2 min-w-[120px]">
        <span className="text-xs text-gray-500 min-w-[25px]">
          {formatTime(currentTime)}
        </span>
                 <input
           type="range"
           min="0"
           max={duration || 100}
           value={currentTime}
           onChange={handleSeek}
           className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer audio-slider"
           style={{
             background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%, #e5e7eb 100%)`
           }}
         />
        <span className="text-xs text-gray-500 min-w-[25px]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Contrôle de vitesse */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handlePlaybackRateChange(0.75)}
          className={`px-1.5 py-0.5 text-xs rounded ${
            playbackRate === 0.75 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title="Vitesse 0.75x"
        >
          0.75x
        </button>
        <button
          onClick={() => handlePlaybackRateChange(1)}
          className={`px-1.5 py-0.5 text-xs rounded ${
            playbackRate === 1 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title="Vitesse normale"
        >
          1x
        </button>
        <button
          onClick={() => handlePlaybackRateChange(1.25)}
          className={`px-1.5 py-0.5 text-xs rounded ${
            playbackRate === 1.25 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title="Vitesse 1.25x"
        >
          1.25x
        </button>
        <button
          onClick={() => handlePlaybackRateChange(1.5)}
          className={`px-1.5 py-0.5 text-xs rounded ${
            playbackRate === 1.5 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title="Vitesse 1.5x"
        >
          1.5x
        </button>
      </div>

      {/* Audio caché pour contrôles */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
};

interface ConversationMessage {
  id: string;
  sender: 'user' | 'expert';
  content: string;
  timestamp: Date;
  hasAudio?: boolean;
  audioUrl?: string;
  emotion?: string;
  isTyping?: boolean;
}

interface ConversationalPhase {
  id: string;
  name: string;
  displayName: string;
  duration: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  conversationalGoals: string[];
  minInteractions: number;
}

interface ConversationalSessionState {
  id: string;
  currentPhase: ConversationalPhase;
  phaseStartTime: Date;
  conversation: ConversationMessage[];
  expertProfile: any;
  phaseObjectivesMet: boolean;
  isActive: boolean;
  wellBeingScore?: number;
  welcomeMessageGenerated?: boolean; // 🚫 Flag pour éviter double message d'accueil
  // 🎯 NOUVEAU : Timer intelligent qui exclut le temps expert
  expertProcessingTime: number; // Temps cumulé des pauses expert (en secondes)
  lastPauseStart: Date | null; // Début de la pause expert actuelle
}

const CONVERSATIONAL_PHASES: ConversationalPhase[] = [
  {
    id: 'checkin_conversational',
    name: 'Check-in Conversationnel',
    displayName: 'Accueil',
    duration: 3,
    color: 'bg-blue-500',
    icon: Heart,
    conversationalGoals: [
      'Établir connexion chaleureuse',
      'Évaluer état émotionnel actuel',
      'Identifier préoccupations immédiates'
    ],
    minInteractions: 3
  },
  {
    id: 'homework_dialogue',
    name: 'Dialogue Devoirs',
    displayName: 'Révision',
    duration: 4,
    color: 'bg-purple-500',
    icon: CheckCircle,
    conversationalGoals: [
      'Discuter exercices pratiqués',
      'Analyser obstacles rencontrés',
      'Célébrer réussites'
    ],
    minInteractions: 4
  },
  {
    id: 'therapeutic_conversation',
    name: 'Conversation Thérapeutique',
    displayName: 'Exploration',
    duration: 10,
    color: 'bg-green-500',
    icon: MessageCircle,
    conversationalGoals: [
      'Enseigner nouvelle technique',
      'Exploration interactive',
      'Application personnalisée'
    ],
    minInteractions: 8
  },
  {
    id: 'guided_practice',
    name: 'Pratique Guidée Interactive',
    displayName: 'Pratique',
    duration: 5,
    color: 'bg-orange-500',
    icon: Play,
    conversationalGoals: [
      'Guider exercice pratique',
      'Feedback temps réel',
      'Application concrète'
    ],
    minInteractions: 5
  },
  {
    id: 'conversational_summary',
    name: 'Résumé Conversationnel',
    displayName: 'Conclusion',
    duration: 3,
    color: 'bg-indigo-500',
    icon: CheckCircle,
    conversationalGoals: [
      'Récapituler acquis',
      'Assigner devoirs dialogue',
      'Prévoir session suivante'
    ],
    minInteractions: 3
  }
];

interface ConversationalTherapySessionProps {
  sessionId: string;
  onComplete: () => void;
}

const ConversationalTherapySession: React.FC<ConversationalTherapySessionProps> = ({ 
  sessionId, 
  onComplete 
}) => {
  const { user } = useAuth();
  const [sessionState, setSessionState] = useState<ConversationalSessionState | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExpertTyping, setIsExpertTyping] = useState(false);
  const [, setAudioPlaying] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [sttSupported, setSTTSupported] = useState(false);
  const [voiceInputStatus, setVoiceInputStatus] = useState<'idle' | 'listening' | 'processing' | 'error' | 'completed'>('idle');
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false); // 🎵 Audio désactivé par défaut
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // État de lecture audio
  const [isPaused, setIsPaused] = useState(false); // État pause
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null); // URL audio en cours
  const [currentPlayingMessageId, setCurrentPlayingMessageId] = useState<string | null>(null); // ID du message en cours
  const [sessionAudioId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sentMessageHashes] = useState(new Set<string>());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const conversationalManagerRef = useRef<ConversationalSessionManager>();
  const therapeuticAIRef = useRef<ConversationalTherapeuticAI>();
  const ttsServiceRef = useRef(geminiTTSService);
  const transitionControllerRef = useRef<PhaseTransitionController>();

  useEffect(() => {
    console.log(`🔄 useEffect déclenché - sessionId: ${sessionId}, sessionInitialized: ${sessionInitialized}`);
    
    conversationalManagerRef.current = new ConversationalSessionManager();
    therapeuticAIRef.current = new ConversationalTherapeuticAI();
    transitionControllerRef.current = new PhaseTransitionController();
    // ttsServiceRef.current = geminiTTSService; // Déjà initialisé dans useRef
    
    // Vérifier support STT
    setSTTSupported(webSpeechSTTService.isRecognitionSupported());
    
    // Initialiser seulement si pas déjà fait
    if (!sessionInitialized) {
      console.log('🚀 Démarrage initialisation session conversationnelle...');
      initializeConversationalSession();
    } else {
      console.log('✅ Session déjà initialisée, passage useEffect...');
    }
  }, [sessionId, sessionInitialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionState?.conversation]);

  // 🎯 NOUVEAU : Auto-pause timer quand expert processing ou audio lecture
  useEffect(() => {
    if (!sessionState) return;

    const shouldPause = isExpertTyping || isAudioPlaying;
    
    if (shouldPause && !sessionState.lastPauseStart) {
      pauseSessionTimer();
    } else if (!shouldPause && sessionState.lastPauseStart) {
      resumeSessionTimer();
    }
  }, [isExpertTyping, isAudioPlaying, sessionState]);

  useEffect(() => {
    if (sessionState?.isActive) {
      const interval = setInterval(() => {
        updatePhaseProgress();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionState]);

  // Surveillance anti-boucle avec vérifications périodiques ET timeout d'urgence
  useEffect(() => {
    if (!sessionState?.isActive || !transitionControllerRef.current) return;

    // ⚠️ CORRECTION CRITIQUE : Désactiver vérifications automatiques pour éviter boucle infinie
    // La vérification se fera uniquement après envoi de message utilisateur
    // const objectiveCheckInterval = setInterval(() => {
    //   if (!sessionState.phaseObjectivesMet) {
    //     checkPhaseObjectives();
    //   }
    // }, 10000); // Augmenté à 10 secondes si réactivé

    // Timeout d'urgence pour éviter blocages absolus
    const emergencyTimeout = setTimeout(() => {
      if (sessionState.isActive && !sessionState.phaseObjectivesMet) {
        console.warn('🚨 TIMEOUT CRITIQUE - TRANSITION FORCÉE D\'URGENCE');
        
        const transitionMessage = transitionControllerRef.current!.generateTransitionMessage(
          sessionState.currentPhase.id,
          getNextPhase()?.id || 'conclusion',
          true
        );

        addConversationMessage({
          sender: 'expert',
          content: `${transitionMessage} Je vais maintenant vous guider vers l'étape suivante.`,
          hasAudio: true,
          emotion: 'concluding'
        });

        setTimeout(() => transitionToNextPhase(), 1000);
      }
    }, (sessionState.currentPhase.duration * 60000) + 90000); // Durée + 1.5 min de grâce

    return () => {
      // clearInterval(objectiveCheckInterval); // Désactivé
      clearTimeout(emergencyTimeout);
    };
  }, [sessionState?.currentPhase?.id, sessionState?.isActive]);

  // Gestion focus/blur de la fenêtre pour éviter les refreshs automatiques
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sessionState) {
        console.log('🔍 Fenêtre redevenue visible - conservation de l\'état');
        // Ne pas recharger, juste logger
      }
    };

    const handleWindowFocus = () => {
      if (sessionState) {
        console.log('🎯 Focus fenêtre retrouvé - session préservée');
        // Sauvegarder l'état actuel pour sécurité
        const savedSessionKey = `conversational_session_${sessionId}`;
        localStorage.setItem(savedSessionKey, JSON.stringify(sessionState));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [sessionState, sessionId]);

  const initializeConversationalSession = async () => {
    if (!user || sessionInitialized) return;

    try {
      setIsLoading(true);
      setSessionInitialized(true); // Marquer comme initialisé dès le début
      
      // Nettoyer les anciennes sessions au démarrage
      cleanupOldSessions();
      
      const manager = conversationalManagerRef.current!;
      // const ai = therapeuticAIRef.current!;
      
      // Vérifier si une session existe déjà dans localStorage
      const savedSessionKey = `conversational_session_${sessionId}`;
      const savedSession = localStorage.getItem(savedSessionKey);
      
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          console.log('🔄 Restauration session sauvegardée:', parsedSession.id);
          
          // Convertir les timestamps des messages en objets Date
          const restoredConversation = parsedSession.conversation.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          setSessionState({
            ...parsedSession,
            conversation: restoredConversation,
            phaseStartTime: new Date(parsedSession.phaseStartTime),
            isActive: true,
            // 🎯 Assurer compatibilité avec anciennes sessions
            expertProcessingTime: parsedSession.expertProcessingTime || 0,
            lastPauseStart: null // Toujours reprendre sans pause active
          });
          setIsLoading(false);
          return;
        } catch (parseError) {
          console.warn('Erreur parsing session sauvegardée, création nouvelle session');
          localStorage.removeItem(savedSessionKey);
        }
      }
      
      // Initialiser nouvelle session conversationnelle
      const sessionResult = await manager.startConversationalSession(sessionId, user.id);
      
      if (!sessionResult) return;

      const initialPhase = CONVERSATIONAL_PHASES[0];
      
      const newSessionState = {
        id: sessionResult.session.id,
        currentPhase: initialPhase,
        phaseStartTime: new Date(),
        conversation: [],
        expertProfile: sessionResult.context.expert_personality,
        phaseObjectivesMet: false,
        isActive: true,
        expertProcessingTime: 0, // 🎯 Timer intelligent : 0 seconde de pause au début
        lastPauseStart: null // 🎯 Pas de pause en cours au démarrage
      };
      
      setSessionState(newSessionState);
      
      // Sauvegarder immédiatement la nouvelle session
      localStorage.setItem(savedSessionKey, JSON.stringify(newSessionState));

      // 🚫 PROTECTION TRIPLE - localStorage + flag global + session state
      const existingSession = localStorage.getItem(savedSessionKey);
      const alreadyGeneratedLS = existingSession ? JSON.parse(existingSession)?.welcomeMessageGenerated : false;
      const alreadyGeneratedGlobal = welcomeGenerationFlags.get(sessionId) || false;
      const alreadyGeneratedState = newSessionState.welcomeMessageGenerated || false;
      
      const alreadyGenerated = alreadyGeneratedLS || alreadyGeneratedGlobal || alreadyGeneratedState;
      
      console.log(`🔍 TRIPLE vérification message accueil:`);
      console.log(`   - LocalStorage: ${alreadyGeneratedLS}`);
      console.log(`   - Flag Global: ${alreadyGeneratedGlobal}`);  
      console.log(`   - Session State: ${alreadyGeneratedState}`);
      console.log(`   - FINAL: ${alreadyGenerated}`);
      
      if (!alreadyGenerated) {
        console.log('🎯 Génération message d\'accueil (première fois pour cette session)');
        
        // 🚫 MARQUER TOUS LES FLAGS IMMÉDIATEMENT pour éviter races conditions
        welcomeGenerationFlags.set(sessionId, true); // Flag global
        
        const sessionWithFlag = { 
          ...newSessionState, 
          welcomeMessageGenerated: true 
        };
        setSessionState(sessionWithFlag); // State
        localStorage.setItem(savedSessionKey, JSON.stringify(sessionWithFlag)); // LocalStorage
        
        setTimeout(async () => {
          await generateExpertWelcome(sessionResult, sessionWithFlag);
        }, 1500);
      } else {
        console.log('⏭️ Message d\'accueil déjà généré pour cette session, passage...');
      }
      
    } catch (error) {
      console.error('Erreur initialisation session conversationnelle:', error);
      setSessionInitialized(false); // Permettre un nouveau tentative en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const generateExpertWelcome = async (sessionResult: any, currentSessionState?: ConversationalSessionState) => {
    if (!therapeuticAIRef.current) return;
    
    const activeSessionState = currentSessionState || sessionState;
    if (!activeSessionState) return;

    try {
      setIsExpertTyping(true);
      
      // 🎯 CORRECTION CLAUDE : Utiliser le contexte programme personnalisé
      let welcomeContext: any = {
        user_profile: sessionResult.context.user_profile,
        current_session: sessionResult.session,
        program_progress: sessionResult.context.current_progress,
        recent_interactions: [],
        emotional_state: 'unknown',
        cultural_context: sessionResult.context.user_profile?.cultural_background || 'français',
        language: 'fr' as const,
        // Propriétés requises pour ConversationalContext
        conversation_history: [],
        phase_context: {
          current_phase: 'welcome',
          phase_progress: 0,
          objectives_met: [],
          time_remaining: 0
        },
        user_engagement: {
          interaction_count: 0,
          average_response_length: 0,
          emotional_openness: 5,
          resistance_indicators: []
        },
        expert_memory: {
          previous_topics: [],
          established_rapport: false,
          user_preferences: {},
          effective_techniques: []
        }
      };

      // 🎯 ENRICHIR avec le contexte du programme thérapeutique
      try {
        const programManager = new TherapyProgramManager();
        const currentProgram = await programManager.getCurrentProgram(user?.id || '');
        
        if (currentProgram) {
          console.log('🔍 Programme trouvé:', {
            name: currentProgram.name || currentProgram.program_name,
            type: currentProgram.program_type,
            has_personalization_data: !!currentProgram.personalization_data,
            personalization_keys: currentProgram.personalization_data ? Object.keys(currentProgram.personalization_data) : []
          });

          const theme = getThemeById(currentProgram.program_type || currentProgram.program_name);
          const programData = currentProgram.personalization_data || currentProgram;
          
          welcomeContext = {
            ...welcomeContext,
            program_context: {
              program_name: currentProgram.name || currentProgram.program_name,
              theme: theme ? {
                id: theme.id,
                name: theme.name,
                description: theme.description
              } : null,
              personalization: {
                primary_diagnosis: programData.primary_diagnosis || 'Non spécifié',
                secondary_diagnoses: programData.secondary_diagnoses || [],
                severity_level: programData.severity_level || 'Non évalué',
                personal_goals: programData.personal_goals || [],
                success_definition: programData.success_definition || 'En cours de définition',
                protective_factors: programData.protective_factors || [],
                risk_factors: programData.risk_factors || [],
                motivation_level: programData.motivation_level || 5,
                completed_sessions: currentProgram.completed_sessions || 0,
                total_sessions: currentProgram.total_sessions || 12,
                improvement_percentage: programData.improvement_percentage || 0
              }
            }
          };
          
          console.log('🎯 Contexte programme enrichi pour message de bienvenue:', {
            program: currentProgram.program_name,
            theme: theme?.name,
            goals: currentProgram.personal_goals?.length || 0
          });
        }
      } catch (programError) {
        console.warn('⚠️ Impossible de récupérer le contexte programme, utilisation du contexte de base:', programError);
      }

      // 🎯 UTILISER generateConversationalResponse pour une meilleure qualité
      const response = await therapeuticAIRef.current.generateConversationalResponse(
        sessionResult.context.expert_personality.id,
        'session_start',
        welcomeContext
      );

      console.log('✅ Message d\'accueil personnalisé généré avec succès via IA conversationnelle');
      
      // Simuler délai de frappe naturel
      setTimeout(() => {
        setIsExpertTyping(false);
        addConversationMessage({
          sender: 'expert',
          content: response.content,
          hasAudio: true,
          emotion: 'welcoming'
        });
      }, 2000);
      
    } catch (error) {
      console.error('🚨 Erreur génération accueil IA conversationnelle, utilisation fallback personnalisé:', error);
      setIsExpertTyping(false);
      
      // 🎯 FALLBACK avec message personnalisé selon le programme
      const expertProfile = activeSessionState.expertProfile || sessionResult.context.expert_personality;
      
      try {
        const personalizedMessage = await getDefaultWelcomeMessage(expertProfile);
        setTimeout(() => {
          addConversationMessage({
            sender: 'expert',
            content: personalizedMessage,
            hasAudio: true,
            emotion: 'welcoming'
          });
        }, 1000);
      } catch (fallbackError) {
        console.error('🚨 Erreur fallback message personnalisé:', fallbackError);
        // Message par défaut en dernier recours
        setTimeout(() => {
          addConversationMessage({
            sender: 'expert',
            content: "Bonjour ! Je suis content de commencer cette session avec vous. Comment vous sentez-vous ?",
            hasAudio: true,
            emotion: 'welcoming'
          });
        }, 1000);
      }
    }
  };

  // Fallback TTS avec synthèse vocale du navigateur
  const generateBrowserTTS = async (text: string): Promise<string | null> => {
    try {
      if (!('speechSynthesis' in window)) {
        console.warn('🚨 Synthèse vocale non supportée par ce navigateur');
        return null;
      }

      // Retourner immédiatement 'browser-tts' pour indiquer la prise en charge
      console.log('🎵 Utilisation TTS navigateur comme fallback');
      return 'browser-tts';
    } catch (error) {
      console.error('🚨 Erreur génération browser TTS:', error);
      return null;
    }
  };

  const getDefaultWelcomeMessage = async (expertProfile: any): Promise<string> => {
    try {
      // Récupérer le programme thérapeutique de l'utilisateur
      const programManager = new TherapyProgramManager();
      const currentProgram = await programManager.getCurrentProgram(user?.id || '');
      
      if (currentProgram) {
        const theme = getThemeById(currentProgram.program_type || currentProgram.program_name);
        
        // Messages personnalisés selon le programme et thème
        const personalizedWelcomes = {
          'dr_sarah_empathie': `Bonjour ! Je suis ravie de vous retrouver pour votre programme "${currentProgram.program_name}". ${theme ? `Nous travaillons ensemble sur ${theme.name.toLowerCase()}.` : ''} Comment vous sentez-vous aujourd'hui par rapport à vos objectifs personnels ?`,
          'dr_alex_mindfulness': `Bienvenue dans votre espace de bien-être. ${theme ? `Nous continuons notre travail sur ${theme.name.toLowerCase()} avec` : 'Prenons'} un moment pour nous centrer et faire le point sur votre progression. Comment vous sentez-vous en ce moment présent ?`,
          'dr_aicha_culturelle': `Ahlan wa sahlan ! Comment allez-vous aujourd'hui ? ${theme ? `J'espère que notre travail sur ${theme.name.toLowerCase()} porte ses fruits.` : ''} Comment va la famille et comment vous sentez-vous par rapport à vos défis personnels ?`
        };

        const personalizedMessage = personalizedWelcomes[expertProfile?.id as keyof typeof personalizedWelcomes];
        if (personalizedMessage) {
          return personalizedMessage;
        }
      }
    } catch (error) {
      console.warn('Impossible de récupérer le contexte du programme:', error);
    }

    // Messages par défaut si pas de programme ou erreur
    const welcomes = {
      'dr_sarah_empathie': "Bonjour ! Je suis ravie de vous retrouver aujourd'hui. Comment vous sentez-vous ?",
      'dr_alex_mindfulness': "Bienvenue. Prenons un moment pour nous centrer. Comment vous sentez-vous en ce moment présent ?",
      'dr_aicha_culturelle': "Ahlan wa sahlan ! Comment allez-vous aujourd'hui ? Comment va la famille ?"
    };
    return welcomes[expertProfile?.id as keyof typeof welcomes] || 
           "Bonjour ! Je suis content de commencer cette session avec vous. Comment vous sentez-vous ?";
  };

  // 🎯 NOUVEAU : Gestion du timer intelligent qui exclut le temps expert
  const pauseSessionTimer = () => {
    if (!sessionState || sessionState.lastPauseStart) return; // Déjà en pause
    
    setSessionState(prev => ({
      ...prev!,
      lastPauseStart: new Date()
    }));
    
    console.log('⏸️ Timer session mis en pause (expert processing)');
  };

  const resumeSessionTimer = () => {
    if (!sessionState || !sessionState.lastPauseStart) return; // Pas en pause
    
    const pauseDuration = (Date.now() - sessionState.lastPauseStart.getTime()) / 1000;
    
    setSessionState(prev => ({
      ...prev!,
      expertProcessingTime: prev!.expertProcessingTime + pauseDuration,
      lastPauseStart: null
    }));
    
    console.log(`▶️ Timer session repris (+${Math.round(pauseDuration)}s de pause expert)`);
  };

  const updatePhaseProgress = () => {
    if (!sessionState) return;

    // 🎯 CALCUL INTELLIGENT : Déduire le temps des pauses expert
    const totalElapsed = (Date.now() - sessionState.phaseStartTime.getTime()) / 1000;
    const currentPauseDuration = sessionState.lastPauseStart ? 
      (Date.now() - sessionState.lastPauseStart.getTime()) / 1000 : 0;
    const effectiveElapsed = totalElapsed - sessionState.expertProcessingTime - currentPauseDuration;
    
    const progress = Math.min((effectiveElapsed / (sessionState.currentPhase.duration * 60)) * 100, 100);
    
    // Log pour debugging (à retirer en prod)
    if (Math.floor(totalElapsed) % 10 === 0 && Math.floor(totalElapsed) > 0) {
      console.log(`⏱️ Timer Phase "${sessionState.currentPhase.displayName}":`, {
        tempsTotal: `${Math.round(totalElapsed)}s`,
        tempsPausesExpert: `${Math.round(sessionState.expertProcessingTime + currentPauseDuration)}s`,
        tempsEffectif: `${Math.round(effectiveElapsed)}s`,
        progression: `${Math.round(progress)}%`
      });
    }
    
    setPhaseProgress(progress);

    // Vérifier objectifs de phase atteints
    checkPhaseObjectives();
  };

  const checkPhaseObjectives = () => {
    if (!sessionState || isExpertTyping || !transitionControllerRef.current) return;

    // ⚠️ CORRECTION : Ne pas vérifier les objectifs si c'est la dernière phase
    if (sessionState.currentPhase.id === 'conversational_summary') {
      console.log('🎯 Phase finale - pas de transition automatique');
      return;
    }

    const { shouldTransition, reason, isForced, metrics } = 
      transitionControllerRef.current.shouldTransitionNow(
        sessionState.id,
        sessionState.currentPhase.id,
        sessionState.conversation
      );

    console.log(`🔍 Phase "${sessionState.currentPhase.displayName}" (${sessionState.currentPhase.id})`);
    console.log(`📊 Métriques: ${metrics.questionCount} questions, ${metrics.userResponseCount} réponses`);
    console.log(`⚡ Consécutives: ${metrics.expertConsecutiveQuestions} questions d'affilée`);
    console.log(`🎯 Décision: ${shouldTransition ? '✅ TRANSITION' : '❌ ATTENTE'} - ${reason}`);
    
    // 🎯 NOUVEAU : Logs de debug pour transitions
    if (shouldTransition) {
      console.log(`🚀 Type transition: ${isForced ? '⚡ FORCÉE' : '🌿 NATURELLE'}`);
      console.log(`🔄 Phase actuelle: ${sessionState.currentPhase.displayName} → Prochaine: ${getNextPhase()?.displayName || 'CONCLUSION'}`);
    }
    
    if (shouldTransition && !sessionState.phaseObjectivesMet) {
      console.log(`🚀 ${isForced ? 'TRANSITION FORCÉE' : 'TRANSITION NATURELLE'}`);
      setSessionState(prev => ({
        ...prev!,
        phaseObjectivesMet: true
      }));
      
      // Délai différent selon le type de transition
      const transitionDelay = isForced ? 500 : 1500;
      setTimeout(() => {
        suggestPhaseTransition(isForced);
      }, transitionDelay);
    }
  };

  const suggestPhaseTransition = async (isForced = false) => {
    if (!therapeuticAIRef.current || !sessionState || !transitionControllerRef.current) return;

    try {
      const nextPhase = getNextPhase();
      if (!nextPhase) {
        // ⚠️ CORRECTION : Session terminée - pas de transition
        console.log('🎯 Session terminée - plus de phases disponibles');
        concludeSession();
        return;
      }

      setIsExpertTyping(true);

      // Générer message de transition intelligent
      const transitionMessage = transitionControllerRef.current.generateTransitionMessage(
        sessionState.currentPhase.id,
        nextPhase.id,
        isForced
      );
      
      const delay = isForced ? 800 : 1500;
      setTimeout(() => {
        setIsExpertTyping(false);
        addConversationMessage({
          sender: 'expert',
          content: transitionMessage,
          hasAudio: true,
          emotion: isForced ? 'concluding' : 'transitioning'
        });
        
        // ⚠️ CORRECTION : Exécuter la transition après le message
        // Délai supplémentaire pour laisser l'utilisateur lire le message
        setTimeout(() => {
          transitionToNextPhase();
        }, isForced ? 1000 : 2000);
      }, delay);

    } catch (error) {
      console.error('Erreur suggestion transition:', error);
      setIsExpertTyping(false);
    }
  };

  const generatePhaseTransitionMessage = async (nextPhase: ConversationalPhase): Promise<string> => {
    const transitions = {
      'homework_dialogue': "Parfait ! Maintenant, j'aimerais savoir comment se sont passés vos exercices cette semaine. Qu'avez-vous pu pratiquer ?",
      'therapeutic_conversation': "Excellent ! Entrons maintenant dans le cœur de notre session. Aujourd'hui, nous allons explorer ensemble une nouvelle approche.",
      'guided_practice': "Maintenant que nous avons bien discuté, il est temps de mettre en pratique. Êtes-vous prêt(e) pour un exercice guidé ?",
      'conversational_summary': "Quelle belle session nous avons eue ! Récapitulons ensemble ce que nous avons découvert aujourd'hui."
    };

    return transitions[nextPhase.id as keyof typeof transitions] || nextPhase.conversationalGoals[0];
  };

  const addConversationMessage = async (messageData: Partial<ConversationMessage>) => {
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...messageData
    } as ConversationMessage;

    console.log('🎵 Création nouveau message:', {
      id: newMessage.id,
      sender: newMessage.sender,
      hasAudio: newMessage.hasAudio,
      hasAudioUrl: !!newMessage.audioUrl,
      contentLength: newMessage.content.length
    });

    setSessionState(prev => {
      const updatedState = {
        ...prev!,
        conversation: [...prev!.conversation, newMessage]
      };
      
      // Sauvegarder automatiquement après chaque message
      const savedSessionKey = `conversational_session_${sessionId}`;
      localStorage.setItem(savedSessionKey, JSON.stringify(updatedState));
      console.log('💾 Conversation sauvegardée automatiquement');
      
      return updatedState;
    });

    // ⚠️ CORRECTION : Génération TTS seulement si audio activé par utilisateur
    if (audioEnabled && newMessage.hasAudio && newMessage.sender === 'expert' && !newMessage.audioUrl) {
      console.log('🎵 Message expert avec audio détecté, génération en cours...');
      
      // Mettre à jour immédiatement avec état "generating"
      setSessionState(prev => {
        if (!prev) return prev;
        
        const updatedConversation = prev.conversation.map(msg => {
          if (msg.id === newMessage.id) {
            return { ...msg, audioUrl: 'generating' };
          }
          return msg;
        });
        
        const updatedState = { ...prev, conversation: updatedConversation };
        
        // Sauvegarder
        const savedSessionKey = `conversational_session_${sessionId}`;
        localStorage.setItem(savedSessionKey, JSON.stringify(updatedState));
        
        return updatedState;
      });
      
      // Générer audio avec TTS en arrière-plan
      generateAudioForMessage(newMessage.content, newMessage.id);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionState) return;

    const userMessage = inputMessage.trim();
    
    // ⚠️ CORRECTION CRITIQUE: Ne pas traiter les messages vides !
    if (!userMessage || userMessage.length === 0) {
      console.log('❌ Message vide ignoré - Aucun traitement');
      return;
    }
    
    setInputMessage('');
    
    // Réinitialiser le statut vocal après envoi
    setVoiceInputStatus('idle');

    console.log(`📝 Traitement message utilisateur: "${userMessage}"`);

    // Ajouter message utilisateur immédiatement
    addConversationMessage({
      sender: 'user',
      content: userMessage
    });

    // Générer réponse expert SEULEMENT si message valide
    try {
      setIsExpertTyping(true);
      
      await processUserMessage(userMessage);
    } catch (error) {
      console.error('Erreur traitement message:', error);
      setIsExpertTyping(false);
    }
  };

  const processUserMessage = async (message: string) => {
    if (!therapeuticAIRef.current || !sessionState) return;

    try {
      // 🎯 CORRECTION CLAUDE : Enrichir le contexte avec les données du programme
      let context: any = {
        user_profile: {},
        current_session: { phase: sessionState.currentPhase },
        program_progress: {},
        recent_interactions: sessionState.conversation.slice(-5),
        emotional_state: 'processing',
        cultural_context: sessionState.expertProfile?.cultural_context || 'français',
        language: 'fr' as const,
        // Propriétés requises pour ConversationalContext
        conversation_history: sessionState.conversation,
        phase_context: {
          current_phase: sessionState.currentPhase.id,
          phase_progress: 0,
          objectives_met: [],
          time_remaining: 0
        },
        user_engagement: {
          interaction_count: sessionState.conversation.length,
          average_response_length: 0,
          emotional_openness: 5,
          resistance_indicators: []
        },
        expert_memory: {
          previous_topics: [],
          established_rapport: false,
          user_preferences: {},
          effective_techniques: []
        }
      };

      // 🎯 ENRICHIR avec le contexte du programme thérapeutique
      try {
        const programManager = new TherapyProgramManager();
        const currentProgram = await programManager.getCurrentProgram(user?.id || '');
        
        if (currentProgram) {
          const theme = getThemeById(currentProgram.program_type || currentProgram.program_name);
          
          context = {
            ...context,
            program_context: {
              program_name: currentProgram.program_name || currentProgram.name,
              theme: theme ? {
                id: theme.id,
                name: theme.name,
                description: theme.description
              } : null,
              personalization: {
                primary_diagnosis: currentProgram.primary_diagnosis,
                secondary_diagnoses: currentProgram.secondary_diagnoses || [],
                severity_level: currentProgram.severity_level,
                personal_goals: currentProgram.personal_goals || [],
                success_definition: currentProgram.success_definition,
                protective_factors: currentProgram.protective_factors || [],
                risk_factors: currentProgram.risk_factors || [],
                motivation_level: currentProgram.motivation_level || 5,
                completed_sessions: currentProgram.sessions_completed || 0,
                total_sessions: currentProgram.total_planned_sessions || 12,
                improvement_percentage: currentProgram.improvement_percentage || 0
              }
            }
          };
          
          console.log('🎯 Contexte programme enrichi pour réponse expert:', {
            program: currentProgram.program_name,
            theme: theme?.name,
            goals: currentProgram.personal_goals?.length || 0
          });
        }
      } catch (programError) {
        console.warn('⚠️ Impossible de récupérer le contexte programme, utilisation du contexte de base:', programError);
      }

      // 🎯 UTILISER generateConversationalResponse pour une meilleure qualité
      const response = await therapeuticAIRef.current.generateConversationalResponse(
        sessionState.expertProfile.id,
        message,
        context
      );

      // Simuler délai de réflexion naturel
      const typingDelay = Math.min(message.length * 50 + 1000, 4000);
      
      setTimeout(() => {
        setIsExpertTyping(false);
        
        // ⚠️ CORRECTION : Vérifier si une réponse similaire existe déjà
        const existingResponse = sessionState?.conversation.find(msg => 
          msg.sender === 'expert' && 
          msg.content === response.content
        );
        
        if (existingResponse) {
          console.log('⚠️ Réponse dupliquée détectée, évitement d\'ajout:', response.content.substring(0, 50) + '...');
          return;
        }
        
        addConversationMessage({
          sender: 'expert',
          content: response.content,
          hasAudio: true,
          emotion: response.emotional_tone
        });
      }, typingDelay);

    } catch (error) {
      console.error('🚨 Erreur génération réponse expert conversationnelle:', error);
      setIsExpertTyping(false);
      addConversationMessage({
        sender: 'expert',
        content: "Je comprends. Pouvez-vous me dire un peu plus sur ce que vous ressentez ?",
        hasAudio: false
      });
    }
  };

  const generateAndPlayAudio = async (text: string) => {
    if (!ttsServiceRef.current || isMuted) return;

    try {
      const expertVoiceId = sessionState?.expertProfile?.id || 'dr_sarah_empathie';
      const audioUrl = await ttsServiceRef.current.generateSpeech(text, expertVoiceId);
      
      if (audioUrl) {
        playAudio(audioUrl);
      }
    } catch (error) {
      console.error('Erreur génération audio:', error);
    }
  };

  // ⚠️ FONCTION AMÉLIORÉE : Générer audio avec indicateur immédiat
  const generateAudioForMessage = async (text: string, messageId: string) => {
    if (!ttsServiceRef.current) {
      console.warn('⚠️ Service TTS non disponible');
      // Marquer le message comme "sans audio disponible"
      setSessionState(prev => {
        if (!prev) return prev;
        
        const updatedConversation = prev.conversation.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, audioUrl: 'unavailable', hasAudio: false };
          }
          return msg;
        });
        
        return { ...prev, conversation: updatedConversation };
      });
      return;
    }

    try {
      console.log('🎵 Début génération audio pour message:', messageId);
      const expertVoiceId = sessionState?.expertProfile?.voice_id || sessionState?.expertProfile?.id || 'dr_sarah_empathie';
      console.log('🎵 Voix expert utilisée:', expertVoiceId);
      
      let audioUrl;
      try {
        audioUrl = await ttsServiceRef.current.generateSpeech(text, expertVoiceId);
        console.log('🎵 Réponse TTS service:', typeof audioUrl, audioUrl ? 'URL reçue' : 'Pas d\'URL');
      } catch (ttsError) {
        console.error('🚨 Erreur TTS service:', ttsError);
        // Fallback: utiliser la synthèse vocale du navigateur
        audioUrl = await generateBrowserTTS(text);
      }
      
      if (audioUrl && audioUrl !== 'error') {
        console.log('🎵 Audio généré avec succès:', audioUrl);
        
        // Mettre à jour avec l'URL audio réelle
        setSessionState(prev => {
          if (!prev) return prev;
          
          const updatedConversation = prev.conversation.map(msg => {
            if (msg.id === messageId) {
              return { ...msg, audioUrl, hasAudio: true };
            }
            return msg;
          });
          
          const updatedState = { ...prev, conversation: updatedConversation };
          
          // Sauvegarder l'état mis à jour
          const savedSessionKey = `conversational_session_${sessionId}`;
          localStorage.setItem(savedSessionKey, JSON.stringify(updatedState));
          
          return updatedState;
        });
      } else {
        console.warn('⚠️ Échec génération audio pour message:', messageId);
        // Marquer comme échec mais garder les contrôles
        setSessionState(prev => {
          if (!prev) return prev;
          
          const updatedConversation = prev.conversation.map(msg => {
            if (msg.id === messageId) {
              return { ...msg, audioUrl: 'failed', hasAudio: false };
            }
            return msg;
          });
          
          return { ...prev, conversation: updatedConversation };
        });
      }
    } catch (error) {
      console.error('❌ Erreur génération audio:', error);
      // Marquer comme erreur
      setSessionState(prev => {
        if (!prev) return prev;
        
        const updatedConversation = prev.conversation.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, audioUrl: 'error', hasAudio: false };
          }
          return msg;
        });
        
        return { ...prev, conversation: updatedConversation };
      });
    }
  };

  // Gestion reconnaissance vocale
  const handleVoiceTranscript = async (transcript: string, confidence: number) => {
    console.log('📝 Transcript reçu:', transcript, 'Confiance:', confidence);
    
    // Normaliser la confiance (certains navigateurs retournent 0 ou undefined)
    const normalizedConfidence = confidence || 0;
    
    // Accepter tout transcript non vide, même avec confiance faible
    if (transcript.trim()) {
      setInputMessage(transcript);
      console.log(`✅ Message vocal mis dans le champ: "${transcript}"`);
      
      // Auto-envoyer seulement si confiance élevée ET transcript long ET session initialisée
      if (normalizedConfidence > 0.7 && transcript.length > 10 && sessionInitialized) {
        const delay = normalizedConfidence > 0.9 ? 500 : 1500;
        console.log(`🚀 Auto-envoi dans ${delay}ms (confiance: ${normalizedConfidence.toFixed(2)})`);
        
        setTimeout(() => {
          sendMessage();
        }, delay);
      } else if (!sessionInitialized) {
        console.log('⏸️ Auto-envoi bloqué - Session en cours d\'initialisation');
        setInputMessage(transcript); // Mettre le texte mais pas d\'auto-envoi
      } else if (normalizedConfidence > 0.4) {
        // Confiance moyenne: invitation à confirmer
        console.log(`⏳ Message prêt, cliquez pour envoyer (confiance: ${normalizedConfidence.toFixed(2)})`);
      } else {
        // Confiance faible ou 0: toujours mettre le texte mais demander confirmation
        console.log(`🔄 Confiance faible (${normalizedConfidence.toFixed(2)}) - Vérifiez le texte et cliquez pour envoyer`);
      }
      
      // Mettre le statut à 'completed' pour montrer l'indicateur vert
      setVoiceInputStatus('completed');
    } else {
      console.log(`❌ Transcript vide, ignoré`);
    }
  };

  const handleVoiceError = (error: string) => {
    console.error('❌ Erreur reconnaissance vocale:', error);
    setVoiceInputStatus('error');
    
    // Diagnostic détaillé pour debugging
    if (error.includes('network')) {
      console.warn('🌐 Problème réseau - vérifiez votre connexion internet');
    } else if (error.includes('audio-capture')) {
      console.warn('🎤 Problème microphone - vérifiez les permissions');
    } else if (error.includes('no-speech')) {
      console.warn('🔇 Aucune parole détectée - parlez plus fort ou plus près du micro');
    } else {
      console.warn('⚠️ Erreur de reconnaissance - réessayez');
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const playAudio = async (audioUrl: string) => {
    if (!audioRef.current) return;

    try {
      setAudioPlaying(audioUrl);
      audioRef.current.src = audioUrl;
      await audioRef.current.play();
    } catch (error) {
      console.error('Erreur lecture audio:', error);
      setAudioPlaying(null);
    }
  };

  // Lecture avec synthèse vocale du navigateur
  const playBrowserTTS = (text: string) => {
    try {
      // Arrêter toute synthèse vocale en cours
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      
      // Sélectionner une voix française si disponible
      const voices = speechSynthesis.getVoices();
      const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      utterance.onstart = () => {
        console.log('🎵 Lecture TTS navigateur démarrée');
        setAudioPlaying('browser-tts');
        setIsAudioPlaying(true);
      };

      utterance.onend = () => {
        console.log('🎵 Lecture TTS navigateur terminée');
        setAudioPlaying(null);
        setIsAudioPlaying(false);
        setIsPaused(false);
        setCurrentPlayingMessageId(null);
      };

      utterance.onerror = (event) => {
        console.error('🚨 Erreur TTS navigateur:', event);
        setAudioPlaying(null);
        setIsAudioPlaying(false);
        setIsPaused(false);
        setCurrentPlayingMessageId(null);
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('🚨 Erreur playBrowserTTS:', error);
    }
  };

  // 🎵 Fonctions de contrôle audio individuelles par message
  const playMessageAudio = (messageId: string, content: string) => {
    console.log(`▶️ Lecture message ${messageId}`);
    
    // Arrêter l'audio en cours s'il y en a un autre
    if (currentPlayingMessageId && currentPlayingMessageId !== messageId) {
      stopAllAudio();
    }
    
    // Si c'est le même message et qu'il est en pause, reprendre
    if (currentPlayingMessageId === messageId && isPaused) {
      console.log('▶️ Reprise lecture depuis la pause');
      speechSynthesis.resume();
      setIsPaused(false);
      setIsAudioPlaying(true);
      return;
    }
    
    // Nouvelle lecture
    setCurrentPlayingMessageId(messageId);
    setIsAudioPlaying(true);
    setIsPaused(false);
    playBrowserTTS(content);
  };

  const pauseMessageAudio = (messageId: string) => {
    if (currentPlayingMessageId === messageId && isAudioPlaying) {
      console.log('⏸️ Pause lecture');
      speechSynthesis.pause();
      setIsPaused(true);
      setIsAudioPlaying(false);
    }
  };

  const stopMessageAudio = (messageId: string) => {
    if (currentPlayingMessageId === messageId) {
      console.log('⏹️ Arrêt lecture');
      speechSynthesis.cancel();
      setIsAudioPlaying(false);
      setIsPaused(false);
      setCurrentPlayingMessageId(null);
    }
  };

  const stopAllAudio = () => {
    console.log('⏹️ Arrêt de tout audio');
    speechSynthesis.cancel();
    setIsAudioPlaying(false);
    setIsPaused(false);
    setCurrentPlayingMessageId(null);
  };

  const getNextPhase = (): ConversationalPhase | null => {
    if (!sessionState) return null;
    
    const currentIndex = CONVERSATIONAL_PHASES.findIndex(p => p.id === sessionState.currentPhase.id);
    return CONVERSATIONAL_PHASES[currentIndex + 1] || null;
  };

  const getConversationSummary = (): string => {
    if (!sessionState) return '';
    
    const userMessages = sessionState.conversation.filter(m => m.sender === 'user');
    return `${userMessages.length} échanges utilisateur dans phase ${sessionState.currentPhase.displayName}`;
  };

  const transitionToNextPhase = () => {
    const nextPhase = getNextPhase();
    if (!nextPhase) {
      // ⚠️ CORRECTION : Plus de phases disponibles - conclure la session
      console.log('🎯 Plus de phases disponibles - conclusion de session');
      concludeSession();
      return;
    }

    // Reset transition controller metrics for new phase
    if (sessionState && transitionControllerRef.current) {
      transitionControllerRef.current.resetPhaseMetrics(sessionState.id);
    }

    setSessionState(prev => ({
      ...prev!,
      currentPhase: nextPhase,
      phaseStartTime: new Date(),
      phaseObjectivesMet: false,
      // 🎯 RESET timer intelligent pour nouvelle phase
      expertProcessingTime: 0, // Reset compteur pause pour nouvelle phase
      lastPauseStart: null // Pas de pause en cours au démarrage phase
    }));
    setPhaseProgress(0);

    console.log(`🔄 Transition vers phase: ${nextPhase.displayName} - Métriques réinitialisées`);
  };

  const concludeSession = () => {
    if (sessionState) {
      console.log('🎯 Session terminée:', sessionState.id);
      
      // Nettoyer la session du localStorage à la fin
      const savedSessionKey = `conversational_session_${sessionId}`;
      localStorage.removeItem(savedSessionKey);
      console.log('🗑️ Session supprimée du localStorage');
    }
    
    // ⚠️ CORRECTION : Vérifier que onComplete existe avant de l'appeler
    if (typeof onComplete === 'function') {
      console.log('✅ Appel de onComplete pour terminer la session');
      onComplete();
    } else {
      console.warn('⚠️ onComplete non défini - redirection par défaut');
      // Redirection par défaut si onComplete n'est pas défini
      window.location.href = '/therapy-dashboard';
    }
  };

  // Fonction utilitaire pour formater les timestamps de manière sécurisée
  const formatTimestamp = (timestamp: any): string => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.warn('Erreur formatage timestamp:', error);
      return new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Fonction utilitaire pour nettoyer les anciennes sessions
  const cleanupOldSessions = () => {
    const keys = Object.keys(localStorage);
    const sessionKeys = keys.filter(key => key.startsWith('conversational_session_'));
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    sessionKeys.forEach(key => {
      try {
        const session = JSON.parse(localStorage.getItem(key) || '{}');
        const sessionTime = new Date(session.phaseStartTime).getTime();
        if (sessionTime < oneDayAgo) {
          localStorage.removeItem(key);
          console.log('🧹 Session ancienne supprimée:', key);
        }
      } catch (error) {
        // Supprimer les sessions corrompues
        localStorage.removeItem(key);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"
        />
        <div className="ml-4">
          <p className="text-lg font-semibold text-gray-700">Préparation de votre session...</p>
          <p className="text-sm text-gray-500">Connection avec votre thérapeute</p>
        </div>
      </div>
    );
  }

  if (!sessionState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session indisponible</h2>
          <p className="text-gray-600">Impossible de charger votre session thérapeutique.</p>
        </div>
      </div>
    );
  }

  const currentPhaseIndex = CONVERSATIONAL_PHASES.findIndex(p => p.id === sessionState.currentPhase.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header avec info session */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-200 p-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {/* Info Expert */}
            <div className="flex items-center space-x-3">
              {sessionState.expertProfile?.avatar && (
                <img 
                  src={sessionState.expertProfile.avatar} 
                  alt={sessionState.expertProfile.name}
                  className="w-12 h-12 rounded-full border-2 border-green-200"
                />
              )}
              <div>
                <h2 className="font-semibold text-gray-800">
                  {sessionState.expertProfile?.name || 'Votre Thérapeute'}
                </h2>
                <div className="text-sm text-green-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  En ligne • {sessionState.currentPhase.displayName}
                </div>
              </div>
            </div>

            {/* Contrôles Audio */}
            <div className="flex items-center space-x-3">
              {/* Toggle Audio TTS */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Audio:</span>
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-2 rounded-full transition-colors ${
                    audioEnabled 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title={audioEnabled ? 'Désactiver l\'audio TTS' : 'Activer l\'audio TTS'}
                >
                  {audioEnabled ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Contrôles déplacés vers chaque message */}

              {/* Mute Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title={isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isMuted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Indicateurs de Phase */}
          <div className="flex items-center space-x-2">
            {CONVERSATIONAL_PHASES.map((phase, index) => {
              const isActive = phase.id === sessionState.currentPhase.id;
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
                    <div className="text-xs font-medium truncate">{phase.displayName}</div>
                    {isActive && (
                      <div className="text-xs opacity-75">
                        {Math.round(phaseProgress)}% • {phase.duration} min
                      </div>
                    )}
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
          
          {/* Indicateur progression objectifs de phase */}
          {sessionState && (
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Progression phase</span>
                <span className="text-gray-800 font-medium">
                  {Math.round(phaseProgress)}% • {sessionState.conversation.filter(m => m.sender === 'user').length}/{sessionState.currentPhase.minInteractions} messages
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(phaseProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Zone de Conversation */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[60vh]">
          <AnimatePresence>
            {sessionState.conversation.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[70%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-3' : 'mr-3'}`}>
                    {message.sender === 'expert' ? (
                      sessionState.expertProfile?.avatar ? (
                        <img 
                          src={sessionState.expertProfile.avatar}
                          alt="Expert"
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )
                    ) : (
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                    
                    {/* Contrôles et métadonnées du message */}
                    <div className="flex items-center justify-between mt-2">
                      <div className={`text-xs ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {formatTimestamp(message.timestamp)}
                      </div>
                      
                      {/* 🎵 CONTRÔLES AUDIO INDIVIDUELS */}
                      {message.sender === 'expert' && (
                        <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                          {/* Play/Resume Button */}
                          <button
                            onClick={() => {
                              if (currentPlayingMessageId === message.id && isPaused) {
                                playMessageAudio(message.id, message.content); // Resume
                              } else if (currentPlayingMessageId === message.id && isAudioPlaying) {
                                pauseMessageAudio(message.id); // Pause
                              } else {
                                playMessageAudio(message.id, message.content); // Play
                              }
                            }}
                            className={`p-1 rounded transition-colors ${
                              currentPlayingMessageId === message.id && isAudioPlaying
                                ? 'bg-orange-500 text-white hover:bg-orange-600' // Pause (orange)
                                : currentPlayingMessageId === message.id && isPaused
                                ? 'bg-blue-500 text-white hover:bg-blue-600' // Resume (bleu) 
                                : 'bg-blue-500 text-white hover:bg-blue-600' // Play (bleu)
                            }`}
                            title={
                              currentPlayingMessageId === message.id && isAudioPlaying
                                ? 'Pause'
                                : currentPlayingMessageId === message.id && isPaused
                                ? 'Reprendre'
                                : 'Lire'
                            }
                          >
                            {currentPlayingMessageId === message.id && isAudioPlaying ? (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zM14 5v14h4V5h-4z"/>
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            )}
                          </button>

                          {/* Stop Button */}
                          <button
                            onClick={() => stopMessageAudio(message.id)}
                            disabled={currentPlayingMessageId !== message.id}
                            className="p-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                            title="Arrêter"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 6h12v12H6z"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Expert en train de taper */}
            {isExpertTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex">
                  <div className="mr-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200 flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">En cours de réflexion...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de Saisie avec Intégration Vocale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Interface de reconnaissance vocale */}
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onError={handleVoiceError}
            onStatusChange={setVoiceInputStatus}
            expertId={sessionState?.expertProfile?.id}
            emotionalContext="therapeutic"
            autoSend={false}
            showTranscript={true}
            variant="inline"
            size="md"
            disabled={isExpertTyping}
            placeholder="Parlez ou tapez votre message..."
          />

          {/* Zone de saisie texte traditionnelle */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-end space-x-3">
              {/* Zone de texte */}
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ou tapez votre message ici..."
                  className="w-full resize-none border-0 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                  rows={2}
                  maxLength={1000}
                />
              </div>
              
              {/* Bouton Envoyer */}
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isExpertTyping}
                className={`p-2 rounded-full transition-all duration-200 ${
                  !inputMessage.trim() || isExpertTyping
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : inputMessage.trim() && !isExpertTyping
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:scale-105'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title={inputMessage.trim() ? 'Envoyer le message' : 'Saisissez votre message'}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Compteur caractères et statut vocal */}
            <div className="mt-2 flex justify-between items-center">
              {voiceInputStatus !== 'idle' && (
                <div className="flex items-center space-x-2 text-xs">
                  {voiceInputStatus === 'listening' && (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-600">🎤 En écoute...</span>
                    </>
                  )}
                  {voiceInputStatus === 'processing' && (
                    <>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-blue-600">🔄 Traitement...</span>
                    </>
                  )}
                  {voiceInputStatus === 'completed' && inputMessage.trim() && (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600">✅ Message vocal prêt - Cliquez "Envoyer"</span>
                    </>
                  )}
                  {voiceInputStatus === 'error' && (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-600">❌ Erreur reconnaissance</span>
                    </>
                  )}
                </div>
              )}
              
              <span className="text-xs text-gray-400">
                {inputMessage.length}/1000 caractères
              </span>
            </div>
          </div>
        </motion.div>

        {/* Boutons Transition Phase */}
        {sessionState.phaseObjectivesMet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <button
              onClick={transitionToNextPhase}
              className="bg-green-500 text-white px-8 py-3 rounded-full hover:bg-green-600 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <span>Continuer vers l'étape suivante</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                →
              </motion.div>
            </button>
          </motion.div>
        )}
        
        {/* Bouton bypass si critères principaux remplis mais pas temporels */}
        {!sessionState.phaseObjectivesMet && sessionState.conversation.length > 0 && (
          (() => {
            const userMessages = sessionState.conversation.filter(m => m.sender === 'user').length;
            const expertMessages = sessionState.conversation.filter(m => m.sender === 'expert').length;
            const minInteractions = sessionState.currentPhase.minInteractions || 3;
            const expertMinRequired = Math.max(1, Math.floor(minInteractions * 0.6));
            const hasMinimumExchange = userMessages >= minInteractions && expertMessages >= expertMinRequired;
            
            const messages = sessionState.conversation;
            const lastMessage = messages[messages.length - 1];
            const secondToLastMessage = messages[messages.length - 2];
            const hasUserRespondedToLastExpert = lastMessage?.sender === 'user' && secondToLastMessage?.sender === 'expert';
            
            const canBypass = hasMinimumExchange && hasUserRespondedToLastExpert;
            
            return canBypass ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <button
                  onClick={transitionToNextPhase}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center space-x-2 mx-auto text-sm"
                >
                  <span>Passer à l'étape suivante</span>
                  →
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Les objectifs principaux sont atteints
                </p>
              </motion.div>
            ) : null;
          })()
        )}
      </div>

             {/* Audio Player */}
       <audio
         ref={audioRef}
         onEnded={() => setAudioPlaying(null)}
         className="hidden"
       />

               {/* Styles CSS importés depuis AudioMessageControls.css */}
     </div>
   );
 };

export default ConversationalTherapySession;