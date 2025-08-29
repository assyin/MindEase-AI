import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AnalyticsService } from '../services/AnalyticsService';
import { DashboardMetrics } from '../types';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Download, TrendingUp, Calendar, Clock, Mic, Brain, Heart, Target } from 'lucide-react';

const analyticsService = new AnalyticsService();

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [selectedChart, setSelectedChart] = useState<'progress' | 'mood' | 'usage'>('progress');

  useEffect(() => {
    const loadMetrics = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const dashboardMetrics = await analyticsService.getDashboardMetrics(user.id, timeRange);
        setMetrics(dashboardMetrics);
      } catch (error) {
        console.error('Erreur chargement métriques:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [user, timeRange]);

  const handleExportData = async (format: 'json' | 'csv') => {
    if (!user) return;
    
    try {
      const exportData = await analyticsService.exportUserData(user.id, format);
      const blob = new Blob([exportData], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindease-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
    trend?: number;
  }> = ({ title, value, icon, color, subtitle, trend }) => (
    <div className={`${color} p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold">{value}</p>
            {trend !== undefined && (
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                trend > 0 ? 'bg-green-100 text-green-700' :
                trend < 0 ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
        <div className="text-2xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  const ChartContainer: React.FC<{
    title: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="h-64">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded-xl"></div>
            <div className="h-80 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const weeklyData = metrics.weeklyProgress.map((sessions, index) => ({
    day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][index],
    sessions,
    target: 2
  }));


  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Tableau de bord de {user?.full_name || 'votre bien-être'}
            </h1>
            <p className="text-gray-600 mt-2">
              Suivez votre progression et vos habitudes de bien-être mental
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExportData('json')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              JSON
            </button>
            <button
              onClick={() => handleExportData('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'week', label: 'Cette semaine', icon: Calendar },
            { id: 'month', label: 'Ce mois', icon: Calendar },
            { id: 'all', label: 'Tout', icon: TrendingUp }
          ].map(period => {
            const Icon = period.icon;
            return (
              <button
                key={period.id}
                onClick={() => setTimeRange(period.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === period.id
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                {period.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard
          title="Sessions totales"
          value={metrics.totalSessions}
          icon={<Calendar className="w-6 h-6" />}
          color="bg-blue-50 border border-blue-200"
          subtitle="conversations complètes"
          trend={5}
        />
        
        <StatCard
          title="Temps moyen"
          value={`${metrics.averageSessionTime} min`}
          icon={<Clock className="w-6 h-6" />}
          color="bg-green-50 border border-green-200"
          subtitle="par session"
          trend={12}
        />
        
        <StatCard
          title="Usage vocal"
          value={`${metrics.voiceUsagePercent}%`}
          icon={<Mic className="w-6 h-6" />}
          color="bg-purple-50 border border-purple-200"
          subtitle="de vos interactions"
          trend={-3}
        />
        
        <StatCard
          title="Score satisfaction"
          value={`${metrics.satisfactionScore}/5`}
          icon={<Heart className="w-6 h-6" />}
          color="bg-pink-50 border border-pink-200"
          subtitle="moyenne générale"
          trend={8}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatCard
          title="IA préférée"
          value={metrics.preferredModel === 'gemini' ? 'Gemini' : 'OpenAI'}
          icon={<Brain className="w-6 h-6" />}
          color="bg-orange-50 border border-orange-200"
          subtitle="modèle principal"
        />
        
        <StatCard
          title="Série actuelle"
          value={`${metrics.streakDays} jours`}
          icon={<Target className="w-6 h-6" />}
          color="bg-indigo-50 border border-indigo-200"
          subtitle="d'utilisation consécutive"
        />
        
        <StatCard
          title="Messages totaux"
          value={metrics.totalMessages}
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-teal-50 border border-teal-200"
          subtitle="envoyés au total"
        />
      </div>

      {/* Chart Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'progress', label: 'Progression', icon: TrendingUp },
            { id: 'mood', label: 'Humeur', icon: Heart },
            { id: 'usage', label: 'Utilisation', icon: Clock }
          ].map(chart => {
            const Icon = chart.icon;
            return (
              <button
                key={chart.id}
                onClick={() => setSelectedChart(chart.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedChart === chart.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                <Icon size={16} />
                {chart.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        {/* Main Chart */}
        <ChartContainer title="Progression hebdomadaire" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChart === 'progress' ? (
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="sessions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : selectedChart === 'mood' ? (
              <AreaChart data={metrics.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            ) : (
              <LineChart data={metrics.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>

        {/* Mood Trend Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Évolution de votre bien-être
          </h3>
          <div className="flex flex-col items-center justify-center h-64">
            <div className={`text-6xl mb-4 animate-pulse ${
              metrics.moodTrend === 'positive' ? 'text-green-500' :
              metrics.moodTrend === 'negative' ? 'text-red-500' :
              'text-gray-500'
            }`}>
              {metrics.moodTrend === 'positive' ? '📈' : 
               metrics.moodTrend === 'neutral' ? '➡️' : '📉'}
            </div>
            <p className={`text-xl font-semibold mb-2 ${
              metrics.moodTrend === 'positive' ? 'text-green-700' :
              metrics.moodTrend === 'negative' ? 'text-red-700' :
              'text-gray-700'
            }`}>
              {metrics.moodTrend === 'positive' ? 'En amélioration' :
               metrics.moodTrend === 'neutral' ? 'Stable' : 'Attention requise'}
            </p>
            <p className="text-sm text-gray-600 text-center">
              Basé sur vos dernières conversations et auto-évaluations
            </p>
            <div className={`mt-4 px-4 py-2 rounded-full text-sm font-medium ${
              metrics.moodTrend === 'positive' ? 'bg-green-100 text-green-700' :
              metrics.moodTrend === 'negative' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              Tendance: {metrics.moodTrend === 'positive' ? 'Positive' :
                        metrics.moodTrend === 'negative' ? 'Négative' : 'Neutre'}
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Insights */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Brain className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">
            Conseils personnalisés basés sur vos données
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-l-green-400">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-700">Objectif suggéré</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {metrics.streakDays < 7 
                ? "Essayez d'atteindre 7 jours consécutifs d'utilisation pour créer une habitude durable."
                : "Félicitations ! Continuez cette belle série en maintenant vos sessions quotidiennes."}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((metrics.streakDays / 7) * 100, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-l-blue-400">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-700">Optimisation temps</h4>
            </div>
            <p className="text-sm text-gray-600">
              {metrics.averageSessionTime < 5 
                ? "Vos sessions sont courtes. Essayez d'approfondir vos réflexions pour plus de bénéfices."
                : metrics.averageSessionTime > 20
                ? "Vos sessions sont longues. C'est excellent pour un travail en profondeur !"
                : "Durée optimale de session. Continuez ainsi !"}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-l-purple-400">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-700">Bien-être</h4>
            </div>
            <p className="text-sm text-gray-600">
              {metrics.moodTrend === 'positive'
                ? "Votre bien-être s'améliore ! Continuez vos bonnes pratiques."
                : metrics.moodTrend === 'negative'
                ? "Votre bien-être nécessite attention. Considérez des sessions plus fréquentes."
                : "Votre bien-être est stable. Explorez de nouvelles techniques pour progresser."}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Calendar size={16} />
            Nouvelle session
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Heart size={16} />
            Évaluer humeur
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <TrendingUp size={16} />
            Voir progression
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;