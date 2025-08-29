CORRECTION IMPORTANTE : Utiliser le vrai Google Generative AI SDK

Claude, j'ai remarqué que tu as implémenté une solution avec Web Speech API, mais ce n'était PAS la demande. 

PROBLÈME IDENTIFIÉ :
- Tu as utilisé Web Speech API (synthèse vocale du navigateur) 
- Je voulais spécifiquement utiliser le Google Generative AI SDK avec Gemini 2.5 Pro Preview TTS
- Le but était d'avoir les vraies voix de Google AI Studio, pas les voix système

DEMANDE SPÉCIFIQUE :
Réimplémente le système d'avatars en utilisant le VRAI Google Generative AI SDK selon leur documentation officielle :

1. **SDK à utiliser :** @google/genai (nouveau SDK 2025)
2. **Modèle :** Gemini 2.5 Pro Preview avec TTS natif
3. **Documentation de référence :** https://ai.google.dev/gemini-api/docs/speech-generation
4. **Capacités requises :** Multi-speaker TTS avec voix Google AI Studio

ARCHITECTURE CORRECTE DEMANDÉE :
- Installation : `npm install @google/genai`
- Client : `GoogleGenAI` avec API key
- Modèle : `gemini-2.5-flash` ou `gemini-2.5-pro-exp` avec TTS
- Configuration : Voix multiples via paramètres Google AI Studio
- Output : Audio de haute qualité généré par Google, pas par le navigateur

EXEMPLE STRUCTURE (selon la doc officielle) :
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({ apiKey: "YOUR_KEY" });

const response = await client.models.generateContent({
model: "gemini-2.5-flash",
contents: "text avec instructions pour avatar spécifique",
config: {
// Configuration TTS avec voix Google AI Studio
audioConfig: { ... },
voice: { ... }
}
});

text

OBJECTIF FINAL :
- Avatars avec vraies voix Google (pas voix système)
- Contrôle total sur le style vocal via Google AI Studio
- Audio généré côté serveur Google, pas côté client
- Utilisation des capacités multi-speaker de Gemini 2.5 Pro

Corrige l'implémentation en utilisant le vrai Google Generative AI SDK avec les vraies capacités TTS de Google AI Studio.