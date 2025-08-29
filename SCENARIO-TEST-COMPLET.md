# 🧪 SCÉNARIO DE TEST COMPLET - SYSTÈME THÉRAPEUTIQUE MINDEASE AI

**Version** : 1.0  
**Date** : 29/08/2025  
**Objectif** : Validation complète du flux thérapeutique de bout en bout  

---

## 📋 OVERVIEW DU SCÉNARIO

### 👤 PERSONA DE TEST
**Nom** : Sarah Benali  
**Âge** : 28 ans  
**Langue** : Français/Arabe  
**Problématique** : Anxiété sociale et stress professionnel  
**Contexte** : Première utilisation de la plateforme  
**Objectif** : Obtenir un accompagnement thérapeutique structuré  

---

## 🎯 PHASE 1 : ONBOARDING THÉRAPEUTIQUE COMPLET

### **ÉTAPE 1.1 : Sélection Thématique**
```
✅ ACTION : Ouvrir TherapyOnboarding
✅ VÉRIFIER : Affichage des 24 sujets thérapeutiques en 5 catégories
✅ TESTER : Clic sur "Anxiété Sociale" (catégorie Troubles Anxieux)
✅ VALIDER : 
   - Animation de sélection fluide
   - Mise à jour du compteur (1/5 étapes)
   - Bouton "Continuer" activé
```

### **ÉTAPE 1.2 : Évaluation Adaptative Initiale**
```
✅ ACTION : Cliquer "Continuer" vers l'évaluation
✅ VÉRIFIER : 
   - Questionnaire GAD-7 pour anxiété sociale
   - Interface adaptative avec questions dynamiques
   - Barre de progression fonctionnelle

🧪 SÉQUENCE DE RÉPONSES TEST :
   Q1: "Je me sens nerveux(se), anxieux(se)" → Réponse: "Plusieurs jours" (2 points)
   Q2: "Je ne peux pas m'empêcher de m'inquiéter" → Réponse: "Plus de la moitié du temps" (3 points)
   Q3: "J'ai du mal à me détendre" → Réponse: "Plusieurs jours" (2 points)
   Q4: Questions adaptées générées selon réponses précédentes

✅ VALIDER :
   - Score GAD-7 calculé automatiquement (7-10 points = Anxiété modérée)
   - Questions supplémentaires contextuelles apparaissent
   - Animation de progression fluide
```

### **ÉTAPE 1.3 : Configuration Profil Utilisateur**
```
✅ ACTION : Compléter le profil thérapeutique

📝 DONNÉES TEST À SAISIR :
   - Objectifs: ["Réduire l'anxiété sociale", "Améliorer confiance en soi"]
   - Définition succès: "Pouvoir participer aux réunions sans stress"
   - Disponibilité: "20-25 minutes, 2x par semaine"
   - Expérience thérapie: "Première fois"
   - Préférence culturelle: "Adaptation française"
   - Motivation: 8/10

✅ VALIDER :
   - Tous les champs sont sauvegardés
   - Validation en temps réel des inputs
   - Génération automatique du profil thérapeutique
```

### **ÉTAPE 1.4 : Sélection Expert avec Preview Voix**
```
✅ ACTION : Ouvrir la sélection d'expert
✅ VÉRIFIER : 
   - ExpertSelectionModal s'ouvre avec 3 experts
   - Scores de compatibilité affichés
   - Dr. Sarah Empathie recommandée (score le plus élevé)

🎤 TEST AUDIO :
✅ TESTER : Clic "Écouter" sur Dr. Sarah
✅ VALIDER :
   - Génération TTS Gemini avec voix "umbriel"
   - Lecture audio du texte de présentation
   - Contrôles lecture/pause fonctionnels
   - Sample text: "Bonjour, je suis le Dr Sarah Empathie..."

✅ COMPARER : Tester les 3 experts
   - Dr. Sarah (umbriel) : Voix douce, empathique
   - Dr. Alex (aoede) : Voix apaisante, méditative  
   - Dr. Aicha (despina) : Accent marocain authentique

✅ SÉLECTIONNER : Dr. Sarah Empathie (meilleur score compatibilité)
```

