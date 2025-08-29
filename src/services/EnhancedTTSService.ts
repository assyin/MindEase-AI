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

interface VoiceMapping {
  name: string;
  gender: 'male' | 'female';
  lang: string;
  rate: number;
  pitch: number;
  voiceIndex?: number;
}

export class EnhancedTTSService {
  private static instance: EnhancedTTSService;
  private audioCache: Map<string, CachedAudio> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 100;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;

  // Mapping d'avatars vers des configurations vocales spécifiques
  private readonly AVATAR_VOICE_MAPPING: Record<string, VoiceMapping> = {
    'therapist-main': {
      name: 'Google français',
      gender: 'female',
      lang: 'fr-FR',
      rate: 0.9,
      pitch: 0.2
    },
    'coach-motivation': {
      name: 'Microsoft Hortense',
      gender: 'male',
      lang: 'fr-FR', 
      rate: 1.1,
      pitch: 0.8
    },
    'guide-meditation': {
      name: 'Google français',
      gender: 'female',
      lang: 'fr-FR',
      rate: 0.7,
      pitch: -0.3
    },
    'analyst-behavioral': {
      name: 'Microsoft Paul',
      gender: 'male',
      lang: 'fr-FR',
      rate: 0.95,
      pitch: 0.1
    }
  };

  static getInstance(): EnhancedTTSService {
    if (!EnhancedTTSService.instance) {
      EnhancedTTSService.instance = new EnhancedTTSService();
    }
    return EnhancedTTSService.instance;
  }

  constructor() {
    this.initializeVoices();
    this.startCacheCleanup();
  }

  private async initializeVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.availableVoices = speechSynthesis.getVoices();
        
