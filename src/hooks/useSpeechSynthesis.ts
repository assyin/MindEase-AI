import { useEffect, useState } from 'react';

const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
    };

    if ('onvoiceschanged' in synth) {
      synth.onvoiceschanged = loadVoices;
    }

    loadVoices();
  }, []);

  const speak = (text: string, voiceName?: string) => {
    if (!text) return;

    const synth = window.speechSynthesis;

    if (synth.speaking) {
      synth.cancel();
    }

    const utterThis = new SpeechSynthesisUtterance(text);
    if (voiceName) {
      const voice = voices.find(v => v.name === voiceName);
      if (voice) utterThis.voice = voice;
    }

    utterThis.lang = 'fr-FR';
    utterThis.rate = 0.9;
    utterThis.pitch = 1.0;
    utterThis.volume = 0.8;

    utterThis.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterThis.onend = () => {
      setIsSpeaking(false);
    };

    utterThis.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
    };

    synth.speak(utterThis);
    setUtterance(utterThis);
  };

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const cancel = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  return { voices, isSpeaking, isPaused, utterance, speak, pause, resume, cancel };
};

export default useSpeechSynthesis;
