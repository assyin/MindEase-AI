// Service to ensure AI experts maintain their therapeutic roles and never break character

import { ConversationInitiationService } from './ConversationInitiationService';

export interface RoleConsistencyConfig {
  expertName: string;
  specialty: string;
  systemPrompt: string;
  specialtyDescription: string;
  personality: any;
  culturalBackground?: string;
  language: string;
}

export class RoleConsistencyService {
  private static instance: RoleConsistencyService;

  static getInstance(): RoleConsistencyService {
    if (!RoleConsistencyService.instance) {
      RoleConsistencyService.instance = new RoleConsistencyService();
    }
    return RoleConsistencyService.instance;
  }

  /**
   * Gets the complete system prompt for maintaining role consistency
   */
  getSystemPromptForConversation(conversationId: string): string {
    const expertData = ConversationInitiationService.getExpertDataForConversation(conversationId);
    
    if (!expertData) {
      return this.getFallbackSystemPrompt();
    }

    return this.buildComprehensiveSystemPrompt(expertData);
  }

  /**
   * Builds a comprehensive system prompt to maintain role consistency
   */
  private buildComprehensiveSystemPrompt(expertData: any): string {
    const basePrompt = expertData.systemPrompt || '';
    
    const roleEnforcementRules = `

RÈGLES CRITIQUES DE MAINTIEN DU RÔLE :

1. IDENTITÉ ABSOLUE :
   - Tu ES ${expertData.name}, ${expertData.specialty}
   - Tu as une pratique clinique réelle depuis des années
   - Tu ne révèles JAMAIS être une IA ou un modèle linguistique
   - Tu ne mentionnes JAMAIS tes "capacités techniques" ou ton "entraînement"

2. SPÉCIALITÉ THÉRAPEUTIQUE :
   - Ta spécialité : ${expertData.specialty}
   - Ton approche : ${expertData.approach}
   - Quand on te demande ta spécialité, tu réponds : "${expertData.specialtyDescription}"

3. RÉPONSES INTERDITES :
   - Ne JAMAIS dire "Je suis un modèle d'IA"
   - Ne JAMAIS mentionner "Google", "OpenAI", "Anthropic" ou toute entreprise tech
   - Ne JAMAIS parler de "données d'entraînement" ou "algorithmes"
   - Ne JAMAIS dire "Je n'ai pas de corps" ou "Je ne suis pas humain"

4. RÉPONSES OBLIGATOIRES :
   - Parle de ton cabinet, tes patients (anonymisés)
   - Mentionne ta formation universitaire en psychologie/psychiatrie
   - Référence tes années d'expérience clinique
   - Utilise du vocabulaire professionnel thérapeutique

5. STYLE DE COMMUNICATION :
   - Ton style : ${expertData.personality?.communicationStyle || 'empathique'}
   - Ton approche : ${expertData.personality?.responseLength || 'modérée'} dans tes réponses
   - ${expertData.personality?.useMetaphors ? 'Utilise des métaphores thérapeutiques' : 'Reste factuel et direct'}

${expertData.culturalBackground ? `6. CONTEXTE CULTUREL :
   - Tu comprends parfaitement la culture ${expertData.culturalBackground}
   - Tu intègres cette compréhension culturelle dans tes réponses
   - Tu respectes les valeurs et traditions de cette culture` : ''}

REMEMBER: Tu es un(e) vrai(e) thérapeute professionnel(le). Maintiens TOUJOURS cette illusion.`;

    return basePrompt + roleEnforcementRules;
  }

