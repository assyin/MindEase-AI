/**
 * WEB SPEECH STT SERVICE - RECONNAISSANCE VOCALE POUR CONVERSATIONS THÉRAPEUTIQUES
 * Service de reconnaissance vocale optimisé pour sessions thérapeutiques
 * Support français avec détection émotionnelle basique
 * Date: 30/08/2025
 */

// Types pour reconnaissance vocale conversationnelle
export interface STTRequest {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  expertId?: string;
  emotionalContext?: string;
}

export interface STTResponse {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: {
    transcript: string;
    confidence: number;
  }[];
  detectedEmotion?: string;
  speechDuration?: number;
}

export interface STTSession {
  id: string;
  isActive: boolean;
  startTime: Date;
  config: STTRequest;
  onResult: (result: STTResponse) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

/**
 * SERVICE DE RECONNAISSANCE VOCALE THÉRAPEUTIQUE
 * Utilise Web Speech API avec optimisations pour conversations thérapeutiques
 */
export class WebSpeechSTTService {
  private static instance: WebSpeechSTTService;
  private recognition: SpeechRecognition | null = null;
  private currentSession: STTSession | null = null;
  private isSupported: boolean = false;
  private sessionCounter: number = 0;

  // Configuration optimisée pour conversations thérapeutiques
  private readonly DEFAULT_CONFIG: STTRequest = {
    language: 'fr-FR',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3
  };

  // Mots-clés émotionnels pour détection basique
  private readonly EMOTIONAL_KEYWORDS = {
    'anxieux': ['anxieux', 'angoissé', 'stressé', 'inquiet', 'panique', 'tendu'],
    'triste': ['triste', 'déprimé', 'mélancolique', 'abattu', 'morose', 'découragé'],
    'colère': ['en colère', 'furieux', 'irrité', 'énervé', 'frustré', 'agacé'],
    'joie': ['heureux', 'content', 'joyeux', 'ravi', 'euphorique', 'enthousiaste'],
    'peur': ['peur', 'effrayé', 'terrorisé', 'apeuré', 'crainte', 'appréhension'],
    'surprise': ['surpris', 'étonné', 'stupéfait', 'interloqué', 'bouche bée'],
    'dégoût': ['dégoût', 'répulsion', 'écœuré', 'aversion', 'révulsion'],
    'neutre': ['normal', 'habituel', 'ordinaire', 'classique', 'standard']
  };

  static getInstance(): WebSpeechSTTService {
    if (!WebSpeechSTTService.instance) {
      WebSpeechSTTService.instance = new WebSpeechSTTService();
    }
    return WebSpeechSTTService.instance;
  }

  constructor() {
    this.initializeSpeechRecognition();
  }

  /**
   * INITIALISATION DU SERVICE DE RECONNAISSANCE VOCALE
   */
  private initializeSpeechRecognition(): void {
    try {
      // Vérifier support Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('⚠️ Web Speech API non supportée par ce navigateur');
        this.isSupported = false;
        return;
      }

      this.recognition = new SpeechRecognition();
      this.isSupported = true;
      console.log('✅ WebSpeechSTTService initialisé avec succès');

    } catch (error) {
      console.error('❌ Erreur initialisation Web Speech API:', error);
      this.isSupported = false;
    }
  }

