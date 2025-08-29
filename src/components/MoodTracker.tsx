import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { Heart, Calendar, TrendingUp } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MoodEntry {
  id?: string;
  user_id: string;
  mood_rating: number;
  notes?: string;
  created_at: string;
}

interface MoodStats {
  average: number;
  trend: 'improving' | 'stable' | 'declining';
  weeklyData: { date: string; mood: number }[];
}

const moodEmojis = {
  1: { emoji: '😢', label: 'Très triste', color: 'text-red-500' },
  2: { emoji: '😞', label: 'Triste', color: 'text-orange-500' },
  3: { emoji: '😐', label: 'Neutre', color: 'text-yellow-500' },
  4: { emoji: '😊', label: 'Heureux', color: 'text-green-500' },
  5: { emoji: '😄', label: 'Très heureux', color: 'text-blue-500' }
};

export const MoodTracker: React.FC = () => {
  const { user } = useAuth();
  const [currentMood, setCurrentMood] = useState<number>(3);
  const [moodNotes, setMoodNotes] = useState('');
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [moodStats, setMoodStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadMoodData();
    }
  }, [user]);

  const loadMoodData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Charger les entrées récentes
      const { data: entries, error: entriesError } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(7);

      if (entriesError) throw entriesError;
      setRecentEntries(entries || []);

      // Calculer les statistiques
      if (entries && entries.length > 0) {
        const weekData = generateWeeklyData(entries);
        const average = entries.reduce((sum, entry) => sum + entry.mood_rating, 0) / entries.length;
        const trend = calculateTrend(entries);
        
        setMoodStats({
          average: Math.round(average * 10) / 10,
          trend,
          weeklyData: weekData
        });
      }
    } catch (error) {
      console.error('Erreur chargement données humeur:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyData = (entries: MoodEntry[]) => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter(entry => 
        format(new Date(entry.created_at), 'yyyy-MM-dd') === dateStr
      );
      
      const averageMood = dayEntries.length > 0 
        ? dayEntries.reduce((sum, entry) => sum + entry.mood_rating, 0) / dayEntries.length
        : 0;

      return {
        date: format(date, 'dd/MM', { locale: fr }),
        mood: Math.round(averageMood * 10) / 10
      };
    });
  };

  const calculateTrend = (entries: MoodEntry[]): 'improving' | 'stable' | 'declining' => {
    if (entries.length < 2) return 'stable';
    
    const recent = entries.slice(0, 3);
    const older = entries.slice(3, 6);
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.mood_rating, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, entry) => sum + entry.mood_rating, 0) / older.length
      : recentAvg;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.3) return 'improving';
    if (difference < -0.3) return 'declining';
    return 'stable';
  };

  const saveMoodEntry = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('mood_entries')
        .insert([{
          user_id: user.id,
          mood_rating: currentMood,
          notes: moodNotes || null,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      // Reset form et recharger les données
      setMoodNotes('');
      setCurrentMood(3);
      setShowForm(false);
      await loadMoodData();
      
    } catch (error) {
      console.error('Erreur sauvegarde humeur:', error);
    } finally {
      setLoading(false);
    }
  };

  const MoodButton: React.FC<{ 
    mood: number; 
    selected: boolean; 
    onClick: () => void;
  }> = ({ mood, selected, onClick }) => {
    const moodData = moodEmojis[mood as keyof typeof moodEmojis];
    
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center p-4 rounded-xl transition-all transform hover:scale-105 ${
          selected 
            ? 'bg-blue-100 border-2 border-blue-500 shadow-md' 
            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
        }`}
      >
        <div className={`text-3xl mb-2 ${moodData.color}`}>
          {moodData.emoji}
        </div>
        <span className="text-xs font-medium text-gray-700">
          {moodData.label}
        </span>
      </button>
    );
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-100';
      case 'declining': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  if (loading && !moodStats) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Mood Entry */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Heart className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Comment vous sentez-vous ?
            </h3>
            <p className="text-sm text-gray-600">
              Suivez votre bien-être quotidien
            </p>
          </div>
        </div>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 font-medium"
          >
            Enregistrer mon humeur du jour
          </button>
        ) : (
          <div className="space-y-6">
            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sélectionnez votre humeur
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(mood => (
                  <MoodButton
                    key={mood}
                    mood={mood}
                    selected={currentMood === mood}
                    onClick={() => setCurrentMood(mood)}
                  />
                ))}
              </div>
            </div>

            {/* Notes optionnelles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={moodNotes}
                onChange={(e) => setMoodNotes(e.target.value)}
                placeholder="Qu'est-ce qui influence votre humeur aujourd'hui ?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                rows={3}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={saveMoodEntry}
                disabled={loading}
                className="flex-1 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setMoodNotes('');
                  setCurrentMood(3);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mood Statistics */}
      {moodStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Statistics Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-800">Statistiques</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Humeur moyenne</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {moodEmojis[Math.round(moodStats.average) as keyof typeof moodEmojis]?.emoji}
                  </span>
                  <span className="font-semibold">{moodStats.average}/5</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tendance</span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(moodStats.trend)}`}>
                  <span>{getTrendIcon(moodStats.trend)}</span>
                  <span>
                    {moodStats.trend === 'improving' ? 'En amélioration' :
                     moodStats.trend === 'declining' ? 'En baisse' : 'Stable'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-800">7 derniers jours</h4>
            </div>
            
            <div className="space-y-2">
              {moodStats.weeklyData.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{day.date}</span>
                  <div className="flex items-center gap-2">
                    {day.mood > 0 ? (
                      <>
                        <span className="text-lg">
                          {moodEmojis[Math.round(day.mood) as keyof typeof moodEmojis]?.emoji || '😐'}
                        </span>
                        <span className="text-sm font-medium">{day.mood}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">Pas de données</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h4 className="font-semibold text-gray-800 mb-4">Entrées récentes</h4>
          <div className="space-y-3">
            {recentEntries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">
                  {moodEmojis[entry.mood_rating as keyof typeof moodEmojis]?.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {moodEmojis[entry.mood_rating as keyof typeof moodEmojis]?.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(entry.created_at), 'dd/MM à HH:mm', { locale: fr })}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-600">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;