### **ÉTAPE 1.5 : Génération Programme Thérapeutique**
```
✅ ACTION : Confirmer sélection expert
✅ VÉRIFIER : 
   - Génération automatique programme TCC pour anxiété sociale
   - Durée estimée: 8-12 semaines
   - 16-20 sessions prévues
   - Plan de traitement personnalisé créé

📊 PROGRAMME GÉNÉRÉ ATTENDU :
   - Semaine 1-2: Évaluation et psychoéducation
   - Semaine 3-5: Techniques de relaxation
   - Semaine 6-8: Exposition graduelle
   - Semaine 9-11: Restructuration cognitive
   - Semaine 12: Consolidation et prévention rechute

✅ VALIDER : Redirection automatique vers Dashboard
```

---

## 🏠 PHASE 2 : DASHBOARD THÉRAPEUTIQUE - PREMIÈRE VISITE

### **ÉTAPE 2.1 : Vue d'ensemble Dashboard**
```
✅ VÉRIFIER : Affichage tableau de bord complet
   - Header avec nom expert (Dr. Sarah Empathie)
   - Progression programme (Semaine 1/12)
   - Cercle de progression à 8% (début programme)
   - Prochaine session disponible

📊 MÉTRIQUES INITIALES ATTENDUES :
   - Sessions complétées: 0
   - Devoirs terminés: 0  
   - Score bien-être: 5/10 (score initial évaluation)
```

### **ÉTAPE 2.2 : Navigation Tabs Dashboard**
```
🧭 TESTER CHAQUE VUE :

✅ TAB "Vue d'ensemble" :
   - Prochaine session: "Introduction et Évaluation Initiale"
   - Objectifs semaine: 3 objectifs avec progress 0%
   - Réalisations: Aucune débloquée encore

✅ TAB "Progrès" :
   - Cercles de progression sessions (0/16)
   - Cercles de progression devoirs (0/0)
   - Graphique évolution humeur (point initial seulement)

✅ TAB "Sessions" :
   - Message "Aucune session complétée"
   - Bouton "Démarrer première session" visible

✅ TAB "Devoirs" :
   - Message "Aucun devoir actif"
   - Zone prête pour futurs devoirs
```

### **ÉTAPE 2.3 : Démarrage Première Session**
```
✅ ACTION : Clic "Commencer" sur prochaine session
✅ VALIDER : Redirection vers TherapySession avec sessionId généré
```

---

## 🎭 PHASE 3 : SESSION THÉRAPEUTIQUE COMPLÈTE (20-25 MIN)

### **ÉTAPE 3.1 : Initialisation Session**
```
✅ VÉRIFIER : Interface session correctement chargée
   - Header avec profil Dr. Sarah
   - 5 phases visibles dans barre progression
   - Phase 1 "Check-in" active (3 min)
   - Contrôles audio disponibles
```

### **ÉTAPE 3.2 : PHASE 1 - CHECK-IN (3 minutes)**
```
🎤 AUDIO INITIAL :
✅ VALIDER : Message audio automatique Dr. Sarah
   "Bonjour Sarah, je suis ravie de commencer ce parcours avec vous..."

📊 MODAL BIEN-ÊTRE :
✅ TESTER : Modal score bien-être s'affiche
✅ SAISIR : Score 6/10 (légère amélioration motivation)
✅ VALIDER : Modal se ferme, score enregistré

💬 CONVERSATION CHECK-IN :
✅ SIMULER ÉCHANGE :
   Dr. Sarah: "Comment vous sentez-vous aujourd'hui à l'idée de commencer ?"
   User: "Un peu anxieuse mais motivée à changer les choses"
   Dr. Sarah: "C'est tout à fait normal. Cette motivation est un excellent point de départ..."

✅ VÉRIFIER :
   - Progression phase à 100% après 3 minutes
   - Bouton "Phase suivante" apparaît
   - Messages échangés sauvegardés
```

### **ÉTAPE 3.3 : PHASE 2 - DEVOIRS (4 minutes)**
```
📚 TRANSITION AUTOMATIQUE :
✅ VALIDER : Passage automatique à "Devoirs" 
✅ AUDIO : Message transition Dr. Sarah
   "Parfait, parlons maintenant de votre préparation à cette première session..."

💭 CONTENU PHASE DEVOIRS :
✅ SIMULER : Pas de devoirs précédents (première session)
✅ VÉRIFIER : Dr. Sarah explique l'absence de devoirs
   "C'est votre première session, nous n'avons pas encore de devoirs à réviser..."
✅ DISCUSSION : Exploration des attentes et appréhensions
```

