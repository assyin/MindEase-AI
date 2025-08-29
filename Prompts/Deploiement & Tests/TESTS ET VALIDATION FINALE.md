MISSION : Effectuer une validation complète et tests de MindEase AI

CONTEXTE : Application de bien-être mental prête pour production nécessitant validation rigoureuse avant lancement.

TYPES DE TESTS REQUIS :
1. Tests unitaires pour composants critiques (Chat, Auth, IA)
2. Tests d'intégration pour flux utilisateur complets
3. Tests de performance et charge
4. Tests d'accessibilité (WCAG 2.1)
5. Tests cross-browser et responsive

SCÉNARIOS DE TEST :
- Inscription/connexion utilisateur
- Conversation complète vocal + textuel
- Sauvegarde et récupération de sessions
- Fonctionnement hors ligne partiel
- Gestion des erreurs et cas limites

VALIDATION TECHNIQUE :
- Sécurité (XSS, CSRF, injection)
- Performance (Core Web Vitals)
- Compatibilité navigateurs modernes
- Responsive design mobile/tablette/desktop
- Synthèse vocale sur différents OS

OUTILS DE TEST :
- Jest/Vitest pour tests unitaires
- Playwright/Cypress pour E2E
- Lighthouse pour performance
- axe-core pour accessibilité
- BrowserStack pour cross-browser

Développe une suite de tests complète avec reporting détaillé et couverture > 80%.
