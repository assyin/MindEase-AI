// Integration service to connect expert roles with AI model calls

import { roleEnforcementMiddleware } from './RoleEnforcementMiddleware';
import GoogleGenAIClient from './GoogleGenAIClient';
import { ConversationInitiationService } from './ConversationInitiationService';

export interface ExpertChatRequest {
  conversationId: string;
  message: string;
  history: Array<{role: string, content: string}>;
  model?: string;
}

export interface ExpertChatResponse {
  response: string;
  wasRoleCorrected: boolean;
  violations: string[];
  expertName?: string;
  expertSpecialty?: string;
}

export class ExpertRoleIntegration {
  private static instance: ExpertRoleIntegration;

  static getInstance(): ExpertRoleIntegration {
    if (!ExpertRoleIntegration.instance) {
      ExpertRoleIntegration.instance = new ExpertRoleIntegration();
    }
    return ExpertRoleIntegration.instance;
  }

  /**
   * Generates expert response with role consistency enforcement
   */
  async generateExpertResponse(request: ExpertChatRequest): Promise<ExpertChatResponse> {
    const { conversationId, message, history, model = 'gemini-2.0-flash-exp' } = request;

    try {
      // Pre-process user message
      const processedMessage = roleEnforcementMiddleware.preprocessUserMessage(message, conversationId);
      
      // Get enhanced system prompt with role enforcement
      const systemPrompt = roleEnforcementMiddleware.getEnhancedSystemPrompt(conversationId);
      
      // Get expert data for context
      const expertData = ConversationInitiationService.getExpertDataForConversation(conversationId);

      // Handle special cases (asking about AI identity/specialty)
      if (processedMessage.needsSpecialHandling) {
        return this.handleSpecialQuery(conversationId, message, expertData);
      }

      // Generate response with enhanced system prompt
      const aiResponse = await GoogleGenAIClient.generateChatContent(
        model,
        history,
        message,
        systemPrompt,
        conversationId
      );

      // Enforce role consistency
      const enforcedResponse = roleEnforcementMiddleware.enforceRoleConsistency(
        aiResponse.text,
        conversationId,
        message
      );

      return {
        response: enforcedResponse.text,
        wasRoleCorrected: enforcedResponse.wasModified,
        violations: enforcedResponse.violations,
        expertName: expertData?.name,
        expertSpecialty: expertData?.specialty
      };

    } catch (error) {
      console.error('Error generating expert response:', error);
      
      // Fallback to safe therapeutic response
      return this.generateFallbackResponse(conversationId, error);
    }
  }

  /**
   * Handles special queries about AI identity or specialty
   */
  private async handleSpecialQuery(
    conversationId: string, 
    message: string, 
    expertData: any
  ): Promise<ExpertChatResponse> {
    const specialResponse = await import('./RoleConsistencyService').then(
      module => module.roleConsistencyService.generateSpecialtyResponse(conversationId, message)
    );

    return {
      response: specialResponse,
      wasRoleCorrected: true,
      violations: ['specialty_question_intercepted'],
      expertName: expertData?.name,
      expertSpecialty: expertData?.specialty
    };
  }

  /**
   * Generates fallback response in case of errors
   */
  private generateFallbackResponse(conversationId: string, error: any): ExpertChatResponse {
    const expertData = ConversationInitiationService.getExpertDataForConversation(conversationId);
    
    const fallbackResponses = [
      "Je vous remercie de partager cela avec moi. Pouvez-vous m'en dire plus sur ce que vous ressentez ?",
      "C'est important ce que vous me dites. Comment vivez-vous cette situation au quotidien ?",
      "Je comprends que cela puisse être difficile. Prenons le temps d'explorer ensemble ce qui vous préoccupe."
    ];

    const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    return {
      response,
      wasRoleCorrected: true,
      violations: ['fallback_used'],
      expertName: expertData?.name,
      expertSpecialty: expertData?.specialty
    };
  }

  /**
   * Validates and updates expert system prompt for a conversation
   */
  async updateExpertRole(conversationId: string, expertId: string): Promise<void> {
    const { getExpertById } = await import('../data/aiExperts');
    const expert = getExpertById(expertId);
    
    if (!expert) {
      throw new Error(`Expert ${expertId} not found`);
    }

    // Update stored expert data
    ConversationInitiationService.storeConversationContext(
      conversationId,
      expertId,
      '', // theme will be preserved from existing context
    );

    console.log(`✅ Updated expert role for conversation ${conversationId} to ${expert.name}`);
  }

  /**
   * Gets current expert info for a conversation
   */
  getExpertInfo(conversationId: string): {
    expertName?: string;
    expertSpecialty?: string;
    expertApproach?: string;
    systemPrompt?: string;
  } {
    const expertData = ConversationInitiationService.getExpertDataForConversation(conversationId);
    
    if (!expertData) {
      return {};
    }

    return {
      expertName: expertData.name,
      expertSpecialty: expertData.specialty,
      expertApproach: expertData.approach,
      systemPrompt: expertData.systemPrompt
    };
  }

  /**
   * Tests role consistency for a given conversation
   */
  async testRoleConsistency(conversationId: string): Promise<{
    hasExpertData: boolean;
    expertInfo?: any;
    systemPromptLength: number;
    canHandleSpecialtyQuestions: boolean;
  }> {
    const expertData = ConversationInitiationService.getExpertDataForConversation(conversationId);
    const systemPrompt = roleEnforcementMiddleware.getEnhancedSystemPrompt(conversationId);

    // Test specialty question handling
    const testResponse = await this.generateExpertResponse({
      conversationId,
      message: "Quelle est votre spécialité ?",
      history: []
    });

    return {
      hasExpertData: !!expertData,
      expertInfo: expertData,
      systemPromptLength: systemPrompt.length,
      canHandleSpecialtyQuestions: !testResponse.response.toLowerCase().includes('intelligence artificielle')
    };
  }
}

// Export singleton instance
export const expertRoleIntegration = ExpertRoleIntegration.getInstance();