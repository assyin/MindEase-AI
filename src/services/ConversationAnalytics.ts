import { supabase } from '../config/supabase';
import { Conversation, Message } from '../types';
import { conversationManager } from './ConversationManager';
import { aiContextManager } from './AIContextManager';

export interface ConversationPattern {
  id: string;
  pattern_type: 'mood_trend' | 'topic_frequency' | 'engagement_level' | 'response_time';
  description: string;
  confidence_score: number;
  detected_at: string;
  related_conversations: string[];
  metadata: Record<string, any>;
}

export interface ConversationInsight {
  id: string;
  insight_type: 'recommendation' | 'alert' | 'progress' | 'trend';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action_items: string[];
  related_conversations: string[];
  created_at: string;
}

export interface ConversationComparison {
  conversation_a: string;
  conversation_b: string;
  similarity_score: number;
  common_topics: string[];
  mood_comparison: {
    conversation_a_mood: string;
    conversation_b_mood: string;
    mood_evolution: string;
  };
  engagement_comparison: {
    messages_per_day_a: number;
    messages_per_day_b: number;
    average_response_length_a: number;
    average_response_length_b: number;
  };
  recommendations: string[];
}

export class ConversationAnalytics {
  private static instance: ConversationAnalytics;
  private patterns: Map<string, ConversationPattern[]> = new Map(); // conversation_id -> patterns
  private insights: ConversationInsight[] = [];

  static getInstance(): ConversationAnalytics {
    if (!ConversationAnalytics.instance) {
      ConversationAnalytics.instance = new ConversationAnalytics();
    }
    return ConversationAnalytics.instance;
  }

  // Pattern Detection
  async analyzeConversationPatterns(conversationId: string): Promise<ConversationPattern[]> {
    const conversation = conversationManager.getConversationById(conversationId);
    const messages = conversationManager.getMessages(conversationId);
    
    if (!conversation || messages.length === 0) return [];

    const patterns: ConversationPattern[] = [];

    // Analyze mood trends
    const moodPattern = this.analyzeMoodTrend(conversationId, messages);
    if (moodPattern) patterns.push(moodPattern);

    // Analyze topic frequency
    const topicPattern = this.analyzeTopicFrequency(conversationId, messages);
    if (topicPattern) patterns.push(topicPattern);

    // Analyze engagement level
    const engagementPattern = this.analyzeEngagementLevel(conversationId, messages);
    if (engagementPattern) patterns.push(engagementPattern);

    // Analyze response times
    const responseTimePattern = this.analyzeResponseTimes(conversationId, messages);
    if (responseTimePattern) patterns.push(responseTimePattern);

    // Cache patterns
    this.patterns.set(conversationId, patterns);

    // Save to database
    await this.savePatternsToDatabase(conversationId, patterns);

    return patterns;
  }

  private analyzeMoodTrend(conversationId: string, messages: Message[]): ConversationPattern | null {
    // Simple mood analysis based on message content
    const moodIndicators = {
      positive: ['bien', 'mieux', 'heureux', 'content', 'satisfait', 'optimiste', 'espoir'],
      negative: ['mal', 'triste', 'anxieux', 'stress', 'difficile', 'problème', 'déprimé'],
      neutral: ['ok', 'normal', 'moyen', 'habituel', 'comme d\'habitude']
    };

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    messages.forEach(message => {
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        moodIndicators.positive.forEach(word => {
          if (content.includes(word)) positiveCount++;
        });
        moodIndicators.negative.forEach(word => {
          if (content.includes(word)) negativeCount++;
        });
        moodIndicators.neutral.forEach(word => {
          if (content.includes(word)) neutralCount++;
        });
      }
    });

    const totalMoodIndicators = positiveCount + negativeCount + neutralCount;
    if (totalMoodIndicators < 3) return null;

