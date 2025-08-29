// Service for handling automatic conversation opening by AI experts

import { AIExpert, getExpertById } from '../data/aiExperts';
import { TherapyTheme, getThemeById } from '../data/therapyThemes';
import { conversationManager } from './ConversationManager';
import { geminiTTSService } from './GeminiTTSService';

export interface ConversationContext {
  conversationId: string;
  expertId: string;
  themeId: string;
  userPreferences?: {
    preferredLanguage?: string;
    communicationStyle?: string;
  };
}

export class ConversationInitiationService {
  private static instance: ConversationInitiationService;

  static getInstance(): ConversationInitiationService {
    if (!ConversationInitiationService.instance) {
      ConversationInitiationService.instance = new ConversationInitiationService();
    }
    return ConversationInitiationService.instance;
  }

  /**
   * Initiates a conversation with an AI expert opening message
   */
  async initiateConversation(context: ConversationContext): Promise<void> {
    const { conversationId, expertId, themeId } = context;

    const expert = getExpertById(expertId);
    const theme = getThemeById(themeId);

    if (!expert || !theme) {
      throw new Error('Expert or theme not found');
    }

    try {
      // Generate personalized opening message
      const openingMessage = this.generateOpeningMessage(expert, theme, context);

      // CRITICAL: Store expert system prompt for this conversation
      this.storeExpertSystemPrompt(conversationId, expert);

      // Add the expert's opening message to the conversation
      await conversationManager.addMessage(conversationId, {
        role: 'assistant',
        content: openingMessage,
        timestamp: Date.now(),
        ai_model: 'gemini'
      });

      // Generate and play the welcome audio (optional)
      await this.playWelcomeAudio(expert, openingMessage);

    } catch (error) {
      console.error('Error initiating conversation:', error);
      // Fallback to a generic opening
      await this.addFallbackOpeningMessage(conversationId, expert);
    }
  }

  /**
   * Generates a personalized opening message based on expert personality and theme
   */
  private generateOpeningMessage(
    expert: AIExpert, 
    theme: TherapyTheme, 
    context: ConversationContext
  ): string {
    const baseMessages = expert.openingMessages;
    const selectedMessage = baseMessages[Math.floor(Math.random() * baseMessages.length)];

    // Customize message based on theme if needed
    const themeSpecificElements = this.getThemeSpecificElements(theme);
    
    if (themeSpecificElements) {
      return `${selectedMessage}\n\n${themeSpecificElements}`;
    }

    return selectedMessage;
  }

  /**
   * Gets theme-specific elements to add to opening message
   */
  private getThemeSpecificElements(theme: TherapyTheme): string | null {
    const themeAdditions: Record<string, string> = {
      'anxiety': "Je vois que tu souhaites parler d'anxiété. C'est un grand pas de chercher de l'aide. Prenons le temps qu'il faut.",
      'depression': "Je comprends que tu traverses une période difficile. Nous sommes ici pour explorer ensemble ce que tu ressens.",
      'stress': "Le stress peut être épuisant. Ensemble, nous allons trouver des moyens de mieux le gérer au quotidien.",
      'work-stress': "Les défis professionnels peuvent être accablants. Parlons de ce qui se passe dans ton environnement de travail.",
      'relationships': "Les relations humaines sont complexes. Je suis là pour t'aider à y voir plus clair.",
      'trauma': "Je sais que parler de traumatisme demande beaucoup de courage. Nous irons à ton rythme, en toute sécurité."
    };

    return themeAdditions[theme.id] || null;
  }

  /**
   * Plays the welcome audio using TTS
   */
  private async playWelcomeAudio(expert: AIExpert, message: string): Promise<void> {
    try {
      await geminiTTSService.speak(message, {
        voice_id: expert.voice,
        language_code: expert.language,
        speaking_rate: expert.personality.communicationStyle === 'calming' ? 0.9 : 1.0,
        pitch: 0,
        volume_gain_db: 0,
        emotional_tone: expert.personality.communicationStyle as any,
        pause_duration: 500
      });
    } catch (error) {
      console.warn('Could not play welcome audio:', error);
      // Audio failure should not break the conversation initiation
    }
  }

