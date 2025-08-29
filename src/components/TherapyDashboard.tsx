import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, BookOpen, TrendingUp, Star, ChevronRight, PlayCircle, CheckCircle, AlertCircle, Zap, Heart } from 'lucide-react';
import TherapyProgramManager from '../services/TherapyProgramManager';
import SessionManager from '../services/SessionManager';
import TherapeuticIntegrationService from '../services/TherapeuticIntegrationService';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardData {
  currentProgram: any;
  nextSession: any;
  recentSessions: any[];
  activeHomework: any[];
  progressMetrics: any;
  weeklyGoals: any[];
  achievements: any[];
  expertProfile: any;
}

interface ProgressCircleProps {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  bgColor?: string;
  children?: React.ReactNode;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ 
  value, 
  max, 
  size, 
  strokeWidth, 
  color, 
  bgColor = "stroke-gray-200",
  children 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

const TherapyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'progress' | 'sessions' | 'homework'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const programManager = new TherapyProgramManager();
      const sessionManager = new SessionManager();
      
      const currentProgram = await programManager.getCurrentProgram(user.id);
      if (!currentProgram) {
        setDashboardData(null);
        return;
      }

      const [nextSession, recentSessions, activeHomework, progressMetrics] = await Promise.all([
        sessionManager.getNextSession(currentProgram.id),
        sessionManager.getRecentSessions(currentProgram.id, 5),
        sessionManager.getActiveHomework(user.id),
        programManager.getProgressMetrics(currentProgram.id)
      ]);

      const weeklyGoals = [
        { id: 1, title: "Compléter 2 sessions cette semaine", progress: 1, target: 2, completed: false },
        { id: 2, title: "Pratiquer la relaxation 5 fois", progress: 3, target: 5, completed: false },
        { id: 3, title: "Tenir mon journal d'humeur", progress: 4, target: 7, completed: false }
      ];

      const achievements = [
        { id: 1, title: "Première session complétée", icon: "🎉", date: "Il y a 3 jours", unlocked: true },
        { id: 2, title: "Une semaine de pratique", icon: "⭐", date: "Il y a 1 jour", unlocked: true },
        { id: 3, title: "Progression constante", icon: "📈", date: "", unlocked: false }
      ];

