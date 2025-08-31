# 🧪 SCÉNARIO DE TEST - SYSTÈME ANTI-BOUCLE INFINIES

## 📋 PLAN DE TEST ÉTAPE PAR ÉTAPE

### ÉTAPE 1: Test Initial - Vérification du Démarrage
**Objectif**: Confirmer que le système démarre correctement avec les nouveaux contrôles

**Actions à effectuer**:
1. Ouvrir l'application sur http://localhost:5173
2. Démarrer une session thérapeutique conversationnelle
3. Observer les logs dans la console du navigateur

**Résultats attendus**:
- ✅ Session conversationnelle se lance sans erreur
- ✅ PhaseTransitionController s'initialise
- ✅ Phase "Accueil" démarre
- ✅ Logs montrent: `🔍 Phase "Accueil"` avec métriques à 0

**Instructions**:
- Tester maintenant l'ÉTAPE 1
- Rapporter le résultat (succès/échec + détails)
- Ne pas interagir avec l'expert, juste observer le démarrage

---

### ÉTAPE 2: Test Boucle Questions (Prévue après validation ÉTAPE 1)
**Objectif**: Laisser l'expert poser plusieurs questions sans répondre

### ÉTAPE 3: Test Transition Naturelle (Prévue après validation ÉTAPE 2)
**Objectif**: Répondre normalement et voir transition douce

### ÉTAPE 4: Test Transition Forcée (Prévue après validation ÉTAPE 3)  
**Objectif**: Provoquer délibérément une transition forcée

### ÉTAPE 5: Test Timeout d'Urgence (Prévue après validation ÉTAPE 4)
**Objectif**: Laisser une phase dépasser sa durée maximale

---

## 🎯 COMMENÇONS PAR L'ÉTAPE 1

**Testez maintenant l'ÉTAPE 1 et rapportez:**
- L'application démarre-t-elle ?
- Voyez-vous des erreurs dans la console ?
- La session conversationnelle se lance-t-elle ?
- Quels sont les premiers logs affichés ?

**Rapportez le résultat et je corrigerai si nécessaire avant de passer à l'ÉTAPE 2.**