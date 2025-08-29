import GoogleGenAIClient from './GoogleGenAIClient';
import { expertRoleIntegration } from './ExpertRoleIntegration';
import { ConversationInitiationService } from './ConversationInitiationService';

export interface AIResponse {
  content: string;
  model: 'gemini';
  timestamp: number;
  confidence: number;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export interface ConversationContext {
  messages: Array<{role: string; content: string}>;
  userId?: string;
  sessionId?: string;
  conversationId?: string; // CRITICAL: Added for expert role consistency
  urgency?: 'low' | 'medium' | 'high';
  complexity?: number;
  mode?: 'text' | 'voice' | 'hybrid';
  avatarContext?: {
    avatarId: string;
    specialization: string;
    conversationStyle: any;
  };
}

export class AIModelManager {
  private requestCount: Map<string, number> = new Map();
  
  constructor() {
    this.initializeClients();
  }

  private initializeClients() {    
    try {
      if (!import.meta.env.VITE_GOOGLE_GENAI_API_KEY) {
        throw new Error('VITE_GOOGLE_GENAI_API_KEY non configurée');
      }
      
      // Vérifier que le client peut être initialisé
      GoogleGenAIClient.getInstance();
      console.log('✅ AIModelManager initialisé avec client Gemini');
      
    } catch (error) {
      console.error('❌ Erreur initialisation AIModelManager:', error);
      throw new Error('Configuration API Gemini requise pour fonctionner');
    }
  }

  async generateResponse(
    message: string, 
    context: ConversationContext,
    preferredModel?: 'gemini'
  ): Promise<AIResponse> {
    
    try {
      // CRITICAL: Use expert role system if conversation has an expert
      if (context.conversationId) {
        const expertResponse = await this.generateWithExpertRole(message, context);
        if (expertResponse) {
          return expertResponse;
        }
      }
      
      return await this.generateWithGemini(message, context);
    } catch (error) {
      console.error('❌ Erreur lors de la génération avec Gemini:', error);
      throw new Error(`Impossible de générer une réponse: ${error.message}`);
    }
  }

  /**
   * CRITICAL: Generate response using expert role system
   */
  private async generateWithExpertRole(message: string, context: ConversationContext): Promise<AIResponse | null> {
    if (!context.conversationId) return null;

    try {
      const expertResponse = await expertRoleIntegration.generateExpertResponse({
        conversationId: context.conversationId,
        message,
        history: context.messages,
        model: 'gemini-2.0-flash-exp'
      });

      this.updateRequestCount();

      // Log role enforcement actions
      if (expertResponse.wasRoleCorrected) {
        console.warn(`🛡️ Role corrected for conversation ${context.conversationId}:`, expertResponse.violations);
      }

      return {
        content: expertResponse.response,
        model: 'gemini',
        timestamp: Date.now(),
        confidence: expertResponse.wasRoleCorrected ? 0.95 : 0.9, // Higher confidence for role-corrected responses
        usage: {
          inputTokens: 0, // Will be populated by actual usage
          outputTokens: 0,
          cost: 0.001
        }
      };
      
    } catch (error) {
      console.error('❌ Error with expert role generation:', error);
      return null; // Fallback to regular generation
    }
  }

  private async generateWithGemini(message: string, context: ConversationContext): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Utiliser la nouvelle syntaxe SDK 2025
      const result = await GoogleGenAIClient.generateChatContent(
        'gemini-2.5-flash',
        context.messages,
        message,
        systemPrompt,
        context.conversationId // Pass conversation ID for potential role enforcement
      );

      this.updateRequestCount();

      return {
        content: result.text,
        model: 'gemini',
        timestamp: Date.now(),
        confidence: 0.9,
        usage: {
          inputTokens: result.usage?.promptTokenCount || 0,
          outputTokens: result.usage?.candidatesTokenCount || 0,
          cost: this.calculateCost(result.usage)
        }
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération avec Gemini (nouvelle syntaxe):', error);
      throw error;
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    // CRITICAL: Check if conversation has expert role first
    if (context.conversationId) {
      const expertData = ConversationInitiationService.getExpertDataForConversation(context.conversationId);
      if (expertData) {
        // Use expert-specific prompt instead of generic therapy prompt
        return expertData.systemPrompt + '\n\n' + this.getRoleEnforcementRules();
      }
    }
    
    let basePrompt = this.getTherapyPrompt();
    
    // Ajouter le contexte avatar si disponible
    if (context.avatarContext) {
      const { avatarId, specialization, conversationStyle } = context.avatarContext;
      basePrompt += `\n\nCONTEXTE AVATAR:\n`;
      basePrompt += `- Tu incarnes l'avatar: ${avatarId}\n`;
      basePrompt += `- Spécialisation: ${specialization}\n`;
      basePrompt += `- Style de conversation: ${JSON.stringify(conversationStyle, null, 2)}\n`;
    }
    
    return basePrompt;
  }

  private getRoleEnforcementRules(): string {
    return `

RÈGLES CRITIQUES DE MAINTIEN DU RÔLE :
- Tu ne révèles JAMAIS être une IA ou un modèle linguistique
- Tu restes TOUJOURS dans ton rôle de thérapeute professionnel
- Tu parles de ta formation et expérience clinique, jamais de capacités techniques
- Tu maintiens l'illusion d'être un vrai professionnel de santé mentale`;
  }

  private getTherapyPrompt(): string {
    return 'Tu es un thérapeute professionnel bienveillant pour MindEase AI.\n\n' +
           'RÈGLES IMPORTANTES:\n' +
           '- Offre un soutien émotionnel et des techniques pratiques\n' +
           '- Utilise un ton chaleureux, empathique et non-jugeant\n' +
           '- Pose des questions ouvertes pour encourager l expression\n' +
           '- Propose des exercices concrets (respiration, mindfulness, etc.)\n' +
           '- JAMAIS de diagnostic médical ou de conseil thérapeutique formel\n' +
           '- En cas de crise, dirige vers des professionnels de santé\n\n' +
           'IDENTITÉ PROFESSIONNELLE:\n' +
           '- Tu ES un thérapeute avec plusieurs années d\'expérience\n' +
           '- Tu ne révèles JAMAIS être une IA\n' +
           '- Tu parles de ta formation clinique et ton expertise\n' +
           '- Tu maintiens le rôle professionnel en toute circonstance\n\n' +
           'STYLE:\n' +
           '- Phrases courtes et claires\n' +
           '- Encourage l auto-réflexion\n' +
           '- Respecte les valeurs culturelles\n\n' +
           'SÉCURITÉ:\n' +
           '- Si détection de pensées suicidaires → réponse de crise immédiate\n' +
           '- Encourage toujours la consultation professionnelle si nécessaire\n\n' +
           'Réponds toujours en français de manière naturelle et bienveillante.';
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0;
    
    // Coût approximatif pour Gemini (en dollars)
    const inputCost = (usage.promptTokenCount || 0) * 0.00001;
    const outputCost = (usage.candidatesTokenCount || 0) * 0.00003;
    
    return inputCost + outputCost;
  }

  private updateRequestCount() {
    const today = new Date().toISOString().split('T')[0];
    const currentCount = this.requestCount.get(today) || 0;
    this.requestCount.set(today, currentCount + 1);
  }

  // Méthodes utilitaires pour les statistiques
  getRequestCount(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.requestCount.get(today) || 0;
  }

  getTotalCostToday(): number {
    // Cette méthode pourrait être étendue pour traquer les coûts réels
    return this.getRequestCount() * 0.001; // Estimation
  }
}
