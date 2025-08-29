MISSION : Implémenter un système de conversations multiples pour MindEase AI

CONTEXTE : Application de bien-être mental nécessitant la capacité pour les utilisateurs de maintenir plusieurs conversations distinctes (ex: travail, famille, santé mentale, etc.)

OBJECTIFS FONCTIONNELS :
1. Permettre la création de nouvelles conversations à tout moment
2. Maintenir des contextes IA séparés par conversation
3. Navigation fluide entre conversations actives
4. Sauvegarde automatique de l'état de chaque conversation
5. Organisation et gestion des conversations (noms, archivage, suppression)

ARCHITECTURE TECHNIQUE REQUISE :
- Context Provider global pour gestion multi-sessions
- Service SessionManager pour CRUD des conversations
- Hook personnalisé useConversations pour accès facile
- Intégration Supabase pour persistance
- Optimisations performance (lazy loading, cache)

FONCTIONNALITÉS CLÉS :
- Création rapide de nouvelle conversation
- Basculement instantané entre conversations
- Maintien du contexte IA par conversation
- Nommage et personnalisation des conversations
- Indicateurs d'activité et statuts

STRUCTURE DONNÉES :
- Conversation: id, name, created_at, last_message, message_count, mood_context
- Message: conversation_id, role, content, timestamp, ai_model
- Context IA maintenu séparément pour chaque conversation

Développe cette architecture complète avec tous les services et composants nécessaires.
