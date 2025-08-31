/**
 * CLIENT OPENAI POUR FALLBACK THÉRAPEUTIQUE
 * Service de fallback quand Gemini API est indisponible
 */

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIClient {
  private static instance: OpenAIClient | null = null;
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  private constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.validateApiKey();
  }

  static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  private validateApiKey(): void {
    if (!this.apiKey || this.apiKey === 'your-openai-api-key') {
      throw new Error(`
        ❌ OpenAI API key not found or invalid.
        
        Please ensure VITE_OPENAI_API_KEY is set in your .env file:
        VITE_OPENAI_API_KEY=sk-...your-actual-key
        
        Current value: ${this.apiKey || 'undefined'}
      `);
    }
  }

  async generateTherapeuticResponse(
    messages: OpenAIMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<OpenAIResponse> {
    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      maxTokens = 1000
    } = options;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('Aucune réponse générée par OpenAI');
      }

      return {
        content: data.choices[0].message.content.trim(),
        usage: data.usage
      };

    } catch (error) {
      console.error('Erreur OpenAI API:', error);
      throw error;
    }
  }

  /**
   * Méthode spécialisée pour les réponses thérapeutiques
   */
  async generateTherapeuticMessage(
    expertPersonality: string,
    userMessage: string,
    context: string = ''
  ): Promise<string> {
    const systemPrompt = this.buildTherapeuticSystemPrompt(expertPersonality);
    const contextualPrompt = context ? `Contexte: ${context}\n\n` : '';
    
    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${contextualPrompt}Message utilisateur: ${userMessage}` }
    ];

    const response = await this.generateTherapeuticResponse(messages, {
      temperature: 0.8,
      maxTokens: 800
    });

    return response.content;
  }

  private buildTherapeuticSystemPrompt(expertPersonality: string): string {
    const basePrompt = `Tu es un thérapeute professionnel bienveillant et empathique. Tu dois répondre de manière chaleureuse, compréhensive et thérapeutiquement appropriée.

RÈGLES IMPORTANTES:
- Sois toujours empathique et non-jugeant
- Pose des questions ouvertes pour encourager l'expression
- Utilise des techniques de validation émotionnelle
- Reste dans un cadre thérapeutique professionnel
- Adapte ton langage au niveau du patient
- N'impose jamais de solutions, guide vers la découverte
- En cas de signaux d'alarme, oriente vers des ressources appropriées

STYLE DE RÉPONSE:
- Réponses de 2-4 phrases maximum
- Langage naturel et accessible
- Ton chaleureux mais professionnel
- Questions de suivi pertinentes`;

    // Adaptations selon l'expert
    const expertAdaptations = {
      'dr_sarah_empathie': `
SPÉCIALISATION: Expert en empathie et validation émotionnelle
- Mets l'accent sur la validation des émotions
- Utilise des phrases comme "Je comprends que..." ou "C'est tout à fait normal de..."
- Encourage l'expression émotionnelle libre`,

      'dr_alex_mindfulness': `
SPÉCIALISATION: Expert en mindfulness et pleine conscience  
- Intègre des éléments de pleine conscience
- Encourage l'observation des sensations et émotions
- Utilise des techniques de respiration et d'ancrage`,

      'dr_aicha_culturelle': `
SPÉCIALISATION: Expert en sensibilité culturelle (culture maghrebine/arabe)
- Respecte les valeurs familiales et culturelles
- Comprend les dynamiques communautaires
- Peut utiliser quelques expressions arabes appropriées (avec traduction)
- Sensible aux questions d'honneur, de famille élargie`
    };

    return basePrompt + (expertAdaptations[expertPersonality as keyof typeof expertAdaptations] || '');
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'your-openai-api-key';
  }
}

export default OpenAIClient;
