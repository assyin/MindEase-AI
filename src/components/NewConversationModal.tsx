import React, { useState, useEffect } from 'react';
import { useConversations } from '../contexts/ConversationsContext';
import { Conversation } from '../types';
import { conversationManager } from '../services/ConversationManager';
import { X, Sparkles } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { ExpertSelector } from './ExpertSelector';
import { TherapyTheme } from '../data/therapyThemes';
import { AIExpert } from '../data/aiExperts';
import { conversationInitiationService, ConversationInitiationService } from '../services/ConversationInitiationService';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated?: (conversation: Conversation) => void;
}


export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated
}) => {
  const { createConversation } = useConversations();
  
  const [step, setStep] = useState<'theme' | 'expert' | 'confirm'>('theme');
  const [selectedTheme, setSelectedTheme] = useState<TherapyTheme | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<AIExpert | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('theme');
      setSelectedTheme(null);
      setSelectedExpert(null);
      setError(null);
    }
  }, [isOpen]);


  const handleThemeSelect = (theme: TherapyTheme) => {
    setSelectedTheme(theme);
    setStep('expert');
  };

  const handleExpertSelect = (expert: AIExpert) => {
    setSelectedExpert(expert);
    setStep('confirm');
  };

  const handleBackToThemes = () => {
    setStep('theme');
    setSelectedTheme(null);
    setSelectedExpert(null);
  };

  const handleBackToExperts = () => {
    setStep('expert');
    setSelectedExpert(null);
  };


  const handleCreateConversation = async () => {
    if (!selectedTheme || !selectedExpert) {
      setError('Veuillez sélectionner un thème et un expert');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create conversation with theme name and expert
      const conversation = await createConversation(
        selectedTheme.name,
        selectedTheme.category === 'work-stress' ? 'work' :
        selectedTheme.category === 'relationships_family' ? 'family' :
        selectedTheme.category === 'emotional_disorders' ? 'health' :
        selectedTheme.category === 'specialized_issues' ? 'therapy' :
        'personal',
        'auto'
      );

      // Update conversation with expert and theme settings
      await conversationManager.updateConversation(conversation.id, {
        conversation_mode: 'listening',
        tags: selectedTheme.tags,
        // Store expert info in conversation metadata
        color: selectedExpert.backgroundColor
      });

      // Store expert and theme selection for this conversation
      ConversationInitiationService.storeConversationContext(
        conversation.id,
        selectedExpert.id,
        selectedTheme.id
      );

      // Initiate conversation with expert opening message
      await conversationInitiationService.initiateConversation({
        conversationId: conversation.id,
        expertId: selectedExpert.id,
        themeId: selectedTheme.id
      });

      onConversationCreated?.(conversation);
      onClose();
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal container */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Nouvelle conversation
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {step === 'theme' && (
              <ThemeSelector
                onThemeSelect={handleThemeSelect}
                selectedTheme={selectedTheme || undefined}
              />
            )}

            {step === 'expert' && selectedTheme && (
              <ExpertSelector
                selectedTheme={selectedTheme}
                onExpertSelect={handleExpertSelect}
                onBack={handleBackToThemes}
                selectedExpert={selectedExpert || undefined}
              />
            )}

            {step === 'confirm' && selectedTheme && selectedExpert && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Prêt à commencer ?
                  </h2>
                  <p className="text-gray-600">
                    Voici un résumé de ta sélection avant de créer la conversation
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Thème sélectionné</h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg">
                        😊
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedTheme.name}</h4>
                        <p className="text-sm text-gray-600">{selectedTheme.description}</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Expert sélectionné</h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg shadow-sm">
                        {selectedExpert.avatar}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedExpert.name}</h4>
                        <p className="text-sm text-gray-600">{selectedExpert.specialty}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-sm">ℹ️</span>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Démarrage automatique</p>
                      <p>
                        {selectedExpert.name} ouvrira automatiquement la conversation avec un message d'accueil personnalisé. 
                        Tu pourras ensuite répondre et débuter votre échange.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleBackToExperts}
                    className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ← Modifier l'expert
                  </button>
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
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            {step === 'confirm' && selectedTheme && selectedExpert ? (
              <button
                onClick={handleCreateConversation}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer la conversation'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};