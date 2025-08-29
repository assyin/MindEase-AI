export class PerformanceOptimizer {
    private responseCache = new Map<string, {response: string, timestamp: number}>();
    private cacheDuration = 5 * 60 * 1000; // 5 minutes
  
    cacheResponse(prompt: string, response: string) {
      this.responseCache.set(prompt, {
        response,
        timestamp: Date.now()
      });
    }
  
    getCachedResponse(prompt: string): string | null {
      const cached = this.responseCache.get(prompt);
      if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
        return cached.response;
      }
      return null;
    }
  
    // Nettoyer le cache périodiquement
    cleanExpiredCache() {
      const now = Date.now();
      for (const [key, value] of this.responseCache.entries()) {
        if (now - value.timestamp > this.cacheDuration) {
          this.responseCache.delete(key);
        }
      }
    }
  
    // Prédire le modèle optimal basé sur l'historique
    predictOptimalModel(messageLength: number, complexity: number): 'gemini' | 'openai' {
      if (messageLength > 100 && complexity > 0.7) {
        return 'gemini'; // Meilleur pour les analyses longues
      }
      if (complexity < 0.3) {
        return 'openai'; // Plus rapide pour les réponses simples
      }
      return 'gemini'; // Par défaut
    }
  }
  