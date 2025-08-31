import { supabase } from '../config/supabase';
import { Avatar, MultiAvatarDialogue, DialogueTurn } from '../types';
import { avatarManager } from './AvatarManager';
import { enhancedTTSService } from './EnhancedTTSService';
import { aiContextManager } from './AIContextManager';
import { GoogleGenAI } from '@google/genai';
import GoogleGenAIClient from './GoogleGenAIClient';
import { v4 as uuidv4 } from 'uuid';

interface DialoguePrompt {
  topic: string;
  userContext: string;
  avatarPersonalities: Record<string, string>;
  dialoguePurpose: 'consultation' | 'perspective_sharing' | 'conflict_resolution' | 'collaborative_support';
  maxTurns: number;
}

interface DialogueGenerationResult {
  dialogue: MultiAvatarDialogue;
  audioResponses: Record<string, string>; // avatarId -> audioUrl
}

export class MultiAvatarDialogueService {
  private static instance: MultiAvatarDialogueService;
  private genAI: GoogleGenAI | null = null;
  private activeDialogues: Map<string, MultiAvatarDialogue> = new Map();

  static getInstance(): MultiAvatarDialogueService {
    if (!MultiAvatarDialogueService.instance) {
      MultiAvatarDialogueService.instance = new MultiAvatarDialogueService();
    }
    return MultiAvatarDialogueService.instance;
  }

  constructor() {
    this.initializeGeminiAI();
  }

  private initializeGeminiAI(): void {
    try {
      // Utiliser le client centralisé
      this.genAI = GoogleGenAIClient.getInstance();
      console.log('✅ Multi-Avatar Dialogue Service initialized with centralized client');
    } catch (error) {
      console.error('❌ Failed to initialize dialogue service:', error);
    }
  }

  // Generate dialogue between multiple avatars
  async generateDialogue(
    conversationId: string,
    avatarIds: string[],
    topic: string,
    userContext: string,
    purpose: MultiAvatarDialogue['dialogue_purpose'] = 'perspective_sharing'
  ): Promise<DialogueGenerationResult> {
    
    if (avatarIds.length < 2) {
      throw new Error('At least 2 avatars required for dialogue');
    }

    const avatars = avatarManager.prepareDialogueAvatars(avatarIds);
    console.log(`🎭 Generating dialogue between ${avatars.map(a => a.name).join(', ')}`);

    // Generate dialogue script using Gemini
    const dialogueScript = await this.generateDialogueScript({
      topic,
      userContext,
      avatarPersonalities: this.buildAvatarPersonalities(avatars),
      dialoguePurpose: purpose,
      maxTurns: 8
    });

    // Create dialogue object
    const dialogue: MultiAvatarDialogue = {
      id: uuidv4(),
      conversation_id: conversationId,
      participating_avatars: avatarIds,
      dialogue_topic: topic,
      turns: dialogueScript,
      created_at: new Date().toISOString(),
      user_initiated: true,
      dialogue_purpose: purpose
    };

    // Generate audio for all turns
    const audioResponses: Record<string, string> = {};
    
    for (const turn of dialogueScript) {
      const avatar = avatars.find(a => a.id === turn.avatar_id);
      if (avatar) {
        try {
          const audioResponse = await enhancedTTSService.generateAvatarSpeech(
            avatar,
            turn.content,
            conversationId
          );
          audioResponses[turn.avatar_id + '_' + turn.timestamp] = audioResponse.audioUrl;
        } catch (error) {
          console.error(`Failed to generate audio for avatar ${avatar.name}:`, error);
        }
      }
    }

    // Save dialogue to database
    await this.saveDialogue(dialogue);
    
    // Cache active dialogue
    this.activeDialogues.set(dialogue.id, dialogue);

    console.log(`✅ Dialogue generated with ${dialogueScript.length} turns`);
    
    return {
      dialogue,
      audioResponses
    };
  }

