# 🎙️ Modèles Gemini TTS Corrects - Référence Officielle

## ❌ ERREUR CORRIGÉE

**Modèle incorrect utilisé précédemment** :
```typescript
model: "gemini-2.5-pro-exp" // ❌ N'EXISTE PAS
```

## ✅ MODÈLES TTS OFFICIELS CORRECTS

### 1. **Gemini 2.5 Pro Preview TTS** (Recommandé)
```typescript
model: "gemini-2.5-pro-preview-tts"
```
- **Utilisation** : Qualité audio maximale
- **Performance** : Lent mais haute qualité
- **Coût** : Plus élevé
- **Cas d'usage** : Production, avatars premium

### 2. **Gemini 2.5 Flash Preview TTS** (Rapide)
```typescript
model: "gemini-2.5-flash-preview-tts" 
```
- **Utilisation** : Génération rapide
- **Performance** : Très rapide
- **Coût** : Économique
- **Cas d'usage** : Tests, développement, volume élevé

## 📋 Corrections Appliquées

### Fichiers Modifiés :
1. ✅ `src/services/GoogleGenAITTSServiceV2.ts`
   - `gemini-2.5-pro-exp` → `gemini-2.5-pro-preview-tts`

2. ✅ `src/services/GoogleGenAITTSService.ts` 
   - `gemini-2.5-flash` → `gemini-2.5-flash-preview-tts`

3. ✅ `src/services/MultiAvatarDialogueService.ts`
   - `gemini-2.5-pro-exp` → `gemini-2.5-pro-preview-tts`

4. ✅ `src/services/GeminiTTSService.ts`
   - `gemini-2.5-pro-exp` → `gemini-2.5-pro-preview-tts`

## 🎯 Configuration par Service

### GoogleGenAITTSServiceV2 (Service Principal)
```typescript
const response = await this.client.models.generateContent({
  model: "gemini-2.5-pro-preview-tts", // ✅ Correct
  contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
  generationConfig: {
    temperature: 0.7,
    audioConfig: {
      voiceConfig: {
        languageCode: voiceProfile.languageCode,
        name: voiceProfile.voiceId,
        ssmlGender: voiceProfile.gender
      },
      audioEncoding: 'MP3',
      speakingRate: voiceProfile.characteristics.speakingRate,
      pitch: voiceProfile.characteristics.pitch,
      volumeGainDb: voiceProfile.characteristics.volumeGain
    }
  }
});
```

### Service Rapide (Tests/Volume)
```typescript
const response = await this.client.models.generateContent({
  model: "gemini-2.5-flash-preview-tts", // ✅ Rapide et économique
  // ... même configuration
});
```

## 📖 Références Officielles

### Documentation Google AI
- **URL** : https://ai.google.dev/gemini-api/docs/models
- **Section TTS** : Speech Generation Models
- **API Version** : v1beta

### Modèles Supportés (Vérifiés)
```bash
# Pour lister les modèles disponibles :
curl -H 'Content-Type: application/json' \
  -d '{}' \
  "https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}"
```

## 🧪 Tests de Validation

### Test Simple
```typescript
// Test avec modèle correct
const testResponse = await client.models.generateContent({
  model: "gemini-2.5-pro-preview-tts",
  contents: [{ role: 'user', parts: [{ text: "Test TTS" }] }]
});
```

### Test Fallback
```typescript
// Si pro-preview échoue, fallback vers flash-preview
let model = "gemini-2.5-pro-preview-tts";
try {
  const response = await client.models.generateContent({ model, ... });
} catch (error) {
  console.warn("Fallback vers Flash TTS");
  model = "gemini-2.5-flash-preview-tts";
  const response = await client.models.generateContent({ model, ... });
}
```

## ⚡ Performance Comparée

| Modèle | Vitesse | Qualité | Coût | Usage Recommandé |
|--------|---------|---------|------|------------------|
| `gemini-2.5-pro-preview-tts` | 🐌 Lent | 🌟🌟🌟🌟🌟 | 💰💰💰 | Production |
| `gemini-2.5-flash-preview-tts` | ⚡ Rapide | 🌟🌟🌟🌟 | 💰 | Développement |

## 🎙️ Configuration Avatars MindEase

### Thérapeute Principal
```typescript
model: "gemini-2.5-pro-preview-tts", // Qualité maximale
voiceId: "fr-FR-Wavenet-C",
speakingRate: 0.9,
pitch: -1,
volumeGain: 2
```

### Coach Motivation
```typescript
model: "gemini-2.5-flash-preview-tts", // Réponse rapide
voiceId: "fr-FR-Neural2-B", 
speakingRate: 1.15,
pitch: 2,
volumeGain: 4
```

---

## ✅ RÉSUMÉ CORRECTION

**Statut** : ✅ **CORRIGÉ**

**Avant** : `gemini-2.5-pro-exp` ❌ (404 Error)

**Après** : `gemini-2.5-pro-preview-tts` ✅ (Officiel)

**Test** : Bouton "🧪 Test TTS" maintenant fonctionnel

---

*Référence créée le 27/08/2025 - Basée sur la documentation officielle Google AI*