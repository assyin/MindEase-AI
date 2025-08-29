import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { avatarManager } from '../services/AvatarManager';
import { googleGenAITTSServiceV2 } from '../services/GoogleGenAITTSServiceV2';
import { culturalPromptService } from '../services/CulturalPromptService';
import { useLanguage } from '../contexts/LanguageContext';
import { Avatar } from '../types';

interface TestResult {
  avatarId: string;
  success: boolean;
  audioUrl?: string;
  duration?: number;
  error?: string;
  usedFallback?: boolean;
}

export const MoroccanAvatarTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { languageSettings, setLanguage, culturalContext } = useLanguage();

  const moroccanAvatars = [
    'therapist-morocco',
    'coach-darija', 
    'guide-meditation-arabic',
    'analyst-mena'
  ];

  const testMessages = {
    'therapist-morocco': 'السلام عليكم دكتورة عائشة، أنا مرهق جداً ومحتاج مساعدة نفسية',
    'coach-darija': 'أهلان أحمد، واخا تعطيني شي نصائح باش نحقق أهدافي؟',
    'guide-meditation-arabic': 'لالة فاطمة الزهراء، محتاج أتأمل وأرتاح من ضغوط الحياة',
    'analyst-mena': 'دكتور يوسف، باغي نفهم ليش كنحس براسي قلقان بزاف'
  };

  const runMoroccanAvatarTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    console.log('🧪 بداية اختبار الأفاتار المغربية مع Google Gemini TTS');

    // Set language to Arabic first
    setLanguage('ar');

    for (const avatarId of moroccanAvatars) {
      const avatar = avatarManager.getAvatarById(avatarId);
      if (!avatar) {
        console.error(`❌ Avatar not found: ${avatarId}`);
        continue;
      }

      try {
        console.log(`🎭 اختبار ${avatar.name} (${avatarId})`);
        
        // Generate cultural prompt
        const culturalPrompt = culturalPromptService.generateCulturalPrompt(avatar, {
          timeOfDay: 'morning',
          sessionType: 'first_meeting',
          culturalContext,
          language: 'ar'
        });

        console.log(`📝 Cultural greeting: ${culturalPrompt.greeting}`);
        
        const testMessage = testMessages[avatarId as keyof typeof testMessages];
        
        // Test TTS generation
        const ttsResponse = await googleGenAITTSServiceV2.generateAvatarSpeech({
          text: testMessage,
          avatarId: avatarId,
          voiceConfig: avatar.voice_config,
          conversationId: 'moroccan-test'
        });

        const result: TestResult = {
          avatarId,
          success: true,
          audioUrl: ttsResponse.audioUrl,
          duration: ttsResponse.duration,
          usedFallback: ttsResponse.usedFallback
        };

        setTestResults(prev => [...prev, result]);
        console.log(`✅ ${avatar.name} test successful`);

        // Wait between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Test failed for ${avatarId}:`, error);
        const result: TestResult = {
          avatarId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        setTestResults(prev => [...prev, result]);
      }
    }

    setIsRunning(false);
    console.log('🏁 اكتملت جميع الاختبارات');
  };

  const playAudio = (audioUrl: string, avatarId: string) => {
    if (playingAudio) {
      // Stop current audio
      const currentAudio = document.getElementById('test-audio') as HTMLAudioElement;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      setPlayingAudio(null);
    }

    if (playingAudio !== avatarId) {
      const audio = new Audio(audioUrl);
      audio.id = 'test-audio';
      audio.onended = () => setPlayingAudio(null);
      audio.onerror = () => {
        console.error('Audio playback error');
        setPlayingAudio(null);
      };
      
      audio.play().then(() => {
        setPlayingAudio(avatarId);
      }).catch(error => {
        console.error('Audio play failed:', error);
        setPlayingAudio(null);
      });
    }
  };

  const getAvatarDetails = (avatarId: string) => {
    return avatarManager.getAvatarById(avatarId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-orange-50 to-red-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-orange-800 mb-2 arabic-heading">
          🇲🇦 اختبار الأفاتار المغربية
        </h1>
        <p className="text-orange-600 arabic-text">
          اختبار الأصوات المغربية مع Google Gemini TTS
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 arabic-heading">
            لوحة التحكم في الاختبار
          </h2>
          <div className="text-sm text-gray-500">
            اللغة الحالية: {languageSettings.current_language === 'ar' ? 'العربية 🇲🇦' : 'Français 🇫🇷'}
          </div>
        </div>

        <button
          onClick={runMoroccanAvatarTests}
          disabled={isRunning}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
          }`}
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin inline ml-2" />
              جاري الاختبار...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 inline ml-2" />
              بدء اختبار الأفاتار المغربية
            </>
          )}
        </button>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {testResults.map((result) => {
          const avatar = getAvatarDetails(result.avatarId);
          if (!avatar) return null;

          return (
            <div
              key={result.avatarId}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                result.success 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 arabic-heading flex items-center">
                      <span className="text-2xl ml-3">{avatar.emoji}</span>
                      {avatar.name}
                    </h3>
                    <p className="text-gray-600 text-sm arabic-text mt-1">
                      {avatar.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        {avatar.voice_config.voice_id}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {avatar.voice_config.language_code}
                      </span>
                      {result.usedFallback && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Fallback Used
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`p-2 rounded-full ${
                    result.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {result.success ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                </div>

                {/* Test Message */}
                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600 mb-1">رسالة الاختبار:</p>
                  <p className="arabic-text font-medium">
                    "{testMessages[result.avatarId as keyof typeof testMessages]}"
                  </p>
                </div>

                {/* Audio Player */}
                {result.success && result.audioUrl && (
                  <div className="flex items-center justify-between bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <button
                        onClick={() => playAudio(result.audioUrl!, result.avatarId)}
                        className={`p-2 rounded-full transition-colors ${
                          playingAudio === result.avatarId
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-orange-600 hover:bg-orange-50'
                        }`}
                      >
                        {playingAudio === result.avatarId ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      <div>
                        <p className="font-semibold text-orange-800">استمع للصوت المغربي</p>
                        <p className="text-sm text-orange-600">
                          المدة: {Math.round((result.duration || 0) / 1000)}s
                        </p>
                      </div>
                    </div>
                    <Volume2 className="w-5 h-5 text-orange-500" />
                  </div>
                )}

                {/* Error */}
                {!result.success && result.error && (
                  <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">
                      <strong>خطأ:</strong> {result.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      {testResults.length === 0 && !isRunning && (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">🎭</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 arabic-heading">
            اختبار الأفاتار المغربية
          </h3>
          <p className="text-gray-600 arabic-text">
            اضغط على زر "بدء الاختبار" لاختبار الأصوات المغربية الأصيلة مع Google Gemini TTS
          </p>
          <div className="mt-4 text-sm text-gray-500">
            سيتم اختبار 4 أفاتار مغربية مع أصوات مميزة لكل تخصص
          </div>
        </div>
      )}
    </div>
  );
};