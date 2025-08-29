import { supabase } from '../config/supabase';
import { AIContext, Conversation, Avatar } from '../types';
import { conversationManager } from './ConversationManager';
import { avatarManager } from './AvatarManager';

interface ContextSummary {
  conversation_id: string;
  summary: string;
  key_topics: string[];
  mood_indicators: string[];
  user_preferences: Record<string, any>;
  last_updated: string;
}

export class AIContextManager {
  private static instance: AIContextManager;
  private contexts: Map<string, AIContext> = new Map(); // conversation_id -> context
  private summaries: Map<string, ContextSummary> = new Map();
  private activeContexts: Set<string> = new Set(); // Currently loaded contexts

  static getInstance(): AIContextManager {
    if (!AIContextManager.instance) {
      AIContextManager.instance = new AIContextManager();
    }
    return AIContextManager.instance;
  }

  // Context lifecycle management
  async loadContext(conversationId: string, avatarId?: string): Promise<AIContext> {
    // Check if already loaded
    if (this.contexts.has(conversationId)) {
      this.activeContexts.add(conversationId);
      const context = this.contexts.get(conversationId)!;
      
      // Update system prompt if avatar is specified and different
      if (avatarId) {
        const conversation = conversationManager.getConversationById(conversationId);
        if (conversation) {
          const newSystemPrompt = this.generateSystemPrompt(conversation, avatarId);
          if (context.system_prompt !== newSystemPrompt) {
            context.system_prompt = newSystemPrompt;
            await this.saveContext(conversationId);
          }
        }
      }
      
      return context;
    }

    try {
      // Load from database
      const { data: contextData, error } = await supabase
        .from('ai_contexts')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      let context: AIContext;

      if (error || !contextData) {
        // Create new context for conversation
        context = await this.createNewContext(conversationId);
      } else {
        context = contextData;
      }

      this.contexts.set(conversationId, context);
      this.activeContexts.add(conversationId);
      
      return context;
    } catch (error) {
      console.error('Error loading AI context:', error);
      // Fallback: create default context
      return this.createNewContext(conversationId);
    }
  }

  async unloadContext(conversationId: string): Promise<void> {
    // Save context before unloading
    await this.saveContext(conversationId);
    
    // Remove from active contexts
    this.activeContexts.delete(conversationId);
    
    // Keep in memory cache for quick access, but mark as inactive
    // Only remove from memory if we have too many cached contexts
    if (this.contexts.size > 20) {
      this.contexts.delete(conversationId);
    }
  }

  private async createNewContext(conversationId: string, avatarId?: string): Promise<AIContext> {
    const conversation = conversationManager.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const systemPrompt = this.generateSystemPrompt(conversation, avatarId);
    
    const context: AIContext = {
      conversation_id: conversationId,
      system_prompt: systemPrompt,
      conversation_history: '',
      personality_traits: this.getPersonalityTraitsForTheme(conversation.theme),
      user_preferences: {},
      mood_context: conversation.mood_context || 'neutral',
      session_goals: [],
      cached_responses: {},
      last_updated: new Date().toISOString()
    };

    // Save to database with upsert to handle potential duplicates
    const { error } = await supabase
      .from('ai_contexts')
      .upsert(context, {
        onConflict: 'conversation_id'
      });
    
    if (error) {
      console.error('Error creating AI context:', error);
    }
    
    return context;
  }

  private generateSystemPrompt(conversation: Conversation, avatarId?: string): string {
    // If avatar is specified, use avatar-specific prompt
    if (avatarId) {
      const avatar = avatarManager.getAvatarById(avatarId);
      if (avatar) {
        return this.generateAvatarSystemPrompt(avatar, conversation);
      }
    }

    const basePrompt = `Tu es MindEase AI, un assistant thérapeutique bienveillant et professionnel.`;
    
    const themePrompts = {
      work: `Tu te spécialises dans l'accompagnement professionnel, la gestion du stress au travail, et l'équilibre vie professionnelle-personnelle.`,
      family: `Tu te concentres sur les dynamiques familiales, la communication interpersonnelle, et le soutien dans les relations familiales.`,
      health: `Tu es expert en bien-être mental, techniques de relaxation, mindfulness, et accompagnement dans les défis de santé mentale.`,
      personal: `Tu accompagnes le développement personnel, l'estime de soi, la définition d'objectifs, et la croissance personnelle.`,
      therapy: `Tu offres un espace thérapeutique sécurisé, pratiques des techniques d'écoute active, et accompagnes dans l'exploration émotionnelle.`,
      custom: `Tu t'adaptes aux besoins spécifiques de cette conversation personnalisée.`
    };

    const modePrompts = {
      listening: `Adopte une approche principalement d'écoute empathique, pose des questions ouvertes, et valide les émotions.`,
      counseling: `Provide des conseils constructifs, des stratégies pratiques, et guide vers des solutions.`,
      analysis: `Aide à analyser les situations, identifier les patterns, et comprendre les dynamiques en jeu.`,
      coaching: `Motive, fixe des objectifs, suit les progrès, et encourage l'action et le développement.`
    };

    return [
      basePrompt,
      themePrompts[conversation.theme || 'personal'],
      modePrompts[conversation.conversation_mode || 'listening'],
      `Nom de la conversation: "${conversation.name}".`,
      `Maintiens toujours un ton bienveillant, professionnel et adapté au contexte émotionnel.`
    ].join(' ');
  }

