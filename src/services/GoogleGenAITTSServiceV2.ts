import { GoogleGenAI } from '@google/genai';
import { Avatar, VoiceConfig } from '../types';
import { enhancedTTSService } from './EnhancedTTSService';
import GoogleGenAIClient from './GoogleGenAIClient';

interface GoogleAITTSRequest {
  text: string;
  avatarId: string;
  voiceConfig: VoiceConfig;
  conversationId: string;
}

interface GoogleAITTSResponse {
  audioData: ArrayBuffer;
  audioUrl: string;
  duration: number;
  format: 'mp3' | 'wav';
  avatarId: string;
  usedFallback?: boolean; // Indicateur si le fallback a été utilisé
}

interface GoogleAIVoiceProfile {
  voiceId: string;
  languageCode: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  characteristics: {
    speakingRate: number;
    pitch: number;
    volumeGain: number;
    emotionalTone: string;
  };
  instructions: string;
}

/**
 * Service TTS utilisant le VRAI Google Generative AI SDK avec Gemini 2.5 Pro Preview
 * Selon les spécifications de Multi-Voice-corrective.md
 */
export class GoogleGenAITTSServiceV2 {
  private client: GoogleGenAI;
  private userInteractionReceived: boolean = false;
  
  // Profils vocaux Google Gemini TTS pour chaque avatar
  private readonly voiceProfiles: Record<string, GoogleAIVoiceProfile> = {
    // 🇫🇷 AVATARS FRANÇAIS
    'therapist-main': {
      voiceId: 'Kore', // Voix Gemini TTS empathique
      languageCode: 'fr-FR',
      gender: 'FEMALE',
      characteristics: {
        speakingRate: 0.9,
        pitch: -1,
        volumeGain: 2,
        emotionalTone: 'empathetic'
      },
      instructions: `Tu es une thérapeute expérimentée et bienveillante. 
      Parle avec une voix douce, empathique et rassurante.
      Utilise des pauses naturelles et un ton chaleureux.
      Ta voix doit transmettre la compassion et la compréhension.`
    },
    
    'coach-motivation': {
      voiceId: 'Puck', // Voix Gemini TTS énergique
      languageCode: 'fr-FR',
      gender: 'MALE',
      characteristics: {
        speakingRate: 1.15,
        pitch: 2,
        volumeGain: 4,
        emotionalTone: 'energetic'
      },
      instructions: `Tu es un coach motivationnel dynamique et inspirant.
      Parle avec énergie, conviction et enthousiasme.
      Utilise un rythme soutenu et des inflexions motivantes.
      Ta voix doit insuffler la confiance et l'action.`
    },
    
    'guide-meditation': {
      voiceId: 'Kore', // Voix Gemini TTS apaisante
      languageCode: 'fr-FR',
      gender: 'NEUTRAL',
      characteristics: {
        speakingRate: 0.7,
        pitch: -3,
        volumeGain: 0,
        emotionalTone: 'calming'
      },
      instructions: `Tu es un guide de méditation zen et apaisant.
      Parle avec une voix très calme, posée et méditative.
      Utilise des pauses longues et un rythme très lent.
      Ta voix doit induire la relaxation et la sérénité.`
    },
    
    'analyst-behavioral': {
      voiceId: 'Puck', // Voix Gemini TTS analytique
      languageCode: 'fr-FR',
      gender: 'MALE',
      characteristics: {
        speakingRate: 0.95,
        pitch: 0,
        volumeGain: 1,
        emotionalTone: 'analytical'
      },
      instructions: `Tu es un analyste comportemental professionnel.
      Parle avec précision, clarté et objectivité.
      Utilise un rythme mesuré et une diction parfaite.
      Ta voix doit transmettre l'expertise et la rigueur scientifique.`
    },

    // 🇲🇦 NOUVEAUX AVATARS ARABES AVEC ACCENT MAROCAIN
    'therapist-morocco': {
      voiceId: 'umbriel', // Voix Gemini TTS féminine empathique avec accent marocain
      languageCode: 'ar-MA',
      gender: 'FEMALE',
      characteristics: {
        speakingRate: 0.85,
        pitch: -1.5,
        volumeGain: 2,
        emotionalTone: 'empathetic'
      },
      instructions: `أنت د. عائشة بنعلي، طبيبة نفسية مغربية متمرسة ومتفهمة.
      تحدثي بصوت هادئ ومتعاطف ومطمئن بلهجة مغربية أصيلة.
      استخدمي فترات توقف طبيعية ونبرة دافئة مع احترام القيم الإسلامية.
      يجب أن ينقل صوتك الرحمة والتفهم والحكمة التقليدية المغربية.`
    },

    'coach-darija': {
      voiceId: 'algenib', // Voix Gemini TTS masculine énergique avec accent marocain
      languageCode: 'ar-MA',
      gender: 'MALE',
      characteristics: {
        speakingRate: 1.1,
        pitch: 2.5,
        volumeGain: 3.5,
        emotionalTone: 'energetic'
      },
      instructions: `راك أنت أحمد الشرايبي، مدرب تحفيز مغربي ديناميكي وملهم.
      تكلم بطاقة واقتناع وحماس بالدارجة المغربية الأصيلة.
      استخدم إيقاع سريع وانعطافات محفزة من الثقافة المغربية.
      صوتك يجب يلهم الثقة والعمل والمثابرة على الطريقة المغربية.`
    },

    'guide-meditation-arabic': {
      voiceId: 'despina', // Voix Gemini TTS douce accent casablancais
      languageCode: 'ar-MA',
      gender: 'FEMALE',
      characteristics: {
        speakingRate: 0.65,
        pitch: -3,
        volumeGain: -1,
        emotionalTone: 'calming'
      },
      instructions: `أنت لالة فاطمة الزهراء، مرشدة روحية مغربية للتأمل والسكينة.
      تحدثي بصوت هادئ جداً ومتأمل ومهدئ بلهجة الدار البيضاء الرقيقة.
      استخدمي فترات صمت طويلة وإيقاع بطيء جداً مع مراجع من التراث الصوفي.
      صوتك يجب أن يحث على الاسترخاء والسكينة الروحية والطمأنينة.`
    },

    'analyst-mena': {
      voiceId: 'iapetus', // Voix Gemini TTS masculine professionnelle
      languageCode: 'ar-MA',
      gender: 'MALE',
      characteristics: {
        speakingRate: 0.95,
        pitch: 0.5,
        volumeGain: 1,
        emotionalTone: 'analytical'
      },
      instructions: `أنت د. يوسف الفاسي، محلل سلوكي مهني متخصص في الثقافة العربية والمغاربية.
      تحدث بدقة ووضوح وموضوعية بلهجة فاسية راقية.
      استخدم إيقاع مدروس وإلقاء مثالي مع مراجع علمية وثقافية مناسبة.
      صوتك يجب أن ينقل الخبرة والدقة العلمية والفهم الثقافي العميق.`
    }
  };

