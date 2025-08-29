# Dashboard Utilisateur MindEase AI

## 🎯 Aperçu

Le tableau de bord utilisateur de MindEase AI offre une vue complète et interactive des progrès de bien-être mental de l'utilisateur. Il combine visualisations de données, métriques personnalisées et insights basés sur l'IA pour aider les utilisateurs à suivre leur parcours de bien-être.

## ✨ Fonctionnalités Principales

### 📊 Métriques Clés
- **Sessions totales** : Nombre de conversations complètes
- **Temps moyen par session** : Durée moyenne des interactions
- **Utilisation vocale** : Pourcentage d'utilisation des fonctionnalités vocales
- **Score de satisfaction** : Évaluation moyenne sur 5 étoiles
- **Série actuelle** : Jours consécutifs d'utilisation
- **Messages totaux** : Nombre total de messages échangés

### 📈 Visualisations Interactives
- **Progression hebdomadaire** : Graphique en barres des sessions quotidiennes
- **Évolution de l'humeur** : Graphique en aires des tendances d'humeur
- **Utilisation mensuelle** : Graphique linéaire des sessions mensuelles
- **Répartition des modèles IA** : Graphique circulaire des préférences d'IA

### 🎯 Insights Personnalisés
- **Tendance d'humeur** : Analyse positive, neutre ou négative
- **Modèle IA préféré** : Identification du modèle le plus utilisé
- **Conseils personnalisés** : Recommandations basées sur les données
- **Objectifs suggérés** : Suggestions d'amélioration

### 📤 Export de Données
- **Format JSON** : Export complet des données utilisateur
- **Format CSV** : Export tabulaire pour analyse externe
- **Conformité RGPD** : Respect des droits utilisateur

## 🏗️ Architecture Technique

### Composants Principaux
```
src/components/UserDashboard.tsx      # Composant principal
src/services/AnalyticsService.ts      # Service de collecte des métriques
src/types/index.ts                    # Interfaces TypeScript
```

### Services Utilisés
- **AnalyticsService** : Collecte et analyse des données
- **Supabase** : Base de données et authentification
- **Recharts** : Bibliothèque de graphiques
- **date-fns** : Manipulation des dates

### Types de Données
```typescript
interface DashboardMetrics {
  totalSessions: number;
  averageSessionTime: number;
  voiceUsagePercent: number;
  preferredModel: string;
  moodTrend: 'positive' | 'neutral' | 'negative';
  weeklyProgress: number[];
  monthlyProgress: { date: string; sessions: number; mood: number }[];
  streakDays: number;
  totalMessages: number;
  satisfactionScore: number;
}
```

## 📊 Sources de Données

### Tables Supabase
- `sessions` : Données des sessions utilisateur
- `messages` : Historique des conversations
- `user_interactions` : Interactions détaillées
- `mood_entries` : Évaluations d'humeur (optionnel)

### Calculs de Métriques
- **Temps moyen** : `SUM(duration_minutes) / COUNT(sessions)`
- **Usage vocal** : `COUNT(voice_interactions) / COUNT(total_interactions) * 100`
- **Série** : Calcul des jours consécutifs d'utilisation
- **Tendance humeur** : Analyse des scores `mood_before` et `mood_after`

## 🎨 Interface Utilisateur

### Design System
- **Couleurs** : Palette apaisante avec bleus, verts et violets
- **Icônes** : Lucide React pour la cohérence
- **Responsive** : Grille adaptative pour tous les écrans
- **Animations** : Transitions fluides et loading states

### Composants Réutilisables
- `StatCard` : Cartes de métriques avec tendances
- `ChartContainer` : Conteneur standardisé pour graphiques
- `MoodTrendIndicator` : Indicateur visuel de tendance d'humeur

## 🚀 Utilisation

### Intégration
```tsx
import { UserDashboard } from './components/UserDashboard';

function App() {
  return (
    <div className="app">
      <UserDashboard />
    </div>
  );
}
```

### Configuration Requise
- Authentification utilisateur via AuthContext
- Base de données Supabase configurée
- Recharts installé (`npm install recharts`)
- date-fns installé (`npm install date-fns`)

### Variables d'Environnement
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📈 Analytics et Tracking

### Événements Trackés
```typescript
type InteractionType = 
  | 'message_sent'     // Message utilisateur envoyé
  | 'voice_used'       // Fonction vocale utilisée
  | 'model_switched'   // Changement de modèle IA
  | 'session_started'  // Nouvelle session démarrée
  | 'mood_tracked';    // Humeur évaluée
```

### Utilisation de l'AnalyticsService
```typescript
const analytics = new AnalyticsService();

// Track une interaction
analytics.trackInteraction({
  type: 'message_sent',
  timestamp: Date.now(),
  userId: user.id,
  sessionId: session.id
});

// Récupérer les métriques
const metrics = await analytics.getDashboardMetrics(userId, 'week');
```

## 🔒 Sécurité et Confidentialité

### Protection des Données
- Authentification requise pour accès aux données
- Chiffrement des données sensibles
- Politique de rétention des données
- Anonymisation possible des exports

### Row Level Security (RLS)
```sql
-- Politique Supabase exemple
CREATE POLICY "Users can only see their own data" 
ON sessions FOR SELECT 
USING (auth.uid() = user_id);
```

## 🧪 Tests

### Tests Unitaires
```bash
npm test UserDashboard.test.tsx
```

### Tests d'Intégration
```bash
npm run test:integration
```

### Tests E2E
```bash
npm run test:e2e
```

## 🚦 Performance

### Optimisations Implémentées
- Lazy loading des composants graphiques
- Mise en cache des métriques (15 minutes)
- Pagination des données historiques
- Compression des exports volumineux

### Métriques de Performance
- First Contentful Paint : < 2s
- Time to Interactive : < 3s
- Bundle size : < 500kb (gzipped)

## 🔮 Roadmap

### Version 2.0 (Prochaine)
- [ ] Objectifs personnalisables
- [ ] Comparaison avec pairs anonymes
- [ ] Prédictions basées sur l'IA
- [ ] Notifications intelligentes

### Version 2.1 (Futur)
- [ ] Intégration wearables
- [ ] Rapport hebdomadaire automatique
- [ ] Partage sélectif avec thérapeutes
- [ ] API publique pour développeurs tiers

## 💡 Contribution

### Structure de Développement
1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

### Standards de Code
- TypeScript strict mode
- ESLint + Prettier
- Tests unitaires obligatoires pour nouvelles features
- Documentation inline pour fonctions complexes

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- 📧 Email : support@mindease.ai
- 💬 Discord : [MindEase Community](https://discord.gg/mindease)
- 📖 Documentation : [docs.mindease.ai](https://docs.mindease.ai)

---

*Développé avec ❤️ par l'équipe MindEase AI*