        if (this.availableVoices.length > 0) {
          this.voicesLoaded = true;
          console.log('🎵 Available voices loaded:', this.availableVoices.length);
          console.log('📋 French voices:', this.availableVoices.filter(v => v.lang.includes('fr')));
          this.mapVoicesToAvatars();
          resolve();
        } else {
          // Retry in case voices aren't loaded yet
          setTimeout(loadVoices, 100);
        }
      };

      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      loadVoices();
    });
  }

  private mapVoicesToAvatars(): void {
    for (const [avatarId, mapping] of Object.entries(this.AVATAR_VOICE_MAPPING)) {
      // Find the best matching voice
      const preferredVoice = this.availableVoices.find(voice => 
        voice.name.includes(mapping.name.split(' ')[0]) && 
        voice.lang === mapping.lang
      );

      if (preferredVoice) {
        mapping.voiceIndex = this.availableVoices.indexOf(preferredVoice);
        console.log(`🎭 Avatar ${avatarId} mapped to voice:`, preferredVoice.name);
      } else {
        // Fallback to any French voice
        const fallbackVoice = this.availableVoices.find(voice => voice.lang.includes('fr'));
        if (fallbackVoice) {
          mapping.voiceIndex = this.availableVoices.indexOf(fallbackVoice);
          console.log(`🎭 Avatar ${avatarId} using fallback voice:`, fallbackVoice.name);
        }
      }
    }
  }

  // Main method for generating avatar speech
  async generateAvatarSpeech(
    avatar: Avatar,
    text: string,
    conversationId: string
  ): Promise<TTSResponse> {
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
    
    // Check cache first
    const cachedAudio = this.getCachedAudio(cacheKey);
    if (cachedAudio) {
      console.log('🎯 Using cached audio for avatar:', request.avatarId);
      return {
        audioUrl: cachedAudio.audioUrl,
        audioDuration: cachedAudio.audioDuration,
        audioBlob: cachedAudio.audioBlob,
        cacheKey
      };
    }

    if (!this.voicesLoaded) {
      await this.initializeVoices();
    }

    try {
      console.log('🎙️ Generating enhanced speech for avatar:', request.avatarId);
      
      const ttsResponse = await this.synthesizeWithEnhancedWebSpeech(request);
      
      // Cache the response
      this.cacheAudio(cacheKey, ttsResponse);

      console.log('✅ Avatar speech generation successful:', request.avatarId);
      return ttsResponse;

    } catch (error) {
      console.error('❌ Enhanced speech synthesis failed:', error);
      throw error;
    }
  }

  private async synthesizeWithEnhancedWebSpeech(request: TTSRequest): Promise<TTSResponse> {
    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(request.text);
        
        // Apply avatar-specific voice configuration
        const voiceMapping = this.AVATAR_VOICE_MAPPING[request.avatarId];
        
        if (voiceMapping && voiceMapping.voiceIndex !== undefined) {
          utterance.voice = this.availableVoices[voiceMapping.voiceIndex];
          utterance.rate = voiceMapping.rate * (request.voiceConfig.speaking_rate || 1);
          utterance.pitch = Math.max(0, Math.min(2, 1 + voiceMapping.pitch + (request.voiceConfig.pitch || 0)));
        } else {
          // Fallback configuration
          utterance.lang = request.voiceConfig.language_code || 'fr-FR';
          utterance.rate = request.voiceConfig.speaking_rate || 1;
          utterance.pitch = Math.max(0, Math.min(2, 1 + (request.voiceConfig.pitch || 0)));
        }

        utterance.volume = Math.max(0, Math.min(1, request.voiceConfig.volume_gain_db ? 
          0.5 + (request.voiceConfig.volume_gain_db / 10) : 0.8));

        console.log(`🎵 Using voice config for ${request.avatarId}:`, {
          voice: utterance.voice?.name,
          rate: utterance.rate,
          pitch: utterance.pitch,
          volume: utterance.volume
        });

        // Create audio recording setup
        this.captureAudioFromSpeech(utterance, request.avatarId)
          .then(resolve)
          .catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  private async captureAudioFromSpeech(
    utterance: SpeechSynthesisUtterance,
    avatarId: string
  ): Promise<TTSResponse> {
    return new Promise((resolve, reject) => {
      // For Web Speech API, we'll directly play the speech and return a simple response
      
      utterance.onstart = () => {
        console.log(`🎤 Started speaking for avatar: ${avatarId}`);
      };

      utterance.onend = () => {
        console.log(`✅ Finished speaking for avatar: ${avatarId}`);
        
        // Create a simple audio blob representation for caching purposes
        const estimatedDuration = this.estimateTextDuration(utterance.text, utterance.rate);
        
        // Create a minimal audio blob for consistency (though Web Speech API doesn't generate files)
        const audioBlob = new Blob([utterance.text], { type: 'text/plain' });
        const audioUrl = `speech-synthesis://${avatarId}-${Date.now()}`;
        
        resolve({
          audioUrl,
          audioDuration: estimatedDuration,
          audioBlob,
          cacheKey: `${avatarId}-${Date.now()}`
        });
      };

      utterance.onerror = (error) => {
        console.error(`❌ Speech synthesis error for avatar ${avatarId}:`, error);
        reject(error);
      };

      // Speak the text directly - no need for audio file creation
      speechSynthesis.speak(utterance);
    });
  }

  private estimateTextDuration(text: string, rate: number): number {
    // Rough estimation: average speaking speed is ~150 words per minute
    const words = text.split(' ').length;
    const baseWPM = 150;
    const adjustedWPM = baseWPM * rate;
    return Math.round((words / adjustedWPM) * 60 * 1000); // milliseconds
  }

  // Enhanced text preprocessing with SSML-like formatting
  private preprocessTextForTTS(text: string, voiceConfig: VoiceConfig): string {
    let processedText = text;

    // Remove markdown formatting
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '$1');
    processedText = processedText.replace(/\*(.*?)\*/g, '$1');
    processedText = processedText.replace(/`(.*?)`/g, '$1');

    // Add pauses for better rhythm based on emotional tone
    if (voiceConfig.emotional_tone === 'calming') {
      processedText = processedText.replace(/\./g, '... ');
      processedText = processedText.replace(/,/g, ', ');
    } else if (voiceConfig.emotional_tone === 'energetic') {
      processedText = processedText.replace(/!/g, '! ');
    }

    // Clean up extra spaces
    processedText = processedText.replace(/\s+/g, ' ').trim();

    return processedText;
  }

  // Cache management methods
  private generateCacheKey(text: string, voiceConfig: VoiceConfig, avatarId: string): string {
    const configHash = JSON.stringify({
      speaking_rate: voiceConfig.speaking_rate,
      pitch: voiceConfig.pitch,
      emotional_tone: voiceConfig.emotional_tone,
      volume_gain_db: voiceConfig.volume_gain_db
    });
    
    // Fix pour les caractères arabes - utiliser base64 Unicode-safe
    try {
      const safeString = `${avatarId}-${text.substring(0, 50)}-${configHash}`;
      return btoa(unescape(encodeURIComponent(safeString)));
    } catch (error) {
      // Fallback si btoa échoue encore - utiliser un hash simple
      console.warn('Fallback vers hash simple pour caractères arabes');
      return `cache_${avatarId}_${configHash}_${text.length}`;
    }
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
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  // Get available voices for debugging
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  // Get avatar voice mapping for debugging
  getAvatarVoiceMapping(): Record<string, VoiceMapping> {
    return this.AVATAR_VOICE_MAPPING;
  }
}

// Export singleton instance
export const enhancedTTSService = EnhancedTTSService.getInstance();