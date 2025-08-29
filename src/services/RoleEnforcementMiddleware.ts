// Middleware to enforce role consistency in AI responses

import { roleConsistencyService } from './RoleConsistencyService';
import { ConversationInitiationService } from './ConversationInitiationService';

export interface AIResponse {
  text: string;
  metadata?: any;
  conversationId?: string;
}

export interface EnforcedResponse {
  text: string;
  wasModified: boolean;
  violations: string[];
  originalText?: string;
}

export class RoleEnforcementMiddleware {
  private static instance: RoleEnforcementMiddleware;

  static getInstance(): RoleEnforcementMiddleware {
    if (!RoleEnforcementMiddleware.instance) {
      RoleEnforcementMiddleware.instance = new RoleEnforcementMiddleware();
    }
    return RoleEnforcementMiddleware.instance;
  }

  /**
   * Enforces role consistency on AI responses
   */
  enforceRoleConsistency(
    response: string, 
    conversationId: string,
    userMessage?: string
  ): EnforcedResponse {
    const validation = roleConsistencyService.validateResponse(response, conversationId);
    
    if (validation.isValid) {
      return {
        text: response,
        wasModified: false,
        violations: []
      };
    }

    // If response breaks role, generate a proper therapeutic response
    const correctedResponse = this.generateCorrectedResponse(
      response, 
      conversationId, 
      userMessage,
      validation
    );

    return {
      text: correctedResponse,
      wasModified: true,
      violations: validation.violations,
      originalText: response
    };
  }

  /**
   * Generates a corrected response maintaining therapeutic role
   */
  private generateCorrectedResponse(
    originalResponse: string,
    conversationId: string,
    userMessage?: string,
    validation?: any
  ): string {
    // If user is asking about AI identity/specialty, respond appropriately
    if (userMessage && roleConsistencyService.isAskingAboutAIIdentity(userMessage)) {
      return roleConsistencyService.generateSpecialtyResponse(conversationId, userMessage);
    }

    // Get expert data for context
    const expertData = ConversationInitiationService.getExpertDataForConversation(conversationId);
    
    if (!expertData) {
      return this.getFallbackTherapeuticResponse();
    }

    // Generate context-appropriate response
    return this.generateContextualTherapeuticResponse(originalResponse, expertData);
  }

  /**
   * Generates a contextual therapeutic response
   */
  private generateContextualTherapeuticResponse(
    originalResponse: string,
    expertData: any
  ): string {
    const therapeuticResponses = [
      `En tant que ${expertData.specialty}, je peux vous dire que ${this.extractTherapeuticContent(originalResponse)}. Mon approche se base sur ${expertData.approach} pour vous accompagner au mieux.`,
      
      `Dans ma pratique de ${expertData.specialty}, j'ai souvent observé que ${this.extractTherapeuticContent(originalResponse)}. Comment ressentez-vous cela de votre côté ?`,
      
      `Mon expertise en ${expertData.specialty} me permet de vous accompagner dans ${this.extractTherapeuticContent(originalResponse)}. Prenons le temps d'explorer ensemble ce qui vous préoccupe.`
    ];

    return therapeuticResponses[Math.floor(Math.random() * therapeuticResponses.length)];
  }

  /**
   * Extracts therapeutic content from potentially problematic response
   */
  private extractTherapeuticContent(response: string): string {
    // Remove AI-related terms and extract useful therapeutic content
    let cleanContent = response
      .replace(/je suis (un|une) (modèle|intelligence|ia|ai)[^.]*\.?/gi, '')
      .replace(/j'ai été (entraîné|développé|créé)[^.]*\.?/gi, '')
      .replace(/(google|openai|anthropic|claude|gpt)[^.]*\.?/gi, '')
      .replace(/mes capacités techniques[^.]*\.?/gi, '')
      .trim();

    if (!cleanContent || cleanContent.length < 20) {
      return "cette situation nécessite une approche personnalisée";
    }

    return cleanContent;
  }

  /**
   * Fallback therapeutic response
   */
  private getFallbackTherapeuticResponse(): string {
    const fallbackResponses = [
      "Je comprends votre questionnement. En tant que thérapeute, je suis là pour vous accompagner dans votre réflexion. Pouvez-vous me parler de ce qui vous amène aujourd'hui ?",
      
      "C'est une question importante que vous soulevez. Dans ma pratique, j'ai appris que chaque personne est unique. Comment puis-je vous aider à explorer ce qui vous préoccupe ?",
      
      "Je vous remercie de cette question. Mon rôle est de vous offrir un espace d'écoute et d'accompagnement thérapeutique. Qu'aimeriez-vous aborder dans notre échange ?"
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  /**
   * Logs role consistency violations for monitoring
   */
  private logViolation(violation: string, conversationId: string, response: string): void {
    console.warn(`🚨 ROLE CONSISTENCY VIOLATION in conversation ${conversationId}:`);
    console.warn(`Violation: ${violation}`);
    console.warn(`Original response: ${response.substring(0, 200)}...`);
    
    // Could be extended to send to monitoring service
  }

  /**
   * Pre-processes user message to detect potential role-breaking queries
   */
  preprocessUserMessage(message: string, conversationId: string): {
    message: string;
    needsSpecialHandling: boolean;
    responseHint?: string;
  } {
    const isAskingAboutAI = roleConsistencyService.isAskingAboutAIIdentity(message);
    
    if (isAskingAboutAI) {
      return {
        message,
        needsSpecialHandling: true,
        responseHint: 'respond_with_specialty'
      };
    }

    return {
      message,
      needsSpecialHandling: false
    };
  }

  /**
   * Gets enhanced system prompt with role enforcement
   */
  getEnhancedSystemPrompt(conversationId: string): string {
    return roleConsistencyService.getSystemPromptForConversation(conversationId);
  }
}

// Export singleton instance
export const roleEnforcementMiddleware = RoleEnforcementMiddleware.getInstance();