import React, { useState } from 'react';
import { Play, Pause, Volume2, Globe, MessageSquare, Send, Mic } from 'lucide-react';
import { avatarManager } from '../services/AvatarManager';
import { googleGenAITTSServiceV2 } from '../services/GoogleGenAITTSServiceV2';
import { useLanguage } from '../contexts/LanguageContext';

interface TestPhrase {
  text: string;
  translation: string;
  category: string;
}

export const QuickDarijaTest: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('therapist-morocco');
  const [customText, setCustomText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const { languageSettings, setLanguage } = useLanguage();

  const testPhrases: TestPhrase[] = [
    {
      text: "السلام عليكم دكتورة عائشة، كيفاش الصحة؟",
      translation: "Bonjour Dr. Aicha, comment allez-vous ?",
      category: "Salutation"
    },
    {
      text: "أهلان أحمد! واخا تعطيني شي نصائح باش نحقق أهدافي؟",
      translation: "Salut Ahmed ! Peux-tu me donner des conseils pour atteindre mes objectifs ?",
      category: "Coaching"
    },
    {
      text: "لالة فاطمة، محتاج أتأمل وأرتاح من ضغوط الحياة",
      translation: "Lalla Fatima, j'ai besoin de méditer et me reposer du stress",
      category: "Méditation"
    },
    {
      text: "دكتور يوسف، باغي نفهم ليش كنحس براسي قلقان بزاف",
      translation: "Dr. Youssef, je veux comprendre pourquoi je me sens très anxieux",
      category: "Analyse"
    },
    {
      text: "ما تخافش، أنا هنا معك، غادي نحلو هاد المشكل بجوج",
      translation: "N'aie pas peur, je suis là avec toi, nous résoudrons ce problème ensemble",
      category: "Soutien"
    },
    {
      text: "الله يعطيك الصحة، راك قادر على كلشي!",
      translation: "Que Dieu te donne la santé, tu es capable de tout !",
      category: "Motivation"
    }
  ];

  const moroccanAvatars = [
    {
      id: 'therapist-morocco',
      name: 'Dr. Aicha Benali',
      emoji: '👩‍⚕️',
      color: 'bg-orange-500'
    },
    {
      id: 'coach-darija',
      name: 'Ahmed Chraibi', 
      emoji: '💪',
      color: 'bg-red-500'
    },
    {
      id: 'guide-meditation-arabic',
      name: 'Lalla Fatima Zahra',
      emoji: '🌙',
      color: 'bg-purple-500'
    },
    {
      id: 'analyst-mena',
      name: 'Dr. Youssef El-Fassi',
      emoji: '📈',
      color: 'bg-green-500'
    }
  ];

  const playDarijaPhrase = async (phrase: TestPhrase) => {
    if (isPlaying === phrase.text) {
      setIsPlaying(null);
      return;
    }

    try {
      setIsPlaying(phrase.text);
      console.log(`🎤 Testing Darija: "${phrase.text}" with avatar: ${selectedAvatar}`);

      const avatar = avatarManager.getAvatarById(selectedAvatar);
      if (!avatar) {
        console.error('Avatar not found:', selectedAvatar);
        setIsPlaying(null);
        return;
      }

      // Generate speech using Google Gemini TTS
      const audioResponse = await googleGenAITTSServiceV2.generateAvatarSpeech({
        text: phrase.text,
        avatarId: selectedAvatar,
        voiceConfig: avatar.voice_config,
        conversationId: 'darija-test'
      });

      // Play the audio
      const audio = new Audio(audioResponse.audioUrl);
      audio.onended = () => {
        setIsPlaying(null);
        URL.revokeObjectURL(audioResponse.audioUrl);
      };
      audio.onerror = () => {
        console.error('Audio playback failed');
        setIsPlaying(null);
        URL.revokeObjectURL(audioResponse.audioUrl);
      };

      await audio.play();
      console.log(`✅ Darija audio played successfully for: ${avatar.name}`);

    } catch (error) {
      console.error('❌ Error playing Darija phrase:', error);
      setIsPlaying(null);
    }
  };

  const switchToArabic = () => {
    setLanguage('ar');
  };

  const switchToFrench = () => {
    setLanguage('fr');
  };

  const playCustomText = async () => {
    if (!customText.trim()) return;
    
    const customPhrase: TestPhrase = {
      text: customText.trim(),
      translation: 'Texte personnalisé',
      category: 'Custom'
    };
    
    await playDarijaPhrase(customPhrase);
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    // Simple voice recognition (basic implementation)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'ar-MA'; // Moroccan Arabic
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCustomText(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        alert('خطأ في التعرف على الصوت - Voice recognition error');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      alert('المتصفح لا يدعم التعرف على الصوت - Browser does not support voice recognition');
      setIsRecording(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-orange-50 to-red-50" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🇲🇦🎤</div>
        <h1 className="text-3xl font-bold text-orange-800 mb-2 arabic-heading">
          اختبار سريع للدارجة المغربية
        </h1>
        <p className="text-orange-600 arabic-text">
          اختبار الأصوات المغربية الأصيلة مع Google Gemini TTS
        </p>
      </div>

      {/* Language Switcher */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="font-semibold arabic-text">تغيير اللغة:</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={switchToArabic}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                languageSettings.current_language === 'ar'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-orange-100'
              }`}
            >
              🇲🇦 العربية
            </button>
            <button
              onClick={switchToFrench}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                languageSettings.current_language === 'fr'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
              }`}
            >
              🇫🇷 Français
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 arabic-heading">
          اختر الأفاتار المغربي:
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {moroccanAvatars.map(avatar => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedAvatar === avatar.id
                  ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
              }`}
            >
              <div className={`w-12 h-12 ${avatar.color} rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-2`}>
                {avatar.emoji}
              </div>
              <div className="text-sm font-medium text-center arabic-text">
                {avatar.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Text Input */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 arabic-heading">
          اكتب جملتك الخاصة بالدارجة:
        </h2>
        <div className="flex space-x-3 space-x-reverse">
          <div className="flex-1">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="اكتب هنا بالدارجة المغربية... مثل: كيفاش الصحة؟ واخا نتكلمو؟"
              className="w-full p-3 border border-gray-300 rounded-lg text-right arabic-text resize-none"
              rows={3}
              dir="rtl"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={startVoiceRecording}
              disabled={isRecording}
              className={`p-3 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              title="تسجيل صوتي"
            >
              <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
            </button>
            <button
              onClick={playCustomText}
              disabled={!customText.trim() || isPlaying !== null}
              className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              title="تشغيل النص"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        {isRecording && (
          <div className="mt-3 text-center text-red-600 arabic-text">
            🎤 استمع... تحدث بالدارجة المغربية
          </div>
        )}
        {customText && (
          <div className="mt-3 text-sm text-gray-600 arabic-text">
            ✅ النص جاهز للتشغيل مع الأفاتار المختار
          </div>
        )}
      </div>

      {/* Test Phrases */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 arabic-heading">
          أو جرب هذه الجمل المغربية:
        </h2>
        <div className="space-y-4">
          {testPhrases.map((phrase, index) => (
            <div 
              key={index}
              className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Category Badge */}
                  <span className="inline-block px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full mb-2">
                    {phrase.category}
                  </span>
                  
                  {/* Arabic Text */}
                  <p className="text-lg font-medium text-gray-800 mb-2 arabic-text leading-relaxed">
                    {phrase.text}
                  </p>
                  
                  {/* Translation */}
                  <p className="text-sm text-gray-600 italic">
                    📝 {phrase.translation}
                  </p>
                </div>

                {/* Play Button */}
                <button
                  onClick={() => playDarijaPhrase(phrase)}
                  disabled={isPlaying !== null}
                  className={`mr-4 p-3 rounded-full transition-colors ${
                    isPlaying === phrase.text
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  } disabled:opacity-50`}
                >
                  {isPlaying === phrase.text ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Playing Indicator */}
              {isPlaying === phrase.text && (
                <div className="mt-3 flex items-center space-x-2 text-sm text-orange-600">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                  <span className="arabic-text">جاري تشغيل الصوت المغربي...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6 mt-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-500 mt-1" />
          <div>
            <h3 className="font-bold text-blue-800 mb-2 arabic-heading">
              كيفية الاستخدام:
            </h3>
            <ul className="text-blue-700 space-y-1 arabic-text text-sm">
              <li>1. اختر أفاتار مغربي من الأعلى</li>
              <li>2. اضغط على زر التشغيل ▶️ بجانب أي جملة</li>
              <li>3. استمع للصوت المغربي الأصيل مع Google Gemini TTS</li>
              <li>4. جرب مع أفاتار مختلفة لسماع أصوات متنوعة</li>
            </ul>
            <div className="mt-3 text-xs text-blue-600 italic">
              💡 كل أفاتار له صوت وأسلوب مختلف باللهجة المغربية الأصيلة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};