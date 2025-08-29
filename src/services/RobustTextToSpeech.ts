// Service de synthèse vocale robuste avec fallbacks multiples
import { SpeechDiagnostic } from '../utils/speechDiagnostic';

export interface RobustVoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice?: string;
  timeout?: number;
}

export class RobustTextToSpeech {
  private synthesis: SpeechSynthesis;
  private diagnostic: SpeechDiagnostic;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.diagnostic = new SpeechDiagnostic();
  }

  // ÉTAPE 1: Initialisation forcée de l'audio
  async forceAudioInitialization(): Promise<boolean> {
    console.log('🔧 Initialisation forcée de l\'audio...');
    
    try {
      // 1. Créer et activer AudioContext
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      
      if (this.audioContext.state === 'suspended') {
        console.log('⏳ AudioContext suspendu, reprise...');
        await this.audioContext.resume();
      }
      
      console.log('✅ AudioContext état:', this.audioContext.state);
      
      // 2. Test audio système
      const audioWorks = await this.diagnostic.testSystemAudio();
      if (!audioWorks) {
        throw new Error('Audio système non fonctionnel');
      }
      
      // 3. Forcer le chargement des voix
      await this.forceVoicesLoad();
      
      this.isInitialized = true;
      console.log('✅ Audio initialisé avec succès');
      return true;
      
    } catch (error) {
      console.error('❌ Échec initialisation audio:', error);
      return false;
    }
  }

  private async forceVoicesLoad(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoices = () => {
        const voices = this.synthesis.getVoices();
        if (voices.length > 0) {
          console.log(`✅ ${voices.length} voix chargées`);
          resolve();
        } else {
          // Forcer le rechargement
          setTimeout(() => {
            this.synthesis.getVoices();
            if (this.synthesis.getVoices().length > 0) {
              resolve();
            } else {
              console.warn('⚠️ Pas de voix après force reload');
              resolve(); // Continue quand même
            }
          }, 100);
        }
      };

      if (this.synthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        this.synthesis.onvoiceschanged = loadVoices;
        // Timeout après 3 secondes
        setTimeout(() => resolve(), 3000);
      }
    });
  }

  // ÉTAPE 2: Sélection de voix intelligente
  private getWorkingVoice(): SpeechSynthesisVoice | null {
    const voices = this.synthesis.getVoices();
    
    // Priorité 1: Voix locales françaises
    let candidate = voices.find(v => 
      v.lang.includes('fr') && v.localService
    );
    
    if (candidate) {
      console.log('✅ Voix locale française trouvée:', candidate.name);
      return candidate;
    }
    
    // Priorité 2: Voix locales (n'importe quelle langue)
    candidate = voices.find(v => v.localService);
    if (candidate) {
      console.log('✅ Voix locale trouvée:', candidate.name);
      return candidate;
    }
    
    // Priorité 3: Première voix disponible
    if (voices.length > 0) {
      console.log('⚠️ Utilisation voix par défaut:', voices[0].name);
      return voices[0];
    }
    
    console.error('❌ Aucune voix disponible');
    return null;
  }

  // ÉTAPE 3: Synthèse avec retry et timeout
  async speak(text: string, settings: RobustVoiceSettings = { rate: 0.9, pitch: 1.0, volume: 1.0, timeout: 10000 }): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.forceAudioInitialization();
      if (!initialized) {
        return this.fallbackToAlert(text);
      }
    }

    // Nettoyage du texte
    const cleanText = this.cleanText(text);
    if (!cleanText) return false;

    console.log('🔊 Tentative synthèse:', cleanText.substring(0, 50) + '...');
    
    // Essai 1: Méthode standard
    let success = await this.trySynthesis(cleanText, settings);
    
    if (!success) {
      console.log('⚠️ Échec méthode 1, essai méthode alternative...');
      // Essai 2: Avec paramètres modifiés
      success = await this.trySynthesis(cleanText, { 
        ...settings, 
        rate: 1.0, 
        pitch: 1.0, 
        volume: 1.0 
      });
    }
    
    if (!success) {
      console.log('⚠️ Échec méthode 2, essai voix par défaut...');
      // Essai 3: Sans voix spécifique
      success = await this.trySynthesisDefault(cleanText);
    }
    
    if (!success) {
      console.log('❌ Toutes les méthodes ont échoué, fallback...');
      return this.fallbackToAlert(text);
    }
    
    return success;
  }

  private async trySynthesis(text: string, settings: RobustVoiceSettings): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Nettoyer la queue
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.getWorkingVoice();
        
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang || 'fr-FR';
        } else {
          utterance.lang = 'fr-FR';
        }
        
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;
        
        let resolved = false;
        let startTimeout: NodeJS.Timeout;
        let endTimeout: NodeJS.Timeout;
        
        const cleanup = () => {
          clearTimeout(startTimeout);
          clearTimeout(endTimeout);
        };
        
        utterance.onstart = () => {
          console.log('✅ Synthèse démarrée');
          clearTimeout(startTimeout);
          
          // Timeout si pas de fin
          endTimeout = setTimeout(() => {
            if (!resolved) {
              console.warn('⚠️ Timeout fin de synthèse');
              resolved = true;
              cleanup();
              this.synthesis.cancel();
              resolve(true); // On considère que ça a fonctionné
            }
          }, settings.timeout || 10000);
        };
        
        utterance.onend = () => {
          console.log('✅ Synthèse terminée');
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(true);
          }
        };
        
        utterance.onerror = (event) => {
          console.error('❌ Erreur synthèse:', event.error);
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(false);
          }
        };
        
        // Timeout si pas de démarrage
        startTimeout = setTimeout(() => {
          if (!resolved) {
            console.warn('⚠️ Timeout démarrage synthèse');
            resolved = true;
            cleanup();
            this.synthesis.cancel();
            resolve(false);
          }
        }, 2000);
        
        this.synthesis.speak(utterance);
        console.log('📤 Utterance envoyée');
        
      } catch (error) {
        console.error('❌ Exception trySynthesis:', error);
        resolve(false);
      }
    });
  }

  private async trySynthesisDefault(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        // Paramètres par défaut simples
        utterance.lang = 'en-US'; // Fallback vers anglais
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        let resolved = false;
        
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            this.synthesis.cancel();
            resolve(false);
          }
        }, 5000);
        
        utterance.onend = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(true);
          }
        };
        
        utterance.onerror = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(false);
          }
        };
        
        this.synthesis.speak(utterance);
        
      } catch (error) {
        resolve(false);
      }
    });
  }

  private cleanText(text: string): string {
    return text
      .replace(/[^\w\s\.,!?;:-]/g, '') // Caractères problématiques
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500); // Limite la longueur
  }

  // FALLBACK ULTIME
  private fallbackToAlert(text: string): boolean {
    console.log('⚠️ FALLBACK: Affichage modal');
    alert(`🔊 Synthèse vocale indisponible.\n\nTexte: ${text.substring(0, 200)}...`);
    return false;
  }

  // Méthodes utilitaires
  stop(): void {
    this.synthesis.cancel();
  }

  async runDiagnostic() {
    return await this.diagnostic.runFullDiagnostic();
  }
}