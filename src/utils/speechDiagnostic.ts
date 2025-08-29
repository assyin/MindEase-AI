// Script de diagnostic complet pour Web Speech API
export interface DiagnosticResult {
  audioContext: {
    supported: boolean;
    state: string;
    canResume: boolean;
  };
  speechSynthesis: {
    supported: boolean;
    speaking: boolean;
    pending: boolean;
    paused: boolean;
  };
  voices: {
    total: number;
    local: number;
    remote: number;
    working: SpeechSynthesisVoice[];
  };
  system: {
    platform: string;
    userAgent: string;
    permissions: any[];
  };
}

export class SpeechDiagnostic {
  async runFullDiagnostic(): Promise<DiagnosticResult> {
    console.log('🔍 Démarrage diagnostic complet...');
    
    const result: DiagnosticResult = {
      audioContext: await this.testAudioContext(),
      speechSynthesis: this.testSpeechSynthesis(),
      voices: await this.testVoices(),
      system: this.getSystemInfo()
    };

    this.logResults(result);
    return result;
  }

  private async testAudioContext() {
    const test = {
      supported: false,
      state: 'unknown',
      canResume: false
    };

    try {
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        test.supported = true;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        test.state = ctx.state;
        
        if (ctx.state === 'suspended') {
          try {
            await ctx.resume();
            test.canResume = true;
            console.log('✅ AudioContext resumé avec succès');
          } catch (error) {
            console.error('❌ Impossible de reprendre AudioContext:', error);
          }
        }
        
        ctx.close();
      }
    } catch (error) {
      console.error('❌ Erreur test AudioContext:', error);
    }

    return test;
  }

  private testSpeechSynthesis() {
    const synth = window.speechSynthesis;
    return {
      supported: 'speechSynthesis' in window,
      speaking: synth?.speaking || false,
      pending: synth?.pending || false,
      paused: synth?.paused || false
    };
  }

  private async testVoices() {
    return new Promise<any>((resolve) => {
      const synth = window.speechSynthesis;
      
      const analyzeVoices = () => {
        const voices = synth.getVoices();
        const local = voices.filter(v => v.localService);
        const remote = voices.filter(v => !v.localService);

        console.log('🎤 Analyse des voix:');
        voices.forEach((voice, i) => {
          console.log(`${i}: ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
        });

        resolve({
          total: voices.length,
          local: local.length,
          remote: remote.length,
          working: voices // On testera plus tard lesquelles fonctionnent
        });
      };

      if (synth.getVoices().length > 0) {
        analyzeVoices();
      } else {
        synth.onvoiceschanged = analyzeVoices;
        // Timeout au cas où les voix ne se chargent jamais
        setTimeout(() => {
          if (synth.getVoices().length === 0) {
            console.warn('⚠️ Aucune voix chargée après 2 secondes');
          }
          analyzeVoices();
        }, 2000);
      }
    });
  }

  private getSystemInfo() {
    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      permissions: [] // Sera enrichi selon les besoins
    };
  }

  async testVoiceActually(voice: SpeechSynthesisVoice): Promise<boolean> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance('test');
      utterance.voice = voice;
      utterance.volume = 0.01; // Très faible pour ne pas déranger
      utterance.rate = 10; // Très rapide
      
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, 1000);

      utterance.onstart = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          window.speechSynthesis.cancel();
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

      window.speechSynthesis.speak(utterance);
    });
  }

  private logResults(result: DiagnosticResult) {
    console.log('📊 RÉSULTATS DIAGNOSTIC:');
    console.log('AudioContext:', result.audioContext);
    console.log('SpeechSynthesis:', result.speechSynthesis);
    console.log('Voix:', result.voices);
    console.log('Système:', result.system);
  }

  // Test d'audio système alternatif
  async testSystemAudio(): Promise<boolean> {
    try {
      // Créer un son de test avec Web Audio API
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = 440; // Note A
      gainNode.gain.value = 0.1; // Volume faible
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1); // 100ms
      
      console.log('✅ Test audio système réussi');
      return true;
    } catch (error) {
      console.error('❌ Test audio système échoué:', error);
      return false;
    }
  }
}