### **ÉTAPE 3.4 : PHASE 3 - CONTENU PRINCIPAL (10 minutes)**
```
🧠 CŒUR DE LA SESSION :
✅ VALIDER : Phase "Contenu Principal" activée
✅ AUDIO : Transition vers contenu thérapeutique principal

📖 CONTENU PSYCHOÉDUCATIF :
✅ SIMULER ÉCHANGE ÉDUCATIF :
   Dr. Sarah: "L'anxiété sociale est très courante. Comprenez-vous ce qui déclenche votre anxiété ?"
   User: "Surtout les situations où je dois parler devant des collègues"
   Dr. Sarah: "Excellente observation. Ces déclencheurs nous aideront à construire votre programme..."

✅ TECHNIQUES INTRODUITES :
   - Explication cycle anxiété (pensées → sensations → comportements)
   - Introduction respiration diaphragmatique
   - Concept exposition graduelle

🎯 VALIDATION COMPRÉHENSION :
✅ VÉRIFIER : Questions de validation apprentissage
✅ ADAPTATION : Réponses ajustent la vitesse d'explication
```

### **ÉTAPE 3.5 : PHASE 4 - PRATIQUE (5 minutes)**
```
🧘 EXERCICE GUIDÉ :
✅ VALIDER : Transition vers "Pratique"
✅ AUDIO : Dr. Sarah guide exercice de relaxation

🫁 EXERCICE RESPIRATION :
✅ SIMULER : Exercice respiration 4-7-8
   Dr. Sarah: "Inspirez par le nez pendant 4 temps..."
   User: [suit les instructions]
   Dr. Sarah: "Excellent, ressentez-vous une différence ?"

✅ VÉRIFIER :
   - Instructions audio claires et rythmées
   - Encouragements personnalisés selon réaction user
   - Exercice adapté au niveau débutant
```

### **ÉTAPE 3.6 : PHASE 5 - RÉSUMÉ (2 minutes)**
```
📝 CONCLUSION SESSION :
✅ VALIDER : Phase finale "Résumé" active
✅ AUDIO : Récapitulatif par Dr. Sarah

🎯 POINTS CLÉS RÉSUMÉS :
✅ VÉRIFIER : 
   - "Aujourd'hui nous avons exploré vos déclencheurs d'anxiété..."
   - "Vous avez appris la technique de respiration 4-7-8..."
   - "Votre niveau de compréhension est excellent..."

📋 DEVOIRS ASSIGNÉS :
✅ VALIDER : Génération automatique devoirs
   - "Pratiquer respiration 4-7-8, 2x par jour"
   - "Tenir journal situations anxiogènes"
   - "Écouter enregistrement relaxation quotidiennement"

✅ FINALISATION :
   - Score post-session: 7/10 (amélioration)
   - Durée totale: 24 minutes
   - Bouton "Terminer session" actif
```

### **ÉTAPE 3.7 : Completion Session**
```
✅ ACTION : Clic "Terminer la session"
✅ VÉRIFIER :
   - Sauvegarde automatique toutes données session
   - Génération métriques engagement (8/10 basé sur interactions)
   - Redirection automatique vers Dashboard mis à jour
```

---

## 📊 PHASE 4 : DASHBOARD POST-SESSION - MISE À JOUR MÉTRIQUES

### **ÉTAPE 4.1 : Métriques Mises à Jour**
```
📈 CHANGEMENTS ATTENDUS :
✅ VALIDER :
   - Sessions complétées: 1/16 (6.25% progression)
   - Devoirs actifs: 3 nouveaux devoirs
   - Score bien-être: 7/10 (amélioration +2 points)
   - Première réalisation débloquée: "🎉 Première session complétée"
```

### **ÉTAPE 4.2 : Vue Progrès Détaillée**
```
📊 TAB PROGRÈS :
✅ VÉRIFIER :
   - Cercle sessions: 1/16 complété
   - Graphique humeur: 2 points (5→7, tendance positive)
   - Métriques engagement: Score 8/10 première session
```

