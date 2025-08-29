import { supabase } from '../config/supabase';
import { Conversation, Message, ConversationSummary } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ConversationManager {
  private static instance: ConversationManager;
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map(); // conversation_id -> messages
  private listeners: Array<(conversations: Conversation[]) => void> = [];

  static getInstance(): ConversationManager {
    if (!ConversationManager.instance) {
      ConversationManager.instance = new ConversationManager();
    }
    return ConversationManager.instance;
  }

  // Subscription management
  subscribe(listener: (conversations: Conversation[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const conversations = Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    this.listeners.forEach(listener => listener(conversations));
  }

  // Conversation CRUD operations
  async createConversation(
    name: string, 
    theme?: Conversation['theme'],
    aiModel?: 'gemini' | 'openai' | 'claude' | 'auto'
  ): Promise<Conversation> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Check conversation limits based on subscription
    const userConversations = Array.from(this.conversations.values())
      .filter(c => c.user_id === user.id && !c.is_archived);
    
    // For now, set limits: free=3, standard=10, premium=unlimited
    const maxConversations = this.getMaxConversations();
    if (userConversations.length >= maxConversations) {
      throw new Error(`Maximum conversations limit reached (${maxConversations})`);
    }

    const conversation: Conversation = {
      id: uuidv4(),
      user_id: user.id,
      name,
      theme: theme || 'personal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 0,
      is_archived: false,
      is_favorite: false,
      ai_model_preference: aiModel || 'auto',
      conversation_mode: 'listening',
      tags: [],
      color: this.generateConversationColor()
    };

    // Save to Supabase
    const { error } = await supabase
      .from('conversations')
      .insert(conversation);

    if (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }

    this.conversations.set(conversation.id, conversation);
    this.messages.set(conversation.id, []);
    this.notifyListeners();

    return conversation;
  }

  async loadUserConversations(userId: string): Promise<void> {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    this.conversations.clear();
    this.messages.clear();

    for (const conversation of conversations || []) {
      this.conversations.set(conversation.id, conversation);
      
      // Load messages for each conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('timestamp', { ascending: true });

      this.messages.set(conversation.id, messages || []);
    }

    this.notifyListeners();
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const conversation = this.conversations.get(id);
    if (!conversation) return;

    const updatedConversation = {
      ...conversation,
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('conversations')
      .update(updatedConversation)
      .eq('id', id);

    if (error) {
      console.error('Error updating conversation:', error);
      throw new Error('Failed to update conversation');
    }

    this.conversations.set(id, updatedConversation);
    this.notifyListeners();
  }

  async deleteConversation(id: string): Promise<void> {
    // Delete messages first
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id);

    // Delete conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }

    this.conversations.delete(id);
    this.messages.delete(id);
    this.notifyListeners();
  }

  async archiveConversation(id: string): Promise<void> {
    await this.updateConversation(id, { is_archived: true });
  }

  async unarchiveConversation(id: string): Promise<void> {
    await this.updateConversation(id, { is_archived: false });
  }

  async toggleFavorite(id: string): Promise<void> {
    const conversation = this.conversations.get(id);
    if (!conversation) return;
    await this.updateConversation(id, { is_favorite: !conversation.is_favorite });
  }

  // Message management
  async addMessage(conversationId: string, message: Omit<Message, 'id' | 'conversation_id'>): Promise<Message> {
    const newMessage: Message = {
      id: uuidv4(),
      conversation_id: conversationId,
      ...message
    };

    const { error } = await supabase
      .from('messages')
      .insert(newMessage);

    if (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }

    // Update local state
    const conversationMessages = this.messages.get(conversationId) || [];
    conversationMessages.push(newMessage);
    this.messages.set(conversationId, conversationMessages);

    // Update conversation metadata
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      await this.updateConversation(conversationId, {
        message_count: conversation.message_count + 1,
        last_message: message.content.substring(0, 100),
        last_message_at: new Date().toISOString()
      });
    }

    return newMessage;
  }

  getMessages(conversationId: string): Message[] {
    return this.messages.get(conversationId) || [];
  }

  getConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  getActiveConversations(): Conversation[] {
    return this.getConversations().filter(c => !c.is_archived);
  }

  getArchivedConversations(): Conversation[] {
    return this.getConversations().filter(c => c.is_archived);
  }

  getFavoriteConversations(): Conversation[] {
    return this.getConversations().filter(c => c.is_favorite);
  }

  getConversationById(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  getConversationsByTheme(theme: Conversation['theme']): Conversation[] {
    return this.getConversations().filter(c => c.theme === theme);
  }

  searchConversations(query: string): Conversation[] {
    const lowerQuery = query.toLowerCase();
    return this.getConversations().filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      c.last_message?.toLowerCase().includes(lowerQuery)
    );
  }

  // Analytics and insights
  getConversationStats(conversationId: string) {
    const conversation = this.conversations.get(conversationId);
    const messages = this.messages.get(conversationId) || [];
    
    if (!conversation) return null;

    return {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.role === 'user').length,
      assistantMessages: messages.filter(m => m.role === 'assistant').length,
      durationDays: Math.ceil(
        (new Date().getTime() - new Date(conversation.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
      averageMessagesPerDay: messages.length / Math.max(1, Math.ceil(
        (new Date().getTime() - new Date(conversation.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )),
      lastActivity: conversation.last_message_at
    };
  }

  // Utility methods
  private generateConversationColor(): string {
    const colors = [
      '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
      '#EF4444', '#EC4899', '#6366F1', '#14B8A6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getMaxConversations(): number {
    // TODO: Get from user profile/subscription
    return 10; // Default for testing
  }

  // Conversation templates
  static getConversationTemplates() {
    return [
      {
        name: 'Gestion du stress au travail',
        theme: 'work' as const,
        description: 'Conversations dédiées aux défis professionnels et à la gestion du stress',
        systemPrompt: 'Je suis spécialisé dans l\'accompagnement professionnel et la gestion du stress au travail.',
        suggestedTags: ['travail', 'stress', 'productivité']
      },
      {
        name: 'Relations familiales',
        theme: 'family' as const,
        description: 'Support pour les dynamiques familiales et relationnelles',
        systemPrompt: 'Je me concentre sur les relations familiales et la communication interpersonnelle.',
        suggestedTags: ['famille', 'relations', 'communication']
      },
      {
        name: 'Bien-être mental',
        theme: 'health' as const,
        description: 'Suivi de la santé mentale et techniques de bien-être',
        systemPrompt: 'Je suis votre accompagnateur en santé mentale et bien-être personnel.',
        suggestedTags: ['santé', 'bien-être', 'mindfulness']
      },
      {
        name: 'Développement personnel',
        theme: 'personal' as const,
        description: 'Croissance personnelle et développement de soi',
        systemPrompt: 'Je vous accompagne dans votre développement personnel et votre croissance.',
        suggestedTags: ['développement', 'objectifs', 'motivation']
      },
      {
        name: 'Session thérapeutique',
        theme: 'therapy' as const,
        description: 'Conversations structurées pour un accompagnement thérapeutique',
        systemPrompt: 'Je offre un espace sécurisé pour l\'expression et l\'accompagnement thérapeutique.',
        suggestedTags: ['thérapie', 'émotions', 'guérison']
      }
    ];
  }
}

// Export singleton instance
export const conversationManager = ConversationManager.getInstance();