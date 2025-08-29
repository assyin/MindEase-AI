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

export class GeminiTTSService {
  private static instance: GeminiTTSService;
  private genAI: GoogleGenAI | null = null;
  private audioCache: Map<string, CachedAudio> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached audio files

  static getInstance(): GeminiTTSService {
    if (!GeminiTTSService.instance) {
      GeminiTTSService.instance = new GeminiTTSService();
    }
    return GeminiTTSService.instance;
  }

  constructor() {
    this.initializeGeminiAI();
    this.startCacheCleanup();
  }

  private initializeGeminiAI(): void {
    try {
      // Utiliser le client centralisé comme les autres services
      this.genAI = GoogleGenAIClient.getInstance();
      console.log('✅ GeminiTTSService initialized with centralized client');
    } catch (error) {
      console.error('❌ Failed to initialize GeminiTTSService:', error);
      console.warn('⚠️ GeminiTTSService will fallback to Web Speech API');
    }
  }

  // Main TTS generation method
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    if (!this.genAI) {
      throw new Error('Google Generative AI not initialized. Check your API key.');
    }

    const cacheKey = this.generateCacheKey(request.text, request.voiceConfig, request.avatarId);
    
    // Check cache first
    const cachedAudio = this.getCachedAudio(cacheKey);
    if (cachedAudio) {
      console.log('🎵 Using cached audio for avatar:', request.avatarId);
      return {
        audioUrl: cachedAudio.audioUrl,
        audioDuration: cachedAudio.audioDuration,
        audioBlob: cachedAudio.audioBlob,
        cacheKey
      };
    }

