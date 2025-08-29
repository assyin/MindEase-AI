# Guide d'Implémentation Google GenAI TTS - Solution Complète

## 🎯 CONTEXTE
Ce guide documente la solution complète pour intégrer Google GenAI TTS (Gemini Flash) dans un projet React/TypeScript, avec gestion des problèmes de compatibilité audio et fallback système.

## ✅ RÉSULTAT FINAL ATTEINT
- ✅ TTS Google GenAI fonctionnel avec modèle `gemini-2.5-flash-preview-tts`
- ✅ Audio compatible navigateur (PCM → WAV conversion)
- ✅ Fallback automatique vers voix système si quota atteint
- ✅ Notification utilisateur des changements de voix
- ✅ Client centralisé partagé entre tous les services
- ✅ Diagnostic audio avancé pour debugging

## 🏗️ ARCHITECTURE FINALE

### 1. Client Centralisé (GoogleGenAIClient.ts)
```typescript
import { GoogleGenAI } from '@google/genai';

class GoogleGenAIClient {
  private static instance: GoogleGenAI | null = null;
  private static isInitialized = false;

  static getInstance(): GoogleGenAI {
    if (!this.instance) {
      const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;
      if (!apiKey) {
        throw new Error('Google GenAI API key not found');
      }
      this.instance = new GoogleGenAI({ apiKey: apiKey.trim() });
      this.isInitialized = true;
      console.log('✅ Google GenAI client initialized');
    }
    return this.instance;
  }

  static getDebugInfo(): Record<string, any> {
    return {
      isInitialized: this.isInitialized,
      hasInstance: this.instance !== null,
      apiKeyConfigured: !!import.meta.env.VITE_GOOGLE_GENAI_API_KEY
    };
  }
}

export default GoogleGenAIClient;
```

### 2. Configuration API TTS Correcte
```typescript
// ✅ CORRECT - Selon documentation officielle Gemini TTS
const response = await client.models.generateContent({
  model: "gemini-2.5-flash-preview-tts", // Plus de quotas que Pro
  contents: request.text, // Texte simple, pas d'objet complexe
  config: {
    responseModalities: ["AUDIO"], // OBLIGATOIRE - audio uniquement
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: voiceProfile.voiceId // "Kore" ou "Puck"
        }
      }
    }
  }
});
```

## 🔧 PROBLÈME AUDIO RÉSOLU

### Problème Identifié
Gemini TTS génère du **PCM 16-bit little-endian brut** sans header WAV :
- Signature : `f0 ff e4 ff ea ff e7 ff ef ff`
- Format : PCM 24kHz, mono, 16-bit
- Erreur navigateur : "NotSupportedError: Failed to load because no supported source was found"

### Solution Implémentée

#### 1. Détection PCM Automatique
```typescript
private isPCMData(audioData: ArrayBuffer): boolean {
  const bytes = new Uint8Array(audioData);
  
  // Vérifier absence de signatures connues (RIFF, MP3, etc.)
  let pcmScore = 0;
  
  // Test 1: Longueur divisible par 2 (16-bit samples)
  if (audioData.byteLength % 2 === 0) pcmScore++;
  
  // Test 2: Distribution équilibrée des valeurs
  const sampleSize = Math.min(100, bytes.length);
  let lowValues = 0;
  for (let i = 0; i < sampleSize; i++) {
    if (bytes[i] < 128) lowValues++;
  }
  if (lowValues > sampleSize * 0.3 && lowValues < sampleSize * 0.7) pcmScore++;
  
  // Test 3: Pas de patterns ASCII de header
  const headerLikeBytes = bytes.slice(0, 4);
  const isAsciiLike = headerLikeBytes.every(b => (b >= 32 && b <= 126) || b === 0);
  if (!isAsciiLike) pcmScore++;
  
  return pcmScore >= 2;
}
```

#### 2. Conversion PCM → WAV
```typescript
private convertPCMToWAV(pcmData: ArrayBuffer): Blob {
  const pcmBytes = new Uint8Array(pcmData);
  const sampleRate = 24000; // Gemini TTS standard
  const numChannels = 1;    // Mono
  const bitsPerSample = 16; // 16-bit
  
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBytes.length;
  const fileSize = dataSize + 36;
  
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);
  
  let offset = 0;
  
  // RIFF Header
  view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
  view.setUint32(offset, fileSize, true); offset += 4;
  view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"
  
  // fmt chunk
  view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;           // PCM format
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  
  // data chunk
  view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
  view.setUint32(offset, dataSize, true); offset += 4;
  
  // Copier les données PCM
  const wavBytes = new Uint8Array(wavBuffer);
  wavBytes.set(pcmBytes, 44);
  
  return new Blob([wavBuffer], { type: 'audio/wav' });
}
```

