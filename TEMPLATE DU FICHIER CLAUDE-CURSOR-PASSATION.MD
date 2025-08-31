# MINDEASE AI - PASSATION CLAUDE ↔ CURSOR

## 📊 ÉTAT GÉNÉRAL DU PROJET
- **Phase actuelle :** [ex: Implémentation système thérapeutique]
- **Progression :** [ex: 65% complété]
- **Dernière mise à jour :** [Date/Heure]

---

## 🕐 DERNIÈRE SESSION CLAUDE
**Date :** [JJ/MM/AAAA à HH:MM:SS]
**Agent :** Claude
**Durée :** [ex: 2h30]

### ✅ FONCTIONNALITÉS COMPLÉTÉES :
- [x] Base de données thérapeutique - Schémas créés
- [x] Service TherapyManager - Méthodes CRUD
- [ ] Interface utilisateur - 50% fait

### 📁 FICHIERS CRÉÉS/MODIFIÉS :
- `src/services/TherapyProgramManager.ts` - Service complet créé
- `database/therapy_tables.sql` - Tables therapy_programs, sessions
- `src/types/therapy.ts` - Interfaces TypeScript définies

### 🎯 POINT D'ARRÊT EXACT :
**Tâche en cours :** Implémentation du composant React SessionInterface
**Fichier :** `src/components/therapy/SessionInterface.tsx`
**Ligne :** 45 - En cours d'ajout de la logique de timer de session
**État :** Interface de base créée, manque la gestion du temps

### ▶️ INSTRUCTIONS POUR CURSOR :
1. **IMMÉDIAT :** Finir la fonction `handleSessionTimer()` ligne 45
2. **ENSUITE :** Ajouter la sauvegarde automatique toutes les 5 min
3. **PUIS :** Intégrer l'API Gemini TTS pour les réponses vocales
4. **ATTENTION :** Respecter le format de session 20-25 minutes

### ❓ QUESTIONS EN SUSPENS :
- Gestion des interruptions de session (reconnexion auto ?)
- Format de stockage des enregistrements audio (blob vs URL ?)
- Validation côté client vs serveur pour les données thérapeutiques ?

### 🔧 NOTES TECHNIQUES :
- **Pattern :** Utiliser les custom hooks pour la logique métier
- **Style :** Classes CSS modules, pas de styled-components
- **État :** Zustand pour la gestion globale, React Query pour API
- **Tests :** Jest + Testing Library, coverage min 80%

---

## 🕐 DERNIÈRE SESSION CURSOR
**Date :** [À remplir par Cursor]
**Agent :** Cursor
**Durée :** [À remplir]

[Section à compléter par Cursor lors de la reprise]

---

## 📈 HISTORIQUE DES SESSIONS
| Date | Agent | Durée | Principales réalisations |
|------|-------|-------|--------------------------|
| 29/08/25 14:30 | Claude | 3h | Schémas DB + Services backend |
| 29/08/25 18:00 | Cursor | 2h | [À compléter] |

---

## 🚨 ALERTES & PRIORITÉS
- **URGENT :** Corriger bug d'authentification Supabase
- **IMPORTANT :** Finaliser l'intégration Gemini avant tests
- **À NOTER :** Performance lente sur mobile (optimiser images)