  // Generate dialogue script using Gemini AI
  private async generateDialogueScript(prompt: DialoguePrompt): Promise<DialogueTurn[]> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized for dialogue generation');
    }

    const model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const dialoguePrompt = this.buildDialoguePrompt(prompt);

    try {
      const result = await model.generateContent(dialoguePrompt);
      const response = result.response;
      const scriptText = response.text();

      return this.parseDialogueScript(scriptText, Object.keys(prompt.avatarPersonalities));
    } catch (error) {
      console.error('Error generating dialogue script:', error);
      throw new Error('Failed to generate dialogue script');
    }
  }

  private buildDialoguePrompt(prompt: DialoguePrompt): string {
    const avatarDescriptions = Object.entries(prompt.avatarPersonalities)
      .map(([avatarId, personality]) => `${avatarId}: ${personality}`)
      .join('\n');

    return `
Génère un dialogue thérapeutique naturel entre plusieurs avatars IA spécialisés.

CONTEXTE UTILISATEUR: ${prompt.userContext}
SUJET DE DISCUSSION: ${prompt.topic}
OBJECTIF DU DIALOGUE: ${prompt.dialoguePurpose}

AVATARS PARTICIPANTS:
${avatarDescriptions}

INSTRUCTIONS:
1. Crée un dialogue de ${prompt.maxTurns} échanges maximum
2. Chaque avatar doit parler selon sa spécialité et personnalité
3. Le dialogue doit être thérapeutiquement bénéfique pour l'utilisateur
4. Les avatars peuvent se répondre mutuellement et enrichir les perspectives
5. Reste naturel et évite les répétitions
6. Termine par une synthèse constructive

FORMAT DE RÉPONSE:
Utilise exactement ce format pour chaque intervention:
[AVATAR_ID]|[CONTENU_MESSAGE]

Exemple:
therapist-main|Je comprends que cette situation est difficile pour vous.
coach-motivation|Exactement, et c'est une opportunité de croissance formidable !

GÉNÈRE LE DIALOGUE:
`;
  }

  private parseDialogueScript(scriptText: string, avatarIds: string[]): DialogueTurn[] {
    const turns: DialogueTurn[] = [];
    const lines = scriptText.split('\n').filter(line => line.trim());

    let turnIndex = 0;
    for (const line of lines) {
      if (line.includes('|')) {
        const [avatarId, content] = line.split('|', 2);
        const cleanAvatarId = avatarId.trim();
        const cleanContent = content?.trim();

        if (cleanContent && avatarIds.includes(cleanAvatarId)) {
          turns.push({
            avatar_id: cleanAvatarId,
            content: cleanContent,
            timestamp: new Date(Date.now() + turnIndex * 1000).toISOString(),
            user_visible: true
          });
          turnIndex++;
        }
      }
    }

    return turns;
  }

  private buildAvatarPersonalities(avatars: Avatar[]): Record<string, string> {
    const personalities: Record<string, string> = {};
    
    for (const avatar of avatars) {
      personalities[avatar.id] = `${avatar.name} - ${avatar.specialization}: ${avatar.description}. 
        Style: ${avatar.conversation_style.greeting_style}, ${avatar.conversation_style.question_approach}. 
        Traits: ${avatar.personality_traits.join(', ')}.
        Expertise: ${avatar.expertise_areas.join(', ')}.`;
    }

    return personalities;
  }

  // Pre-defined dialogue scenarios
  async generatePredefinedDialogue(
    conversationId: string,
    scenarioType: 'anxiety_support' | 'motivation_boost' | 'conflict_resolution' | 'progress_review'
  ): Promise<DialogueGenerationResult> {
    
    const scenarios = {
      anxiety_support: {
        avatarIds: ['therapist-main', 'guide-meditation'],
        topic: 'Gestion de l\'anxiété et techniques de relaxation',
        purpose: 'collaborative_support' as const,
        context: 'L\'utilisateur ressent de l\'anxiété et a besoin de soutien et d\'outils pratiques.'
      },
      motivation_boost: {
        avatarIds: ['coach-motivation', 'analyst-behavioral'],
        topic: 'Retrouver motivation et définir des objectifs clairs',
        purpose: 'consultation' as const,
        context: 'L\'utilisateur manque de motivation et a besoin d\'encouragement et de structure.'
      },
      conflict_resolution: {
        avatarIds: ['therapist-main', 'coach-motivation', 'analyst-behavioral'],
        topic: 'Résolution de conflits internes ou externes',
        purpose: 'conflict_resolution' as const,
        context: 'L\'utilisateur fait face à un conflit et cherche différentes perspectives pour le résoudre.'
      },
      progress_review: {
        avatarIds: ['analyst-behavioral', 'therapist-main'],
        topic: 'Évaluation des progrès et planification future',
        purpose: 'perspective_sharing' as const,
        context: 'L\'utilisateur souhaite faire le point sur ses progrès et définir ses prochaines étapes.'
      }
    };

    const scenario = scenarios[scenarioType];
    return this.generateDialogue(
      conversationId,
      scenario.avatarIds,
      scenario.topic,
      scenario.context,
      scenario.purpose
    );
  }

  // Interactive dialogue continuation
  async continueDialogue(
    dialogueId: string,
    userInput: string,
    targetAvatarId?: string
  ): Promise<DialogueTurn[]> {
    const dialogue = this.activeDialogues.get(dialogueId);
    if (!dialogue) {
      throw new Error('Dialogue not found or expired');
    }

    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    const model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
      }
    });

    // Build context from previous dialogue
    const dialogueHistory = dialogue.turns
      .map(turn => `${turn.avatar_id}: ${turn.content}`)
      .join('\n');

    const continuationPrompt = `
DIALOGUE EN COURS:
${dialogueHistory}

NOUVELLE INTERVENTION UTILISATEUR: ${userInput}

${targetAvatarId ? `L'utilisateur s'adresse spécifiquement à: ${targetAvatarId}` : 'L\'utilisateur s\'adresse à tous les avatars'}

Génère les réponses appropriées des avatars en tenant compte:
1. Du contexte du dialogue précédent
2. De la nouvelle intervention de l'utilisateur  
3. Des spécialités de chaque avatar
4. De la continuité thérapeutique

FORMAT: [AVATAR_ID]|[RÉPONSE]

Limite à 2-3 réponses maximum pour maintenir le dialogue fluide.
`;

    try {
      const result = await model.generateContent(continuationPrompt);
      const response = result.response.text();
      
      const newTurns = this.parseDialogueScript(response, dialogue.participating_avatars);
      
      // Update dialogue with new turns
      dialogue.turns.push(...newTurns);
      this.activeDialogues.set(dialogueId, dialogue);
      
      // Update in database
      await this.updateDialogue(dialogue);

      return newTurns;
    } catch (error) {
      console.error('Error continuing dialogue:', error);
      throw new Error('Failed to continue dialogue');
    }
  }

  // Dialogue management
  async saveDialogue(dialogue: MultiAvatarDialogue): Promise<void> {
    try {
      const { error } = await supabase
        .from('multi_avatar_dialogues')
        .insert({
          id: dialogue.id,
          conversation_id: dialogue.conversation_id,
          participating_avatars: dialogue.participating_avatars,
          dialogue_topic: dialogue.dialogue_topic,
          turns: dialogue.turns,
          created_at: dialogue.created_at,
          user_initiated: dialogue.user_initiated,
          dialogue_purpose: dialogue.dialogue_purpose
        });

      if (error) {
        console.error('Error saving dialogue:', error);
      }
    } catch (error) {
      console.error('Error saving dialogue:', error);
    }
  }

  async updateDialogue(dialogue: MultiAvatarDialogue): Promise<void> {
    try {
      const { error } = await supabase
        .from('multi_avatar_dialogues')
        .update({
          turns: dialogue.turns
        })
        .eq('id', dialogue.id);

      if (error) {
        console.error('Error updating dialogue:', error);
      }
    } catch (error) {
      console.error('Error updating dialogue:', error);
    }
  }

  async getDialogueHistory(conversationId: string): Promise<MultiAvatarDialogue[]> {
    try {
      const { data, error } = await supabase
        .from('multi_avatar_dialogues')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dialogue history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching dialogue history:', error);
      return [];
    }
  }

  // Audio playback management for dialogues
  async playDialogueSequentially(
    dialogue: MultiAvatarDialogue,
    audioResponses: Record<string, string>,
    onTurnStart?: (turn: DialogueTurn) => void,
    onTurnEnd?: (turn: DialogueTurn) => void
  ): Promise<void> {
    
    for (const turn of dialogue.turns) {
      if (!turn.user_visible) continue;

      const audioKey = turn.avatar_id + '_' + turn.timestamp;
      const audioUrl = audioResponses[audioKey];

      if (onTurnStart) {
        onTurnStart(turn);
      }

      if (audioUrl) {
        await this.playAudioTurn(audioUrl);
      }

      if (onTurnEnd) {
        onTurnEnd(turn);
      }

      // Small pause between turns for natural flow
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  private playAudioTurn(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = () => {
        console.error('Error playing dialogue audio');
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };
      
      audio.play().catch(reject);
    });
  }

  // Dialogue analytics
  getDialogueStats(dialogue: MultiAvatarDialogue) {
    const avatarParticipation: Record<string, number> = {};
    let totalWords = 0;

    dialogue.turns.forEach(turn => {
      avatarParticipation[turn.avatar_id] = (avatarParticipation[turn.avatar_id] || 0) + 1;
      totalWords += turn.content.split(' ').length;
    });

    return {
      totalTurns: dialogue.turns.length,
      totalWords,
      averageWordsPerTurn: Math.round(totalWords / dialogue.turns.length),
      avatarParticipation,
      duration: this.calculateDialogueDuration(dialogue),
      dominantAvatar: Object.entries(avatarParticipation)
        .sort(([,a], [,b]) => b - a)[0]?.[0]
    };
  }

  private calculateDialogueDuration(dialogue: MultiAvatarDialogue): number {
    if (dialogue.turns.length < 2) return 0;
    
    const firstTurn = new Date(dialogue.turns[0].timestamp);
    const lastTurn = new Date(dialogue.turns[dialogue.turns.length - 1].timestamp);
    
    return Math.round((lastTurn.getTime() - firstTurn.getTime()) / 1000);
  }

  // Cleanup
  clearActiveDialogues(): void {
    this.activeDialogues.clear();
  }

  removeDialogue(dialogueId: string): void {
    this.activeDialogues.delete(dialogueId);
  }
}

// Export singleton instance
export const multiAvatarDialogueService = MultiAvatarDialogueService.getInstance();