    let dominantMood = 'neutral';
    let confidence = 0;

    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      dominantMood = 'positive';
      confidence = positiveCount / totalMoodIndicators;
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      dominantMood = 'negative';
      confidence = negativeCount / totalMoodIndicators;
    } else {
      confidence = neutralCount / totalMoodIndicators;
    }

    return {
      id: `${conversationId}_mood_trend`,
      pattern_type: 'mood_trend',
      description: `Tendance d'humeur dominante: ${dominantMood}`,
      confidence_score: confidence,
      detected_at: new Date().toISOString(),
      related_conversations: [conversationId],
      metadata: {
        dominant_mood: dominantMood,
        positive_count: positiveCount,
        negative_count: negativeCount,
        neutral_count: neutralCount
      }
    };
  }

  private analyzeTopicFrequency(conversationId: string, messages: Message[]): ConversationPattern | null {
    // Simple topic extraction based on keywords
    const topics = {
      work: ['travail', 'bureau', 'collègue', 'patron', 'projet', 'réunion', 'entreprise'],
      family: ['famille', 'parent', 'enfant', 'mari', 'femme', 'frère', 'sœur', 'relation'],
      health: ['santé', 'médecin', 'maladie', 'douleur', 'fatigue', 'sommeil', 'exercice'],
      emotions: ['émotion', 'sentiment', 'colère', 'peur', 'joie', 'tristesse', 'amour'],
      goals: ['objectif', 'but', 'projet', 'avenir', 'plan', 'ambition', 'rêve']
    };

    const topicCounts: Record<string, number> = {};
    Object.keys(topics).forEach(topic => topicCounts[topic] = 0);

    messages.forEach(message => {
      const content = message.content.toLowerCase();
      Object.entries(topics).forEach(([topic, keywords]) => {
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            topicCounts[topic]++;
          }
        });
      });
    });

    const dominantTopic = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (!dominantTopic || dominantTopic[1] < 3) return null;

    const totalTopicMentions = Object.values(topicCounts).reduce((sum, count) => sum + count, 0);
    const confidence = dominantTopic[1] / totalTopicMentions;

    return {
      id: `${conversationId}_topic_frequency`,
      pattern_type: 'topic_frequency',
      description: `Sujet principal: ${dominantTopic[0]} (${dominantTopic[1]} mentions)`,
      confidence_score: confidence,
      detected_at: new Date().toISOString(),
      related_conversations: [conversationId],
      metadata: {
        dominant_topic: dominantTopic[0],
        topic_counts: topicCounts,
        total_mentions: totalTopicMentions
      }
    };
  }

  private analyzeEngagementLevel(conversationId: string, messages: Message[]): ConversationPattern | null {
    const conversation = conversationManager.getConversationById(conversationId);
    if (!conversation) return null;

    const userMessages = messages.filter(m => m.role === 'user');
    const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
    
    const createdAt = new Date(conversation.created_at);
    const now = new Date();
    const daysSinceCreation = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const messagesPerDay = messages.length / Math.max(1, daysSinceCreation);

    let engagementLevel = 'low';
    let confidence = 0.5;

    if (messagesPerDay > 10 && avgMessageLength > 100) {
      engagementLevel = 'high';
      confidence = 0.9;
    } else if (messagesPerDay > 5 || avgMessageLength > 50) {
      engagementLevel = 'medium';
      confidence = 0.7;
    }

    return {
      id: `${conversationId}_engagement_level`,
      pattern_type: 'engagement_level',
      description: `Niveau d'engagement: ${engagementLevel}`,
      confidence_score: confidence,
      detected_at: new Date().toISOString(),
      related_conversations: [conversationId],
      metadata: {
        engagement_level: engagementLevel,
        messages_per_day: messagesPerDay,
        avg_message_length: avgMessageLength,
        total_messages: messages.length,
        days_since_creation: daysSinceCreation
      }
    };
  }

  private analyzeResponseTimes(conversationId: string, messages: Message[]): ConversationPattern | null {
    if (messages.length < 4) return null;

    const responseTimes: number[] = [];
    
    for (let i = 1; i < messages.length; i++) {
      const prevMessage = messages[i - 1];
      const currentMessage = messages[i];
      
      if (prevMessage.role !== currentMessage.role) {
        const timeDiff = currentMessage.timestamp - prevMessage.timestamp;
        responseTimes.push(timeDiff);
      }
    }

    if (responseTimes.length === 0) return null;

    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const avgMinutes = avgResponseTime / (1000 * 60);

    let responsePattern = 'normal';
    let confidence = 0.6;

    if (avgMinutes < 5) {
      responsePattern = 'immediate';
      confidence = 0.8;
    } else if (avgMinutes > 60) {
      responsePattern = 'delayed';
      confidence = 0.9;
    }

    return {
      id: `${conversationId}_response_time`,
      pattern_type: 'response_time',
      description: `Temps de réponse: ${responsePattern} (${Math.round(avgMinutes)} min)`,
      confidence_score: confidence,
      detected_at: new Date().toISOString(),
      related_conversations: [conversationId],
      metadata: {
        response_pattern: responsePattern,
        avg_response_time_ms: avgResponseTime,
        avg_response_time_minutes: avgMinutes,
        total_exchanges: responseTimes.length
      }
    };
  }

  // Cross-conversation analysis
  async compareConversations(conversationIdA: string, conversationIdB: string): Promise<ConversationComparison> {
    const conversationA = conversationManager.getConversationById(conversationIdA);
    const conversationB = conversationManager.getConversationById(conversationIdB);
    const messagesA = conversationManager.getMessages(conversationIdA);
    const messagesB = conversationManager.getMessages(conversationIdB);

    if (!conversationA || !conversationB) {
      throw new Error('One or both conversations not found');
    }

    // Analyze patterns for both conversations
    const patternsA = await this.analyzeConversationPatterns(conversationIdA);
    const patternsB = await this.analyzeConversationPatterns(conversationIdB);

    // Calculate similarity score
    const similarityScore = this.calculateSimilarityScore(patternsA, patternsB);

    // Find common topics
    const topicsA = patternsA.find(p => p.pattern_type === 'topic_frequency')?.metadata.topic_counts || {};
    const topicsB = patternsB.find(p => p.pattern_type === 'topic_frequency')?.metadata.topic_counts || {};
    const commonTopics = Object.keys(topicsA).filter(topic => 
      topicsA[topic] > 0 && topicsB[topic] > 0
    );

    // Mood comparison
    const moodA = patternsA.find(p => p.pattern_type === 'mood_trend')?.metadata.dominant_mood || 'neutral';
    const moodB = patternsB.find(p => p.pattern_type === 'mood_trend')?.metadata.dominant_mood || 'neutral';
    
    let moodEvolution = 'stable';
    if (moodA === 'negative' && moodB === 'positive') moodEvolution = 'amélioration';
    else if (moodA === 'positive' && moodB === 'negative') moodEvolution = 'dégradation';
    else if (moodA === 'neutral' && moodB === 'positive') moodEvolution = 'progression positive';
    else if (moodA === 'neutral' && moodB === 'negative') moodEvolution = 'progression négative';

    // Engagement comparison
    const engagementA = patternsA.find(p => p.pattern_type === 'engagement_level')?.metadata;
    const engagementB = patternsB.find(p => p.pattern_type === 'engagement_level')?.metadata;

    const comparison: ConversationComparison = {
      conversation_a: conversationIdA,
      conversation_b: conversationIdB,
      similarity_score: similarityScore,
      common_topics: commonTopics,
      mood_comparison: {
        conversation_a_mood: moodA,
        conversation_b_mood: moodB,
        mood_evolution: moodEvolution
      },
      engagement_comparison: {
        messages_per_day_a: engagementA?.messages_per_day || 0,
        messages_per_day_b: engagementB?.messages_per_day || 0,
        average_response_length_a: engagementA?.avg_message_length || 0,
        average_response_length_b: engagementB?.avg_message_length || 0
      },
      recommendations: this.generateComparisonRecommendations(similarityScore, moodEvolution, commonTopics)
    };

    return comparison;
  }

  private calculateSimilarityScore(patternsA: ConversationPattern[], patternsB: ConversationPattern[]): number {
    if (patternsA.length === 0 || patternsB.length === 0) return 0;

    let similaritySum = 0;
    let comparisonCount = 0;

    patternsA.forEach(patternA => {
      const matchingPatternB = patternsB.find(p => p.pattern_type === patternA.pattern_type);
      if (matchingPatternB) {
        comparisonCount++;
        // Simple similarity calculation (could be more sophisticated)
        if (patternA.pattern_type === 'mood_trend') {
          const moodA = patternA.metadata.dominant_mood;
          const moodB = matchingPatternB.metadata.dominant_mood;
          similaritySum += moodA === moodB ? 1 : 0.5;
        } else {
          // For other patterns, use confidence scores
          similaritySum += (patternA.confidence_score + matchingPatternB.confidence_score) / 2;
        }
      }
    });

    return comparisonCount > 0 ? similaritySum / comparisonCount : 0;
  }

  private generateComparisonRecommendations(
    similarityScore: number, 
    moodEvolution: string, 
    commonTopics: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (similarityScore > 0.7) {
      recommendations.push('Ces conversations traitent de sujets similaires - considérez les fusionner');
    }

    if (moodEvolution === 'amélioration') {
      recommendations.push('Excellente progression émotionnelle détectée - continuez sur cette voie');
    } else if (moodEvolution === 'dégradation') {
      recommendations.push('Attention: dégradation de l\'humeur détectée - surveillance recommandée');
    }

    if (commonTopics.length > 2) {
      recommendations.push(`Sujets récurrents identifiés: ${commonTopics.join(', ')} - possibilité d'approfondir`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Conversations complémentaires - bon équilibre thématique');
    }

    return recommendations;
  }

  // Insights generation
  async generateInsights(userId: string): Promise<ConversationInsight[]> {
    const conversations = conversationManager.getConversations().filter(c => c.user_id === userId);
    const insights: ConversationInsight[] = [];

    // Analyze all conversations for patterns
    for (const conversation of conversations) {
      const patterns = await this.analyzeConversationPatterns(conversation.id);
      
      // Generate insights based on patterns
      patterns.forEach(pattern => {
        const insight = this.generateInsightFromPattern(pattern, conversation);
        if (insight) insights.push(insight);
      });
    }

    // Cross-conversation insights
    if (conversations.length > 1) {
      const crossInsights = await this.generateCrossConversationInsights(conversations);
      insights.push(...crossInsights);
    }

    this.insights = insights;
    await this.saveInsightsToDatabase(insights);

    return insights;
  }

  private generateInsightFromPattern(pattern: ConversationPattern, conversation: Conversation): ConversationInsight | null {
    const insightId = `${pattern.id}_insight`;

    switch (pattern.pattern_type) {
      case 'mood_trend':
        if (pattern.metadata.dominant_mood === 'negative' && pattern.confidence_score > 0.7) {
          return {
            id: insightId,
            insight_type: 'alert',
            title: 'Tendance d\'humeur négative détectée',
            description: `La conversation "${conversation.name}" montre une tendance d'humeur négative persistante.`,
            priority: 'high',
            action_items: [
              'Considérer un suivi plus fréquent',
              'Introduire des techniques de gestion émotionnelle',
              'Évaluer le besoin d\'accompagnement professionnel'
            ],
            related_conversations: [conversation.id],
            created_at: new Date().toISOString()
          };
        }
        break;

      case 'engagement_level':
        if (pattern.metadata.engagement_level === 'high') {
          return {
            id: insightId,
            insight_type: 'progress',
            title: 'Excellent engagement détecté',
            description: `Très bon niveau d'engagement dans "${conversation.name}".`,
            priority: 'medium',
            action_items: [
              'Maintenir cette dynamique positive',
              'Explorer de nouveaux objectifs',
              'Partager les réussites'
            ],
            related_conversations: [conversation.id],
            created_at: new Date().toISOString()
          };
        }
        break;

      case 'response_time':
        if (pattern.metadata.response_pattern === 'delayed' && pattern.confidence_score > 0.8) {
          return {
            id: insightId,
            insight_type: 'recommendation',
            title: 'Temps de réponse élevés',
            description: `Les délais de réponse dans "${conversation.name}" sont élevés.`,
            priority: 'low',
            action_items: [
              'Vérifier la disponibilité pour les sessions',
              'Considérer des créneaux plus adaptés',
              'Évaluer l\'engagement dans cette conversation'
            ],
            related_conversations: [conversation.id],
            created_at: new Date().toISOString()
          };
        }
        break;
    }

    return null;
  }

  private async generateCrossConversationInsights(conversations: Conversation[]): Promise<ConversationInsight[]> {
    const insights: ConversationInsight[] = [];

    // Look for conversations that might benefit from being merged
    for (let i = 0; i < conversations.length - 1; i++) {
      for (let j = i + 1; j < conversations.length; j++) {
        const comparison = await this.compareConversations(conversations[i].id, conversations[j].id);
        
        if (comparison.similarity_score > 0.8) {
          insights.push({
            id: `merge_suggestion_${conversations[i].id}_${conversations[j].id}`,
            insight_type: 'recommendation',
            title: 'Fusion de conversations suggérée',
            description: `"${conversations[i].name}" et "${conversations[j].name}" traitent de sujets très similaires.`,
            priority: 'medium',
            action_items: [
              'Considérer fusionner ces conversations',
              'Transférer le contexte entre les conversations',
              'Consolider les objectifs communs'
            ],
            related_conversations: [conversations[i].id, conversations[j].id],
            created_at: new Date().toISOString()
          });
        }
      }
    }

    return insights;
  }

  // Database operations
  private async savePatternsToDatabase(conversationId: string, patterns: ConversationPattern[]): Promise<void> {
    try {
      // Delete existing patterns for this conversation
      await supabase
        .from('conversation_patterns')
        .delete()
        .eq('conversation_id', conversationId);

      // Insert new patterns
      if (patterns.length > 0) {
        const patternData = patterns.map(pattern => ({
          ...pattern,
          conversation_id: conversationId
        }));

        await supabase
          .from('conversation_patterns')
          .insert(patternData);
      }
    } catch (error) {
      console.error('Error saving patterns to database:', error);
    }
  }

  private async saveInsightsToDatabase(insights: ConversationInsight[]): Promise<void> {
    try {
      if (insights.length > 0) {
        await supabase
          .from('conversation_insights')
          .insert(insights);
      }
    } catch (error) {
      console.error('Error saving insights to database:', error);
    }
  }

  // Getters
  getPatterns(conversationId: string): ConversationPattern[] {
    return this.patterns.get(conversationId) || [];
  }

  getInsights(): ConversationInsight[] {
    return this.insights;
  }

  getInsightsByPriority(priority: 'low' | 'medium' | 'high'): ConversationInsight[] {
    return this.insights.filter(insight => insight.priority === priority);
  }

  getInsightsByType(type: 'recommendation' | 'alert' | 'progress' | 'trend'): ConversationInsight[] {
    return this.insights.filter(insight => insight.insight_type === type);
  }
}

// Export singleton instance
export const conversationAnalytics = ConversationAnalytics.getInstance();