  /**
   * Crée un profil vocal personnalisé pour les tests
   */
  private createCustomVoiceProfile(voiceId: string, voiceConfig: any): GoogleAIVoiceProfile {
    return {
      voiceId: voiceId,
      languageCode: voiceConfig?.language_code || 'ar-MA',
      gender: voiceConfig?.gender || 'NEUTRAL',
      characteristics: {
        speakingRate: voiceConfig?.speaking_rate || 0.9,
        pitch: voiceConfig?.pitch || 0,
        volumeGain: voiceConfig?.volume_gain_db || 0,
        emotionalTone: voiceConfig?.emotional_tone || 'empathetic'
      },
      instructions: `Test de la voix ${voiceId} pour la darija marocaine. 
      Parle naturellement en arabe marocain avec un accent authentique.
      Utilise des expressions de la darija et maintiens un ton ${voiceConfig?.emotional_tone || 'naturel'}.`
    };
  }

  constructor() {
    try {
      // Utiliser le client centralisé
      this.client = GoogleGenAIClient.getInstance();
      console.log('✅ Google GenAI TTS Service V2 initialisé avec client centralisé');
      
      // Écouter les interactions utilisateur pour débloquer l'autoplay
      this.setupUserInteractionListener();
      
    } catch (error) {
      console.error('❌ Erreur initialisation GoogleGenAITTSServiceV2:', error);
      throw new Error(`TTS Service initialization failed: ${error.message}`);
    }
  }

