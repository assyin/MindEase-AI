import { GoogleGenAI } from '@google/genai';

/**
 * Client Google GenAI singleton centralisé - Syntaxe SDK 2025
 * Assure une initialisation unique et partagée entre tous les services
 */
class GoogleGenAIClient {
  private static instance: GoogleGenAI | null = null;
  private static isInitialized = false;

  /**
   * Obtient l'instance unique du client Google GenAI
   * @returns Instance initialisée du client
   * @throws Error si la clé API n'est pas trouvée
   */
  static getInstance(): GoogleGenAI {
    if (!this.instance) {
      this.initialize();
    }
    return this.instance!;
  }

  /**
   * Initialise le client Google GenAI avec la clé API
   * @private
   */
  private static initialize(): void {
    const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;

    if (!apiKey || apiKey === 'your-google-genai-api-key') {
      throw new Error(`
        ❌ Google GenAI API key not found or invalid.
        
        Please ensure VITE_GOOGLE_GENAI_API_KEY is set in your .env file:
        VITE_GOOGLE_GENAI_API_KEY=AIzaSy...your-actual-key
        
        Current value: ${apiKey || 'undefined'}
      `);
    }

    try {
      this.instance = new GoogleGenAI({ 
        apiKey: apiKey.trim() 
      });
      
      this.isInitialized = true;
      console.log('✅ Google GenAI client initialized successfully (SDK 2025)');
      console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Google GenAI client:', error);
      throw new Error(`Google GenAI initialization failed: ${error.message}`);
    }
  }

  /**
   * Génère du contenu avec la nouvelle syntaxe SDK 2025
   * @param model Nom du modèle (ex: 'gemini-2.5-flash')
   * @param contents Contenu à générer
   * @param systemInstruction Instructions système optionnelles
   * @returns Promise<string> Le contenu généré
   */
  static async generateContent(
    model: string, 
    contents: string, 
    systemInstruction?: string
  ): Promise<{text: string, usage?: any}> {
    try {
      const client = this.getInstance();
      
      const response = await client.models.generateContent({
        model,
        contents,
        systemInstruction
      });

      return {
        text: response.text || response.content,
        usage: response.usage
      };
      
    } catch (error) {
      console.error('❌ Google GenAI generation failed:', error);
      throw error;
    }
  }

  /**
   * Génère du contenu avec chat (conversation) et maintien de rôle
   * @param model Nom du modèle
   * @param history Historique des messages
   * @param message Nouveau message
   * @param systemInstruction Instructions système avec maintien de rôle
   * @param conversationId ID de conversation pour cohérence de rôle
   * @returns Réponse générée
   */
  static async generateChatContent(
    model: string,
    history: Array<{role: string, content: string}>,
    message: string,
    systemInstruction?: string,
    conversationId?: string
  ): Promise<{text: string, usage?: any}> {
    try {
      const client = this.getInstance();
      
      // Convertir l'historique au format attendu
      const conversationHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await client.models.generateContent({
        model,
        contents: [
          ...conversationHistory,
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ],
        systemInstruction
      });

      // Apply role consistency filtering if conversation ID provided
      let responseText = response.text || response.content;
      
      if (conversationId && responseText) {
        responseText = this.enforceRoleConsistency(responseText, conversationId, systemInstruction);
      }

      return {
        text: responseText,
        usage: response.usage
      };
      
    } catch (error) {
      console.error('❌ Google GenAI chat generation failed:', error);
      throw error;
    }
  }

  /**
   * CRITICAL: Enforces role consistency on responses
   */
  private static enforceRoleConsistency(
    response: string, 
    conversationId: string, 
    systemInstruction?: string
  ): string {
    try {
      // Import role enforcement middleware dynamically to avoid circular dependencies
      const { roleEnforcementMiddleware } = require('./RoleEnforcementMiddleware');
      
      const enforcedResponse = roleEnforcementMiddleware.enforceRoleConsistency(
        response,
        conversationId
      );
      
      // Log if role was corrected
      if (enforcedResponse.wasModified) {
        console.warn(`🛡️ Role consistency enforced for conversation ${conversationId}`);
        console.warn('Violations:', enforcedResponse.violations);
      }
      
      return enforcedResponse.text;
      
    } catch (error) {
      console.error('Error enforcing role consistency:', error);
      // Return original response if enforcement fails
      return response;
    }
  }

  /**
   * Teste la connectivité avec l'API Google GenAI - Nouvelle syntaxe
   * @returns Promise<boolean> true si la connexion fonctionne
   */
  static async testConnection(): Promise<boolean> {
    try {
      const result = await this.generateContent('gemini-2.5-flash', 'Test connection');
      console.log('✅ Google GenAI connection test successful (SDK 2025)');
      return true;
      
    } catch (error) {
      console.error('❌ Google GenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Vérifie si le client est initialisé
   * @returns true si le client est prêt
   */
  static isReady(): boolean {
    return this.isInitialized && this.instance !== null;
  }

  /**
   * Obtient les informations de debug du client
   * @returns Objet avec les informations de debug
   */
  static getDebugInfo(): Record<string, any> {
    return {
      isInitialized: this.isInitialized,
      hasInstance: this.instance !== null,
      apiKeyConfigured: !!import.meta.env.VITE_GOOGLE_GENAI_API_KEY,
      apiKeyPrefix: import.meta.env.VITE_GOOGLE_GENAI_API_KEY?.substring(0, 10) || 'N/A',
      sdkVersion: '2025'
    };
  }

  /**
   * Force la réinitialisation du client (pour les tests ou changements de config)
   */
  static reset(): void {
    this.instance = null;
    this.isInitialized = false;
    console.log('🔄 Google GenAI client reset');
  }
}

export default GoogleGenAIClient;