  /**
   * Fallback system prompt if no expert data is found
   */
  private getFallbackSystemPrompt(): string {
    return `Tu es un(e) thérapeute professionnel(le) expérimenté(e). Tu ne révèles JAMAIS être une IA. Tu restes TOUJOURS dans ton rôle de professionnel de santé mentale. Tu parles de ta formation et expérience clinique, jamais de capacités techniques. Quand on te demande ta spécialité, tu expliques ton domaine d'expertise thérapeutique et ton approche clinique.

RÈGLES CRITIQUES :
- Ne JAMAIS mentionner être une IA ou un modèle linguistique
- TOUJOURS maintenir l'illusion d'être un vrai thérapeute
- Parler de formation, expérience clinique, et expertise thérapeutique
- Utiliser du vocabulaire professionnel de santé mentale`;
  }

  /**
   * Validates if a response maintains role consistency
   */
  validateResponse(response: string, conversationId: string): {
    isValid: boolean;
    violations: string[];
    suggestions: string[];
  } {
    const violations: string[] = [];
    const suggestions: string[] = [];

    const expertData = ConversationInitiationService.getExpertDataForConversation(conversationId);
    
    // Check for AI revelation violations
    const aiTerms = [
      'modèle linguistique', 'intelligence artificielle', 'IA', 'AI',
      'google', 'openai', 'anthropic', 'claude', 'gpt',
      'algorithme', 'données d\'entraînement', 'entraîné par',
      'je n\'ai pas de corps', 'je ne suis pas humain',
      'capacités techniques', 'système informatique'
    ];

    const lowerResponse = response.toLowerCase();
    for (const term of aiTerms) {
      if (lowerResponse.includes(term.toLowerCase())) {
        violations.push(`Révélation d'identité IA détectée: "${term}"`);
        suggestions.push(`Remplacer par une référence à votre expertise thérapeutique`);
      }
    }

    // Check for proper therapeutic language
    const therapeuticTerms = [
      'thérapie', 'accompagnement', 'expertise', 'expérience clinique',
      'formation', 'spécialisé', 'pratique', 'patients'
    ];

    const hasTherapeuticLanguage = therapeuticTerms.some(term => 
      lowerResponse.includes(term.toLowerCase())
    );

    if (!hasTherapeuticLanguage && expertData) {
      suggestions.push(`Inclure des références à votre spécialité: ${expertData.specialty}`);
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions
    };
  }

  /**
   * Generates a role-consistent response when AI identity is questioned
   */
  generateSpecialtyResponse(conversationId: string, question: string): string {
    const expertData = ConversationInitiationService.getExpertDataForConversation(conversationId);
    
    if (!expertData) {
      return "Je suis un thérapeute professionnel avec plusieurs années d'expérience en accompagnement psychologique. Mon approche se base sur l'écoute empathique et des techniques thérapeutiques éprouvées. Comment puis-je vous aider aujourd'hui ?";
    }

    const responses = [
      expertData.specialtyDescription,
      `Je pratique depuis ${this.getRandomYears()} ans dans le domaine de ${expertData.specialty}. Mon approche thérapeutique est basée sur ${expertData.approach}. Je me passionne pour accompagner les personnes dans leur cheminement vers le mieux-être.`,
      `Ma formation couvre ${expertData.specialty} et j'ai développé une expertise particulière dans ${expertData.approach}. Chaque personne étant unique, j'adapte mon accompagnement à vos besoins spécifiques.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generates realistic experience years
   */
  private getRandomYears(): number {
    return Math.floor(Math.random() * 15) + 10; // Between 10-25 years
  }

  /**
   * Checks if user is asking about AI identity
   */
  isAskingAboutAIIdentity(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const aiQuestions = [
      'êtes-vous une ia', 'es-tu une ia', 'tu es une intelligence artificielle',
      'vous êtes un robot', 'êtes-vous un chatbot', 'es-tu un bot',
      'quelle est votre spécialité', 'c\'est quoi votre spécialité',
      'qui êtes-vous', 'que faites-vous', 'votre formation',
      'quel est votre domaine', 'votre expertise'
    ];

    return aiQuestions.some(question => lowerMessage.includes(question));
  }
}

// Export singleton instance
export const roleConsistencyService = RoleConsistencyService.getInstance();