  /**
   * Stores expert system prompt for maintaining role consistency
   */
  private storeExpertSystemPrompt(conversationId: string, expert: AIExpert): void {
    try {
      const systemPromptData = {
        expertId: expert.id,
        systemPrompt: expert.systemPrompt,
        specialtyDescription: expert.specialtyDescription,
        name: expert.name,
        specialty: expert.specialty,
        approach: expert.approach,
        personality: expert.personality,
        culturalBackground: expert.culturalBackground,
        language: expert.language,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(`conversation_system_prompt_${conversationId}`, JSON.stringify(systemPromptData));
    } catch (error) {
      console.error('Error storing system prompt:', error);
    }
  }

  /**
   * Gets system prompt for a conversation to maintain role consistency
   */
  static getSystemPromptForConversation(conversationId: string): string | null {
    try {
      const stored = localStorage.getItem(`conversation_system_prompt_${conversationId}`);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      return data.systemPrompt || null;
    } catch (error) {
      console.error('Error retrieving system prompt:', error);
      return null;
    }
  }

  /**
   * Gets expert data for role consistency in responses
   */
  static getExpertDataForConversation(conversationId: string): any | null {
    try {
      const stored = localStorage.getItem(`conversation_system_prompt_${conversationId}`);
      if (!stored) return null;
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error retrieving expert data:', error);
      return null;
    }
  }

  /**
   * Fallback opening message if personalization fails
   */
  private async addFallbackOpeningMessage(conversationId: string, expert: AIExpert): Promise<void> {
    const fallbackMessage = expert.openingMessages[0] || 
      "Bonjour, je suis là pour t'accompagner. Comment puis-je t'aider aujourd'hui ?";

    // Still store system prompt even for fallback
    this.storeExpertSystemPrompt(conversationId, expert);

    await conversationManager.addMessage(conversationId, {
      role: 'assistant',
      content: fallbackMessage,
      timestamp: Date.now(),
      ai_model: 'gemini'
    });
  }

  /**
   * Retrieves conversation context from localStorage
   */
  static getConversationContext(conversationId: string): ConversationContext | null {
    try {
      const stored = localStorage.getItem(`conversation_expert_${conversationId}`);
      if (!stored) return null;

      const data = JSON.parse(stored);
      return {
        conversationId,
        expertId: data.expertId,
        themeId: data.themeId,
        userPreferences: data.userPreferences
      };
    } catch (error) {
      console.error('Error retrieving conversation context:', error);
      return null;
    }
  }

  /**
   * Stores conversation context in localStorage
   */
  static storeConversationContext(
    conversationId: string, 
    expertId: string, 
    themeId: string,
    userPreferences?: any
  ): void {
    try {
      const context = {
        expertId,
        themeId,
        userPreferences,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(`conversation_expert_${conversationId}`, JSON.stringify(context));
    } catch (error) {
      console.error('Error storing conversation context:', error);
    }
  }

  /**
   * Gets current expert for a conversation
   */
  static getCurrentExpert(conversationId: string): AIExpert | null {
    const context = ConversationInitiationService.getConversationContext(conversationId);
    if (!context) return null;
    
    return getExpertById(context.expertId) || null;
  }

  /**
   * Gets current theme for a conversation
   */
  static getCurrentTheme(conversationId: string): TherapyTheme | null {
    const context = ConversationInitiationService.getConversationContext(conversationId);
    if (!context) return null;
    
    return getThemeById(context.themeId) || null;
  }

  /**
   * Updates expert for an existing conversation
   */
  async updateConversationExpert(conversationId: string, newExpertId: string): Promise<void> {
    const context = ConversationInitiationService.getConversationContext(conversationId);
    if (!context) throw new Error('Conversation context not found');

    const newExpert = getExpertById(newExpertId);
    if (!newExpert) throw new Error('Expert not found');

    // Store updated context
    ConversationInitiationService.storeConversationContext(
      conversationId, 
      newExpertId, 
      context.themeId, 
      context.userPreferences
    );

    // Add transition message from new expert
    const transitionMessage = `Bonjour, je suis ${newExpert.name}. Je prends le relais de notre conversation. Comment puis-je t'aider ?`;
    
    await conversationManager.addMessage(conversationId, {
      role: 'assistant',
      content: transitionMessage,
      timestamp: Date.now(),
      ai_model: 'gemini'
    });
  }
}

// Export singleton instance
export const conversationInitiationService = ConversationInitiationService.getInstance();