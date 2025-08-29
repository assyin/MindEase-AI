export interface VoiceSettings {
    rate: number;      // Vitesse (0.1 à 10)
    pitch: number;     // Tonalité (0 à 2)  
    volume: number;    // Volume (0 à 1)
    voice?: string;    // Nom de la voix
  }
  
  export class TextToSpeechService {
    private synthesis: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private defaultSettings: VoiceSettings = {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8
    };
  
    constructor() {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  
    private loadVoices() {
      // Les voix se chargent de manière asynchrone
      const loadVoicesWhenAvailable = () => {
        this.voices = this.synthesis.getVoices();
        
        if (this.voices.length === 0) {
          // Réessayer après un court délai
          setTimeout(loadVoicesWhenAvailable, 100);
        }
      };
  
      loadVoicesWhenAvailable();
  
      // Écouter les changements de voix
      this.synthesis.onvoiceschanged = () => {
        this.voices = this.synthesis.getVoices();
      };
    }
  
    getFrenchVoices(): SpeechSynthesisVoice[] {
      return this.voices.filter(voice => 
        voice.lang.includes('fr') || 
        voice.name.toLowerCase().includes('french') ||
        voice.name.toLowerCase().includes('francais')
      );
    }
  
    getPreferredVoice(): SpeechSynthesisVoice | null {
      const frenchVoices = this.getFrenchVoices();
      
      if (frenchVoices.length > 0) {
        // Préférer une voix féminine pour un ton plus doux
        const femaleVoice = frenchVoices.find(voice => 
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('femme') ||
          voice.name.toLowerCase().includes('marie') ||
          voice.name.toLowerCase().includes('amelie')
        );
        
        return femaleVoice || frenchVoices[0];
      }
      
      return this.voices[0] || null;
    }
  
    async speak(text: string, settings?: Partial<VoiceSettings>): Promise<void> {
      return new Promise((resolve, reject) => {
        // Arrêter toute parole en cours
        this.synthesis.cancel();
  
        const utterance = new SpeechSynthesisUtterance(text);
        const finalSettings = { ...this.defaultSettings, ...settings };
        
        // Configuration de la voix
        utterance.rate = finalSettings.rate;
        utterance.pitch = finalSettings.pitch;
        utterance.volume = finalSettings.volume;
        
        const voice = this.getPreferredVoice();
        if (voice) {
          utterance.voice = voice;
        }
  
        // Événements
        utterance.onend = () => resolve();
        utterance.onerror = (event) => {
          console.error('Erreur synthèse vocale:', event);
          reject(new Error('Erreur lors de la synthèse vocale'));
        };
  
        // Démarrer la synthèse
        this.synthesis.speak(utterance);
      });
    }
  
    stop() {
      this.synthesis.cancel();
    }
  
    pause() {
      this.synthesis.pause();
    }
  
    resume() {
      this.synthesis.resume();
    }
  
    isSupported(): boolean {
      return 'speechSynthesis' in window;
    }
  
    isSpeaking(): boolean {
      return this.synthesis.speaking;
    }
  
    // Nettoyer le texte pour une meilleure synthèse
    private cleanTextForSpeech(text: string): string {
      return text
        // Supprimer le markdown
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/``````/g, '')
        .replace(/`([^`]+)`/g, '$1')
        
        // Remplacer les émoticônes par des mots
        .replace(/💙/g, '')
        .replace(/🌱/g, '')
        .replace(/✨/g, '')
        .replace(/😊/g, '')
        .replace(/🔧/g, '')
        
        // Améliorer la ponctuation pour la parole
        .replace(/\n\n/g, '. ')
        .replace(/\n/g, ', ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  
    async speakCleaned(text: string, settings?: Partial<VoiceSettings>): Promise<void> {
      const cleanedText = this.cleanTextForSpeech(text);
      return this.speak(cleanedText, settings);
    }
  }
  