    try {
      console.log('🎙️ Generating new speech with Gemini TTS for avatar:', request.avatarId);
      
      // Process text for optimal TTS
      const processedText = this.preprocessTextForTTS(request.text, request.voiceConfig);
      
      // Use Gemini 2.5 Pro Preview for TTS generation
      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro-preview-tts",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        }
      });

      // Create TTS request with voice configuration
      const ttsPayload = {
        input: { text: processedText },
        voice: {
          languageCode: request.voiceConfig.language_code,
          name: request.voiceConfig.voice_id,
          ssmlGender: this.inferGenderFromVoiceId(request.voiceConfig.voice_id)
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: request.voiceConfig.speaking_rate,
          pitch: request.voiceConfig.pitch,
          volumeGainDb: request.voiceConfig.volume_gain_db,
          effectsProfileId: [this.getAudioProfile(request.voiceConfig.emotional_tone)]
        }
      };

      // Note: Gemini 2.5 Pro Preview TTS is still in development
      // This is a conceptual implementation - actual API may differ
      const response = await this.callGeminiTTS(ttsPayload);
      
      if (!response || !response.audioContent) {
        throw new Error('No audio content received from Gemini TTS');
      }

      // Convert base64 audio to blob
      const audioBlob = this.base64ToBlob(response.audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioDuration = await this.getAudioDuration(audioBlob);

      const ttsResponse: TTSResponse = {
        audioUrl,
        audioDuration,
        audioBlob,
        cacheKey
      };

      // Cache the result
      this.cacheAudio(cacheKey, ttsResponse);

      console.log(`✅ Speech generated successfully for avatar ${request.avatarId} (${audioDuration}s)`);
      return ttsResponse;

    } catch (error) {
      console.error('❌ Gemini TTS generation failed:', error);
      
      // Fallback to browser TTS
      return await this.fallbackToWebSpeechAPI(request);
    }
  }

  // Conceptual Gemini TTS API call (actual implementation may vary)
  private async callGeminiTTS(payload: any): Promise<any> {
    // This is a conceptual implementation
    // The actual Gemini 2.5 Pro Preview TTS API may have different endpoints and parameters
    // Note: This service should be replaced by GoogleGenAITTSServiceV2 for production use
    
    const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Google GenAI API key not configured');
    }
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:synthesizeSpeech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini TTS API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Text preprocessing for better TTS output
  private preprocessTextForTTS(text: string, voiceConfig: VoiceConfig): string {
    let processedText = text;

    // Add emphasis to specific words
    if (voiceConfig.emphasis_words && voiceConfig.emphasis_words.length > 0) {
      voiceConfig.emphasis_words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        processedText = processedText.replace(regex, `<emphasis level="strong">${word}</emphasis>`);
      });
    }

    // Add pauses based on emotional tone
    switch (voiceConfig.emotional_tone) {
      case 'calming':
        processedText = processedText.replace(/\./g, '.<break time="1s"/>');
        processedText = processedText.replace(/\,/g, ',<break time="500ms"/>');
        break;
      case 'empathetic':
        processedText = processedText.replace(/\./g, '.<break time="800ms"/>');
        break;
      case 'energetic':
        processedText = processedText.replace(/!/g, '<prosody rate="fast" pitch="+5st">!</prosody>');
        break;
    }

    // Add breathing pauses for meditation guide
    if (voiceConfig.emotional_tone === 'calming') {
      processedText = processedText.replace(/respir/gi, '<break time="500ms"/>respir');
      processedText = processedText.replace(/détend/gi, '<break time="300ms"/>détend');
    }

    return `<speak>${processedText}</speak>`;
  }

  // Fallback to Web Speech API
  private async fallbackToWebSpeechAPI(request: TTSRequest): Promise<TTSResponse> {
    console.log('🔄 Falling back to Web Speech API for avatar:', request.avatarId);

    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(request.text);
      
      // Configure voice based on avatar
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => 
        v.lang.startsWith(request.voiceConfig.language_code.split('-')[0]) &&
        v.name.toLowerCase().includes('female')
      );
      
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = request.voiceConfig.speaking_rate;
      utterance.pitch = Math.max(0, Math.min(2, 1 + (request.voiceConfig.pitch / 20)));
      utterance.volume = Math.max(0, Math.min(1, 0.8 + (request.voiceConfig.volume_gain_db / 20)));

      // Create audio recording for caching
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(destination.stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioDuration = await this.getAudioDuration(audioBlob);
        const cacheKey = this.generateCacheKey(request.text, request.voiceConfig, request.avatarId);

        const response: TTSResponse = {
          audioUrl,
          audioDuration,
          audioBlob,
          cacheKey
        };

        this.cacheAudio(cacheKey, response);
        resolve(response);
      };

      utterance.onstart = () => {
        mediaRecorder.start();
      };

      utterance.onend = () => {
        mediaRecorder.stop();
      };

      utterance.onerror = (error) => {
        console.error('Web Speech API error:', error);
        reject(new Error('Speech synthesis failed'));
      };

      speechSynthesis.speak(utterance);
    });
  }

  // Utility methods
  private generateCacheKey(text: string, voiceConfig: VoiceConfig, avatarId: string): string {
    const hash = btoa(
      text + 
      voiceConfig.voice_id + 
      voiceConfig.speaking_rate + 
      voiceConfig.pitch + 
      avatarId
    ).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    
    return `tts_${avatarId}_${hash}`;
  }

  private getCachedAudio(cacheKey: string): CachedAudio | null {
    const cached = this.audioCache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (new Date() > new Date(cached.expiresAt)) {
      this.audioCache.delete(cacheKey);
      URL.revokeObjectURL(cached.audioUrl);
      return null;
    }

    return cached;
  }

  private cacheAudio(cacheKey: string, response: TTSResponse): void {
    // Remove oldest entries if cache is full
    if (this.audioCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.audioCache.keys().next().value;
      const oldest = this.audioCache.get(oldestKey);
      if (oldest) {
        URL.revokeObjectURL(oldest.audioUrl);
        this.audioCache.delete(oldestKey);
      }
    }

    const cachedAudio: CachedAudio = {
      audioUrl: response.audioUrl,
      audioDuration: response.audioDuration,
      audioBlob: response.audioBlob,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.CACHE_DURATION).toISOString()
    };

    this.audioCache.set(cacheKey, cachedAudio);
  }

  private async getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration || 0);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
      
      audio.src = url;
    });
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private inferGenderFromVoiceId(voiceId: string): string {
    // Simple inference based on common voice naming patterns
    const femaleNames = ['eloise', 'denise', 'luna', 'elena'];
    const maleNames = ['henri', 'claude', 'max', 'alex'];
    
    const lowerVoiceId = voiceId.toLowerCase();
    
    if (femaleNames.some(name => lowerVoiceId.includes(name))) {
      return 'FEMALE';
    }
    if (maleNames.some(name => lowerVoiceId.includes(name))) {
      return 'MALE';
    }
    
    return 'NEUTRAL';
  }

  private getAudioProfile(emotionalTone: string): string {
    switch (emotionalTone) {
      case 'empathetic':
        return 'telephony-class-application';
      case 'energetic':
        return 'wearable-class-device';
      case 'calming':
        return 'headphone-class-device';
      case 'analytical':
        return 'small-bluetooth-speaker-class-device';
      default:
        return 'headphone-class-device';
    }
  }

  // Cache management
  private startCacheCleanup(): void {
    // Clean up expired cache entries every hour
    setInterval(() => {
      const now = new Date();
      const expiredKeys: string[] = [];

      this.audioCache.forEach((cached, key) => {
        if (now > new Date(cached.expiresAt)) {
          expiredKeys.push(key);
          URL.revokeObjectURL(cached.audioUrl);
        }
      });

      expiredKeys.forEach(key => this.audioCache.delete(key));
      
      if (expiredKeys.length > 0) {
        console.log(`🧹 Cleaned up ${expiredKeys.length} expired audio cache entries`);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  // Public methods for cache management
  clearCache(): void {
    this.audioCache.forEach((cached) => {
      URL.revokeObjectURL(cached.audioUrl);
    });
    this.audioCache.clear();
    console.log('🧹 Audio cache cleared');
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.audioCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  // Avatar-specific TTS methods
  async generateAvatarSpeech(avatar: Avatar, text: string, conversationId: string): Promise<TTSResponse> {
    return this.generateSpeech({
      text,
      voiceConfig: avatar.voice_config,
      avatarId: avatar.id,
      conversationId
    });
  }

  // Multi-avatar dialogue support
  async generateDialogue(avatars: Avatar[], dialogueScript: Array<{avatarId: string, text: string}>, conversationId: string): Promise<TTSResponse[]> {
    const responses: TTSResponse[] = [];
    
    for (const turn of dialogueScript) {
      const avatar = avatars.find(a => a.id === turn.avatarId);
      if (!avatar) {
        console.error(`Avatar ${turn.avatarId} not found for dialogue`);
        continue;
      }

      const response = await this.generateAvatarSpeech(avatar, turn.text, conversationId);
      responses.push(response);
    }

    return responses;
  }

  // Error handling and diagnostics
  async testTTSConnection(): Promise<boolean> {
    if (!this.genAI) {
      return false;
    }

    try {
      // Test with a simple phrase
      const testRequest: TTSRequest = {
        text: 'Test de connexion TTS',
        voiceConfig: {
          voice_id: 'fr-FR-DeniseNeural',
          language_code: 'fr-FR',
          speaking_rate: 1.0,
          pitch: 0.0,
          volume_gain_db: 0.0,
          emotional_tone: 'empathetic',
          pause_duration: 500,
          emphasis_words: []
        },
        avatarId: 'test',
        conversationId: 'test'
      };

      await this.generateSpeech(testRequest);
      return true;
    } catch (error) {
      console.error('TTS connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const geminiTTSService = GeminiTTSService.getInstance();