      setDashboardData({
        currentProgram,
        nextSession,
        recentSessions,
        activeHomework,
        progressMetrics,
        weeklyGoals,
        achievements,
        expertProfile: currentProgram.expert_profile
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    if (!dashboardData?.currentProgram) return;
    
    try {
      const integrationService = new TherapeuticIntegrationService();
      const sessionData = await integrationService.conductCompleteTherapeuticSession(
        dashboardData.currentProgram.id,
        'user_ready_for_session'
      );
      
      // Navigate to session interface (would be handled by router)
      console.log('Starting new session:', sessionData);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const getSessionDateDisplay = (date: string) => {
    const sessionDate = new Date(date);
    if (isToday(sessionDate)) return "Aujourd'hui";
    if (isTomorrow(sessionDate)) return "Demain";
    return format(sessionDate, 'EEEE d MMMM', { locale: fr });
  };

  const getProgressColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return "stroke-green-500";
    if (percentage >= 50) return "stroke-blue-500";
    if (percentage >= 30) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <BookOpen className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun programme actif</h2>
          <p className="text-gray-600 mb-6">Commencez votre parcours thérapeutique dès maintenant.</p>
          <button 
            onClick={() => {
              // Navigate to therapy onboarding
              const event = new CustomEvent('navigate-to-therapy-onboarding');
              window.dispatchEvent(event);
            }}
            className="bg-blue-500 text-white px-8 py-3 rounded-full hover:bg-blue-600 transition-colors"
          >
            Démarrer l'évaluation
          </button>
        </motion.div>
      </div>
    );
  }

  const { currentProgram, nextSession, recentSessions, activeHomework, progressMetrics, weeklyGoals, achievements, expertProfile } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-200 p-6"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mon Parcours Thérapeutique</h1>
            <p className="text-gray-600 mt-1">
              Programme: {currentProgram.title} • Expert: {expertProfile?.name}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Semaine</div>
              <div className="text-2xl font-bold text-blue-600">
                {currentProgram.current_week}/{currentProgram.total_weeks}
              </div>
            </div>
            
            <ProgressCircle
              value={currentProgram.current_week}
              max={currentProgram.total_weeks}
              size={60}
              strokeWidth={6}
              color="stroke-blue-500"
            >
              <span className="text-xs font-semibold text-blue-600">
                {Math.round((currentProgram.current_week / currentProgram.total_weeks) * 100)}%
              </span>
            </ProgressCircle>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg"
        >
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
            { key: 'progress', label: 'Progrès', icon: Star },
            { key: 'sessions', label: 'Sessions', icon: PlayCircle },
            { key: 'homework', label: 'Devoirs', icon: BookOpen }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedView(key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                selectedView === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {selectedView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Next Session Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                    Prochaine Session
                  </h3>
                  {nextSession && (
                    <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {getSessionDateDisplay(nextSession.scheduled_for)}
                    </span>
                  )}
                </div>
                
                {nextSession ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">{nextSession.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{nextSession.description}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <Clock className="w-4 h-4 mr-1" />
                          {nextSession.duration_minutes} minutes • Session {nextSession.session_number}
                        </div>
                      </div>
                      <button
                        onClick={startNewSession}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      >
                        <PlayCircle className="w-5 h-5" />
                        <span>Commencer</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune session programmée</p>
                  </div>
                )}
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Sessions Complétées</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{progressMetrics?.completed_sessions || 0}</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Devoirs Terminés</span>
                    <BookOpen className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{progressMetrics?.completed_homework || 0}</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Score Bien-être</span>
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {progressMetrics?.current_wellbeing_score || 0}/10
                  </div>
                </div>
              </motion.div>

              {/* Weekly Goals */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                  Objectifs de la Semaine
                </h3>
                <div className="space-y-4">
                  {weeklyGoals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{goal.title}</span>
                        <span className="text-xs text-gray-500">{goal.progress}/{goal.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(goal.progress / goal.target) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-2 rounded-full ${
                            goal.progress >= goal.target
                              ? 'bg-green-500'
                              : goal.progress >= goal.target * 0.5
                              ? 'bg-blue-500'
                              : 'bg-yellow-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Achievements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  Réalisations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + achievement.id * 0.1 }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        achievement.unlocked
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <h4 className="font-semibold text-gray-800 text-sm">{achievement.title}</h4>
                      {achievement.date && (
                        <p className="text-xs text-gray-500 mt-1">{achievement.date}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {selectedView === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Progress Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Vue d'ensemble des Progrès</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <ProgressCircle
                      value={progressMetrics?.completed_sessions || 0}
                      max={currentProgram.total_sessions}
                      size={120}
                      strokeWidth={8}
                      color="stroke-blue-500"
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">
                          {progressMetrics?.completed_sessions || 0}
                        </div>
                        <div className="text-xs text-gray-500">Sessions</div>
                      </div>
                    </ProgressCircle>
                  </div>
                  
                  <div className="text-center">
                    <ProgressCircle
                      value={progressMetrics?.completed_homework || 0}
                      max={progressMetrics?.total_homework || 1}
                      size={120}
                      strokeWidth={8}
                      color="stroke-green-500"
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">
                          {progressMetrics?.completed_homework || 0}
                        </div>
                        <div className="text-xs text-gray-500">Devoirs</div>
                      </div>
                    </ProgressCircle>
                  </div>
                </div>
              </div>

              {/* Mood Tracking */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Évolution de l'Humeur</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Score Actuel</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {progressMetrics?.current_wellbeing_score || 0}/10
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Score Initial</span>
                    <span className="text-lg text-gray-500">
                      {progressMetrics?.initial_wellbeing_score || 0}/10
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amélioration</span>
                    <span className={`text-lg font-semibold ${
                      (progressMetrics?.current_wellbeing_score || 0) > (progressMetrics?.initial_wellbeing_score || 0)
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}>
                      +{((progressMetrics?.current_wellbeing_score || 0) - (progressMetrics?.initial_wellbeing_score || 0))} points
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Sessions Récentes</h3>
              <div className="space-y-4">
                {recentSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        session.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-800">{session.title}</h4>
                        <p className="text-sm text-gray-500">
                          {format(new Date(session.created_at), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800">
                        {session.duration_minutes} min
                      </div>
                      <div className="text-xs text-gray-500">
                        Score: {session.post_session_score}/10
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedView === 'homework' && (
            <motion.div
              key="homework"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Devoirs Actifs</h3>
              <div className="space-y-4">
                {activeHomework.map((homework, index) => (
                  <motion.div
                    key={homework.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">{homework.title}</h4>
                        <p className="text-sm text-gray-600">{homework.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        homework.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : homework.due_date && new Date(homework.due_date) < new Date()
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {homework.status === 'completed'
                          ? 'Terminé'
                          : homework.due_date && new Date(homework.due_date) < new Date()
                          ? 'En retard'
                          : 'En cours'
                        }
                      </div>
                    </div>
                    
                    {homework.due_date && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Calendar className="w-4 h-4 mr-1" />
                        Échéance: {format(new Date(homework.due_date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    )}

                    {homework.status !== 'completed' && (
                      <button className="w-full bg-blue-50 text-blue-600 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium">
                        Commencer le devoir
                      </button>
                    )}
                  </motion.div>
                ))}

                {activeHomework.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun devoir actif</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TherapyDashboard;