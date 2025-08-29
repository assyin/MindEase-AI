import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  Star, 
  Heart, 
  Brain, 
  Globe,
  CheckCircle,
  Sparkles,
  User,
  MessageCircle,
  Clock
} from 'lucide-react';
import ExpertMatchingService from '../services/ExpertMatchingService';
import TherapeuticTTSService from '../services/TherapeuticTTSService';
import { therapeuticExperts } from '../data/therapeuticExperts';

interface Expert {
  id: string;
  name: string;
  specialty: string;
  approach: string;
  personality: string;
  voiceId: string;
  avatar: string;
  description: string;
  experience: string;
  languages: string[];
  culturalBackground: string;
  keyStrengths: string[];
  typicalPhrases: string[];
  compatibilityScore?: number;
  completionRate?: number;
  engagementPrediction?: number;
}

interface VoicePreview {
  expertId: string;
  isLoading: boolean;
  isPlaying: boolean;
  audioUrl?: string;
  duration?: number;
}

interface ExpertSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (expert: Expert) => void;
  userProfile?: any;
  preSelectedExpertId?: string;
  showCompatibilityScores?: boolean;
}

const SAMPLE_TEXTS = {
  'dr-sarah': "Bonjour, je suis le Dr Sarah Empathie. Je suis là pour vous accompagner avec douceur et compréhension dans votre parcours thérapeutique. Ensemble, nous explorerons vos émotions dans un espace sûr et bienveillant.",
  'dr-alex': "Salut, je suis le Dr Alex Mindfulness. Ma spécialité est la pleine conscience et la gestion du stress. Je vous guiderai vers une meilleure connexion avec vous-même à travers des techniques apaisantes et des exercices de méditation.",
  'dr-aicha': "مرحبا، أنا الدكتورة عائشة. أتحدث العربية والفرنسية وأفهم تماماً التحديات الثقافية. سأرافقك في رحلتك العلاجية مع احترام كامل لخلفيتك الثقافية وقيمك."
};

