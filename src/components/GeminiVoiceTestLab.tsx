import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Star, Download, RefreshCw, Headphones, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { googleGenAITTSServiceV2 } from '../services/GoogleGenAITTSServiceV2';

interface GeminiVoice {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  description: string;
  recommended: boolean;
}

interface VoiceTestResult {
  voiceId: string;
  audioUrl?: string;
  duration?: number;
  rating: number;
  notes: string;
  error?: string;
  tested: boolean;
}

const STORAGE_KEY = 'gemini-voice-test-results';
const PHRASE_STORAGE_KEY = 'gemini-voice-test-phrase';

export const GeminiVoiceTestLab: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, VoiceTestResult>>({});
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testPhrase, setTestPhrase] = useState<string>('السلام عليكم، كيفاش الصحة؟ أنا هنا باش نساعدك');
  const [rateLimitInfo, setRateLimitInfo] = useState({ remaining: 3, resetTime: 0 });
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [currentError, setCurrentError] = useState<string>('');
  
  const testQueue = useRef<string[]>([]);
  const isProcessingQueue = useRef(false);

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    try {
      const savedResults = localStorage.getItem(STORAGE_KEY);
      const savedPhrase = localStorage.getItem(PHRASE_STORAGE_KEY);
      
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        setTestResults(parsedResults);
        console.log('🔄 Données de test chargées:', Object.keys(parsedResults).length, 'voix');
      }
      
      if (savedPhrase) {
        setTestPhrase(savedPhrase);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données sauvegardées:', error);
    }
  }, []);

  // Sauvegarder les résultats dans localStorage
  const saveResults = (newResults: Record<string, VoiceTestResult>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));
      console.log('💾 Résultats sauvegardés automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  };

  // Sauvegarder la phrase de test
  const saveTestPhrase = (phrase: string) => {
    try {
      localStorage.setItem(PHRASE_STORAGE_KEY, phrase);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la phrase:', error);
    }
  };

  // Voix officiellement supportées par Google Gemini TTS (mises à jour selon l'API)
  const allGeminiVoices: GeminiVoice[] = [
    // Voix actuellement utilisées pour les avatars marocains
    { id: 'umbriel', name: 'Umbriel', gender: 'FEMALE', description: 'Voix féminine empathique - Dr. Aicha', recommended: true },
    { id: 'algenib', name: 'Algenib', gender: 'MALE', description: 'Voix masculine énergique - Ahmed', recommended: true },
    { id: 'despina', name: 'Despina', gender: 'FEMALE', description: 'Voix douce casablancaise - Lalla Fatima', recommended: true },
    { id: 'iapetus', name: 'Iapetus', gender: 'MALE', description: 'Voix professionnelle - Dr. Youssef', recommended: true },

    // Autres voix Gemini TTS à tester pour la darija
    { id: 'orus', name: 'Orus', gender: 'MALE', description: 'Voix masculine naturelle, accent marocain potentiel', recommended: true },
    { id: 'aoede', name: 'Aoede', gender: 'FEMALE', description: 'Voix féminine, intonation maghrebine', recommended: true },
    { id: 'enceladus', name: 'Enceladus', gender: 'NEUTRAL', description: 'Voix neutre, darija claire', recommended: true },
    { id: 'rasalgethi', name: 'Rasalgethi', gender: 'MALE', description: 'Voix sage, conseil traditionnel', recommended: true },

    // Voix supportées officiellement par l'API Gemini TTS
    { id: 'achernar', name: 'Achernar', gender: 'MALE', description: 'Voix masculine stellaire', recommended: false },
    { id: 'achird', name: 'Achird', gender: 'FEMALE', description: 'Voix féminine astrale', recommended: false },
    { id: 'algieba', name: 'Algieba', gender: 'MALE', description: 'Voix masculine léonine', recommended: false },
    { id: 'alnilam', name: 'Alnilam', gender: 'MALE', description: 'Voix masculine orionide', recommended: false },
    { id: 'autonoe', name: 'Autonoe', gender: 'FEMALE', description: 'Voix féminine jovienne', recommended: false },
    { id: 'callirrhoe', name: 'Callirrhoe', gender: 'FEMALE', description: 'Voix féminine fluide', recommended: false },
    { id: 'charon', name: 'Charon', gender: 'MALE', description: 'Voix masculine sombre', recommended: false },
    { id: 'erinome', name: 'Erinome', gender: 'FEMALE', description: 'Voix féminine satellitaire', recommended: false },
    { id: 'fenrir', name: 'Fenrir', gender: 'MALE', description: 'Voix masculine lupine', recommended: false },
    { id: 'gacrux', name: 'Gacrux', gender: 'MALE', description: 'Voix masculine cruciale', recommended: false },
    { id: 'kore', name: 'Kore', gender: 'FEMALE', description: 'Voix féminine printanière', recommended: false },
    { id: 'laomedeia', name: 'Laomedeia', gender: 'FEMALE', description: 'Voix féminine troyenne', recommended: false },
    { id: 'leda', name: 'Leda', gender: 'FEMALE', description: 'Voix féminine cygne', recommended: false },
    { id: 'puck', name: 'Puck', gender: 'NEUTRAL', description: 'Voix espiègle uranienne', recommended: false },
    { id: 'pulcherrima', name: 'Pulcherrima', gender: 'FEMALE', description: 'Voix féminine belle', recommended: false },
    { id: 'sadachbia', name: 'Sadachbia', gender: 'MALE', description: 'Voix masculine aquarienne', recommended: false },
    { id: 'sadaltager', name: 'Sadaltager', gender: 'MALE', description: 'Voix masculine pégasienne', recommended: false },
    { id: 'schedar', name: 'Schedar', gender: 'FEMALE', description: 'Voix féminine cassiopéenne', recommended: false },
    { id: 'sulafat', name: 'Sulafat', gender: 'FEMALE', description: 'Voix féminine lyrique', recommended: false },
    { id: 'vindemiatrix', name: 'Vindemiatrix', gender: 'FEMALE', description: 'Voix féminine virginie', recommended: false },
    { id: 'zephyr', name: 'Zephyr', gender: 'MALE', description: 'Voix masculine ventée', recommended: false },
    { id: 'zubenelgenubi', name: 'Zubenelgenubi', gender: 'MALE', description: 'Voix masculine balance', recommended: false }
  ];

  // Vérifier et gérer les limites de taux
  const checkRateLimit = (): { canProceed: boolean; waitTime: number } => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
    const MIN_DELAY = 20 * 1000; // 20 secondes minimum entre requêtes
    
    // Réinitialiser le compteur si la fenêtre de limite est passée
    if (timeSinceLastRequest > RATE_LIMIT_WINDOW) {
      setRateLimitInfo({ remaining: 3, resetTime: now + RATE_LIMIT_WINDOW });
      return { canProceed: true, waitTime: 0 };
    }
    
    // Vérifier si nous devons attendre entre les requêtes
    if (timeSinceLastRequest < MIN_DELAY) {
      const waitTime = MIN_DELAY - timeSinceLastRequest;
      return { canProceed: false, waitTime };
    }
    
    // Vérifier les limites restantes
    if (rateLimitInfo.remaining <= 0 && now < rateLimitInfo.resetTime) {
      const waitTime = rateLimitInfo.resetTime - now;
      return { canProceed: false, waitTime };
    }
    
    return { canProceed: true, waitTime: 0 };
  };

  // Traitement de la queue de tests
  const processTestQueue = async () => {
    if (isProcessingQueue.current || testQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;
    
    while (testQueue.current.length > 0) {
      const voiceId = testQueue.current.shift()!;
      const voice = allGeminiVoices.find(v => v.id === voiceId);
      if (!voice) continue;

      const { canProceed, waitTime } = checkRateLimit();
      
      if (!canProceed) {
        console.log(`⏳ Rate limit: Waiting ${Math.round(waitTime/1000)}s before testing ${voice.name}`);
        setCurrentError(`⏳ Limitation de taux: Attente ${Math.round(waitTime/1000)}s avant de tester ${voice.name}`);
        
        // Attendre puis réessayer
        await new Promise(resolve => setTimeout(resolve, waitTime));
        testQueue.current.unshift(voiceId); // Remettre en tête de queue
        continue;
      }

      setCurrentError('');
      try {
        await testVoiceSingle(voice);
      } catch (error) {
        console.error(`❌ Queue processing failed for ${voice.name}:`, error);
      }
      
      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    isProcessingQueue.current = false;
  };

  const testVoiceWithDarija = async (voice: GeminiVoice) => {
    if (isPlaying === voice.id) {
      setIsPlaying(null);
      return;
    }

    const { canProceed, waitTime } = checkRateLimit();
    
    if (!canProceed) {
      setCurrentError(`⏳ Limitation de taux: Attendre ${Math.round(waitTime/1000)} secondes`);
      // Ajouter à la queue pour traitement ultérieur
      testQueue.current.push(voice.id);
      processTestQueue();
      return;
    }

    await testVoiceSingle(voice);
  };

  const testVoiceSingle = async (voice: GeminiVoice) => {
    try {
      setIsPlaying(voice.id);
      setCurrentTest(voice.id);
      setCurrentError('');
      console.log(`🧪 Testing Gemini voice: ${voice.name} (${voice.id}) with Darija`);

      const startTime = Date.now();
      setLastRequestTime(startTime);
      
      // Décrémenter le compteur de limite
      setRateLimitInfo(prev => ({ ...prev, remaining: Math.max(0, prev.remaining - 1) }));

      // Génération audio avec cette voix spécifique
      const audioResponse = await googleGenAITTSServiceV2.generateAvatarSpeech({
        text: testPhrase,
        avatarId: 'voice-test',
        voiceConfig: {
          voice_id: voice.id,
          language_code: 'ar-MA',
          speaking_rate: 0.9,
          pitch: 0,
          volume_gain_db: 0,
          emotional_tone: 'empathetic',
          pause_duration: 500,
          emphasis_words: [],
          accent: 'moroccan',
          cultural_context: 'moroccan_test'
        },
        conversationId: 'voice-test-lab'
      });

      const duration = Date.now() - startTime;

      // Jouer l'audio
      const audio = new Audio(audioResponse.audioUrl);
      audio.onended = () => {
        setIsPlaying(null);
        URL.revokeObjectURL(audioResponse.audioUrl);
      };
      audio.onerror = (err) => {
        console.error('Audio playback failed for:', voice.name, err);
        setIsPlaying(null);
        setCurrentError(`❌ Échec de lecture audio pour ${voice.name}`);
        URL.revokeObjectURL(audioResponse.audioUrl);
      };

      await audio.play();

      // Sauvegarder le résultat du test
      const newResults = {
        ...testResults,
        [voice.id]: {
          voiceId: voice.id,
          audioUrl: audioResponse.audioUrl,
          duration: duration,
          rating: 0,
          notes: '',
          tested: true
        }
      };
      setTestResults(newResults);
      saveResults(newResults);

      console.log(`✅ Voice test completed: ${voice.name} (${duration}ms)`);

    } catch (error: any) {
      console.error(`❌ Voice test failed for ${voice.name}:`, error);
      
      let errorMessage = `❌ Erreur lors du test de ${voice.name}`;
      
      // Gérer les erreurs spécifiques
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        errorMessage = `⏳ Quota Gemini TTS dépassé - Utilisation du fallback Web Speech API`;
        setRateLimitInfo({ remaining: 0, resetTime: Date.now() + (60 * 1000) });
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = `🌐 Erreur réseau - Vérifiez votre connexion`;
      } else if (error.message?.includes('encoding')) {
        errorMessage = `🔤 Erreur d'encodage de caractères arabes`;
      }

      setCurrentError(errorMessage);
      
      // Sauvegarder l'erreur
      const newResults = {
        ...testResults,
        [voice.id]: {
          voiceId: voice.id,
          rating: 0,
          notes: '',
          error: errorMessage,
          tested: true
        }
      };
      setTestResults(newResults);
      saveResults(newResults);
      
      setIsPlaying(null);
      setCurrentTest('');
    }
  };

  const rateVoice = (voiceId: string, rating: number) => {
    const newResults = {
      ...testResults,
      [voiceId]: {
        ...testResults[voiceId],
        rating
      }
    };
    setTestResults(newResults);
    saveResults(newResults);
  };

  const addNotes = (voiceId: string, notes: string) => {
    const newResults = {
      ...testResults,
      [voiceId]: {
        ...testResults[voiceId],
        notes
      }
    };
    setTestResults(newResults);
    saveResults(newResults);
  };

  const exportResults = () => {
    const results = Object.entries(testResults).map(([voiceId, result]) => {
      const voice = allGeminiVoices.find(v => v.id === voiceId);
      return {
        voiceId,
        voiceName: voice?.name,
        gender: voice?.gender,
        rating: result.rating,
        notes: result.notes,
        duration: result.duration
      };
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "gemini-voice-test-darija.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getTopRatedVoices = () => {
    return Object.entries(testResults)
      .filter(([_, result]) => result.rating > 0)
      .sort(([_, a], [__, b]) => b.rating - a.rating)
      .slice(0, 5);
  };

  const clearAllData = () => {
    if (window.confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PHRASE_STORAGE_KEY);
      setTestResults({});
      setTestPhrase('السلام عليكم، كيفاش الصحة؟ أنا هنا باش نساعدك');
      console.log('🗑️ جميع البيانات محذوفة');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-indigo-50" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🧪🎤</div>
        <h1 className="text-3xl font-bold text-purple-800 mb-2 arabic-heading">
          مختبر اختبار أصوات Gemini TTS
        </h1>
        <p className="text-purple-600 arabic-text">
          اختبر جميع أصوات Google Gemini TTS للعثور على الأفضل للدارجة المغربية
        </p>
      </div>

      {/* Rate Limit Status & Error Display */}
      {(rateLimitInfo.remaining < 3 || currentError || testQueue.current.length > 0) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="mr-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 arabic-heading">
                معلومات النظام:
              </h3>
              <div className="mt-2 text-sm text-yellow-700 arabic-text space-y-1">
                {rateLimitInfo.remaining < 3 && (
                  <p>⚡ طلبات متبقية: {rateLimitInfo.remaining}/3 في الدقيقة</p>
                )}
                {testQueue.current.length > 0 && (
                  <p>⏳ في الانتظار: {testQueue.current.length} صوت</p>
                )}
                {currentError && (
                  <p className="font-medium">{currentError}</p>
                )}
                {rateLimitInfo.remaining === 0 && (
                  <p className="text-orange-600">
                    🔄 إعادة تعيين الحد الأقصى في: {Math.max(0, Math.round((rateLimitInfo.resetTime - Date.now()) / 1000))}s
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Phrase Input */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 arabic-heading">
          الجملة المرجعية للاختبار:
        </h2>
        <textarea
          value={testPhrase}
          onChange={(e) => {
            const newPhrase = e.target.value;
            setTestPhrase(newPhrase);
            saveTestPhrase(newPhrase);
          }}
          className="w-full p-4 border border-gray-300 rounded-lg text-right arabic-text resize-none"
          rows={3}
          dir="rtl"
          placeholder="أدخل جملة بالدارجة المغربية لاختبار جميع الأصوات..."
        />
        <div className="mt-2 text-sm text-gray-500 arabic-text">
          💡 جرب جمل مختلفة: سؤال، تحفيز، مواساة، تحليل...
        </div>
      </div>

      {/* Top Rated Voices */}
      {getTopRatedVoices().length > 0 && (
        <div className="bg-gradient-to-r from-gold-100 to-yellow-100 rounded-xl shadow-lg p-6 mb-6 border-2 border-yellow-300">
          <h2 className="text-xl font-bold text-yellow-800 mb-4 arabic-heading flex items-center">
            <Star className="w-6 h-6 ml-2 text-yellow-600" />
            أفضل الأصوات المقيمة:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {getTopRatedVoices().map(([voiceId, result], index) => {
              const voice = allGeminiVoices.find(v => v.id === voiceId);
              return (
                <div key={voiceId} className="bg-white p-3 rounded-lg border border-yellow-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-700">#{index + 1}</div>
                    <div className="text-sm font-medium">{voice?.name}</div>
                    <div className="text-xs text-gray-600">{voice?.gender}</div>
                    <div className="flex justify-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < result.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Voice Test Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {allGeminiVoices.map(voice => {
          const result = testResults[voice.id];
          return (
            <div 
              key={voice.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all ${
                voice.recommended 
                  ? 'border-purple-300 bg-purple-50' 
                  : 'border-gray-200'
              } ${isPlaying === voice.id ? 'ring-4 ring-purple-300 scale-105' : ''}`}
            >
              {/* Voice Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <Headphones className="w-5 h-5 ml-2 text-purple-500" />
                    {voice.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      voice.gender === 'MALE' ? 'bg-blue-100 text-blue-800' :
                      voice.gender === 'FEMALE' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {voice.gender === 'MALE' ? 'ذكر' : voice.gender === 'FEMALE' ? 'أنثى' : 'محايد'}
                    </span>
                    {voice.recommended && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        مُوصى به
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 arabic-text">
                    {voice.description}
                  </p>
                </div>

                {/* Play Button */}
                <button
                  onClick={() => testVoiceWithDarija(voice)}
                  disabled={isPlaying !== null && isPlaying !== voice.id && !result?.error}
                  className={`p-3 rounded-full transition-colors ${
                    result?.error
                      ? 'bg-red-500 text-white'
                      : isPlaying === voice.id
                      ? 'bg-red-500 text-white animate-pulse'
                      : testQueue.current.includes(voice.id)
                      ? 'bg-yellow-500 text-white'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  } disabled:opacity-50`}
                  title={
                    result?.error ? 'Erreur - Cliquez pour réessayer' :
                    testQueue.current.includes(voice.id) ? 'En attente dans la queue' :
                    isPlaying === voice.id ? 'Arrêter la lecture' : 'Tester cette voix'
                  }
                >
                  {result?.error ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : isPlaying === voice.id ? (
                    <Pause className="w-5 h-5" />
                  ) : testQueue.current.includes(voice.id) ? (
                    <Clock className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Test Results */}
              {result && (
                <div className="border-t border-gray-200 pt-4">
                  {result.error ? (
                    <div className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                      <div className="flex items-start">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 ml-2 flex-shrink-0" />
                        <div className="text-sm text-red-700 arabic-text">
                          {result.error}
                        </div>
                      </div>
                      <button
                        onClick={() => testVoiceWithDarija(voice)}
                        className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Rating */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2 arabic-text">
                          قيم جودة الصوت للدارجة المغربية:
                        </label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              onClick={() => rateVoice(voice.id, rating)}
                              className="p-1"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  rating <= (result.rating || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1 arabic-text">
                          ملاحظات:
                        </label>
                        <textarea
                          value={result.notes || ''}
                          onChange={(e) => addNotes(voice.id, e.target.value)}
                          placeholder="كيف يبدو الصوت؟ هل مناسب للدارجة؟"
                          className="w-full p-2 text-sm border border-gray-300 rounded text-right arabic-text"
                          rows={2}
                          dir="rtl"
                        />
                      </div>

                      {/* Duration */}
                      {result.duration && (
                        <div className="text-xs text-gray-500">
                          ⏱️ وقت التوليد: {Math.round((result.duration || 0) / 10) / 100}s
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Testing Indicator */}
              {currentTest === voice.id && !result && (
                <div className="border-t border-gray-200 pt-4 text-center">
                  <RefreshCw className="w-5 h-5 animate-spin text-purple-500 mx-auto mb-2" />
                  <div className="text-sm text-purple-600 arabic-text">
                    جاري اختبار الصوت...
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Batch Actions */}
      <div className="text-center space-y-4">
        <div className="flex justify-center space-x-4 flex-wrap gap-2">
          <button
            onClick={() => {
              const untestedVoices = allGeminiVoices.filter(v => !testResults[v.id]?.tested);
              untestedVoices.forEach(voice => {
                if (!testQueue.current.includes(voice.id)) {
                  testQueue.current.push(voice.id);
                }
              });
              processTestQueue();
            }}
            disabled={isProcessingQueue.current}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ml-2 ${isProcessingQueue.current ? 'animate-spin' : ''}`} />
            اختبار الجميع ({allGeminiVoices.filter(v => !testResults[v.id]?.tested).length} متبقي)
          </button>
          
          <button
            onClick={exportResults}
            disabled={Object.keys(testResults).length === 0}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-50"
          >
            <Download className="w-5 h-5 ml-2" />
            تصدير النتائج (JSON)
          </button>

          <button
            onClick={clearAllData}
            disabled={Object.keys(testResults).length === 0}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5 ml-2" />
            مسح الكل
          </button>
        </div>
        
        <div className="text-sm text-gray-600 arabic-text max-w-2xl mx-auto">
          💡 <strong>اختبار الجميع:</strong> سيتم تشغيل جميع الأصوات غير المختبرة تلقائياً مع احترام حدود API
          <br/>
          💾 <strong>تصدير النتائج:</strong> احفظ تقييماتك وملاحظاتك لكل صوت
          <br/>
          🔄 <strong>حفظ تلقائي:</strong> تُحفظ جميع التقييمات والملاحظات تلقائياً - {Object.keys(testResults).length} صوت محفوظ
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6 mt-6 border border-blue-200">
        <h3 className="font-bold text-blue-800 mb-3 arabic-heading">
          تعليمات الاختبار:
        </h3>
        <ul className="text-blue-700 space-y-2 arabic-text text-sm">
          <li>🎯 <strong>الأصوات الموصى بها:</strong> مميزة بلون بنفسجي ومُجربة مسبقاً</li>
          <li>🔊 <strong>اختبر كل صوت:</strong> اضغط ▶️ واستمع للجملة المرجعية</li>
          <li>⭐ <strong>قيم الصوت:</strong> من 1-5 نجوم حسب جودته للدارجة المغربية</li>
          <li>📝 <strong>اكتب ملاحظات:</strong> مدى طبيعية النطق، وضوح اللهجة، إلخ</li>
          <li>💾 <strong>صدّر النتائج:</strong> احفظ تقييماتك لاختيار الأصوات الأفضل</li>
        </ul>
      </div>
    </div>
  );
};