  /**
   * Configure l'écoute des interactions utilisateur pour débloquer l'autoplay
   */
  private setupUserInteractionListener(): void {
    const handleUserInteraction = () => {
      this.userInteractionReceived = true;
      console.log('✅ Interaction utilisateur détectée - autoplay débloqué');
      
      // Nettoyer les listeners après la première interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
  }

  /**
   * Génère un audio TTS avec les vraies voix Google AI Studio
   * Implémentation avec fallback automatique vers EnhancedTTSService
   */
  async generateAvatarSpeech(request: GoogleAITTSRequest): Promise<GoogleAITTSResponse> {
    try {
      // Pour les tests de voix, utiliser la voix spécifiée dans voiceConfig si disponible
      const customVoiceId = request.voiceConfig?.voice_id;
      const voiceProfile = customVoiceId && customVoiceId !== this.voiceProfiles[request.avatarId]?.voiceId
        ? this.createCustomVoiceProfile(customVoiceId, request.voiceConfig)
        : this.voiceProfiles[request.avatarId];
        
      if (!voiceProfile) {
        throw new Error(`Profil vocal non trouvé pour l'avatar: ${request.avatarId}`);
      }

      console.log(`🎙️ Génération TTS Google AI pour ${request.avatarId} avec voix ${voiceProfile.voiceId}`);

      // Construction du prompt spécialisé avec instructions vocales
      const enhancedPrompt = this.buildVoicePrompt(request.text, voiceProfile);

      // Appel à Gemini 2.5 Flash TTS avec configuration EXACTE selon doc officielle
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: request.text, // ✅ Texte simple en input selon la doc
        config: {
          responseModalities: ["AUDIO"], // ✅ OBLIGATOIRE - seulement AUDIO
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceProfile.voiceId // ✅ Voix spécifique à l'avatar
              }
            }
          }
        }
      });

      // Traitement de la réponse audio
      return await this.processAudioResponse(response, request.avatarId);

    } catch (error) {
      console.error(`❌ Erreur génération TTS pour ${request.avatarId}:`, error);
      
      // Vérification si c'est une erreur de quota (429)
      if (error.status === 429 || error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
        console.log('🔄 Quota Google AI atteint, basculement vers voix système...');
        return await this.fallbackToEnhancedTTS(request);
      }
      
      throw new Error(`Génération TTS échouée: ${error.message}`);
    }
  }

  /**
   * Fallback automatique vers EnhancedTTSService en cas de quota dépassé
   */
  private async fallbackToEnhancedTTS(request: GoogleAITTSRequest): Promise<GoogleAITTSResponse> {
    try {
      console.log(`🎵 Utilisation de la voix système pour ${request.avatarId}`);
      
      // Création d'un avatar minimal pour EnhancedTTSService
      const avatar: Avatar = {
        id: request.avatarId,
        name: request.avatarId,
        role: 'therapist', // Default role
        personality: '',
        voice_config: request.voiceConfig
      };

      // Appel à EnhancedTTSService
      const enhancedResponse = await enhancedTTSService.generateAvatarSpeech(
        avatar, 
        request.text, 
        request.conversationId
      );

      // Conversion vers le format GoogleAITTSResponse
      return {
        audioData: await this.blobToArrayBuffer(enhancedResponse.audioBlob),
        audioUrl: enhancedResponse.audioUrl,
        duration: enhancedResponse.audioDuration,
        format: 'wav' as const,
        avatarId: request.avatarId,
        usedFallback: true // Marquer que le fallback a été utilisé
      };

    } catch (fallbackError) {
      console.error(`❌ Fallback vers voix système échoué:`, fallbackError);
      throw new Error(`Échec total TTS: Google AI (quota) + voix système: ${fallbackError.message}`);
    }
  }

  /**
   * Génère un dialogue multi-avatars avec voix distinctes Google AI Studio
   */
  async generateMultiAvatarDialogue(
    avatarTexts: Array<{ avatarId: string; text: string; }>
  ): Promise<GoogleAITTSResponse[]> {
    console.log('🎭 Génération dialogue multi-avatars avec Google AI Studio TTS');
    
    const audioResponses: GoogleAITTSResponse[] = [];
    
    // Génération séquentielle pour éviter les limitations API
    for (const { avatarId, text } of avatarTexts) {
      if (!text.trim()) continue;
      
      const request: GoogleAITTSRequest = {
        text,
        avatarId,
        voiceConfig: this.adaptVoiceConfig(avatarId),
        conversationId: `multi-dialogue-${Date.now()}`
      };
      
      const audioResponse = await this.generateAvatarSpeech(request);
      audioResponses.push(audioResponse);
      
      // Délai pour éviter rate limiting
      await this.sleep(200);
    }
    
    console.log(`✅ Dialogue multi-avatars généré: ${audioResponses.length} segments audio`);
    return audioResponses;
  }

  /**
   * Construit un prompt spécialisé avec instructions vocales Google AI Studio
   */
  private buildVoicePrompt(text: string, voiceProfile: GoogleAIVoiceProfile): string {
    return `${voiceProfile.instructions}

INSTRUCTIONS TECHNIQUES GOOGLE AI STUDIO:
- Voix: ${voiceProfile.voiceId}
- Langue: ${voiceProfile.languageCode}  
- Vitesse: ${voiceProfile.characteristics.speakingRate}x
- Tonalité: ${voiceProfile.characteristics.pitch}
- Volume: +${voiceProfile.characteristics.volumeGain}dB
- Style émotionnel: ${voiceProfile.characteristics.emotionalTone}

TEXTE À PRONONCER:
"${text}"

Génère l'audio correspondant avec ces paramètres vocaux précis selon les capacités TTS natives de Google AI Studio.`;
  }

  /**
   * Traite la réponse audio de Gemini 2.5 Pro
   */
  private async processAudioResponse(response: any, avatarId: string): Promise<GoogleAITTSResponse> {
    try {
      // Extraction de l'audio depuis la réponse Gemini selon la nouvelle API
      let audioBase64: string | null = null;
      let duration = 0;

      // Extraction audio selon format officiel Gemini TTS
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          // Format officiel selon doc : response.candidates.content.parts.inlineData.data
          if (part.inlineData?.data) {
            audioBase64 = part.inlineData.data;
            break;
          }
        }
      }

      // Vérification alternative dans la réponse directe
      if (!audioBase64 && response.audioContent) {
        audioBase64 = response.audioContent;
      }

      if (!audioBase64) {
        throw new Error('Aucune donnée audio reçue de Google AI Studio TTS');
      }

      // 🔍 DIAGNOSTIC : Logs détaillés pour debugging
      console.log('🔍 DIAGNOSTIC TTS AUDIO:');
      console.log('Base64 audio length:', audioBase64.length);
      console.log('First 100 chars of base64:', audioBase64.substring(0, 100));
      console.log('Last 50 chars of base64:', audioBase64.substring(audioBase64.length - 50));
      
      // Conversion base64 -> ArrayBuffer
      const audioData = this.base64ToArrayBuffer(audioBase64);
      console.log('ArrayBuffer size:', audioData.byteLength);
      
      // Détection du format audio basée sur la signature
      const format = this.detectAudioFormat(audioBase64);
      console.log('🔍 Format détecté:', format);
      
      let audioBlob: Blob;
      let audioUrl: string;
      
      // Approche multi-format : essayer plusieurs stratégies
      const { blob: finalBlob, url: finalUrl } = await this.createCompatibleAudio(audioData, format);
      audioBlob = finalBlob;
      audioUrl = finalUrl;
      
      console.log('Blob size:', audioBlob.size);
      console.log('Blob type:', audioBlob.type);
      console.log('Audio URL:', audioUrl);
      
      // 🧪 Test de lecture audio immédiat
      // this.testAudioPlayback(audioUrl, audioBlob, audioBase64); // Désactivé pour éviter l'écho
      console.log('ℹ️ Test audio automatique désactivé - seule l\'interface joue l\'audio');
      
      // 🔧 Si toujours des problèmes, essayer Web Audio API en dernier recours
      if (!(await this.testAudioCompatibility(audioUrl))) {
        console.log('🆘 Tentative Web Audio API en dernier recours...');
        try {
          const webAudioBlob = await this.convertWithWebAudioAPI(audioData);
          if (webAudioBlob) {
            URL.revokeObjectURL(audioUrl); // Nettoyer l'ancien
            audioBlob = webAudioBlob;
            audioUrl = URL.createObjectURL(audioBlob);
            console.log('✅ Conversion Web Audio API réussie');
          }
        } catch (webAudioError) {
          console.warn('⚠️ Web Audio API fallback échoué:', webAudioError);
        }
      }

      // Calcul de la durée si pas fournie
      if (!duration) {
        duration = await this.estimateAudioDuration(audioBlob);
      }

      console.log(`✅ Audio généré avec Google AI Studio TTS: ${duration}s pour ${avatarId}`);

      return {
        audioData: await this.blobToArrayBuffer(audioBlob), // Utiliser les données du blob final
        audioUrl,
        duration: duration * 1000, // Conversion en millisecondes
        format: 'wav' as const,
        avatarId
      };

    } catch (error) {
      console.error('❌ Erreur traitement réponse audio:', error);
      throw new Error(`Traitement audio échoué: ${error.message}`);
    }
  }

  /**
   * Adapte la configuration vocale pour un avatar
   */
  private adaptVoiceConfig(avatarId: string): VoiceConfig {
    const profile = this.voiceProfiles[avatarId];
    if (!profile) {
      return this.getDefaultVoiceConfig();
    }

    return {
      voice_id: profile.voiceId,
      language_code: profile.languageCode,
      speaking_rate: profile.characteristics.speakingRate,
      pitch: profile.characteristics.pitch,
      volume_gain_db: profile.characteristics.volumeGain,
      emotional_tone: profile.characteristics.emotionalTone as any,
      pause_duration: 500,
      emphasis_words: []
    };
  }

  /**
   * Configuration vocale par défaut
   */
  private getDefaultVoiceConfig(): VoiceConfig {
    return {
      voice_id: 'fr-FR-Standard-A',
      language_code: 'fr-FR',
      speaking_rate: 1.0,
      pitch: 0,
      volume_gain_db: 0,
      emotional_tone: 'neutral' as any,
      pause_duration: 300,
      emphasis_words: []
    };
  }

  /**
   * Convertit base64 en ArrayBuffer avec gestion d'erreurs robuste
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      // Nettoyage du préfixe data URL si présent
      let cleanBase64 = base64.replace(/^data:[^,]+,/, '');
      
      // Nettoyage des espaces et caractères non-base64
      cleanBase64 = cleanBase64.replace(/[^A-Za-z0-9+/=]/g, '');
      
      // Ajouter padding si nécessaire
      while (cleanBase64.length % 4) {
        cleanBase64 += '=';
      }
      
      console.log('🔍 Clean base64 length:', cleanBase64.length);
      console.log('🔍 Clean base64 sample:', cleanBase64.substring(0, 50));
      
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('✅ ArrayBuffer créé, taille:', bytes.buffer.byteLength);
      return bytes.buffer;
      
    } catch (error) {
      console.error('❌ Erreur conversion base64:', error);
      console.log('Base64 problématique (50 premiers chars):', base64.substring(0, 50));
      throw new Error(`Conversion base64 échouée: ${error.message}`);
    }
  }

  /**
   * Estime la durée audio depuis le blob
   */
  private async estimateAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration || 2); // Défaut 2 secondes
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        // Estimation basée sur la taille du fichier
        resolve(Math.max(1, blob.size / 16000)); // ~16kb/sec pour MP3
      });
      
      audio.src = url;
    });
  }

  /**
   * Délai utilitaire
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convertit un Blob en ArrayBuffer pour la compatibilité
   */
  private async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * 🧪 Test de diagnostic audio pour identifier les problèmes de lecture
   */
  private testAudioPlayback(audioUrl: string, audioBlob: Blob, audioBase64: string): void {
    console.log('🧪 TEST AUDIO PLAYBACK:');
    
    // Test 1: Créer un élément audio et essayer de le jouer
    const audio = new Audio(audioUrl);
    
    audio.addEventListener('loadstart', () => console.log('✅ Audio loadstart'));
    audio.addEventListener('canplay', () => console.log('✅ Audio canplay'));
    audio.addEventListener('canplaythrough', () => console.log('✅ Audio canplaythrough'));
    audio.addEventListener('error', (e) => console.error('❌ Audio error:', e));
    audio.addEventListener('ended', () => console.log('✅ Audio ended'));
    
    // Test 2: DÉSACTIVÉ - ne pas jouer automatiquement pour éviter l'écho avec l'interface
    console.log('ℹ️ Auto-play de test désactivé pour éviter double lecture audio');
    
    // Créer les éléments de test sans autoplay - DÉSACTIVÉ
    // this.createTestElements(audioUrl, audioBlob);
    
    // Test 4: Log de la signature audio pour vérification du format
    const signature = audioBase64.substring(0, 20);
    console.log('🔍 Audio signature:', signature);
    
    // Test 5: Vérifier si c'est du PCM/WAV valide
    if (signature.startsWith('UklGR')) {
      console.log('✅ Format detecté: WAV (RIFF header)');
    } else if (signature.startsWith('/+MYxA')) {
      console.log('✅ Format detecté: MP3');
    } else {
      console.log('⚠️ Format audio non reconnu, signature:', signature);
    }
  }

  /**
   * Détecte le format audio basé sur la signature magic bytes
   */
  private detectAudioFormat(base64: string): { format: string; mimeType: string; extension: string } {
    // Nettoyage du base64
    const cleanBase64 = base64.replace(/^data:[^,]+,/, '');
    
    // Décoder les premiers bytes pour détecter la signature
    try {
      const binaryString = atob(cleanBase64.substring(0, 100)); // Premiers bytes seulement
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Signatures de formats audio courants
      const signatures = [
        { bytes: [0x52, 0x49, 0x46, 0x46], format: 'WAV', mimeType: 'audio/wav', extension: 'wav' }, // RIFF
        { bytes: [0xFF, 0xFB], format: 'MP3', mimeType: 'audio/mpeg', extension: 'mp3' }, // MP3 VBR
        { bytes: [0xFF, 0xFA], format: 'MP3', mimeType: 'audio/mpeg', extension: 'mp3' }, // MP3 CBR
        { bytes: [0xFF, 0xF3], format: 'MP3', mimeType: 'audio/mpeg', extension: 'mp3' }, // MP3 MPEG-2
        { bytes: [0xFF, 0xF2], format: 'MP3', mimeType: 'audio/mpeg', extension: 'mp3' }, // MP3 MPEG-2.5
        { bytes: [0x4F, 0x67, 0x67, 0x53], format: 'OGG', mimeType: 'audio/ogg', extension: 'ogg' }, // OggS
        { bytes: [0x66, 0x74, 0x79, 0x70], format: 'MP4', mimeType: 'audio/mp4', extension: 'm4a' }, // ftyp (MP4/M4A)
        { bytes: [0x66, 0x4C, 0x61, 0x43], format: 'FLAC', mimeType: 'audio/flac', extension: 'flac' }, // fLaC
      ];
      
      // Vérifier chaque signature
      for (const sig of signatures) {
        let match = true;
        for (let i = 0; i < sig.bytes.length && i < bytes.length; i++) {
          if (bytes[i] !== sig.bytes[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          console.log(`✅ Format audio identifié: ${sig.format}`);
          return { format: sig.format, mimeType: sig.mimeType, extension: sig.extension };
        }
      }
      
      console.log('⚠️ Format audio non reconnu, signature:', Array.from(bytes.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
    } catch (error) {
      console.error('❌ Erreur détection format:', error);
    }
    
    // Format par défaut
    return { format: 'Unknown', mimeType: 'audio/wav', extension: 'wav' };
  }

  /**
   * Crée un audio compatible avec le navigateur en essayant plusieurs stratégies
   */
  private async createCompatibleAudio(
    audioData: ArrayBuffer, 
    detectedFormat: { format: string; mimeType: string; extension: string }
  ): Promise<{ blob: Blob; url: string }> {
    
    const strategies = [
      // Stratégie 1: Format détecté si connu
      () => {
        if (detectedFormat.format !== 'Unknown') {
          console.log(`📋 Stratégie 1: Utilisation du format détecté (${detectedFormat.format})`);
          return new Blob([audioData], { type: detectedFormat.mimeType });
        }
        return null;
      },
      
      // Stratégie 2: Conversion PCM vers WAV si données brutes
      () => {
        if (this.isPCMData(audioData)) {
          console.log('📋 Stratégie 2: Conversion PCM → WAV');
          return this.convertPCMToWAV(audioData);
        }
        return null;
      },
      
      // Stratégie 3: Essayer comme WAV brut
      () => {
        console.log('📋 Stratégie 3: Forcer format WAV');
        return new Blob([audioData], { type: 'audio/wav' });
      },
      
      // Stratégie 4: Essayer comme MP3
      () => {
        console.log('📋 Stratégie 4: Essayer format MP3');
        return new Blob([audioData], { type: 'audio/mpeg' });
      },
      
      // Stratégie 5: Format octet-stream générique
      () => {
        console.log('📋 Stratégie 5: Format générique');
        return new Blob([audioData], { type: 'audio/wav' }); // Toujours WAV pour compatibilité
      }
    ];
    
    // Essayer chaque stratégie
    for (let i = 0; i < strategies.length; i++) {
      const blob = strategies[i]();
      if (blob) {
        const url = URL.createObjectURL(blob);
        
        // Test rapide de compatibilité
        const isCompatible = await this.testAudioCompatibility(url);
        console.log(`🧪 Stratégie ${i + 1} compatible: ${isCompatible}`);
        
        if (isCompatible || i === strategies.length - 1) {
          // Utiliser cette stratégie (même si dernière tentative)
          return { blob, url };
        } else {
          // Nettoyer et essayer la suivante
          URL.revokeObjectURL(url);
        }
      }
    }
    
    // Fallback final (ne devrait jamais arriver)
    const fallbackBlob = new Blob([audioData], { type: 'audio/wav' });
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    return { blob: fallbackBlob, url: fallbackUrl };
  }

  /**
   * Test rapide de compatibilité audio
   */
  private async testAudioCompatibility(audioUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const timeout = setTimeout(() => {
        resolve(false); // Timeout = non compatible
      }, 1000); // 1 seconde max
      
      audio.addEventListener('canplay', () => {
        clearTimeout(timeout);
        resolve(true);
      }, { once: true });
      
      audio.addEventListener('error', () => {
        clearTimeout(timeout);
        resolve(false);
      }, { once: true });
      
      audio.src = audioUrl;
    });
  }

  /**
   * Vérifie si les données sont du PCM brut de Gemini TTS
   */
  private isPCMData(audioData: ArrayBuffer): boolean {
    const bytes = new Uint8Array(audioData);
    
    // Vérifier d'abord les signatures de formats connus
    const knownFormats = [
      [0x52, 0x49, 0x46, 0x46], // RIFF (WAV)
      [0xFF, 0xFB], [0xFF, 0xFA], [0xFF, 0xF3], [0xFF, 0xF2], // MP3
      [0x4F, 0x67, 0x67, 0x53], // OGG
      [0x66, 0x74, 0x79, 0x70], // MP4
    ];
    
    for (const sig of knownFormats) {
      let match = true;
      for (let i = 0; i < sig.length && i < bytes.length; i++) {
        if (bytes[i] !== sig[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        console.log(`🎵 Format audio connu détecté, pas de conversion PCM nécessaire`);
        return false;
      }
    }
    
    // Heuristique spécifique pour Gemini TTS PCM
    // Les données PCM 16-bit ont tendance à avoir des patterns spécifiques
    const firstBytes = Array.from(bytes.slice(0, 10));
    console.log(`🔍 Analyse PCM candidat: ${firstBytes.map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    
    // Vérifier si c'est un pattern typique de PCM 16-bit
    // Les valeurs audio 16-bit alternent généralement entre bytes pairs et impairs
    let pcmScore = 0;
    
    // Test 1: Longueur divisible par 2 (16-bit samples)
    if (audioData.byteLength % 2 === 0) pcmScore++;
    
    // Test 2: Distribution des valeurs (PCM a tendance à être centré autour de 0)
    const sampleSize = Math.min(100, bytes.length);
    let lowValues = 0;
    for (let i = 0; i < sampleSize; i++) {
      if (bytes[i] < 128) lowValues++;
    }
    if (lowValues > sampleSize * 0.3 && lowValues < sampleSize * 0.7) pcmScore++;
    
    // Test 3: Pas de patterns de header évidents
    const headerLikeBytes = bytes.slice(0, 4);
    const isAsciiLike = headerLikeBytes.every(b => (b >= 32 && b <= 126) || b === 0);
    if (!isAsciiLike) pcmScore++;
    
    const isPcm = pcmScore >= 2;
    console.log(`🎯 Score PCM: ${pcmScore}/3, isPCM: ${isPcm}`);
    
    return isPcm;
  }

  /**
   * Filtre l'écho et les duplications dans les données audio PCM
   */
  private filterAudioEcho(pcmBytes: Uint8Array): Uint8Array {
    const sampleSize = 2; // 16-bit = 2 bytes par sample
    const samplesCount = Math.floor(pcmBytes.length / sampleSize);
    
    if (samplesCount < 1000) return pcmBytes; // Trop court pour détecter l'écho
    
    // Analyser les 1000 premiers samples pour détecter des patterns répétitifs
    const analysisSize = Math.min(1000, samplesCount);
    const samples = new Int16Array(pcmBytes.buffer.slice(0, analysisSize * sampleSize));
    
    // Détecter des répétitions suspectes (écho)
    let duplicateCount = 0;
    let patternLength = 0;
    
    for (let i = 1; i < analysisSize - 1; i++) {
      // Chercher si ce sample se répète à intervalles réguliers
      for (let stride = 100; stride < analysisSize / 4; stride++) {
        if (i + stride < analysisSize && Math.abs(samples[i] - samples[i + stride]) < 100) {
          // Vérifier si c'est un pattern qui continue
          let matchCount = 0;
          for (let j = 0; j < Math.min(50, analysisSize - i - stride); j++) {
            if (i + j + stride < analysisSize && Math.abs(samples[i + j] - samples[i + j + stride]) < 100) {
              matchCount++;
            }
          }
          if (matchCount > 25) { // Plus de 50% de matches
            duplicateCount++;
            patternLength = stride;
            break;
          }
        }
      }
    }
    
    if (duplicateCount > 20 && patternLength > 0) {
      console.log(`🔍 Écho détecté: ${duplicateCount} répétitions avec pattern de ${patternLength} samples`);
      
      // Filtrer en gardant seulement la première occurrence du pattern
      const filteredSamples = new Int16Array(Math.floor(samplesCount / 2));
      const originalSamples = new Int16Array(pcmBytes.buffer);
      
      let writeIndex = 0;
      for (let readIndex = 0; readIndex < originalSamples.length && writeIndex < filteredSamples.length; readIndex += 2) {
        filteredSamples[writeIndex++] = originalSamples[readIndex];
      }
      
      console.log(`✂️ Audio écho filtré: ${samplesCount} → ${filteredSamples.length} samples`);
      return new Uint8Array(filteredSamples.buffer);
    }
    
    console.log('✅ Pas d\'écho détecté, audio original conservé');
    return pcmBytes;
  }

  /**
   * Convertit des données PCM brutes en format WAV (spécial pour Gemini TTS)
   */
  private convertPCMToWAV(pcmData: ArrayBuffer): Blob {
    console.log('🔧 Conversion PCM spécialisée pour Gemini TTS...');
    
    // Gemini génère du PCM 16-bit little-endian, 24kHz, mono
    const sampleRate = 24000; 
    const numChannels = 1;
    const bitsPerSample = 16;
    
    // Les données sont déjà en 16-bit PCM, pas besoin de conversion
    let pcmBytes = new Uint8Array(pcmData);
    console.log(`📊 PCM source: ${pcmBytes.length} bytes, premiers samples: ${Array.from(pcmBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    
    // Détecter et filtrer l'écho/duplications potentiels - DÉSACTIVÉ temporairement pour diagnostic
    // pcmBytes = this.filterAudioEcho(pcmBytes);
    console.log('ℹ️ Filtrage écho désactivé pour éviter problème de vitesse');
    
    // Calculer les paramètres WAV
    const byteRate = sampleRate * numChannels * bitsPerSample / 8; // 48000 bytes/sec
    const blockAlign = numChannels * bitsPerSample / 8; // 2 bytes par sample
    const dataSize = pcmBytes.length;
    const fileSize = dataSize + 36; // 44 - 8 bytes
    
    console.log(`📊 Paramètres WAV calculés: sampleRate=${sampleRate}, byteRate=${byteRate}, blockAlign=${blockAlign}, dataSize=${dataSize}`);
    
    // Créer le header WAV complet
    const headerSize = 44;
    const wavBuffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(wavBuffer);
    
    let offset = 0;
    
    // RIFF Header
    view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF" big-endian
    view.setUint32(offset, fileSize, true); offset += 4;    // Taille fichier minus 8
    view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE" big-endian
    
    // fmt chunk  
    view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt " big-endian
    view.setUint32(offset, 16, true); offset += 4;          // Size of fmt chunk (16)
    view.setUint16(offset, 1, true); offset += 2;           // Audio format (1 = PCM)
    view.setUint16(offset, numChannels, true); offset += 2; // Number of channels
    view.setUint32(offset, sampleRate, true); offset += 4;  // Sample rate
    view.setUint32(offset, byteRate, true); offset += 4;    // Byte rate
    view.setUint16(offset, blockAlign, true); offset += 2;  // Block align
    view.setUint16(offset, bitsPerSample, true); offset += 2; // Bits per sample
    
    // data chunk
    view.setUint32(offset, 0x64617461, false); offset += 4; // "data" big-endian
    view.setUint32(offset, dataSize, true); offset += 4;    // Data size
    
    // Vérifier l'offset
    console.log(`🔍 Header offset après construction: ${offset} (attendu: 44)`);
    
    // Copier les données PCM
    const wavBytes = new Uint8Array(wavBuffer);
    wavBytes.set(pcmBytes, headerSize);
    
    // Vérification finale
    const finalHeader = Array.from(wavBytes.slice(0, 12)).map(b => String.fromCharCode(b)).join('');
    console.log(`✅ Header WAV créé: "${finalHeader.substring(0, 4)}"..."{finalHeader.substring(8, 12)}"`);
    console.log(`📊 WAV final: ${sampleRate}Hz, ${numChannels}ch, ${bitsPerSample}bit, total=${wavBuffer.byteLength} bytes`);
    
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  /**
   * Fallback ultime : utiliser Web Audio API pour décoder et re-encoder
   */
  private async convertWithWebAudioAPI(audioData: ArrayBuffer): Promise<Blob | null> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Essayer de décoder les données audio
      const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));
      
      // Créer un nouveau buffer WAV à partir des données décodées
      const sampleRate = audioBuffer.sampleRate;
      const numChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length;
      
      console.log(`🎵 Web Audio API: ${sampleRate}Hz, ${numChannels}ch, ${length} samples`);
      
      // Extraire les données PCM
      const pcmData = new Float32Array(length);
      audioBuffer.getChannelData(0).forEach((sample, index) => {
        // Convertir float32 (-1 to 1) vers int16 (-32768 to 32767)
        pcmData[index] = Math.max(-1, Math.min(1, sample)) * 32767;
      });
      
      // Convertir en Int16Array
      const int16Data = new Int16Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        int16Data[i] = Math.round(pcmData[i]);
      }
      
      // Créer un nouveau WAV
      return this.createWAVFromPCM(int16Data.buffer, sampleRate, numChannels);
      
    } catch (error) {
      console.error('❌ Web Audio API conversion failed:', error);
      return null;
    }
  }

  /**
   * Crée un fichier WAV à partir de données PCM avec paramètres spécifiés
   */
  private createWAVFromPCM(pcmData: ArrayBuffer, sampleRate: number, numChannels: number): Blob {
    const pcmBytes = new Uint8Array(pcmData);
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = pcmBytes.length;
    const fileSize = 36 + dataSize;
    
    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);
    
    // Header WAV complet
    view.setUint32(0, 0x46464952, false); // "RIFF"
    view.setUint32(4, fileSize, true);
    view.setUint32(8, 0x45564157, false); // "WAVE"
    view.setUint32(12, 0x20746d66, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint32(36, 0x61746164, false); // "data"
    view.setUint32(40, dataSize, true);
    
    const wavBytes = new Uint8Array(wavBuffer);
    wavBytes.set(pcmBytes, 44);
    
    console.log('✅ WAV créé via Web Audio API');
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  /**
   * Crée des éléments de test pour diagnostic audio manuel
   */
  private createTestElements(audioUrl: string, audioBlob: Blob): void {
    // Créer un conteneur de test
    const testContainer = document.createElement('div');
    testContainer.id = 'audio-test-container';
    testContainer.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 9999;
      background: #ffeb3b;
      padding: 15px;
      border: 2px solid #333;
      border-radius: 8px;
      font-family: monospace;
      max-width: 300px;
    `;
    
    // Titre
    const title = document.createElement('h3');
    title.textContent = '🧪 DIAGNOSTIC AUDIO TTS';
    title.style.margin = '0 0 10px 0';
    testContainer.appendChild(title);
    
    // Contrôle audio
    const audioControl = document.createElement('audio');
    audioControl.src = audioUrl;
    audioControl.controls = true;
    audioControl.style.width = '100%';
    testContainer.appendChild(audioControl);
    
    // Lien de téléchargement
    const downloadLink = document.createElement('a');
    downloadLink.href = audioUrl;
    downloadLink.download = `gemini-tts-test-${Date.now()}.wav`;
    downloadLink.textContent = '📥 Télécharger pour test externe';
    downloadLink.style.cssText = 'display: block; margin: 10px 0; color: blue; text-decoration: underline;';
    testContainer.appendChild(downloadLink);
    
    // Info blob
    const blobInfo = document.createElement('div');
    blobInfo.innerHTML = `
      <strong>Info Audio:</strong><br>
      Taille: ${audioBlob.size} bytes<br>
      Type: ${audioBlob.type}<br>
      URL: ${audioUrl.substring(0, 50)}...
    `;
    blobInfo.style.cssText = 'font-size: 11px; margin: 10px 0;';
    testContainer.appendChild(blobInfo);
    
    // Bouton de fermeture
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌ Fermer';
    closeBtn.style.cssText = 'margin-top: 10px; padding: 5px 10px;';
    closeBtn.onclick = () => document.body.removeChild(testContainer);
    testContainer.appendChild(closeBtn);
    
    // Ajouter au DOM
    document.body.appendChild(testContainer);
    
    // Auto-suppression après 60 secondes
    setTimeout(() => {
      if (document.body.contains(testContainer)) {
        document.body.removeChild(testContainer);
      }
    }, 60000);
    
    console.log('🧪 Éléments de test audio créés');
  }

  /**
   * Test de connectivité avec Google AI Studio TTS
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Test de connectivité Google AI Studio TTS...');
      
      const testRequest: GoogleAITTSRequest = {
        text: 'Bonjour test', // ✅ Prompt très court pour diagnostic
        avatarId: 'therapist-main',
        voiceConfig: this.getDefaultVoiceConfig(),
        conversationId: 'test-connection'
      };

      await this.generateAvatarSpeech(testRequest);
      
      console.log('✅ Connexion Google AI Studio TTS réussie');
      return true;

    } catch (error) {
      console.error('❌ Test connexion échoué:', error);
      return false;
    }
  }

  /**
   * Liste des avatars supportés
   */
  getSupportedAvatars(): string[] {
    return Object.keys(this.voiceProfiles);
  }

  /**
   * Obtient le profil vocal d'un avatar
   */
  getVoiceProfile(avatarId: string): GoogleAIVoiceProfile | null {
    return this.voiceProfiles[avatarId] || null;
  }
}

// Instance singleton pour utilisation dans l'app
export const googleGenAITTSServiceV2 = new GoogleGenAITTSServiceV2();