const ExpertSelectionModal: React.FC<ExpertSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  userProfile,
  preSelectedExpertId,
  showCompatibilityScores = false
}) => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [voicePreviews, setVoicePreviews] = useState<Record<string, VoicePreview>>({});
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const ttsServiceRef = useRef<TherapeuticTTSService>();
  const matchingServiceRef = useRef<ExpertMatchingService>();

  useEffect(() => {
    if (isOpen) {
      initializeServices();
      loadExperts();
    }
  }, [isOpen, userProfile]);

  useEffect(() => {
    // Auto-select pre-selected expert
    if (preSelectedExpertId && experts.length > 0) {
      const preSelected = experts.find(e => e.id === preSelectedExpertId);
      if (preSelected) {
        setSelectedExpert(preSelected);
      }
    }
  }, [preSelectedExpertId, experts]);

  const initializeServices = () => {
    ttsServiceRef.current = new TherapeuticTTSService();
    matchingServiceRef.current = new ExpertMatchingService();
  };

  const loadExperts = async () => {
    try {
      setLoading(true);
      
      // Get expert compatibility scores if user profile is available
      let expertsWithScores = Object.values(therapeuticExperts);
      
      if (userProfile && showCompatibilityScores && matchingServiceRef.current) {
        const matchingResults = await matchingServiceRef.current.matchOptimalExpert(userProfile);
        
        expertsWithScores = expertsWithScores.map(expert => ({
          ...expert,
          compatibilityScore: matchingResults.compatibilityBreakdown[expert.id]?.totalScore || 0,
          completionRate: matchingResults.compatibilityBreakdown[expert.id]?.predictions.completionRate || 0,
          engagementPrediction: matchingResults.compatibilityBreakdown[expert.id]?.predictions.engagementScore || 0
        }));

        // Sort by compatibility score
        expertsWithScores.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
      }

      setExperts(expertsWithScores as Expert[]);
    } catch (error) {
      console.error('Error loading experts:', error);
      setExperts(Object.values(therapeuticExperts) as Expert[]);
    } finally {
      setLoading(false);
    }
  };

  const generateVoicePreview = async (expert: Expert) => {
    if (!ttsServiceRef.current) return;

    const expertId = expert.id;
    
    // Set loading state
    setVoicePreviews(prev => ({
      ...prev,
      [expertId]: { expertId, isLoading: true, isPlaying: false }
    }));

    try {
      const sampleText = SAMPLE_TEXTS[expertId as keyof typeof SAMPLE_TEXTS] || 
        `Bonjour, je suis ${expert.name}. Je suis spécialisé en ${expert.specialty} et j'utilise une approche ${expert.approach}. J'ai hâte de vous accompagner dans votre parcours thérapeutique.`;

      const audioUrl = await ttsServiceRef.current.generateExpertVoicePreview(
        expert.id,
        sampleText,
        {
          preview: true,
          maxDuration: 15000, // 15 seconds max
          emotionalTone: 'welcoming'
        }
      );

      setVoicePreviews(prev => ({
        ...prev,
        [expertId]: {
          expertId,
          isLoading: false,
          isPlaying: false,
          audioUrl,
          duration: 15
        }
      }));
    } catch (error) {
      console.error('Error generating voice preview:', error);
      setVoicePreviews(prev => ({
        ...prev,
        [expertId]: { expertId, isLoading: false, isPlaying: false }
      }));
    }
  };

  const playVoicePreview = async (expertId: string) => {
    const preview = voicePreviews[expertId];
    if (!preview?.audioUrl || !audioRef.current) return;

    try {
      // Stop any currently playing audio
      if (currentlyPlaying && currentlyPlaying !== expertId) {
        audioRef.current.pause();
        setVoicePreviews(prev => ({
          ...prev,
          [currentlyPlaying]: { ...prev[currentlyPlaying], isPlaying: false }
        }));
      }

      if (preview.isPlaying) {
        // Pause current audio
        audioRef.current.pause();
        setCurrentlyPlaying(null);
        setVoicePreviews(prev => ({
          ...prev,
          [expertId]: { ...prev[expertId], isPlaying: false }
        }));
      } else {
        // Play audio
        audioRef.current.src = preview.audioUrl;
        await audioRef.current.play();
        setCurrentlyPlaying(expertId);
        setVoicePreviews(prev => ({
          ...prev,
          [expertId]: { ...prev[expertId], isPlaying: true }
        }));
      }
    } catch (error) {
      console.error('Error playing voice preview:', error);
    }
  };

  const handleAudioEnded = () => {
    if (currentlyPlaying) {
      setVoicePreviews(prev => ({
        ...prev,
        [currentlyPlaying]: { ...prev[currentlyPlaying], isPlaying: false }
      }));
      setCurrentlyPlaying(null);
    }
  };

  const handleExpertSelect = (expert: Expert) => {
    setSelectedExpert(expert);
  };

  const handleConfirmSelection = () => {
    if (selectedExpert) {
      onSelect(selectedExpert);
    }
  };

  const getExpertIcon = (expertId: string) => {
    switch (expertId) {
      case 'dr-sarah': return Heart;
      case 'dr-alex': return Brain;
      case 'dr-aicha': return Globe;
      default: return User;
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="expert-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <Sparkles className="w-6 h-6 mr-2" />
                  Choisissez votre Expert Thérapeutique
                </h2>
                <p className="text-blue-100 mt-1">
                  Sélectionnez l'expert qui correspond le mieux à vos besoins
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex h-[600px]">
            {/* Experts List */}
            <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {experts.map((expert, index) => {
                    const IconComponent = getExpertIcon(expert.id);
                    const preview = voicePreviews[expert.id];
                    
                    return (
                      <motion.div
                        key={expert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleExpertSelect(expert)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedExpert?.id === expert.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <img
                              src={expert.avatar}
                              alt={expert.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                              expert.id === 'dr-sarah' ? 'bg-pink-500' :
                              expert.id === 'dr-alex' ? 'bg-green-500' : 'bg-purple-500'
                            }`}>
                              <IconComponent className="w-3 h-3 text-white" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {expert.name}
                              </h3>
                              {showCompatibilityScores && expert.compatibilityScore && (
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  getCompatibilityColor(expert.compatibilityScore)
                                }`}>
                                  {Math.round(expert.compatibilityScore)}% compatible
                                </div>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{expert.specialty}</p>
                            <p className="text-xs text-gray-500 line-clamp-2">{expert.description}</p>
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <MessageCircle className="w-3 h-3" />
                                <span>{expert.approach}</span>
                              </div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!preview?.audioUrl) {
                                    generateVoicePreview(expert);
                                  } else {
                                    playVoicePreview(expert.id);
                                  }
                                }}
                                disabled={preview?.isLoading}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  preview?.isLoading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : preview?.isPlaying
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                }`}
                              >
                                {preview?.isLoading ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full"
                                  />
                                ) : preview?.isPlaying ? (
                                  <Pause className="w-3 h-3" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                                <span>
                                  {preview?.isLoading ? 'Génération...' : preview?.isPlaying ? 'Pause' : 'Écouter'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Expert Details */}
            <div className="w-1/2 p-6 overflow-y-auto">
              {selectedExpert ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Expert Profile */}
                  <div className="text-center">
                    <img
                      src={selectedExpert.avatar}
                      alt={selectedExpert.name}
                      className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                    />
                    <h3 className="text-2xl font-bold text-gray-800">{selectedExpert.name}</h3>
                    <p className="text-blue-600 font-medium">{selectedExpert.specialty}</p>
                    <p className="text-gray-500 text-sm mt-1">{selectedExpert.experience}</p>
                  </div>

                  {/* Compatibility Metrics */}
                  {showCompatibilityScores && selectedExpert.compatibilityScore && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-2" />
                        Compatibilité avec votre profil
                      </h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(selectedExpert.compatibilityScore)}%
                          </div>
                          <div className="text-xs text-gray-500">Compatibilité</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round((selectedExpert.completionRate || 0) * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">Taux de réussite</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round(selectedExpert.engagementPrediction || 0)}/10
                          </div>
                          <div className="text-xs text-gray-500">Engagement prévu</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approach & Background */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Approche thérapeutique</h4>
                    <p className="text-gray-600 text-sm">{selectedExpert.approach}</p>
                    <p className="text-gray-600 text-sm mt-2">{selectedExpert.description}</p>
                  </div>

                  {/* Cultural Context */}
                  {selectedExpert.culturalBackground && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        Contexte culturel
                      </h4>
                      <p className="text-gray-600 text-sm">{selectedExpert.culturalBackground}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {selectedExpert.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Strengths */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Points forts</h4>
                    <div className="space-y-1">
                      {selectedExpert.specialties?.slice(0, 3).map((specialty, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                          {specialty}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typical Phrases */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Style de communication</h4>
                    <div className="space-y-2">
                      {selectedExpert.characteristic_phrases?.opening_session?.slice(0, 3).map((phrase, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-200"
                        >
                          <p className="text-sm text-gray-700 italic">"{phrase}"</p>
                        </div>
                      )) || (
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-200">
                          <p className="text-sm text-gray-700 italic">"{selectedExpert.personality?.communication_style}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <User className="w-16 h-16 mx-auto mb-4" />
                    <p>Sélectionnez un expert pour voir ses détails</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedExpert ? (
                  <span>Expert sélectionné: <strong>{selectedExpert.name}</strong></span>
                ) : (
                  <span>Sélectionnez un expert pour continuer</span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmSelection}
                  disabled={!selectedExpert}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmer le choix</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Audio Player */}
        <audio
          ref={audioRef}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExpertSelectionModal;