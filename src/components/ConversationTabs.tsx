import React, { useState, useRef, useEffect } from 'react';
import { useConversations } from '../contexts/ConversationsContext';
import { Conversation } from '../types';
import { X, Star, ChevronLeft, ChevronRight, Plus, MoreHorizontal } from 'lucide-react';

interface ConversationTabsProps {
  onCreateConversation: () => void;
  maxTabs?: number;
  className?: string;
}

export const ConversationTabs: React.FC<ConversationTabsProps> = ({
  onCreateConversation,
  maxTabs = 6,
  className = ''
}) => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    toggleFavorite,
    archiveConversation
  } = useConversations();

  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const tabsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Initialize open tabs with active conversation
  useEffect(() => {
    if (activeConversationId && !openTabs.includes(activeConversationId)) {
      setOpenTabs(prev => {
        const newTabs = [activeConversationId, ...prev.slice(0, maxTabs - 1)];
        return newTabs;
      });
    }
  }, [activeConversationId, maxTabs]);

  // Close overflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOverflowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTabConversations = (): Conversation[] => {
    return openTabs.map(tabId => 
      conversations.find(c => c.id === tabId)
    ).filter(Boolean) as Conversation[];
  };

  const handleTabClick = (conversationId: string) => {
    setActiveConversation(conversationId);
  };

  const handleTabClose = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    
    setOpenTabs(prev => {
      const newTabs = prev.filter(id => id !== conversationId);
      
      // If closing active tab, switch to next available tab
      if (conversationId === activeConversationId && newTabs.length > 0) {
        const currentIndex = prev.indexOf(conversationId);
        const nextIndex = currentIndex < newTabs.length ? currentIndex : newTabs.length - 1;
        setActiveConversation(newTabs[nextIndex]);
      }
      
      return newTabs;
    });
  };

  const handleAddTab = (conversationId: string) => {
    if (!openTabs.includes(conversationId)) {
      setOpenTabs(prev => {
        if (prev.length >= maxTabs) {
          // Replace oldest non-active tab
          const nonActiveTabs = prev.filter(id => id !== activeConversationId);
          if (nonActiveTabs.length > 0) {
            const tabToReplace = nonActiveTabs[nonActiveTabs.length - 1];
            return prev.map(id => id === tabToReplace ? conversationId : id);
          } else {
            // Replace last tab
            return [...prev.slice(0, -1), conversationId];
          }
        }
        return [...prev, conversationId];
      });
      setActiveConversation(conversationId);
    } else {
      setActiveConversation(conversationId);
    }
  };

  const handleScrollTabs = (direction: 'left' | 'right') => {
    const container = tabsRef.current;
    if (!container) return;

    const scrollAmount = 200;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);

    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, conversationId: string) => {
    setDraggedTab(conversationId);
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
    
    if (draggedTab && draggedTab !== targetId) {
      setOpenTabs(prev => {
        const draggedIndex = prev.indexOf(draggedTab);
        const targetIndex = prev.indexOf(targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return prev;
        
        const newTabs = [...prev];
        newTabs.splice(draggedIndex, 1);
        newTabs.splice(targetIndex, 0, draggedTab);
        
        return newTabs;
      });
    }
    
    setDraggedTab(null);
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

  const tabConversations = getTabConversations();
  const availableConversations = conversations.filter(c => 
    !c.is_archived && !openTabs.includes(c.id)
  );

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = tabsRef.current && 
    scrollPosition < (tabsRef.current.scrollWidth - tabsRef.current.clientWidth);

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center h-12">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScrollTabs('left')}
            className="flex-shrink-0 px-2 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Défiler vers la gauche"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Tabs Container */}
        <div
          ref={tabsRef}
          className="flex-1 flex overflow-x-hidden"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex space-x-0">
            {tabConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`relative flex-shrink-0 group transition-all duration-200 ${
                  dropTarget === conversation.id ? 'translate-x-1' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, conversation.id)}
                onDragOver={(e) => handleDragOver(e, conversation.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, conversation.id)}
              >
                <button
                  onClick={() => handleTabClick(conversation.id)}
                  className={`relative flex items-center px-4 py-3 space-x-2 border-r border-gray-200 transition-colors min-w-0 max-w-[200px] ${
                    activeConversationId === conversation.id
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-b-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {/* Conversation Icon */}
                  <span className="flex-shrink-0 text-sm">
                    {getConversationIcon(conversation.theme)}
                  </span>

                  {/* Conversation Name */}
                  <span className="truncate font-medium text-sm">
                    {conversation.name}
                  </span>

                  {/* Favorite Indicator */}
                  {conversation.is_favorite && (
                    <Star className="flex-shrink-0 w-3 h-3 text-yellow-500 fill-current" />
                  )}

                  {/* Unread Indicator */}
                  {conversation.message_count > 0 && conversation.id !== activeConversationId && (
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={(e) => handleTabClose(e, conversation.id)}
                  className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-all"
                  title="Fermer l'onglet"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Active Tab Indicator */}
                {activeConversationId === conversation.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Right Button */}
        {canScrollRight && (
          <button
            onClick={() => handleScrollTabs('right')}
            className="flex-shrink-0 px-2 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Défiler vers la droite"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Add Tab / Overflow Menu */}
        <div className="relative flex-shrink-0">
          {availableConversations.length > 0 || openTabs.length < maxTabs ? (
            <button
              onClick={() => setShowOverflowMenu(!showOverflowMenu)}
              className="px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Plus de conversations"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onCreateConversation}
              className="px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              title="Nouvelle conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {/* Overflow Menu */}
          {showOverflowMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[250px] max-h-[400px] overflow-y-auto"
            >
              {/* Available Conversations */}
              {availableConversations.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Conversations disponibles
                  </div>
                  {availableConversations.slice(0, 10).map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        handleAddTab(conversation.id);
                        setShowOverflowMenu(false);
                      }}
                      className="w-full flex items-center px-3 py-2 space-x-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm">{getConversationIcon(conversation.theme)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {conversation.name}
                          </span>
                          {conversation.is_favorite && (
                            <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {conversation.message_count} messages
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {availableConversations.length > 10 && (
                    <div className="px-3 py-2 text-xs text-gray-500 text-center">
                      +{availableConversations.length - 10} conversations de plus...
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              {(availableConversations.length > 0 && openTabs.length < maxTabs) && (
                <div className="border-t border-gray-100 my-2"></div>
              )}
              
              <button
                onClick={() => {
                  onCreateConversation();
                  setShowOverflowMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 space-x-3 text-left text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Nouvelle conversation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content Indicator */}
      {activeConversationId && (
        <div className="px-4 py-1 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>
                {tabConversations.find(c => c.id === activeConversationId)?.message_count || 0} messages
              </span>
              <span>•</span>
              <span>
                {tabConversations.find(c => c.id === activeConversationId)?.theme || 'personnel'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};