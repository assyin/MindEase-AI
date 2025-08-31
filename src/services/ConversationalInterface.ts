import { WebSpeechSTTService } from './WebSpeechSTTService';
import { GeminiTTSService } from './GeminiTTSService';
import { ExpertPersonalityEngine } from './ExpertPersonalityEngine';

export interface ConversationMetrics {
  speechClarity: number;
  emotionalTone: 'calm' | 'anxious' | 'engaged' | 'distressed' | 'neutral';
  participationLevel: 'high' | 'medium' | 'low';
  conversationFlow: 'smooth' | 'hesitant' | 'interrupted';
}

export interface ConversationSession {
  sessionId: string;
  expertId: string;
  isActive: boolean;
  startTime: Date;
  lastActivity: Date;
  metrics: ConversationMetrics;
  audioSettings: {
    voiceType: 'umbriel' | 'aoede' | 'despina';
    speed: number;
    pitch: number;
    volume: number;
  };
}

export interface ConversationConfig {
  enableAutoResponse: boolean;
  pauseDetectionMs: number;
  maxSilenceDuration: number;
  interruptionHandling: 'immediate' | 'polite' | 'disabled';
  qualityMonitoring: boolean;
}

export class ConversationalInterface {
  private sttService: WebSpeechSTTService;
  private ttsService: GeminiTTSService;
  private personalityEngine: ExpertPersonalityEngine;
  private currentSession: ConversationSession | null = null;
  private config: ConversationConfig;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private conversationBuffer: string[] = [];
  private pauseTimeout: NodeJS.Timeout | null = null;
  private qualityMetrics: ConversationMetrics;

  constructor() {
    this.sttService = new WebSpeechSTTService();
    this.ttsService = new GeminiTTSService();
    this.personalityEngine = new ExpertPersonalityEngine();
    
    this.config = {
      enableAutoResponse: true,
      pauseDetectionMs: 2000,
      maxSilenceDuration: 10000,
      interruptionHandling: 'polite',
      qualityMonitoring: true
    };

    this.qualityMetrics = {
      speechClarity: 0.8,
      emotionalTone: 'neutral',
      participationLevel: 'medium',
      conversationFlow: 'smooth'
    };

    this.initializeEventHandlers();
  }

  private initializeEventHandlers(): void {
    this.sttService.onSpeechRecognized = (text: string) => {
      this.handleUserSpeech(text);
    };

    this.sttService.onSpeechStart = () => {
      this.handleSpeechStart();
    };

    this.sttService.onSpeechEnd = () => {
      this.handleSpeechEnd();
    };

    this.ttsService.onSpeechStart = () => {
      this.isSpeaking = true;
    };

    this.ttsService.onSpeechEnd = () => {
      this.isSpeaking = false;
      this.resumeListening();
    };
  }

  public async startConversationSession(
    sessionId: string,
    expertId: string,
    customConfig?: Partial<ConversationConfig>
  ): Promise<ConversationSession> {
    if (this.currentSession?.isActive) {
      await this.endConversationSession();
    }

    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    const expertProfile = await this.personalityEngine.getExpertProfile(expertId);
    
    this.currentSession = {
      sessionId,
      expertId,
      isActive: true,
      startTime: new Date(),
      lastActivity: new Date(),
      metrics: { ...this.qualityMetrics },
      audioSettings: {
        voiceType: expertProfile.voiceSettings.voice as 'umbriel' | 'aoede' | 'despina',
        speed: expertProfile.voiceSettings.speed,
        pitch: expertProfile.voiceSettings.pitch,
        volume: 0.8
      }
    };

    await this.initializeAudioServices();
    this.startListening();
    
    return this.currentSession;
  }