  private generateAvatarSystemPrompt(avatar: Avatar, conversation: Conversation): string {
    // Build comprehensive avatar-specific system prompt
    const basePrompt = avatar.system_prompt_template;
    
    const contextualAdditions = [
      `Tu es actuellement dans une conversation intitulée "${conversation.name}".`,
      `Le thème de cette conversation est: ${conversation.theme || 'personnel'}.`,
      `Ton rôle spécialisé: ${avatar.specialization} - ${avatar.description}`,
      `Tes domaines d'expertise: ${avatar.expertise_areas.join(', ')}.`,
      `Tes traits de personnalité: ${avatar.personality_traits.join(', ')}.`
    ];

    // Add conversation style guidelines
    const styleGuidelines = this.buildStyleGuidelines(avatar.conversation_style);
    
    // Add mood-specific adaptations
    const moodAdaptations = this.buildMoodAdaptations(conversation.mood_context, avatar);

    return [
      basePrompt,
      ...contextualAdditions,
      styleGuidelines,
      moodAdaptations,
      'Reste toujours fidèle à ta personnalité et à ton expertise tout en étant adaptatif aux besoins de l\'utilisateur.'
    ].join(' ');
  }

  private buildStyleGuidelines(style: Avatar['conversation_style']): string {
    const guidelines = [
      `Style de salutation: ${style.greeting_style}`,
      `Approche des questions: ${style.question_approach}`,
      `Longueur de réponse: ${style.response_length}`,
      `Niveau d'empathie: ${style.empathy_level}`
    ];

    if (style.use_metaphors) guidelines.push('Utilise des métaphores appropriées');
    if (style.encourage_reflection) guidelines.push('Encourage la réflexion personnelle');
    if (style.offer_practical_advice) guidelines.push('Propose des conseils pratiques');

    return `Directives de style: ${guidelines.join(', ')}.`;
  }

  private buildMoodAdaptations(mood?: string, avatar?: Avatar): string {
    if (!mood || !avatar) return '';

    const adaptations = {
      positive: 'L\'utilisateur semble dans un état positif - maintiens cette énergie tout en approfondissant.',
      negative: 'L\'utilisateur traverse une période difficile - soit particulièrement bienveillant et rassurant.',
      neutral: 'L\'utilisateur semble dans un état équilibré - adapte-toi à l\'évolution de la conversation.',
      mixed: 'L\'utilisateur exprime des émotions mixtes - aide à clarifier et normaliser ces sentiments.'
    };

    const moodAdaptation = adaptations[mood as keyof typeof adaptations];
    if (!moodAdaptation) return '';

    // Add avatar-specific mood handling
    const avatarMoodHandling = {
      therapist: 'Utilise tes compétences thérapeutiques pour explorer et soutenir.',
      coach: 'Canalise cette énergie vers des objectifs constructifs.',
      meditation: 'Guide vers l\'acceptation et la paix intérieure.',
      analyst: 'Aide à comprendre les patterns derrière ces émotions.'
    };

    return `${moodAdaptation} ${avatarMoodHandling[avatar.specialization] || ''}`;
  }

  private getPersonalityTraitsForTheme(theme?: Conversation['theme']): string[] {
    const traits = {
      work: ['professionnel', 'orienté-solutions', 'pragmatique', 'empathique'],
      family: ['chaleureux', 'patient', 'compréhensif', 'médiateur'],
      health: ['rassurant', 'encourageant', 'mindful', 'thérapeutique'],
      personal: ['motivant', 'positif', 'développement-orienté', 'bienveillant'],
      therapy: ['non-jugemental', 'sécurisant', 'profond', 'thérapeutique'],
      custom: ['adaptable', 'personnalisé', 'flexible', 'empathique']
    };
    
    return traits[theme || 'personal'];
  }

