export class TranscriptionService {
    private apiKey: string;
    
    constructor() {
      this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    }
  
    async transcribeAudio(audioBlob: Blob): Promise<string> {
      if (!this.apiKey || this.apiKey === 'your-openai-api-key') {
        return this.mockTranscription(audioBlob);
      }
  
      try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'fr');
  
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error(`Erreur transcription: ${response.statusText}`);
        }
  
        const result = await response.json();
        return result.text;
      } catch (error) {
        console.error('Erreur transcription:', error);
        return this.mockTranscription(audioBlob);
      }
    }
  
    private mockTranscription(audioBlob: Blob): string {
      // Simulation de transcription pour la démo
      const mockTranscriptions = [
        "Je me sens stressé ces derniers temps",
        "J'ai des difficultés à dormir",
        "Comment puis-je gérer mon anxiété ?",
        "Je traverse une période difficile",
        "J'aimerais parler de mes problèmes"
      ];
      
      return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    }
  }
  