import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Conversation, Message } from '../types';
import { conversationManager } from '../services/ConversationManager';
import { useAuth } from './AuthContext';

interface ConversationsContextType {
  // State
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;

  // Actions
  setActiveConversation: (id: string) => void;
  createConversation: (name: string, theme?: Conversation['theme'], aiModel?: 'gemini' | 'openai' | 'claude' | 'auto') => Promise<Conversation>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addMessage: (content: string, role: 'user' | 'assistant') => Promise<Message>;
  
  // Filters and utilities
  getActiveConversations: () => Conversation[];
  getArchivedConversations: () => Conversation[];
  getFavoriteConversations: () => Conversation[];
  searchConversations: (query: string) => Conversation[];
  getConversationsByTheme: (theme: Conversation['theme']) => Conversation[];
  getConversationStats: (id: string) => any;
  
  // Conversation management
  refreshConversations: () => Promise<void>;
  clearMessages: () => void;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
}

export const ConversationsProvider: React.FC<ConversationsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    const unsubscribe = conversationManager.subscribe((updatedConversations) => {
      setConversations(updatedConversations);
      setLoading(false);
    });

    // Load user conversations
    conversationManager.loadUserConversations(user.id).catch((err) => {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
      setLoading(false);
    });

    return unsubscribe;
  }, [isAuthenticated, user]);

  // Update messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      const conversationMessages = conversationManager.getMessages(activeConversationId);
      setMessages(conversationMessages);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, conversations]);

  const setActiveConversation = (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setActiveConversationId(id);
      // Update conversation as recently accessed
      conversationManager.updateConversation(id, { updated_at: new Date().toISOString() });
    }
  };

  const createConversation = async (
    name: string, 
    theme?: Conversation['theme'], 
    aiModel?: 'gemini' | 'openai' | 'claude' | 'auto'
  ): Promise<Conversation> => {
    try {
      setError(null);
      const conversation = await conversationManager.createConversation(name, theme, aiModel);
      setActiveConversationId(conversation.id);
      return conversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      throw err;
    }
  };

  const updateConversation = async (id: string, updates: Partial<Conversation>): Promise<void> => {
    try {
      setError(null);
      await conversationManager.updateConversation(id, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteConversation = async (id: string): Promise<void> => {
    try {
      setError(null);
      
      // If deleting the active conversation, switch to another one
      if (activeConversationId === id) {
        const otherConversations = conversations.filter(c => c.id !== id && !c.is_archived);
        if (otherConversations.length > 0) {
          setActiveConversationId(otherConversations[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
      
      await conversationManager.deleteConversation(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMessage);
      throw err;
    }
  };

  const archiveConversation = async (id: string): Promise<void> => {
    try {
      setError(null);
      
      // If archiving the active conversation, switch to another one
      if (activeConversationId === id) {
        const activeConversations = conversations.filter(c => c.id !== id && !c.is_archived);
        if (activeConversations.length > 0) {
          setActiveConversationId(activeConversations[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
      
      await conversationManager.archiveConversation(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive conversation';
      setError(errorMessage);
      throw err;
    }
  };

  const toggleFavorite = async (id: string): Promise<void> => {
    try {
      setError(null);
      await conversationManager.toggleFavorite(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle favorite';
      setError(errorMessage);
      throw err;
    }
  };

  const addMessage = async (
    content: string, 
    role: 'user' | 'assistant'
  ): Promise<Message> => {
    if (!activeConversationId) {
      throw new Error('No active conversation');
    }

    try {
      setError(null);
      const message = await conversationManager.addMessage(activeConversationId, {
        role,
        content,
        timestamp: Date.now()
      });

      // Update local messages immediately for better UX
      setMessages(prev => [...prev, message]);
      
      return message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message';
      setError(errorMessage);
      throw err;
    }
  };

  const refreshConversations = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      await conversationManager.loadUserConversations(user.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh conversations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  // Utility functions
  const getActiveConversations = () => conversationManager.getActiveConversations();
  const getArchivedConversations = () => conversationManager.getArchivedConversations();
  const getFavoriteConversations = () => conversationManager.getFavoriteConversations();
  const searchConversations = (query: string) => conversationManager.searchConversations(query);
  const getConversationsByTheme = (theme: Conversation['theme']) => conversationManager.getConversationsByTheme(theme);
  const getConversationStats = (id: string) => conversationManager.getConversationStats(id);

  // Computed values
  const activeConversation = activeConversationId 
    ? conversations.find(c => c.id === activeConversationId) || null 
    : null;

  const contextValue: ConversationsContextType = {
    // State
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    loading,
    error,

    // Actions
    setActiveConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    archiveConversation,
    toggleFavorite,
    addMessage,

    // Filters and utilities
    getActiveConversations,
    getArchivedConversations,
    getFavoriteConversations,
    searchConversations,
    getConversationsByTheme,
    getConversationStats,

    // Management
    refreshConversations,
    clearMessages
  };

  return (
    <ConversationsContext.Provider value={contextValue}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = (): ConversationsContextType => {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationsProvider');
  }
  return context;
};

// Specialized hooks for common patterns
export const useActiveConversation = () => {
  const { activeConversation, activeConversationId, messages } = useConversations();
  return { activeConversation, activeConversationId, messages };
};

export const useConversationFilters = () => {
  const { 
    getActiveConversations, 
    getArchivedConversations, 
    getFavoriteConversations,
    searchConversations,
    getConversationsByTheme 
  } = useConversations();
  
  return {
    getActiveConversations,
    getArchivedConversations,
    getFavoriteConversations,
    searchConversations,
    getConversationsByTheme
  };
};