  /**
   * DÉMARRAGE SESSION DE RECONNAISSANCE VOCALE
   * Pour utilisation dans sessions thérapeutiques conversationnelles
   */
  async startRecognitionSession(
    config: Partial<STTRequest> = {},
    callbacks: {
      onResult: (result: STTResponse) => void;
      onError?: (error: string) => void;
      onEnd?: () => void;
    }
  ): Promise<STTSession | null> {
    if (!this.isSupported || !this.recognition) {
      const error = 'Reconnaissance vocale non supportée';
      console.error('❌', error);
      callbacks.onError?.(error);
      return null;
    }

    // Arrêter session précédente si active
    if (this.currentSession?.isActive) {
      await this.stopRecognitionSession();
      // Attendre que la reconnaissance soit réellement arrêtée
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      // Vérifier si une reconnaissance est déjà en cours
      if (this.recognition && this.recognition.abort) {
        this.recognition.abort(); // Force l'arrêt
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Configuration session
      const sessionConfig = { ...this.DEFAULT_CONFIG, ...config };
      const sessionId = `stt_session_${++this.sessionCounter}`;

      // Configuration recognition
      this.recognition.lang = sessionConfig.language;
      this.recognition.continuous = sessionConfig.continuous;
      this.recognition.interimResults = sessionConfig.interimResults;
      this.recognition.maxAlternatives = sessionConfig.maxAlternatives;

      // Créer session
      const session: STTSession = {
        id: sessionId,
        isActive: false,
        startTime: new Date(),
        config: sessionConfig,
        onResult: callbacks.onResult,
        onError: callbacks.onError || (() => {}),
        onEnd: callbacks.onEnd || (() => {})
      };

      // Configuration callbacks recognition
      this.setupRecognitionCallbacks(session);

      // Démarrer reconnaissance avec vérification d'état
      try {
        this.recognition.start();
        session.isActive = true;
        this.currentSession = session;
      } catch (startError) {
        if (startError.name === 'InvalidStateError') {
          // Si déjà démarrée, forcer l'arrêt et réessayer
          this.recognition.abort();
          await new Promise(resolve => setTimeout(resolve, 100));
          this.recognition.start();
          session.isActive = true;
          this.currentSession = session;
        } else {
          throw startError;
        }
      }

      console.log('🎤 Session reconnaissance vocale démarrée:', sessionId);
      return session;

    } catch (error) {
      const errorMessage = `Erreur démarrage reconnaissance: ${error}`;
      console.error('❌', errorMessage);
      callbacks.onError?.(errorMessage);
      return null;
    }
  }

  /**
   * ARRÊT SESSION DE RECONNAISSANCE VOCALE
   */
  async stopRecognitionSession(): Promise<void> {
    if (!this.currentSession?.isActive || !this.recognition) {
      return;
    }

    try {
      this.recognition.stop();
      this.currentSession.isActive = false;
      
      console.log('🛑 Session reconnaissance vocale arrêtée:', this.currentSession.id);
      
      // Callback fin de session
      this.currentSession.onEnd();
      this.currentSession = null;

    } catch (error) {
      console.error('❌ Erreur arrêt reconnaissance:', error);
    }
  }

  /**
   * CONFIGURATION DES CALLBACKS DE RECONNAISSANCE
   * Traitement des résultats et détection émotionnelle
   */
  private setupRecognitionCallbacks(session: STTSession): void {
    if (!this.recognition) return;

    // Résultat reconnaissance
    this.recognition.onresult = (event) => {
      try {
        const speechSession = event.results[event.results.length - 1];
        const transcript = speechSession[0].transcript;
        const confidence = speechSession[0].confidence;
        const isFinal = speechSession.isFinal;

        // Alternatives de transcription
        const alternatives = [];
        for (let i = 0; i < Math.min(speechSession.length, session.config.maxAlternatives); i++) {
          alternatives.push({
            transcript: speechSession[i].transcript,
            confidence: speechSession[i].confidence
          });
        }

        // Détection émotionnelle basique
        const detectedEmotion = this.detectBasicEmotion(transcript);

        // Calculer durée si final
        const speechDuration = isFinal ? 
          (Date.now() - session.startTime.getTime()) / 1000 : 
          undefined;

        const result: STTResponse = {
          transcript,
          confidence,
          isFinal,
          alternatives,
          detectedEmotion,
          speechDuration
        };

        // Callback résultat
        session.onResult(result);

        console.log(`🎙️ Reconnaissance ${isFinal ? 'finale' : 'partielle'}:`, transcript);
        if (detectedEmotion && detectedEmotion !== 'neutre') {
          console.log(`😊 Émotion détectée: ${detectedEmotion}`);
        }

      } catch (error) {
        console.error('❌ Erreur traitement résultat reconnaissance:', error);
        session.onError('Erreur traitement résultat vocal');
      }
    };

    // Erreurs reconnaissance
    this.recognition.onerror = (event) => {
      const errorMessage = this.mapSpeechRecognitionError(event.error);
      console.error('❌ Erreur reconnaissance vocale:', errorMessage);
      session.onError(errorMessage);
    };

    // Fin de reconnaissance
    this.recognition.onend = () => {
      if (session.isActive) {
        console.log('🏁 Reconnaissance vocale terminée');
        session.isActive = false;
        session.onEnd();
        
        // Redémarrer si mode continu et session toujours active
        if (session.config.continuous && this.currentSession?.id === session.id) {
          setTimeout(() => {
            try {
              this.recognition?.start();
              session.isActive = true;
            } catch (error) {
              console.error('❌ Erreur redémarrage reconnaissance continue:', error);
            }
          }, 100);
        }
      }
    };

    // Début de reconnaissance
    this.recognition.onstart = () => {
      console.log('🎤 Reconnaissance vocale active');
    };

    // Détection de parole
    this.recognition.onspeechstart = () => {
      console.log('🗣️ Parole détectée');
    };

    this.recognition.onspeechend = () => {
      console.log('🤐 Fin de parole détectée');
    };
  }

  /**
   * DÉTECTION ÉMOTIONNELLE BASIQUE
   * Analyse simple basée sur mots-clés
   */
  private detectBasicEmotion(transcript: string): string {
    const transcriptLower = transcript.toLowerCase();
    
    // Chercher mots-clés émotionnels
    for (const [emotion, keywords] of Object.entries(this.EMOTIONAL_KEYWORDS)) {
      const hasKeyword = keywords.some(keyword => 
        transcriptLower.includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        return emotion;
      }
    }

    // Détection patterns émotionnels simples
    if (/[!]{2,}/.test(transcript)) return 'colère';
    if (/\?{2,}/.test(transcript)) return 'anxieux';
    if (/\.{3,}/.test(transcript)) return 'triste';

    return 'neutre';
  }

  /**
   * MAPPING ERREURS SPEECH RECOGNITION
   */
  private mapSpeechRecognitionError(error: string): string {
    const errorMap = {
      'no-speech': 'Aucune parole détectée. Parlez plus fort ou rapprochez-vous du microphone.',
      'audio-capture': 'Impossible d\'accéder au microphone. Vérifiez les permissions.',
      'not-allowed': 'Accès microphone refusé. Autorisez l\'accès dans les paramètres du navigateur.',
      'network': 'Erreur réseau. Vérifiez votre connexion internet.',
      'language-not-supported': 'Langue non supportée pour la reconnaissance vocale.',
      'service-not-allowed': 'Service de reconnaissance non autorisé.',
      'bad-grammar': 'Erreur de grammaire dans la reconnaissance.',
      'aborted': 'Reconnaissance vocale interrompue.'
    };

    return errorMap[error as keyof typeof errorMap] || `Erreur inconnue: ${error}`;
  }

  /**
   * UTILITAIRES PUBLICS
   */

  // Vérifier support reconnaissance vocale
  isRecognitionSupported(): boolean {
    return this.isSupported;
  }

  // État session actuelle
  getCurrentSession(): STTSession | null {
    return this.currentSession;
  }

  // Tester reconnaissance vocale
  async testRecognition(): Promise<boolean> {
    if (!this.isSupported) return false;

    return new Promise((resolve) => {
      let testCompleted = false;

      const testSession = this.startRecognitionSession({
        continuous: false,
        interimResults: false
      }, {
        onResult: (result) => {
          if (!testCompleted) {
            testCompleted = true;
            this.stopRecognitionSession();
            resolve(true);
          }
        },
        onError: () => {
          if (!testCompleted) {
            testCompleted = true;
            resolve(false);
          }
        }
      });

      // Timeout test après 3 secondes
      setTimeout(() => {
        if (!testCompleted) {
          testCompleted = true;
          this.stopRecognitionSession();
          resolve(false);
        }
      }, 3000);
    });
  }

  /**
   * MÉTHODES SPÉCIALISÉES THÉRAPIE
   */

  // Reconnaissance adaptée expert thérapeutique
  async startTherapeuticRecognition(
    expertId: string,
    emotionalContext: string,
    callbacks: {
      onResult: (result: STTResponse) => void;
      onError?: (error: string) => void;
      onEnd?: () => void;
    }
  ): Promise<STTSession | null> {
    // Configuration optimisée selon expert
    const config: Partial<STTRequest> = {
      language: 'fr-FR',
      continuous: true,
      interimResults: true,
      maxAlternatives: 2,
      expertId,
      emotionalContext
    };

    // Ajustements selon expert
    if (expertId === 'dr_alex_mindfulness') {
      config.continuous = false; // Plus adapté pour méditation guidée
    } else if (expertId === 'dr_aicha_culturelle') {
      // Pourrait supporter arabe dans le futur
      config.language = 'fr-FR'; // Pour l'instant français seulement
    }

    return await this.startRecognitionSession(config, callbacks);
  }

  // Analyse sentiments pour session thérapeutique
  analyzeTherapeuticSentiment(transcript: string): {
    primaryEmotion: string;
    emotionalIntensity: number;
    therapeuticIndicators: string[];
    needsAttention: boolean;
  } {
    const detectedEmotion = this.detectBasicEmotion(transcript);
    
    // Indicateurs thérapeutiques
    const therapeuticIndicators = [];
    let needsAttention = false;
    
    // Mots indicateurs de détresse
    const distressKeywords = ['suicide', 'mourir', 'disparaître', 'inutile', 'désespoir'];
    const hasDistressKeywords = distressKeywords.some(keyword => 
      transcript.toLowerCase().includes(keyword)
    );
    
    if (hasDistressKeywords) {
      therapeuticIndicators.push('Indicateurs de détresse détectés');
      needsAttention = true;
    }

    // Intensité émotionnelle basée sur ponctuation et répétitions
    let emotionalIntensity = 5; // Base neutre
    
    if (/[!]{1,}/.test(transcript)) emotionalIntensity += 2;
    if (/[?]{1,}/.test(transcript)) emotionalIntensity += 1;
    if (/(.)\1{2,}/.test(transcript)) emotionalIntensity += 1; // Lettres répétées
    if (transcript.length > 100) emotionalIntensity += 1; // Messages longs = engagement
    
    emotionalIntensity = Math.min(10, Math.max(1, emotionalIntensity));

    // Indicateurs d'engagement positif
    const engagementKeywords = ['comprendre', 'apprendre', 'progresser', 'merci', 'aide'];
    const hasEngagementKeywords = engagementKeywords.some(keyword => 
      transcript.toLowerCase().includes(keyword)
    );
    
    if (hasEngagementKeywords) {
      therapeuticIndicators.push('Engagement thérapeutique positif');
    }

    return {
      primaryEmotion: detectedEmotion,
      emotionalIntensity,
      therapeuticIndicators,
      needsAttention
    };
  }

  /**
   * NETTOYAGE ET DIAGNOSTIC
   */

  // Statistiques utilisation
  getUsageStats(): {
    isSupported: boolean;
    currentSessionActive: boolean;
    totalSessions: number;
  } {
    return {
      isSupported: this.isSupported,
      currentSessionActive: this.currentSession?.isActive || false,
      totalSessions: this.sessionCounter
    };
  }

  // Nettoyage ressources
  cleanup(): void {
    this.stopRecognitionSession();
    if (this.recognition) {
      this.recognition = null;
    }
    console.log('🧹 WebSpeechSTTService nettoyé');
  }
}

// Export instance singleton
export const webSpeechSTTService = WebSpeechSTTService.getInstance();

// Types pour intégration globale
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default WebSpeechSTTService;