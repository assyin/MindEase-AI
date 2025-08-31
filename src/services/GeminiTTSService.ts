import { GoogleGenerativeAI } from '@google/generative-ai';

// Interfaces simplifiées pour usage conversationnel
interface ConversationalTTSRequest {
  text: string;
  voiceId: string;
  language?: string;
  emotionalTone?: string;
  speakingRate?: number;
}

interface ConversationalTTSResponse {
  audioUrl: string;
  audioDuration: number;
  audioBlob: Blob;
  cacheKey: string;
}

// Interface pour compatibilité avec l'existant
interface TTSRequest {
  text: string;
  voiceConfig: any;
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

/**
 * SERVICE TTS GEMINI AMÉLIORÉ POUR CONVERSATIONS THÉRAPEUTIQUES
 * Synthèse vocale avec voix expertes spécialisées et cache intelligent
 */
export class GeminiTTSService {
  private static instance: GeminiTTSService;
  private genAI: GoogleGenerativeAI | null = null;
  private audioCache: Map<string, CachedAudio> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 100;

  // Configuration voix expertes thérapeutiques
  private readonly EXPERT_VOICES = {
    'dr_sarah_empathie': {
      gemini_voice_id: 'umbriel',
      language_code: 'fr-FR',
      emotional_tone: 'empathetic',
      speaking_rate: 1.0,
      pitch: 0.0,
      volume_gain_db: 2.0
    },
    'dr_alex_mindfulness': {
      gemini_voice_id: 'aoede',
      language_code: 'fr-FR',
      emotional_tone: 'calming',
      speaking_rate: 0.8,
      pitch: -2.0,
      volume_gain_db: 1.0
    },
    'dr_aicha_culturelle': {
      gemini_voice_id: 'despina',
      language_code: 'fr-FR',
      emotional_tone: 'warm',
      speaking_rate: 0.9,
      pitch: 1.0,
      volume_gain_db: 2.5
    }
  };

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
      const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ Google GenAI API key not found, falling back to Web Speech API');
        return;
      }
      
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ GeminiTTSService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize GeminiTTSService:', error);
      console.warn('⚠️ GeminiTTSService will fallback to Web Speech API');
    }
  }

  /**
   * GÉNÉRATION VOCALE SIMPLIFIÉE POUR CONVERSATIONS
   * Interface simple pour usage dans ConversationalTherapySession
   */
  async generateSpeech(text: string, voiceId: string = 'umbriel'): Promise<string | null> {
    try {
      // Configuration voix selon expert
      const expertConfig = this.EXPERT_VOICES[voiceId as keyof typeof this.EXPERT_VOICES] || 
                          this.EXPERT_VOICES['dr_sarah_empathie'];

      const request: ConversationalTTSRequest = {
        text,
        voiceId: expertConfig.gemini_voice_id,
        language: expertConfig.language_code,
        emotionalTone: expertConfig.emotional_tone,
        speakingRate: expertConfig.speaking_rate
      };

      const response = await this.generateConversationalSpeech(request);
      return response.audioUrl;

    } catch (error) {
      console.error('Erreur génération vocale simple:', error);
      return null;
    }
  }

  /**
   * GÉNÉRATION VOCALE CONVERSATIONNELLE AVANCÉE
   * Avec gestion cache et fallback Web Speech API
   */
  async generateConversationalSpeech(request: ConversationalTTSRequest): Promise<ConversationalTTSResponse> {
    const cacheKey = this.generateConversationalCacheKey(request);
    
    // Vérifier cache
    const cachedAudio = this.getCachedAudio(cacheKey);
    if (cachedAudio) {
      console.log('🎵 Audio récupéré du cache:', request.voiceId);
      return {
        audioUrl: cachedAudio.audioUrl,
        audioDuration: cachedAudio.audioDuration,
        audioBlob: cachedAudio.audioBlob,
        cacheKey
      };
    }

    // Essayer génération Gemini TTS
    if (this.genAI) {
      try {
        return await this.generateGeminiSpeech(request, cacheKey);
      } catch (error) {
        console.log('🔄 Gemini TTS échec, passage Web Speech API:', error.message);
      }
    }

    // Fallback Web Speech API
    return await this.generateWebSpeechAPI(request, cacheKey);
  }

  /**
   * GÉNÉRATION VOCALE GEMINI (EXPÉRIMENTAL)
   * Utilise l'API Gemini pour synthèse vocale de haute qualité
   */
  private async generateGeminiSpeech(request: ConversationalTTSRequest, cacheKey: string): Promise<ConversationalTTSResponse> {
    console.log('🎙️ Génération vocale Gemini TTS:', request.voiceId);
    
    try {
      // Prétraitement du texte pour optimiser la synthèse
      const processedText = this.preprocessTextForConversationalTTS(request.text, request.emotionalTone);
      
      // Note: L'API Gemini TTS est encore expérimentale
      // Cette implémentation est conceptuelle et peut nécessiter ajustements
      const ttsPayload = {
        input: { text: processedText },
        voice: {
          languageCode: request.language || 'fr-FR',
          name: request.voiceId,
          ssmlGender: this.inferGenderFromVoiceId(request.voiceId)
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: request.speakingRate || 1.0,
          pitch: 0.0,
          volumeGainDb: 2.0,
          effectsProfileId: [this.getAudioProfile(request.emotionalTone || 'empathetic')]
        }
      };

      // Appel API Gemini TTS (conceptuel)
      const response = await this.callGeminiTTS(ttsPayload);
      
      if (!response?.audioContent) {
        throw new Error('Pas de contenu audio reçu de Gemini TTS');
      }

      // Conversion base64 vers blob
      const audioBlob = this.base64ToBlob(response.audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioDuration = await this.getAudioDuration(audioBlob);

      const ttsResponse: ConversationalTTSResponse = {
        audioUrl,
        audioDuration,
        audioBlob,
        cacheKey
      };

      // Mise en cache
      this.cacheAudio(cacheKey, ttsResponse);

      console.log(`✅ Gemini TTS réussi (${audioDuration}s)`);
      return ttsResponse;

    } catch (error) {
      console.error('❌ Échec génération Gemini TTS:', error);
      throw error;
    }
  }

  /**
   * GÉNÉRATION VOCALE WEB SPEECH API (FALLBACK)
   * Solution de secours utilisant l'API native du navigateur
   */
  private async generateWebSpeechAPI(request: ConversationalTTSRequest, cacheKey: string): Promise<ConversationalTTSResponse> {
    console.log('🔊 Génération Web Speech API:', request.voiceId);

    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Synthèse vocale non supportée par le navigateur'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(request.text);
      
      // Sélection voix selon langue et préférences
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(request.language?.split('-')[0] || 'fr') &&
        (voice.name.toLowerCase().includes('google') || voice.name.toLowerCase().includes('microsoft'))
      ) || voices.find(voice => voice.lang.startsWith('fr'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('🎤 Voix sélectionnée:', preferredVoice.name);
      }

      // Configuration vocale
      utterance.rate = request.speakingRate || 1.0;
      utterance.pitch = this.adjustPitchForEmotion(request.emotionalTone || 'neutral');
      utterance.volume = 0.9;

      // Simulation enregistrement pour caching
      let audioChunks: Blob[] = [];

      // Fallback: générer URL blob directement sans enregistrement
      utterance.onstart = () => {
        console.log('🎵 Début synthèse vocale Web Speech API');
      };

      utterance.onend = () => {
        // Comme Web Speech API ne permet pas d'enregistrer facilement,
        // nous créons un blob vide pour la compatibilité cache
        const audioBlob = new Blob([''], { type: 'audio/wav' });
        const audioUrl = `data:audio/wav;base64,`; // URL fictive vide pour cache
        
        const response: ConversationalTTSResponse = {
          audioUrl: audioUrl,
          audioDuration: this.estimateDuration(request.text),
          audioBlob: audioBlob,
          cacheKey
        };

        // Note: Web Speech API joue directement, pas de cache réel
        console.log('✅ Web Speech API terminé');
        resolve(response);
      };

      utterance.onerror = (error) => {
        console.error('❌ Erreur Web Speech API:', error);
        reject(new Error('Échec synthèse vocale'));
      };

      // Lancement synthèse
      speechSynthesis.speak(utterance);
    });
  }

  // ========================================
  // MÉTHODES PRIVÉES - UTILITAIRES TTS
  // ========================================

  private generateConversationalCacheKey(request: ConversationalTTSRequest): string {
    const keyString = `${request.text}_${request.voiceId}_${request.speakingRate || 1.0}_${request.emotionalTone || 'neutral'}`;
    
    // Encodage sécurisé pour Unicode (alternative à btoa)
    try {
      // Convertir en Base64 de manière sécurisée pour Unicode
      const encoded = btoa(encodeURIComponent(keyString).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
      return `conv_tts_${encoded.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
    } catch (error) {
      // Fallback: utiliser un hash simple si l'encodage échoue
      console.warn('Fallback vers hash simple pour cache key:', error);
      const simpleHash = this.generateSimpleHash(keyString);
      return `conv_tts_${simpleHash}`;
    }
  }

  private generateSimpleHash(input: string): string {
    // Génère un hash simple et reproductible pour les clés de cache
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Conversion en entier 32-bit
    }
    // Convertir en string hexadécimal et limiter la longueur
    return Math.abs(hash).toString(36).substring(0, 16);
  }

  private preprocessTextForConversationalTTS(text: string, emotionalTone?: string): string {
    let processedText = text;

    // Ajustements selon ton émotionnel
    switch (emotionalTone) {
      case 'calming':
        processedText = processedText.replace(/\./g, '... ');
        processedText = processedText.replace(/,/g, ', ');
        break;
      case 'empathetic':
        processedText = processedText.replace(/\?/g, ' ? ');
        break;
      case 'warm':
        processedText = processedText.replace(/!/g, ' ! ');
        break;
    }

    // Nettoyer caractères problématiques
    processedText = processedText.replace(/[""]/g, '"');
    processedText = processedText.replace(/['']/g, "'");
    
    return processedText;
  }

  private adjustPitchForEmotion(emotionalTone: string): number {
    const pitchMap = {
      'calming': 0.8,
      'empathetic': 0.9,
      'warm': 1.1,
      'energetic': 1.2,
      'neutral': 1.0
    };
    return pitchMap[emotionalTone as keyof typeof pitchMap] || 1.0;
  }

  private estimateDuration(text: string): number {
    // Estimation basée sur nombre de mots (~180 mots/minute)
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.round(wordCount / 3)); // Plus conservateur pour TTS
  }

  // Méthode conceptuelle Gemini TTS API (peut varier selon implémentation réelle)
  private async callGeminiTTS(payload: any): Promise<any> {
    // Note: Gemini TTS n'est pas encore disponible publiquement
    // Cette implémentation est désactivée temporairement
    throw new Error('Gemini TTS not yet available - using Web Speech API fallback');
  }

  // ========================================
  // MÉTHODES HÉRITÉES (COMPATIBILITÉ ANCIENNE API)
  // ========================================

  // Text preprocessing for better TTS output (version héritée)
  private preprocessTextForTTS(text: string, voiceConfig: any): string {
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
    const keyData = text + 
      voiceConfig.voice_id + 
      voiceConfig.speaking_rate + 
      voiceConfig.pitch + 
      avatarId;
    
    // Utiliser notre méthode de hash sécurisée au lieu de btoa
    const hash = this.generateSimpleHash(keyData);
    
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