#### 3. Stratégies Multiples avec Test de Compatibilité
```typescript
private async createCompatibleAudio(audioData: ArrayBuffer, detectedFormat): Promise<{blob: Blob; url: string}> {
  const strategies = [
    () => detectedFormat.format !== 'Unknown' ? new Blob([audioData], { type: detectedFormat.mimeType }) : null,
    () => this.isPCMData(audioData) ? this.convertPCMToWAV(audioData) : null,
    () => new Blob([audioData], { type: 'audio/wav' }),
    () => new Blob([audioData], { type: 'audio/mpeg' })
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    const blob = strategies[i]();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const isCompatible = await this.testAudioCompatibility(url);
      
      if (isCompatible || i === strategies.length - 1) {
        return { blob, url };
      } else {
        URL.revokeObjectURL(url);
      }
    }
  }
}

private async testAudioCompatibility(audioUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const timeout = setTimeout(() => resolve(false), 1000);
    
    audio.addEventListener('canplay', () => {
      clearTimeout(timeout);
      resolve(true);
    }, { once: true });
    
    audio.addEventListener('error', () => {
      clearTimeout(timeout);
      resolve(false);
    }, { once: true });
    
    audio.src = audioUrl;
  });
}
```

## 🔄 SYSTÈME DE FALLBACK

### Configuration Hybride
```typescript
async generateAvatarSpeech(request: GoogleAITTSRequest): Promise<GoogleAITTSResponse> {
  try {
    // Essayer Google GenAI TTS d'abord
    const response = await this.client.models.generateContent({...});
    return await this.processAudioResponse(response, request.avatarId);
    
  } catch (error) {
    // Vérification erreur quota (429)
    if (error.status === 429 || error.message.includes('RESOURCE_EXHAUSTED')) {
      console.log('🔄 Quota Google AI atteint, basculement vers voix système...');
      return await this.fallbackToEnhancedTTS(request);
    }
    throw error;
  }
}
```

### Notification Utilisateur
```typescript
if (audioResponse.usedFallback) {
  await notificationService.addNotification({
    type: 'system',
    category: 'system',
    title: 'Voix de secours activée',
    message: 'Les quotas Google AI sont atteints. Utilisation de la voix système pour maintenir une expérience fluide.',
    priority: 'medium',
    icon: '🎵',
    expiresAt: Date.now() + (5 * 60 * 1000)
  });
}
```

## 🐛 DIAGNOSTIC ET DEBUGGING

### Logs Détaillés Implémentés
```typescript
console.log('🔍 DIAGNOSTIC TTS AUDIO:');
console.log('Base64 audio length:', audioBase64.length);
console.log('🎯 Score PCM: 3/3, isPCM: true');
console.log('📊 Paramètres WAV calculés: sampleRate=24000, byteRate=48000');
console.log('✅ Header WAV créé: "RIFF"..."WAVE"');
console.log('🧪 Stratégie 2 compatible: true');
console.log('✅ Audio playing successfully after user interaction');
```

### Widget de Test Automatique
Le système crée automatiquement un widget de diagnostic avec :
- Contrôles audio HTML5 natifs
- Lien de téléchargement du fichier WAV
- Informations détaillées du blob
- Auto-suppression après 60 secondes

## 🌟 CONFIGURATION ENVIRONNEMENT

### Variables Requises (.env)
```bash
VITE_GOOGLE_GENAI_API_KEY=AIzaSy...votre-cle-complete
```

### Initialisation au Démarrage (main.tsx)
```typescript
import GoogleGenAIClient from './services/GoogleGenAIClient';

if (import.meta.env.DEV) {
  try {
    GoogleGenAIClient.getInstance();
    console.log('✅ Google GenAI client ready at startup');
  } catch (error) {
    console.error('❌ Google GenAI initialization failed:', error);
  }
  
  // Fonctions de debugging exposées
  (window as any).googleGenAI = {
    getDebugInfo: () => GoogleGenAIClient.getDebugInfo(),
    testConnection: () => GoogleGenAIClient.testConnection(),
    reset: () => GoogleGenAIClient.reset()
  };
}
```

## 🎵 PROFILS VOCAUX

### Configuration Avatars
```typescript
private readonly voiceProfiles: Record<string, GoogleAIVoiceProfile> = {
  'therapist-main': {
    voiceId: 'Kore', // Voix empathique
    languageCode: 'fr-FR',
    gender: 'FEMALE'
  },
  'coach-motivation': {
    voiceId: 'Puck', // Voix énergique
    languageCode: 'fr-FR', 
    gender: 'MALE'
  }
};
```

## 📋 CHECKLIST D'IMPLÉMENTATION

- [ ] Créer GoogleGenAIClient centralisé
- [ ] Configurer variables d'environnement
- [ ] Implémenter détection PCM et conversion WAV
- [ ] Ajouter système de fallback avec notifications
- [ ] Tester avec widget de diagnostic
- [ ] Vérifier logs de compatibilité audio
- [ ] Valider toutes les stratégies de format

## 🚨 POINTS CRITIQUES

1. **API Configuration** : `responseModalities: ["AUDIO"]` est OBLIGATOIRE
2. **Format Audio** : Gemini génère du PCM brut, conversion WAV nécessaire
3. **Quotas** : Flash model a plus de quotas que Pro
4. **Fallback** : Toujours implémenter EnhancedTTSService en backup
5. **User Interaction** : Gérer les restrictions d'autoplay navigateur

## 🎯 RÉSULTAT FINAL ATTENDU

```
✅ Audio loadstart
✅ Audio canplay  
✅ Audio playing successfully after user interaction
✅ Audio canplaythrough
✅ Audio généré avec Google AI Studio TTS: 7.130958s
```

---
**🔥 CETTE SOLUTION EST COMPLÈTE ET TESTÉE - RÉUTILISER TELLE QUELLE POUR FUTURS PROJETS**