  private async initializeAudioServices(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await this.sttService.initialize();
      await this.ttsService.initialize();
      
      this.ttsService.setVoiceSettings({
        voice: this.currentSession.audioSettings.voiceType,
        speed: this.currentSession.audioSettings.speed,
        pitch: this.currentSession.audioSettings.pitch
      });
    } catch (error) {
      console.error('Erreur initialisation services audio:', error);
      throw error;
    }
  }

  public async speakExpertResponse(message: string): Promise<void> {
    if (!this.currentSession?.isActive || this.isSpeaking) return;

    try {
      this.pauseListening();
      
      const personalizedMessage = await this.personalityEngine.adaptMessage(
        message,
        this.currentSession.expertId
      );

      await this.ttsService.speak(personalizedMessage);
      this.updateConversationMetrics('expert_response', personalizedMessage);
      
    } catch (error) {
      console.error('Erreur synthèse vocale expert:', error);
      this.resumeListening();
    }
  }

  private handleUserSpeech(text: string): void {
    if (!this.currentSession?.isActive) return;

    this.conversationBuffer.push(`USER: ${text}`);
    this.currentSession.lastActivity = new Date();
    
    this.updateConversationMetrics('user_input', text);
    
    if (this.config.enableAutoResponse) {
      this.scheduleResponseCheck();
    }

    this.onUserSpeechRecognized?.(text);
  }

  private handleSpeechStart(): void {
    if (this.isSpeaking && this.config.interruptionHandling === 'immediate') {
      this.ttsService.stop();
    }
    
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
  }

  private handleSpeechEnd(): void {
    this.scheduleResponseCheck();
  }

  private scheduleResponseCheck(): void {
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
    }

    this.pauseTimeout = setTimeout(() => {
      if (!this.isSpeaking && this.currentSession?.isActive) {
        this.onConversationPause?.();
      }
    }, this.config.pauseDetectionMs);
  }

  private updateConversationMetrics(type: 'user_input' | 'expert_response', content: string): void {
    if (!this.config.qualityMonitoring || !this.currentSession) return;

    const wordCount = content.split(' ').length;
    const hasEmotionalWords = /\b(anxieux|calme|stress|détend|inquiet|confiant)\b/i.test(content);
    
    if (type === 'user_input') {
      this.currentSession.metrics.participationLevel = 
        wordCount > 10 ? 'high' : wordCount > 3 ? 'medium' : 'low';
      
      this.currentSession.metrics.emotionalTone = hasEmotionalWords 
        ? (content.includes('anxieux') || content.includes('stress') ? 'anxious' : 'engaged')
        : 'neutral';
    }

    this.currentSession.metrics.conversationFlow = 
      this.conversationBuffer.length > 5 ? 'smooth' : 'hesitant';
  }

  private startListening(): void {
    if (!this.isListening && this.currentSession?.isActive) {
      this.sttService.startListening();
      this.isListening = true;
    }
  }

  private pauseListening(): void {
    if (this.isListening) {
      this.sttService.stopListening();
      this.isListening = false;
    }
  }

  private resumeListening(): void {
    setTimeout(() => {
      this.startListening();
    }, 500);
  }

  public async endConversationSession(): Promise<ConversationMetrics | null> {
    if (!this.currentSession) return null;

    const finalMetrics = { ...this.currentSession.metrics };
    
    this.pauseListening();
    this.ttsService.stop();
    
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
    }

    this.currentSession.isActive = false;
    this.currentSession = null;
    this.conversationBuffer = [];
    
    return finalMetrics;
  }

  public getCurrentSession(): ConversationSession | null {
    return this.currentSession;
  }

  public getConversationMetrics(): ConversationMetrics | null {
    return this.currentSession?.metrics || null;
  }

  public updateAudioSettings(settings: Partial<ConversationSession['audioSettings']>): void {
    if (this.currentSession) {
      this.currentSession.audioSettings = {
        ...this.currentSession.audioSettings,
        ...settings
      };
      
      this.ttsService.setVoiceSettings({
        voice: this.currentSession.audioSettings.voiceType,
        speed: this.currentSession.audioSettings.speed,
        pitch: this.currentSession.audioSettings.pitch
      });
    }
  }

  public onUserSpeechRecognized?: (text: string) => void;
  public onConversationPause?: () => void;
  public onSessionQualityUpdate?: (metrics: ConversationMetrics) => void;
}