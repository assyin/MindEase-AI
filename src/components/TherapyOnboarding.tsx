/**
 * THERAPY ONBOARDING - INTERFACE D'ONBOARDING THÉRAPEUTIQUE COMPLÈTE
 * Flux complet : Sélection thématique → Évaluation → Matching expert → Programme
 * Documents de référence: Plan logique complet Phase 1 + Guide technique Phase D
 * Date: 29/08/2025
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Heart, 
  Users, 
  Stethoscope, 
  Briefcase, 
  ChevronRight, 
  CheckCircle, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Star,
  Clock,
  User,
  MessageCircle
} from 'lucide-react';

import TherapeuticIntegrationService from '../services/TherapeuticIntegrationService';
import ExpertMatchingService from '../services/ExpertMatchingService';
import { therapeuticExperts } from '../data/therapeuticExperts';
import { useAuth } from '../contexts/AuthContext';

// Types pour l'onboarding
interface TherapyTheme {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  prevalence: string;
  duration: string;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'scale' | 'multiple' | 'text';
  options?: string[];
  required: boolean;
}

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
}

interface UserProfile {
  personal_goals: string[];
  success_definition: string;
  cultural_context: string;
  preferred_language: 'fr' | 'ar';
  availability_per_week: number;
  voice_preferences?: any;
}

interface TherapyOnboardingProps {
  onComplete: () => void;
}

const TherapyOnboarding: React.FC<TherapyOnboardingProps> = ({ onComplete }) => {
  // Auth context
  const { user } = useAuth();
  
  // États principaux
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState<TherapyTheme | null>(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
  const [userProfile, setUserProfile] = useState<UserProfile>({
    personal_goals: [],
    success_definition: '',
    cultural_context: 'français',
    preferred_language: 'fr',
    availability_per_week: 2
  });
  const [expertMatching, setExpertMatching] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingExpertId, setPlayingExpertId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Services
  const integrationService = new TherapeuticIntegrationService();
  const matchingService = new ExpertMatchingService();

  // Étapes d'onboarding
  const onboardingSteps: OnboardingStep[] = [
    { step: 1, title: "Sélection thématique", description: "Choisissez votre problématique principale", completed: false },
    { step: 2, title: "Évaluation initiale", description: "Questionnaire personnalisé adaptatif", completed: false },
    { step: 3, title: "Profil thérapeutique", description: "Définition de vos objectifs", completed: false },
    { step: 4, title: "Sélection d'expert", description: "Matching automatique et prévisualisation", completed: false },
    { step: 5, title: "Programme personnalisé", description: "Création de votre parcours thérapeutique", completed: false }
  ];

  // Thèmes thérapeutiques (24 sujets organisés en 5 catégories)
  const therapyThemes: TherapyTheme[] = [
    // Troubles émotionnels
    { 
      id: 'anxiete_sociale', 
      category: 'Troubles émotionnels', 
      title: 'Anxiété sociale', 
      description: 'Peur excessive des situations sociales et du jugement d\'autrui',
      icon: Users,
      color: 'bg-blue-500',
      prevalence: '12% des adultes',
      duration: '8-12 semaines'
    },
    {
      id: 'anxiete_generalisee',
      category: 'Troubles émotionnels',
      title: 'Anxiété généralisée',
      description: 'Inquiétudes excessives et incontrôlables sur divers aspects de la vie',
      icon: Brain,
      color: 'bg-purple-500',
      prevalence: '6% des adultes',
      duration: '10-14 semaines'
    },
    {
      id: 'depression',
      category: 'Troubles émotionnels',
      title: 'Épisodes dépressifs',
      description: 'Tristesse persistante, perte d\'intérêt et d\'énergie',
      icon: Heart,
      color: 'bg-indigo-500',
      prevalence: '8% des adultes',
      duration: '12-16 semaines'
    },
    {
      id: 'attaques_panique',
      category: 'Troubles émotionnels',
      title: 'Attaques de panique',
      description: 'Crises d\'anxiété intense avec symptômes physiques',
      icon: Stethoscope,
      color: 'bg-red-500',
      prevalence: '4% des adultes',
      duration: '8-12 semaines'
    },
    
    // Relations & Famille
    {
      id: 'conflits_familiaux',
      category: 'Relations & Famille',
      title: 'Conflits familiaux',
      description: 'Difficultés relationnelles avec la famille proche',
      icon: Users,
      color: 'bg-green-500',
      prevalence: '25% des familles',
      duration: '10-14 semaines'
    },
    {
      id: 'relations_amoureuses',
      category: 'Relations & Famille',
      title: 'Difficultés relationnelles',
      description: 'Problèmes de communication et d\'intimité',
      icon: Heart,
      color: 'bg-pink-500',
      prevalence: '35% des couples',
      duration: '12-16 semaines'
    },
    
    // Développement personnel
    {
      id: 'estime_de_soi',
      category: 'Développement personnel',
      title: 'Estime de soi',
      description: 'Manque de confiance et dévalorisation personnelle',
      icon: User,
      color: 'bg-orange-500',
      prevalence: '40% des adultes',
      duration: '10-14 semaines'
    },
    {
      id: 'stress_chronique',
      category: 'Développement personnel',
      title: 'Stress chronique',
      description: 'Tension permanente affectant la qualité de vie',
      icon: Brain,
      color: 'bg-yellow-500',
      prevalence: '55% des actifs',
      duration: '8-12 semaines'
    },
    
    // Vie quotidienne
    {
      id: 'burnout',
      category: 'Vie quotidienne',
      title: 'Burnout professionnel',
      description: 'Épuisement physique et émotionnel lié au travail',
      icon: Briefcase,
      color: 'bg-gray-500',
      prevalence: '15% des actifs',
      duration: '12-16 semaines'
    },
    {
      id: 'troubles_sommeil',
      category: 'Vie quotidienne',
      title: 'Troubles du sommeil',
      description: 'Difficultés d\'endormissement et sommeil non réparateur',
      icon: Clock,
      color: 'bg-teal-500',
      prevalence: '30% des adultes',
      duration: '8-10 semaines'
    }
  ];

  // Questions d'évaluation adaptatives
  const getAssessmentQuestions = (theme: TherapyTheme): AssessmentQuestion[] => {
    const baseQuestions: AssessmentQuestion[] = [
      {
        id: 'intensity',
        question: `Sur une échelle de 1 à 10, à quel point ${theme.title.toLowerCase()} vous affecte-t-il actuellement ?`,
        type: 'scale',
        required: true
      },
      {
        id: 'frequency',
        question: 'À quelle fréquence ressentez-vous ces difficultés ?',
        type: 'multiple',
        options: ['Quotidiennement', 'Plusieurs fois par semaine', 'Hebdomadairement', 'Occasionnellement'],
        required: true
      },
      {
        id: 'impact_life',
        question: 'Dans quelle mesure cela impacte-t-il votre vie quotidienne ?',
        type: 'scale',
        required: true
      },
      {
        id: 'duration',
        question: 'Depuis quand vivez-vous cette situation ?',
        type: 'multiple',
        options: ['Moins de 6 mois', '6 mois à 1 an', '1 à 3 ans', 'Plus de 3 ans'],
        required: true
      },
      {
        id: 'motivation',
        question: 'À quel point êtes-vous motivé(e) pour travailler sur cette problématique ?',
        type: 'scale',
        required: true
      },
      {
        id: 'previous_therapy',
        question: 'Avez-vous déjà suivi une thérapie ou un accompagnement psychologique ?',
        type: 'multiple',
        options: ['Jamais', 'Oui, récemment', 'Oui, il y a longtemps', 'Actuellement en cours'],
        required: true
      }
    ];

    // Questions spécifiques selon le thème
    if (theme.id === 'anxiete_sociale') {
      baseQuestions.push({
        id: 'social_situations',
        question: 'Quelles situations sociales vous posent le plus de difficultés ?',
        type: 'multiple',
        options: ['Prendre la parole en public', 'Rencontrer de nouvelles personnes', 'Réunions de travail', 'Événements sociaux'],
        required: true
      });
    }

    return baseQuestions;
  };

  // Rendu des étapes d'onboarding
  const renderProgressBar = () => (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {onboardingSteps.map((step, index) => (
          <div key={step.step} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
              ${currentStep >= step.step 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'bg-white border-gray-300 text-gray-500'}
            `}>
              {currentStep > step.step ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <span className="text-sm font-medium">{step.step}</span>
              )}
            </div>
            {index < onboardingSteps.length - 1 && (
              <div className={`
                w-16 h-0.5 mx-4 transition-colors
                ${currentStep > step.step ? 'bg-blue-500' : 'bg-gray-300'}
              `} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {onboardingSteps[currentStep - 1]?.title}
        </h2>
        <p className="text-gray-600 mt-1">
          {onboardingSteps[currentStep - 1]?.description}
        </p>
      </div>
    </div>
  );

  // ÉTAPE 1: Sélection thématique
  const renderThemeSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Quelle problématique souhaitez-vous aborder ?
        </h3>
        <p className="text-gray-600">
          Choisissez le domaine qui correspond le mieux à vos préoccupations actuelles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {therapyThemes.map((theme) => {
          const IconComponent = theme.icon;
          return (
            <motion.div
              key={theme.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-6 rounded-xl border-2 cursor-pointer transition-all
                ${selectedTheme?.id === theme.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-blue-300'}
              `}
              onClick={() => setSelectedTheme(theme)}
            >
              <div className={`w-12 h-12 ${theme.color} rounded-lg flex items-center justify-center mb-4`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                {theme.title}
              </h4>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {theme.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{theme.prevalence}</span>
                <span>{theme.duration}</span>
              </div>
              
              <div className="text-xs text-blue-600 mt-2 font-medium">
                {theme.category}
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedTheme && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => setCurrentStep(2)}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors inline-flex items-center"
          >
            Commencer l'évaluation
            <ChevronRight className="ml-2 w-5 h-5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );

  // Reset question index when theme changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [selectedTheme]);

  // ÉTAPE 2: Évaluation adaptative
  const renderAssessment = () => {
    if (!selectedTheme) return null;
    
    const questions = getAssessmentQuestions(selectedTheme);
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    const handleAnswer = (value: any) => {
      setAssessmentAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: value
      }));

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Évaluation complète
        setCurrentStep(3);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto"
      >
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} sur {questions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% complété</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl p-8 shadow-sm border">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            {currentQuestion.question}
          </h3>

          {currentQuestion.type === 'scale' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Pas du tout</span>
                <span className="text-sm text-gray-500">Extrêmement</span>
              </div>
              <div className="grid grid-cols-10 gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <button
                    key={num}
                    onClick={() => handleAnswer(num)}
                    className={`
                      h-12 rounded-lg border-2 font-medium transition-all
                      hover:border-blue-500 hover:bg-blue-50
                      ${assessmentAnswers[currentQuestion.id] === num 
                        ? 'border-blue-500 bg-blue-500 text-white' 
                        : 'border-gray-200 bg-white text-gray-700'}
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentQuestion.type === 'multiple' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all
                    hover:border-blue-500 hover:bg-blue-50
                    ${assessmentAnswers[currentQuestion.id] === option 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white'}
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <button
            onClick={() => setCurrentStep(1)}
            className="px-6 py-2 text-blue-600 hover:text-blue-800"
          >
            Changer de thème
          </button>
        </div>
      </motion.div>
    );
  };

  // ÉTAPE 3: Profil utilisateur
  const renderProfileSetup = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl p-8 shadow-sm border">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">
          Définissons vos objectifs thérapeutiques
        </h3>

        <div className="space-y-6">
          {/* Objectifs personnels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Que souhaitez-vous améliorer en priorité ? (Sélectionnez jusqu'à 3 objectifs)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Gérer mon anxiété',
                'Améliorer ma confiance en moi', 
                'Mieux communiquer',
                'Réduire mon stress',
                'Améliorer mes relations',
                'Retrouver l\'énergie'
              ].map(goal => (
                <button
                  key={goal}
                  onClick={() => {
                    setUserProfile(prev => ({
                      ...prev,
                      personal_goals: prev.personal_goals.includes(goal)
                        ? prev.personal_goals.filter(g => g !== goal)
                        : prev.personal_goals.length < 3 
                          ? [...prev.personal_goals, goal]
                          : prev.personal_goals
                    }));
                  }}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-all
                    ${userProfile.personal_goals.includes(goal)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'}
                  `}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Définition du succès */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              À quoi ressemblerait le succès pour vous ?
            </label>
            <textarea
              value={userProfile.success_definition}
              onChange={(e) => setUserProfile(prev => ({ ...prev, success_definition: e.target.value }))}
              placeholder="Décrivez en quelques phrases ce que vous aimeriez avoir accompli à la fin de votre parcours thérapeutique..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
          </div>

          {/* Disponibilité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Combien d'heures par semaine pouvez-vous consacrer à votre parcours thérapeutique ?
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(hours => (
                <button
                  key={hours}
                  onClick={() => setUserProfile(prev => ({ ...prev, availability_per_week: hours }))}
                  className={`
                    p-3 rounded-lg border-2 text-center transition-all
                    ${userProfile.availability_per_week === hours
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'}
                  `}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div>

          {/* Contexte culturel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contexte culturel et linguistique
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setUserProfile(prev => ({ 
                  ...prev, 
                  cultural_context: 'français',
                  preferred_language: 'fr'
                }))}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${userProfile.cultural_context === 'français'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'}
                `}
              >
                🇫🇷 Contexte français
              </button>
              <button
                onClick={() => setUserProfile(prev => ({ 
                  ...prev, 
                  cultural_context: 'marocain',
                  preferred_language: 'ar'
                }))}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${userProfile.cultural_context === 'marocain'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'}
                `}
              >
                🇲🇦 Contexte marocain/arabe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setCurrentStep(2)}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Retour
          </button>
          <button
            onClick={() => processExpertMatching()}
            disabled={userProfile.personal_goals.length === 0 || !userProfile.success_definition.trim()}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {isLoading ? 'Analyse en cours...' : 'Continuer'}
            {!isLoading && <ChevronRight className="ml-2 w-5 h-5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Traitement du matching expert
  const processExpertMatching = async () => {
    if (!selectedTheme) return;
    
    setIsLoading(true);
    try {
      const matching = await matchingService.quickExpertMatch(
        selectedTheme.id,
        userProfile.cultural_context,
        userProfile.preferred_language
      );
      
      setExpertMatching(matching);
      setCurrentStep(4);
    } catch (error) {
      console.error('Erreur matching expert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ÉTAPE 4: Sélection d'expert avec preview
  const renderExpertSelection = () => {
    if (!expertMatching) return null;

    const playExpertVoice = async (expertId: string) => {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setPlayingExpertId(null);
      }

      if (playingExpertId === expertId) return;

      try {
        // Simulation lecture audio expert
        setPlayingExpertId(expertId);
        
        // Dans la vraie implémentation, utiliser le TTS service
        // const audioResponse = await ttsService.generateExpertVoicePreview(expertId, 'greeting');
        // const audio = new Audio(audioResponse.audio_url);
        
        const audio = new Audio(); // Placeholder
        setCurrentAudio(audio);
        
        audio.onended = () => {
          setPlayingExpertId(null);
          setCurrentAudio(null);
        };
        
        // audio.play();
        
        // Simulation durée
        setTimeout(() => {
          setPlayingExpertId(null);
          setCurrentAudio(null);
        }, 3000);
        
      } catch (error) {
        console.error('Erreur lecture audio expert:', error);
        setPlayingExpertId(null);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Votre expert recommandé
          </h3>
          <p className="text-gray-600">
            Basé sur votre profil, nous avons sélectionné l'expert le plus adapté à vos besoins
          </p>
        </div>

        {/* Expert recommandé */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                {expertMatching.suggested_expert.name.split(' ')[1]?.[0]}
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-800">
                  {expertMatching.suggested_expert.name}
                </h4>
                <p className="text-blue-600 font-medium">
                  {expertMatching.suggested_expert.title}
                </p>
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-gray-600">
                    Compatibilité: {expertMatching.confidence_level}%
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => playExpertVoice(expertMatching.suggested_expert.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
                ${playingExpertId === expertMatching.suggested_expert.id
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}
              `}
            >
              {playingExpertId === expertMatching.suggested_expert.id ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Écouter</span>
                </>
              )}
            </button>
          </div>

          <p className="text-gray-700 mb-4">
            {expertMatching.reasoning}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-2">Spécialités</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {expertMatching.suggested_expert.specialties.slice(0, 3).map((specialty: string, index: number) => (
                  <li key={index}>• {specialty}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-2">Approche</h5>
              <p className="text-sm text-gray-600">
                {expertMatching.suggested_expert.primary_approach}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-2">Voix</h5>
              <p className="text-sm text-gray-600">
                {expertMatching.suggested_expert.voice_configuration.voice_description}
              </p>
            </div>
          </div>
        </div>

        {/* Alternatives */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Autres experts disponibles
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(therapeuticExperts)
              .filter(expert => expert.id !== expertMatching.suggested_expert.id)
              .map(expert => (
              <div key={expert.id} className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {expert.name.split(' ')[1]?.[0]}
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">{expert.name}</h5>
                      <p className="text-sm text-gray-600">{expert.primary_approach}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => playExpertVoice(expert.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {playingExpertId === expert.id ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  {expert.specialties.slice(0, 2).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentStep(3)}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Retour
          </button>
          <div className="space-x-4">
            <button
              className="px-6 py-3 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Choisir un autre expert
            </button>
            <button
              onClick={() => createTherapeuticProgram()}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors inline-flex items-center"
            >
              {isLoading ? 'Création...' : 'Créer mon programme'}
              {!isLoading && <ChevronRight className="ml-2 w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Création du programme thérapeutique
  const createTherapeuticProgram = async () => {
    if (!selectedTheme || !expertMatching) return;

    setIsLoading(true);
    try {
      const onboardingResult = await integrationService.completeTherapeuticOnboarding(
        user?.id || '',
        selectedTheme.id,
        userProfile
      );

      setCurrentStep(5);
      // Redirection vers le dashboard thérapeutique
    } catch (error) {
      console.error('Erreur création programme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ÉTAPE 5: Programme créé
  const renderProgramCreated = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto text-center"
    >
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-200">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Votre programme thérapeutique est prêt !
        </h3>
        
        <p className="text-gray-600 mb-6">
          Nous avons créé un parcours personnalisé de {selectedTheme?.duration} 
          avec {expertMatching?.suggested_expert.name} pour vous accompagner 
          dans l'amélioration de {selectedTheme?.title.toLowerCase()}.
        </p>

        <div className="bg-white rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-gray-800 mb-4">Votre programme inclut :</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-700">Sessions thérapeutiques audio</span>
            </div>
            <div className="flex items-center space-x-3">
              <Brain className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-700">Exercices pratiques personnalisés</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-700">Suivi de progrès en temps réel</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-700">Sessions optimisées 20-25 minutes</span>
            </div>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="bg-blue-500 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-600 transition-colors text-lg"
        >
          Commencer ma première session
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto">
        {renderProgressBar()}
        
        <AnimatePresence mode="wait">
          {currentStep === 1 && renderThemeSelection()}
          {currentStep === 2 && renderAssessment()}
          {currentStep === 3 && renderProfileSetup()}
          {currentStep === 4 && renderExpertSelection()}
          {currentStep === 5 && renderProgramCreated()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TherapyOnboarding;