### **ÉTAPE 4.3 : Sessions Récentes**
```
📝 TAB SESSIONS :
✅ VALIDER :
   - Première session listée avec statut "complété"
   - Durée: 24 minutes
   - Score post-session: 7/10
   - Date/heure enregistrement correct
```

### **ÉTAPE 4.4 : Devoirs Actifs**
```
📋 TAB DEVOIRS :
✅ VÉRIFIER : 3 devoirs générés automatiquement
   
   DEVOIR 1: "Pratique Respiration 4-7-8"
   - Description: "2 fois par jour, matin et soir"
   - Échéance: J+7
   - Statut: "En cours"
   - Bouton: "Commencer le devoir"

   DEVOIR 2: "Journal Situations Anxiogènes"
   - Description: "Noter 1 situation par jour avec ressenti"
   - Échéance: J+7  
   - Statut: "En cours"

   DEVOIR 3: "Écoute Audio Relaxation"
   - Description: "Session guidée 10 min quotidienne"
   - Échéance: J+7
   - Audio intégré disponible
```

---

## 🔄 PHASE 5 : TEST CHANGEMENT D'EXPERT

### **ÉTAPE 5.1 : Déclenchement Réévaluation Expert**
```
🔄 SIMULATION STAGNATION :
✅ SIMULER : 3 sessions avec engagement décroissant
✅ SCORES SIMULÉS :
   - Session 2: Engagement 7/10, Bien-être 6/10
   - Session 3: Engagement 5/10, Bien-être 6/10  
   - Session 4: Engagement 4/10, Bien-être 5/10

🚨 DÉCLENCHEUR AUTOMATIQUE :
✅ VALIDER : 
   - ExpertMatchingService détecte stagnation
   - Notification suggestion changement expert
   - Modal ExpertSelectionModal s'ouvre automatiquement
```

### **ÉTAPE 5.2 : Nouveau Matching Expert**
```
🎯 RÉÉVALUATION :
✅ VÉRIFIER :
   - Dr. Alex Mindfulness maintenant recommandé
   - Score compatibilité recalculé basé sur historique
   - Explication changement fournie

✅ TESTER : Preview voix Dr. Alex
   - Voix "aoede" plus apaisante
   - Approche méditative adaptée au profil
   - Transition expliquée par nouvel expert
```

---

## 🌍 PHASE 6 : TEST ADAPTATION CULTURELLE

### **ÉTAPE 6.1 : Profil Culturel Arabe**
```
🇲🇦 CHANGEMENT CONTEXTE :
✅ MODIFIER : Préférence culturelle → "Adaptation marocaine"
✅ VALIDER : 
   - Dr. Aicha Culturelle automatiquement suggérée
   - Interface partiellement en arabe (zones RTL)
   - Voix "despina" avec accent marocain authentique

🎤 TEST AUDIO CULTUREL :
✅ ÉCOUTER : Sample Dr. Aicha
   "مرحبا، أنا الدكتورة عائشة. أتحدث العربية والفرنسية وأفهم تماماً التحديات الثقافية..."
✅ VALIDER : 
   - Prononciation naturelle
   - Intégration expressions culturelles
   - Respect contexte familial/social
```

---

## 🚨 PHASE 7 : TEST DÉTECTION CRISE

### **ÉTAPE 7.1 : Simulation Signaux Alarme**
```
⚠️ MESSAGES CRITIQUES TEST :
✅ SIMULER message utilisateur :
   "Je me sens vraiment mal, j'ai des pensées sombres, je ne vois pas d'issue"

🤖 RÉACTION IA ATTENDUE :
✅ VALIDER :
   - TherapeuticAI détecte signaux de crise immédiatement
   - Protocole d'urgence activé automatiquement
   - Message audio Dr. Sarah avec ton adapté:
     "Je comprends que vous traversez une période très difficile. Votre sécurité est ma priorité absolue..."
   
📞 RESSOURCES CRISE :
✅ VÉRIFIER affichage automatique :
   - Numéros urgence: 3114 (numéro national français)
   - SOS Amitié: 09 72 39 40 50
   - Contacts professionnels locaux
   - Option "Contacter proche de confiance"
```

---

## 📱 PHASE 8 : TESTS RESPONSIVITÉ ET PERFORMANCE

### **ÉTAPE 8.1 : Tests Multi-Device**
```
📱 MOBILE (iPhone/Android) :
✅ TESTER :
   - TherapyOnboarding: Navigation tactile fluide
   - Dashboard: Métriques lisibles, graphs adaptés
   - Session: Interface chat optimisée, audio fonctionne
   - Modal Expert: Sélection et preview audio OK

💻 DESKTOP :
✅ VALIDER :
   - Animations Framer Motion fluides 60fps
   - Audio TTS lecture sans latence
   - Transitions entre vues instantanées

📊 TABLETTE :
✅ VÉRIFIER : Layout adaptatif optimal
```

### **ÉTAPE 8.2 : Performance Audio TTS**
```
🔊 TESTS NAVIGATEURS :
✅ CHROME : 
   - Génération TTS < 3 secondes
   - Lecture audio sans coupure
   - Cache audio opérationnel

✅ FIREFOX :
   - Compatibilité Gemini TTS validée
   - Contrôles audio natifs fonctionnels

✅ SAFARI :
   - Playback audio optimisé iOS
   - Pas de blocage auto-play
```

---

## 🎯 CRITÈRES DE VALIDATION FINALE

### ✅ **SUCCÈS COMPLET SI :**

**🏗️ ARCHITECTURE :**
- [ ] Base données: Toutes tables créées, relations opérationnelles
- [ ] Services backend: 7 services fonctionnels sans erreur
- [ ] Intégration: Communication fluide entre couches

**🎨 INTERFACE :**
- [ ] 4 composants UI: Rendu parfait, responsive, animations fluides
- [ ] Navigation: Flux logique sans broken state
- [ ] UX: Feedback immédiat, loading states appropriés

**🤖 INTELLIGENCE :**
- [ ] 3 experts IA: Personnalités distinctes, réponses contextuelles
- [ ] Matching: Score compatibilité cohérent, réévaluation automatique
- [ ] TTS: Voix authentiques, audio sans défaut

**📊 FONCTIONNALITÉS :**
- [ ] Onboarding: 5 étapes complètes, données sauvegardées
- [ ] Sessions: 5 phases respectées, durée 20-25min, progrès trackés
- [ ] Dashboard: Métriques temps réel, visualisations précises
- [ ] Adaptation: Culturelle français/arabe, détection crise

**🔒 ROBUSTESSE :**
- [ ] Gestion erreurs: Pas de crash, fallbacks appropriés
- [ ] Performance: < 3s chargement, animations 60fps
- [ ] Sécurité: Aucune donnée sensible exposée

---

## 🚀 CHECKLIST EXÉCUTION TEST

### **PRÉPARATION :**
```bash
# 1. Environnement
cd /home/assyin/MindEase-IA
npm install
npm run dev

# 2. Base de données
# Vérifier migration executée
# Vérifier tables therapy_* présentes

# 3. Services
# Vérifier tous les services compilent
# Vérifier pas d'erreurs TypeScript
```

### **EXÉCUTION :**
```bash
# 1. Démarrer tests
# Ouvrir http://localhost:5173
# Aller vers TherapyIntegrationTest

# 2. Tests automatisés
# Clic "Lancer tous les tests"
# Valider 4/4 composants succès

# 3. Tests manuels
# Suivre scénario étape par étape
# Noter tout problème rencontré
```

### **VALIDATION :**
```bash
# 1. Métriques de succès
# Temps de réponse < 3s partout
# Aucun crash ou erreur console
# Audio TTS fonctionne parfaitement

# 2. Données persistantes
# Vérifier sauvegarde en base
# Tester reload page (données conservées)
# Valider progression programme

# 3. Cross-browser
# Test Chrome, Firefox, Safari
# Mobile + Desktop
# Audio compatible partout
```

---

**🎯 RÉSULTAT ATTENDU :** Système thérapeutique 100% opérationnel, ready pour production, validé sur tous critères qualité.

**📈 CRITÈRE RÉUSSITE :** Parcours utilisateur complet sans interruption, de l'onboarding à la 5ème session, avec adaptation expert et détection crise fonctionnelles.