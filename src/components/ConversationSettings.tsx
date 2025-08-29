import React, { useState, useEffect } from 'react';
import { useConversations } from '../contexts/ConversationsContext';
import { conversationAnalytics } from '../services/ConversationAnalytics';
import { aiContextManager } from '../services/AIContextManager';
import { Conversation, ConversationPattern, ConversationInsight } from '../types';
import { 
  Settings, 
  BarChart3, 
  Users, 
  Download, 
  Upload, 
  Merge, 
  Archive,
  AlertTriangle,
  TrendingUp,
  Brain,
  Tag,
  Palette,
  Bot,
  Clock,
  FileText,
  X,
  Save,
  RefreshCw
} from 'lucide-react';

interface ConversationSettingsProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationSettings: React.FC<ConversationSettingsProps> = ({
  conversationId,
  isOpen,
  onClose
}) => {
  const { conversations, updateConversation } = useConversations();
  const conversation = conversations.find(c => c.id === conversationId);

  const [activeTab, setActiveTab] = useState<'general' | 'analytics' | 'context' | 'advanced'>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // General settings
  const [name, setName] = useState('');
  const [theme, setTheme] = useState<Conversation['theme']>('personal');
  const [conversationMode, setConversationMode] = useState<'listening' | 'counseling' | 'analysis' | 'coaching'>('listening');
  const [aiModel, setAiModel] = useState<'gemini' | 'openai' | 'claude' | 'auto'>('auto');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [color, setColor] = useState('#3B82F6');

  // Analytics data
  const [patterns, setPatterns] = useState<ConversationPattern[]>([]);
  const [insights, setInsights] = useState<ConversationInsight[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Context data
  const [contextExport, setContextExport] = useState<string>('');
  const [contextImport, setContextImport] = useState<string>('');

  useEffect(() => {
    if (conversation && isOpen) {
      setName(conversation.name);
      setTheme(conversation.theme || 'personal');
      setConversationMode(conversation.conversation_mode || 'listening');
      setAiModel(conversation.ai_model_preference || 'auto');
      setTags(conversation.tags || []);
      setColor(conversation.color || '#3B82F6');
      setError(null);
      
      // Load analytics data
      loadAnalyticsData();
    }
  }, [conversation, isOpen]);

  const loadAnalyticsData = async () => {
    if (!conversationId) return;
    
    try {
      setAnalysisLoading(true);
      const [patterns, insights] = await Promise.all([
        conversationAnalytics.analyzeConversationPatterns(conversationId),
        conversationAnalytics.generateInsights(conversation?.user_id || '')
      ]);
      
      setPatterns(patterns);
      setInsights(insights.filter(i => i.related_conversations.includes(conversationId)));
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    if (!conversation || !name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      await updateConversation(conversationId, {
        name: name.trim(),
        theme,
        conversation_mode: conversationMode,
        ai_model_preference: aiModel,
        tags: tags.length > 0 ? tags : undefined,
        color
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleExportContext = async () => {
    try {
      setLoading(true);
      const exportData = await aiContextManager.exportContext(conversationId);
      setContextExport(exportData);
    } catch (error) {
      setError('Erreur lors de l\'export du contexte');
    } finally {
      setLoading(false);
    }
  };

  const handleImportContext = async () => {
    try {
      setLoading(true);
      await aiContextManager.importContext(conversationId, contextImport);
      setContextImport('');
      setError(null);
      alert('Contexte importé avec succès');
    } catch (error) {
      setError('Erreur lors de l\'import du contexte - Vérifiez le format');
    } finally {
      setLoading(false);
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'mood_trend': return <Brain className="w-4 h-4" />;
      case 'topic_frequency': return <Tag className="w-4 h-4" />;
      case 'engagement_level': return <TrendingUp className="w-4 h-4" />;
      case 'response_time': return <Clock className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'progress': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'recommendation': return <Brain className="w-4 h-4 text-blue-500" />;
      case 'trend': return <BarChart3 className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (!isOpen || !conversation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal container */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Settings className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Paramètres de conversation
                </h2>
                <p className="text-sm text-gray-600">{conversation.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6">
              {[
                { id: 'general', label: 'Général', icon: Settings },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'context', label: 'Contexte IA', icon: Brain },
                { id: 'advanced', label: 'Avancé', icon: Bot }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la conversation
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thème
                      </label>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as Conversation['theme'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="personal">Personnel</option>
                        <option value="work">Travail</option>
                        <option value="family">Famille</option>
                        <option value="health">Santé mentale</option>
                        <option value="therapy">Thérapie</option>
                        <option value="custom">Personnalisé</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mode de conversation
                      </label>
                      <select
                        value={conversationMode}
                        onChange={(e) => setConversationMode(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="listening">Écoute empathique</option>
                        <option value="counseling">Conseil stratégique</option>
                        <option value="analysis">Analyse réflexive</option>
                        <option value="coaching">Coaching motivant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modèle IA préféré
                      </label>
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="auto">Automatique</option>
                        <option value="claude">Claude</option>
                        <option value="openai">GPT</option>
                        <option value="gemini">Gemini</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Couleur
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nouveau tag..."
                          />
                          <button
                            onClick={handleAddTag}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                        </div>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                              >
                                {tag}
                                <button
                                  onClick={() => handleRemoveTag(tag)}
                                  className="ml-2 text-blue-500 hover:text-blue-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Analytics de conversation
                  </h3>
                  <button
                    onClick={loadAnalyticsData}
                    disabled={analysisLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${analysisLoading ? 'animate-spin' : ''}`} />
                    <span>Actualiser</span>
                  </button>
                </div>

                {/* Patterns */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Patterns détectés</h4>
                  {patterns.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun pattern détecté pour cette conversation.</p>
                  ) : (
                    <div className="space-y-3">
                      {patterns.map(pattern => (
                        <div
                          key={pattern.id}
                          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getPatternIcon(pattern.pattern_type)}
                              <div>
                                <h5 className="font-medium text-gray-900">{pattern.description}</h5>
                                <p className="text-sm text-gray-600">
                                  Confiance: {Math.round(pattern.confidence_score * 100)}%
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(pattern.detected_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Insights */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Insights générés</h4>
                  {insights.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun insight disponible pour cette conversation.</p>
                  ) : (
                    <div className="space-y-3">
                      {insights.map(insight => (
                        <div
                          key={insight.id}
                          className={`p-4 border rounded-lg ${getPriorityColor(insight.priority)}`}
                        >
                          <div className="flex items-start space-x-3">
                            {getInsightIcon(insight.insight_type)}
                            <div className="flex-1">
                              <h5 className="font-medium">{insight.title}</h5>
                              <p className="text-sm mt-1">{insight.description}</p>
                              {insight.action_items.length > 0 && (
                                <ul className="text-sm mt-2 list-disc list-inside">
                                  {insight.action_items.map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'context' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Gestion du contexte IA
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Export du contexte</h4>
                    <button
                      onClick={handleExportContext}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 mb-3"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exporter</span>
                    </button>
                    {contextExport && (
                      <textarea
                        value={contextExport}
                        readOnly
                        className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                        placeholder="Le contexte exporté apparaîtra ici..."
                      />
                    )}
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Import de contexte</h4>
                    <textarea
                      value={contextImport}
                      onChange={(e) => setContextImport(e.target.value)}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono mb-3"
                      placeholder="Collez le contexte JSON à importer..."
                    />
                    <button
                      onClick={handleImportContext}
                      disabled={loading || !contextImport.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Importer</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Fonctionnalités avancées
                </h3>

                <div className="grid gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Fusion de conversations</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Fusionner cette conversation avec une autre pour consolider les contextes.
                    </p>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                      <Merge className="w-4 h-4" />
                      <span>Fusionner</span>
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Archivage</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Archiver cette conversation pour la masquer de la vue principale.
                    </p>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                      <Archive className="w-4 h-4" />
                      <span>Archiver</span>
                    </button>
                  </div>

                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-medium text-red-900 mb-2">Zone de danger</h4>
                    <p className="text-sm text-red-600 mb-3">
                      Actions irréversibles - procédez avec prudence.
                    </p>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Supprimer définitivement</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 bg-gray-50 border-t border-gray-200 space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Fermer
            </button>
            {activeTab === 'general' && (
              <button
                onClick={handleSaveGeneral}
                disabled={loading || !name.trim()}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};