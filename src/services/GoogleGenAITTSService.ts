import { GoogleGenAI } from '@google/genai';
import GoogleGenAIClient from './GoogleGenAIClient';
import { Avatar, VoiceConfig, AvatarInteraction } from '../types';

interface TTSRequest {
  text: string;
  voiceConfig: VoiceConfig;
  avatarId: string;
  conversationId: string;
}

interface TTSResponse {
  audioUrl: string;
  audioDuration: number;
  audioBlob: Blob;
  cacheKey: string;
}

interface CachedAudio {
  audioUrl: string;
  audioDuration: number;
  audioBlob: Blob;
  createdAt: string;
  expiresAt: string;
}

interface GoogleVoiceConfig {
  voiceId: string;
  languageCode: string;
  speakingRate: number;
  pitch: number;
  volumeGainDb: number;
  audioEncoding: string;
}

export class GoogleGenAITTSService {
  private static instance: GoogleGenAITTSService;
  private client: GoogleGenAI | null = null;
  private audioCache: Map<string, CachedAudio> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 100;

  // Mapping des avatars vers les voix Google AI Studio
  private readonly AVATAR_GOOGLE_VOICES: Record<string, GoogleVoiceConfig> = {
    'therapist-main': {
      voiceId: 'fr-FR-Journey-F', // Voix féminine française Journey
      languageCode: 'fr-FR',
      speakingRate: 0.9,
      pitch: 0.2,
      volumeGainDb: 2.0,
      audioEncoding: 'MP3'
    },
    'coach-motivation': {
      voiceId: 'fr-FR-Studio-M', // Voix masculine française Studio
      languageCode: 'fr-FR', 
      speakingRate: 1.1,
      pitch: 0.8,
      volumeGainDb: 3.0,
      audioEncoding: 'MP3'
    },
    'guide-meditation': {
      voiceId: 'fr-FR-Casual-F', // Voix féminine française Casual
      languageCode: 'fr-FR',
      speakingRate: 0.7,
      pitch: -0.3,
      volumeGainDb: 1.0,
      audioEncoding: 'MP3'
    },
    'analyst-behavioral': {
      voiceId: 'fr-FR-Neural2-B', // Voix masculine française Neural2-B
      languageCode: 'fr-FR',
      speakingRate: 0.95,
      pitch: 0.1,
      volumeGainDb: 2.5,
      audioEncoding: 'MP3'
    }
  };

  static getInstance(): GoogleGenAITTSService {
    if (!GoogleGenAITTSService.instance) {
      GoogleGenAITTSService.instance = new GoogleGenAITTSService();
    }
    return GoogleGenAITTSService.instance;
  }

  constructor() {
    this.initializeGoogleGenAI();
    this.startCacheCleanup();
  }

  private initializeGoogleGenAI(): void {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Google AI API Key not found. Please set VITE_GOOGLE_AI_API_KEY in your environment variables.');
      return;
    }

    try {
      // Utiliser le client centralisé au lieu de créer une nouvelle instance
      this.client = GoogleGenAIClient.getInstance();
      
      console.log('✅ Google GenAI TTS Service initialized with centralized client');
    } catch (error) {
      console.error('❌ Failed to initialize Google GenAI TTS Service:', error);
    }
  }

  // Méthode principale pour générer la parole d'avatar avec Google AI Studio TTS
  async generateAvatarSpeech(
    avatar: Avatar,
    text: string,
    conversationId: string
  ): Promise<TTSResponse> {
    if (!this.client) {
      throw new Error('Google GenAI client not initialized. Check your API key.');
    }

    const request: TTSRequest = {
      text,
      voiceConfig: avatar.voice_config,
      avatarId: avatar.id,
      conversationId
    };

    return this.generateSpeech(request);
  }

  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    const cacheKey = this.generateCacheKey(request.text, request.voiceConfig, request.avatarId);
    
    // Vérifier le cache d'abord
    const cachedAudio = this.getCachedAudio(cacheKey);
    if (cachedAudio) {
      console.log('🎯 Using cached Google AI audio for avatar:', request.avatarId);
      return {
        audioUrl: cachedAudio.audioUrl,
        audioDuration: cachedAudio.audioDuration,
        audioBlob: cachedAudio.audioBlob,
        cacheKey
      };
    }

    if (!this.client) {
      throw new Error('Google GenAI client not initialized');
    }

    try {
      console.log('🎙️ Generating Google AI TTS for avatar:', request.avatarId);
      
      // Configuration de la voix Google pour l'avatar spécifique
      const voiceConfig = this.AVATAR_GOOGLE_VOICES[request.avatarId];
      if (!voiceConfig) {
        throw new Error(`No Google voice configuration found for avatar: ${request.avatarId}`);
      }

      // Préparer le texte avec instructions de style pour l'avatar
      const enhancedText = this.enhanceTextForAvatar(request.text, request.avatarId);

      // Générer le contenu avec TTS en utilisant Gemini 2.5 Pro
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts", // Modèle TTS rapide et économique
        contents: [{
          role: 'user',
          parts: [{
            text: enhancedText
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          // Configuration TTS spécialisée
          audioConfig: {
            audioEncoding: voiceConfig.audioEncoding,
            speakingRate: voiceConfig.speakingRate,
            pitch: voiceConfig.pitch,
            volumeGainDb: voiceConfig.volumeGainDb,
            sampleRateHertz: 22050
          },
          voice: {
            languageCode: voiceConfig.languageCode,
            name: voiceConfig.voiceId,
            ssmlGender: this.inferGenderFromVoiceId(voiceConfig.voiceId)
          }
        },
        tools: [{
          // Outil TTS natif de Google AI Studio
          textToSpeech: {
            voice: {
              languageCode: voiceConfig.languageCode,
              name: voiceConfig.voiceId
            },
            audioConfig: {
              audioEncoding: voiceConfig.audioEncoding,
              speakingRate: voiceConfig.speakingRate,
              pitch: voiceConfig.pitch,
              volumeGainDb: voiceConfig.volumeGainDb
            }
          }
        }]
      });

      // Traiter la réponse audio de Google AI Studio
      const audioData = await this.processGoogleAIAudio(response);
      
      if (!audioData) {
        throw new Error('No audio data received from Google AI Studio TTS');
      }

      // Créer l'objet de réponse
      const ttsResponse: TTSResponse = {
        audioUrl: audioData.audioUrl,
        audioDuration: audioData.duration,
        audioBlob: audioData.blob,
        cacheKey
      };

      // Mettre en cache la réponse
      this.cacheAudio(cacheKey, ttsResponse);

      console.log('✅ Google AI Studio TTS generation successful for avatar:', request.avatarId);
      return ttsResponse;

    } catch (error) {
      console.error('❌ Google AI Studio TTS failed for avatar:', request.avatarId, error);
      throw new Error(`Google AI Studio TTS generation failed: ${error.message}`);
    }
  }

  private async processGoogleAIAudio(response: any): Promise<{audioUrl: string, duration: number, blob: Blob} | null> {
    try {
      // Traitement spécifique pour l'audio de Google AI Studio
      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];
        
        // Vérifier si l'audio est dans les outils de réponse
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.audioData || part.audio) {
              const audioBase64 = part.audioData || part.audio;
              
              // Convertir base64 en blob
              const audioBlob = this.base64ToBlob(audioBase64, 'audio/mp3');
              const audioUrl = URL.createObjectURL(audioBlob);
              const duration = await this.getAudioDuration(audioBlob);
              
              return { audioUrl, duration, blob: audioBlob };
            }
          }
        }
        
        // Vérifier si l'audio est dans une réponse TTS dédiée
        if (candidate.audioContent) {
          const audioBlob = this.base64ToBlob(candidate.audioContent, 'audio/mp3');
          const audioUrl = URL.createObjectURL(audioBlob);
          const duration = await this.getAudioDuration(audioBlob);
          
          return { audioUrl, duration, blob: audioBlob };
        }
      }
      
      // Vérifier si l'audio est à la racine de la réponse (nouvelle API)
      if (response.audioContent) {
        const audioBlob = this.base64ToBlob(response.audioContent, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = await this.getAudioDuration(audioBlob);
        
        return { audioUrl, duration, blob: audioBlob };
      }
      
      return null;
    } catch (error) {
      console.error('Error processing Google AI audio:', error);
      return null;
    }
  }

  private enhanceTextForAvatar(text: string, avatarId: string): string {
    // Améliorer le texte avec des instructions spécialisées pour chaque avatar
    const avatarInstructions = {
      'therapist-main': 'Parlez avec une voix douce, empathique et professionnelle, comme une thérapeute expérimentée qui écoute avec attention.',
      'coach-motivation': 'Parlez avec enthousiasme et énergie, comme un coach motivational qui inspire et encourage à l\'action.',
      'guide-meditation': 'Parlez très lentement et calmement, avec une voix apaisante comme un guide de méditation expérimenté.',
      'analyst-behavioral': 'Parlez de manière posée et analytique, comme un expert qui analyse objectivement les comportements.'
    };

    const instruction = avatarInstructions[avatarId] || '';
    
    return `${instruction}

Voici le message à dire : "${text}"

Adaptez votre intonation, rythme et style vocal selon votre spécialisation thérapeutique.`;
  }

  private inferGenderFromVoiceId(voiceId: string): 'MALE' | 'FEMALE' | 'NEUTRAL' {
    if (voiceId.includes('-F') || voiceId.includes('Female') || voiceId.includes('Journey')) {
      return 'FEMALE';
    } else if (voiceId.includes('-M') || voiceId.includes('Male') || voiceId.includes('Studio')) {
      return 'MALE';
    }
    return 'NEUTRAL';
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    // Supprimer le préfixe data URL s'il existe
    const base64Data = base64.replace(/^data:[^,]+,/, '');
    
    // Décoder le base64
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: mimeType });
  }

  private async getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration * 1000); // Retourner en millisecondes
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        // Estimation si impossible de charger
        const estimatedDuration = Math.max(2000, blob.size / 1000); // ~1ms par byte
        resolve(estimatedDuration);
      };
      
      audio.src = url;
    });
  }

  // Gestion du cache
  private generateCacheKey(text: string, voiceConfig: VoiceConfig, avatarId: string): string {
    const configHash = JSON.stringify({
      speaking_rate: voiceConfig.speaking_rate,
      pitch: voiceConfig.pitch,
      emotional_tone: voiceConfig.emotional_tone,
      volume_gain_db: voiceConfig.volume_gain_db
    });
    
    return btoa(`google-ai-${avatarId}-${text.substring(0, 50)}-${configHash}`).replace(/[^a-zA-Z0-9]/g, '');
  }

  private getCachedAudio(cacheKey: string): CachedAudio | null {
    const cached = this.audioCache.get(cacheKey);
    if (cached && new Date(cached.expiresAt) > new Date()) {
      return cached;
    }
    
    if (cached) {
      this.audioCache.delete(cacheKey);
      URL.revokeObjectURL(cached.audioUrl);
    }
    
    return null;
  }

  private cacheAudio(cacheKey: string, response: TTSResponse): void {
    if (this.audioCache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupOldestCache();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION);

    this.audioCache.set(cacheKey, {
      audioUrl: response.audioUrl,
      audioDuration: response.audioDuration,
      audioBlob: response.audioBlob,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    });
  }

  private cleanupOldestCache(): void {
    if (this.audioCache.size === 0) return;

    let oldestKey = '';
    let oldestTime = new Date();

    for (const [key, cached] of this.audioCache.entries()) {
      const createdAt = new Date(cached.createdAt);
      if (createdAt < oldestTime) {
        oldestTime = createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const cached = this.audioCache.get(oldestKey);
      if (cached) {
        URL.revokeObjectURL(cached.audioUrl);
      }
      this.audioCache.delete(oldestKey);
    }
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      for (const [key, cached] of this.audioCache.entries()) {
        if (new Date(cached.expiresAt) <= new Date()) {
          URL.revokeObjectURL(cached.audioUrl);
          this.audioCache.delete(key);
        }
      }
    }, 60 * 60 * 1000); // Nettoyage chaque heure
  }

  // Méthodes publiques pour debug et configuration
  getAvatarVoiceConfig(avatarId: string): GoogleVoiceConfig | null {
    return this.AVATAR_GOOGLE_VOICES[avatarId] || null;
  }

  getAllAvatarVoices(): Record<string, GoogleVoiceConfig> {
    return this.AVATAR_GOOGLE_VOICES;
  }

  // Test de connectivité avec Google AI Studio
  async testConnection(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      // Test simple avec un petit texte
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: 'Test connection' }] }]
      });
      
      return !!response;
    } catch (error) {
      console.error('Google AI Studio connection test failed:', error);
      return false;
    }
  }
}

// Export de l'instance singleton
export const googleGenAITTSService = GoogleGenAITTSService.getInstance();