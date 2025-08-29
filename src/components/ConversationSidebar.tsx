import React, { useState, useRef, useEffect } from 'react';
import { useConversations, useConversationFilters } from '../contexts/ConversationsContext';
import { Conversation } from '../types';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Star, 
  Archive, 
  Trash2, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
  Folder,
  Tag
} from 'lucide-react';
import { conversationManager } from '../services/ConversationManager';

interface ConversationSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCreateConversation: () => void;
  className?: string;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onCreateConversation,
  className = ''
}) => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    toggleFavorite,
    archiveConversation,
    deleteConversation,
    updateConversation,
    loading,
    error
  } = useConversations();

  const {
    getActiveConversations,
    getArchivedConversations,
    getFavoriteConversations,
    searchConversations,
    getConversationsByTheme
  } = useConversationFilters();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'archived' | 'theme'>('all');
  const [selectedTheme, setSelectedTheme] = useState<Conversation['theme']>('personal');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedConversation, setDraggedConversation] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Filter conversations based on current filter and search
  const getFilteredConversations = (): Conversation[] => {
    let filteredConversations: Conversation[] = [];

    switch (filter) {
      case 'favorites':
        filteredConversations = getFavoriteConversations();
        break;
      case 'archived':
        filteredConversations = getArchivedConversations();
        break;
      case 'theme':
        filteredConversations = getConversationsByTheme(selectedTheme);
        break;
      default:
        filteredConversations = getActiveConversations();
    }

    if (searchQuery) {
      filteredConversations = searchConversations(searchQuery).filter(c => 
        filteredConversations.some(fc => fc.id === c.id)
      );
    }

    return filteredConversations;
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setActiveConversation(conversation.id);
  };

  const handleEditStart = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingName(conversation.name);
    setShowMenu(null);
  };

  const handleEditSave = async (conversationId: string) => {
    if (editingName.trim() && editingName !== conversations.find(c => c.id === conversationId)?.name) {
      try {
        await updateConversation(conversationId, { name: editingName.trim() });
      } catch (error) {
        console.error('Error updating conversation name:', error);
      }
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, conversationId: string) => {
    if (e.key === 'Enter') {
      handleEditSave(conversationId);
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    try {
      await toggleFavorite(conversationId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleArchive = async (conversationId: string) => {
    try {
      await archiveConversation(conversationId);
      setShowMenu(null);
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  const handleDelete = async (conversationId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.')) {
      try {
        await deleteConversation(conversationId);
        setShowMenu(null);
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, conversationId: string) => {
    setDraggedConversation(conversationId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, conversationId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(conversationId);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (draggedConversation && draggedConversation !== targetId) {
      // TODO: Implement conversation reordering
      console.log('Reorder conversation:', draggedConversation, 'before:', targetId);
    }
    
    setDraggedConversation(null);
    setDropTarget(null);
  };

  const getConversationIcon = (theme?: Conversation['theme']) => {
    const icons = {
      work: '💼',
      family: '👨‍👩‍👧‍👦',
      health: '🧘‍♀️',
      personal: '🌱',
      therapy: '💚',
      custom: '⭐'
    };
    return icons[theme || 'personal'];
  };

  const formatLastMessage = (conversation: Conversation): string => {
    if (!conversation.last_message) return 'Aucun message';
    const preview = conversation.last_message.substring(0, 50);
    return preview.length < conversation.last_message.length ? `${preview}...` : preview;
  };

  const formatLastActivity = (conversation: Conversation): string => {
    if (!conversation.last_message_at) return '';
    
    const now = new Date();
    const lastActivity = new Date(conversation.last_message_at);
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return lastActivity.toLocaleDateString();
  };

  const filteredConversations = getFilteredConversations();

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    } ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          )}
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <button
                onClick={onCreateConversation}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Nouvelle conversation"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onToggleCollapse}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title={isCollapsed ? 'Développer' : 'Réduire'}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {!isCollapsed && (
        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === 'favorites' 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Star className="w-3 h-3 inline mr-1" />
              Favoris
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === 'archived' 
                  ? 'bg-gray-200 text-gray-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Archive className="w-3 h-3 inline mr-1" />
              Archivées
            </button>
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            {isCollapsed ? '...' : 'Chargement...'}
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 text-sm">
            {isCollapsed ? '!' : error}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {isCollapsed ? '∅' : searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`relative group cursor-pointer transition-all duration-200 ${
                  conversation.id === activeConversationId
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50'
                } ${
                  dropTarget === conversation.id ? 'border-t-2 border-blue-400' : ''
                }`}
                onClick={() => handleConversationSelect(conversation)}
                draggable={!isCollapsed}
                onDragStart={(e) => handleDragStart(e, conversation.id)}
                onDragOver={(e) => handleDragOver(e, conversation.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, conversation.id)}
              >
                <div className="flex items-center p-3 space-x-3">
                  {/* Theme Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    isCollapsed ? 'w-8 h-8' : ''
                  }`} style={{ backgroundColor: `${conversation.color}20` }}>
                    {isCollapsed ? getConversationIcon(conversation.theme) : getConversationIcon(conversation.theme)}
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      {editingId === conversation.id ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, conversation.id)}
                          onBlur={() => handleEditSave(conversation.id)}
                          className="w-full px-2 py-1 text-sm font-medium bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.name}
                          </h3>
                          {conversation.is_favorite && (
                            <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                          )}
                        </div>
                      )}

                      {/* Last Message Preview */}
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {formatLastMessage(conversation)}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          {conversation.tags && conversation.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              {conversation.tags.slice(0, 2).map(tag => (
                                <span
                                  key={tag}
                                  className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>{conversation.message_count}</span>
                          <MessageSquare className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Last Activity */}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatLastActivity(conversation)}
                      </p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  {!isCollapsed && (
                    <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleToggleFavorite(e, conversation.id)}
                        className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                          conversation.is_favorite ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                        title={conversation.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <Star className={`w-4 h-4 ${conversation.is_favorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(showMenu === conversation.id ? null : conversation.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Plus d'options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Context Menu */}
                {showMenu === conversation.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-2 top-12 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
                  >
                    <button
                      onClick={() => handleEditStart(conversation)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Renommer
                    </button>
                    <button
                      onClick={() => handleArchive(conversation.id)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Archive className="w-4 h-4 inline mr-2" />
                      Archiver
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => handleDelete(conversation.id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 inline mr-2" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section - Create Button (when collapsed) */}
      {isCollapsed && (
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={onCreateConversation}
            className="w-full p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Nouvelle conversation"
          >
            <Plus className="w-5 h-5 mx-auto" />
          </button>
        </div>
      )}
    </div>
  );
};