  // Context updates and management
  async updateContext(conversationId: string, updates: Partial<AIContext>): Promise<void> {
    const context = this.contexts.get(conversationId);
    if (!context) return;

    const updatedContext = {
      ...context,
      ...updates,
      last_updated: new Date().toISOString()
    };

    this.contexts.set(conversationId, updatedContext);
    
    // Save to database if context is active
    if (this.activeContexts.has(conversationId)) {
      await this.saveContext(conversationId);
    }
  }

  async saveContext(conversationId: string): Promise<void> {
    const context = this.contexts.get(conversationId);
    if (!context) return;

    try {
      // Créer une copie de l'objet en excluant les champs qui pourraient causer des problèmes
      const contextToSave = {
        conversation_id: context.conversation_id,
        system_prompt: context.system_prompt,
        conversation_history: context.conversation_history,
        personality_traits: context.personality_traits,
        user_preferences: context.user_preferences,
        mood_context: context.mood_context,
        session_goals: context.session_goals,
        cached_responses: context.cached_responses,
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('ai_contexts')
        .upsert(contextToSave, {
          onConflict: 'conversation_id'
        });

      if (error) {
        console.error('Error saving AI context:', error);
      }
    } catch (error) {
      console.error('Error saving AI context:', error);
    }
  }

  // Context manipulation methods
  async addToHistory(conversationId: string, message: string, role: 'user' | 'assistant'): Promise<void> {
    const context = await this.loadContext(conversationId);
    
    const historyEntry = `${role}: ${message}\n`;
    const newHistory = context.conversation_history + historyEntry;
    
    // Keep history manageable (last 50 exchanges)
    const lines = newHistory.split('\n');
    const trimmedHistory = lines.slice(-100).join('\n'); // Keep last 100 lines (50 exchanges)
    
    await this.updateContext(conversationId, {
      conversation_history: trimmedHistory
    });
  }

  async updateMoodContext(conversationId: string, mood: string): Promise<void> {
    await this.updateContext(conversationId, { mood_context: mood });
    
    // Also update the conversation
    await conversationManager.updateConversation(conversationId, {
      mood_context: mood as any
    });
  }

  async addSessionGoal(conversationId: string, goal: string): Promise<void> {
    const context = await this.loadContext(conversationId);
    const updatedGoals = [...context.session_goals, goal];
    
    await this.updateContext(conversationId, {
      session_goals: updatedGoals
    });
  }

  async updateUserPreferences(conversationId: string, preferences: Record<string, any>): Promise<void> {
    const context = await this.loadContext(conversationId);
    const updatedPreferences = { ...context.user_preferences, ...preferences };
    
    await this.updateContext(conversationId, {
      user_preferences: updatedPreferences
    });
  }

  // Context analysis and insights
  async analyzeContext(conversationId: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    keyTopics: string[];
    progressIndicators: string[];
    recommendations: string[];
  }> {
    const context = await this.loadContext(conversationId);
    const history = context.conversation_history;
    
    // Simple analysis (in production, this would use more sophisticated NLP)
    const positiveWords = ['bien', 'mieux', 'progrès', 'heureux', 'satisfait', 'content'];
    const negativeWords = ['mal', 'difficile', 'stress', 'anxieux', 'triste', 'problème'];
    
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (history.toLowerCase().split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (history.toLowerCase().split(word).length - 1), 0);
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    if (positiveCount > negativeCount * 1.2) sentiment = 'positive';
    else if (negativeCount > positiveCount * 1.2) sentiment = 'negative';
    else sentiment = 'neutral';

    return {
      sentiment,
      keyTopics: this.extractKeyTopics(history),
      progressIndicators: this.extractProgressIndicators(history),
      recommendations: this.generateRecommendations(context, sentiment)
    };
  }

  private extractKeyTopics(history: string): string[] {
    // Simple keyword extraction (would be more sophisticated in production)
    const commonWords = ['travail', 'famille', 'stress', 'relation', 'objectif', 'émotion'];
    return commonWords.filter(word => 
      history.toLowerCase().includes(word)
    ).slice(0, 5);
  }

  private extractProgressIndicators(history: string): string[] {
    const progressWords = ['progrès', 'mieux', 'amélioration', 'réussi', 'objectif atteint'];
    return progressWords.filter(word => 
      history.toLowerCase().includes(word)
    );
  }

  private generateRecommendations(context: AIContext, sentiment: 'positive' | 'negative' | 'neutral'): string[] {
    const recommendations = [];
    
    if (sentiment === 'negative') {
      recommendations.push('Considérer des techniques de relaxation');
      recommendations.push('Explorer les sources de stress');
    } else if (sentiment === 'positive') {
      recommendations.push('Maintenir les habitudes positives');
      recommendations.push('Définir de nouveaux objectifs');
    }

    if (context.session_goals.length === 0) {
      recommendations.push('Définir des objectifs de session clairs');
    }

    return recommendations;
  }

  // Context transfer and management
  async transferContextBetweenConversations(sourceId: string, targetId: string, elements: string[]): Promise<void> {
    const sourceContext = await this.loadContext(sourceId);
    const targetContext = await this.loadContext(targetId);

    const updates: Partial<AIContext> = {};

    if (elements.includes('preferences')) {
      updates.user_preferences = { ...targetContext.user_preferences, ...sourceContext.user_preferences };
    }

    if (elements.includes('goals')) {
      updates.session_goals = [...new Set([...targetContext.session_goals, ...sourceContext.session_goals])];
    }

    if (elements.includes('mood')) {
      updates.mood_context = sourceContext.mood_context;
    }

    await this.updateContext(targetId, updates);
  }

  // Memory management
  async cleanupOldContexts(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Remove contexts for conversations not accessed in 30 days
    const oldContexts = Array.from(this.contexts.entries()).filter(([_, context]) => 
      new Date(context.last_updated) < thirtyDaysAgo
    );

    for (const [conversationId] of oldContexts) {
      if (!this.activeContexts.has(conversationId)) {
        this.contexts.delete(conversationId);
      }
    }
  }

  // Getters
  getContext(conversationId: string): AIContext | undefined {
    return this.contexts.get(conversationId);
  }

  getSystemPrompt(conversationId: string): string {
    const context = this.contexts.get(conversationId);
    return context?.system_prompt || 'Tu es MindEase AI, un assistant thérapeutique bienveillant.';
  }

  getConversationHistory(conversationId: string): string {
    const context = this.contexts.get(conversationId);
    return context?.conversation_history || '';
  }

  // Export/Import functionality
  async exportContext(conversationId: string): Promise<string> {
    const context = await this.loadContext(conversationId);
    return JSON.stringify(context, null, 2);
  }

  async importContext(conversationId: string, contextData: string): Promise<void> {
    try {
      const context: AIContext = JSON.parse(contextData);
      context.conversation_id = conversationId;
      context.last_updated = new Date().toISOString();
      
      this.contexts.set(conversationId, context);
      await this.saveContext(conversationId);
    } catch (error) {
      console.error('Error importing context:', error);
      throw new Error('Invalid context data format');
    }
  }

  // Avatar-specific context methods
  async switchAvatarContext(conversationId: string, newAvatarId: string): Promise<void> {
    const context = await this.loadContext(conversationId);
    const conversation = conversationManager.getConversationById(conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const avatar = avatarManager.getAvatarById(newAvatarId);
    if (!avatar) {
      throw new Error('Avatar not found');
    }

    // Generate new system prompt for the avatar
    const newSystemPrompt = this.generateAvatarSystemPrompt(avatar, conversation);
    
    // Update context
    await this.updateContext(conversationId, {
      system_prompt: newSystemPrompt
    });

    // Add context switch note to history
    const switchNote = `[Changement d'avatar: ${avatar.name} (${avatar.specialization})]`;
    await this.addToHistory(conversationId, switchNote, 'assistant');

    console.log(`🔄 Switched to avatar ${avatar.name} for conversation ${conversationId}`);
  }

  async adaptContextToAvatar(conversationId: string, avatarId: string): Promise<void> {
    const context = await this.loadContext(conversationId, avatarId);
    const conversation = conversationManager.getConversationById(conversationId);
    const avatar = avatarManager.getAvatarById(avatarId);

    if (!conversation || !avatar) {
      return;
    }

    // Add avatar-specific adaptations to context
    const avatarAdaptations = {
      conversation_style_preference: avatar.conversation_style,
      voice_characteristics: avatar.voice_config,
      expertise_focus: avatar.expertise_areas,
      personality_emphasis: avatar.personality_traits
    };

    await this.updateContext(conversationId, {
      user_preferences: {
        ...context.user_preferences,
        current_avatar: avatarId,
        avatar_adaptations: avatarAdaptations
      }
    });
  }

  async getAvatarRecommendation(conversationId: string): Promise<string | null> {
    const context = await this.loadContext(conversationId);
    const conversation = conversationManager.getConversationById(conversationId);
    
    if (!conversation) return null;

    // Analyze conversation history and mood to recommend best avatar
    const analysis = await this.analyzeContext(conversationId);
    
    // Simple recommendation logic based on sentiment and topics
    if (analysis.sentiment === 'negative' && analysis.keyTopics.includes('anxiété')) {
      return 'therapist-main'; // Dr. Elena for anxiety
    }
    
    if (analysis.keyTopics.includes('objectif') || analysis.keyTopics.includes('motivation')) {
      return 'coach-motivation'; // Max for motivation
    }
    
    if (analysis.keyTopics.includes('stress') || analysis.keyTopics.includes('relaxation')) {
      return 'guide-meditation'; // Luna for stress relief
    }
    
    if (analysis.keyTopics.includes('analyse') || analysis.keyTopics.includes('pattern')) {
      return 'analyst-behavioral'; // Alex for analysis
    }

    // Default to current avatar or therapist
    return context.user_preferences.current_avatar || 'therapist-main';
  }

  // Multi-avatar dialogue context management
  async prepareMultiAvatarContext(conversationId: string, avatarIds: string[]): Promise<Record<string, string>> {
    const contextPrompts: Record<string, string> = {};
    const conversation = conversationManager.getConversationById(conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const baseContext = await this.loadContext(conversationId);
    
    for (const avatarId of avatarIds) {
      const avatar = avatarManager.getAvatarById(avatarId);
      if (avatar) {
        // Create specialized prompt for this avatar in dialogue context
        const dialoguePrompt = this.generateDialogueSystemPrompt(avatar, conversation, baseContext);
        contextPrompts[avatarId] = dialoguePrompt;
      }
    }

    return contextPrompts;
  }

  private generateDialogueSystemPrompt(avatar: Avatar, conversation: Conversation, baseContext: AIContext): string {
    const baseAvatarPrompt = this.generateAvatarSystemPrompt(avatar, conversation);
    
    const dialogueAdditions = [
      'Tu participes actuellement à un dialogue avec d\'autres avatars spécialisés.',
      'Reste dans ton rôle et apporte ta perspective unique.',
      'Écoute les autres avatars et enrichis la conversation avec ton expertise.',
      'Évite de répéter ce que les autres ont déjà dit.',
      'Sois concis mais impactant dans tes interventions.',
      `Contexte de la conversation: ${baseContext.conversation_history.slice(-500)}` // Last 500 chars
    ];

    return [baseAvatarPrompt, ...dialogueAdditions].join(' ');
  }

  // Context analytics with avatar awareness
  async getAvatarUsageAnalytics(conversationId: string): Promise<Record<string, any>> {
    const context = await this.loadContext(conversationId);
    const avatarSwitches = this.extractAvatarSwitchesFromHistory(context.conversation_history);
    
    return {
      avatar_switches: avatarSwitches.length,
      most_used_avatar: this.getMostUsedAvatar(avatarSwitches),
      average_session_duration_per_avatar: this.calculateAvatarSessionDurations(avatarSwitches),
      user_avatar_preferences: context.user_preferences.avatar_adaptations || {}
    };
  }

  private extractAvatarSwitchesFromHistory(history: string): Array<{avatar: string, timestamp: string}> {
    const switches: Array<{avatar: string, timestamp: string}> = [];
    const switchPattern = /\[Changement d'avatar: ([^(]+) \(([^)]+)\)\]/g;
    
    let match;
    while ((match = switchPattern.exec(history)) !== null) {
      switches.push({
        avatar: match[1].trim(),
        timestamp: new Date().toISOString() // Simplified - in reality would parse from context
      });
    }
    
    return switches;
  }

  private getMostUsedAvatar(switches: Array<{avatar: string, timestamp: string}>): string | null {
    if (switches.length === 0) return null;
    
    const avatarCounts = switches.reduce((counts, sw) => {
      counts[sw.avatar] = (counts[sw.avatar] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return Object.entries(avatarCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
  }

  private calculateAvatarSessionDurations(switches: Array<{avatar: string, timestamp: string}>): Record<string, number> {
    // Simplified calculation - in reality would analyze actual session times
    const durations: Record<string, number> = {};
    switches.forEach(sw => {
      durations[sw.avatar] = Math.random() * 30 + 10; // Mock data: 10-40 minutes
    });
    return durations;
  }
}

// Export singleton instance
export const aiContextManager = AIContextManager.getInstance();