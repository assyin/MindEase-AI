🔄 SYSTÈME DE PASSATION - CLAUDE → CURSOR

Cher Claude,

À la fin de chaque session de travail, tu DOIS mettre à jour le fichier **`Claude-Cursor-Passation.md`** avec le format suivant :

---

# CLAUDE-CURSOR-PASSATION.md

## 🕐 DERNIÈRE SESSION CLAUDE
**Date :** [JJ/MM/AAAA à HH:MM]
**Durée :** [Temps de travail]

### ✅ TRAVAIL RÉALISÉ :
- **Fonctionnalité A** - [Description détaillée]
- **Fonctionnalité B** - [État d'avancement]
- **Bug fixé X** - [Solution apportée]

### 📁 FICHIERS MODIFIÉS :
- `src/components/ChatInterface.tsx` - [Modifications apportées]
- `src/services/TherapyManager.ts` - [Nouvelles fonctions ajoutées]
- `database/schema.sql` - [Tables créées/modifiées]

### 🎯 POINT D'ARRÊT EXACT :
**Dernière tâche en cours :** [Description précise]
**Ligne de code :** [Fichier:ligne où tu t'es arrêté]
**Contexte :** [Ce que tu étais en train de faire]

### ▶️ PROCHAINES ÉTAPES POUR CURSOR :
1. [Tâche immédiate à faire]
2. [Ordre des priorités]
3. [Points d'attention spécifiques]

### ❓ QUESTIONS/BLOCAGES :
- [Question technique non résolue]
- [Décision à prendre]
- [Point nécessitant clarification]

### 🔧 NOTES TECHNIQUES :
- [Standards de code à respecter]
- [Patterns utilisés]
- [Dépendances importantes]

---

**IMPORTANT :** Sois exhaustif et précis pour permettre à Cursor de reprendre sans confusion.

Génère ce rapport systématiquement avant toute pause !
📋 PROMPT POUR CURSOR - REPRISE APRÈS CLAUDE
text
🔄 SYSTÈME DE PASSATION - CURSOR REPREND LE TRAVAIL

Cher Cursor,

Avant de commencer à coder, tu DOIS :

1. **LIRE INTÉGRALEMENT** le fichier `Claude-Cursor-Passation.md`
2. **COMPRENDRE** exactement où Claude s'est arrêté
3. **CONTINUER** logiquement son travail

## 📖 PROCESSUS DE REPRISE :

### ÉTAPE 1 - ANALYSE
- Lis la section "POINT D'ARRÊT EXACT"
- Examine les "FICHIERS MODIFIÉS" récemment
- Comprends le contexte des "PROCHAINES ÉTAPES"

### ÉTAPE 2 - VALIDATION
- Confirme que tu as compris la situation
- Pose des questions si quelque chose n'est pas clair
- Vérifie l'état du code avant de continuer

### ÉTAPE 3 - CONTINUATION
- Reprends exactement où Claude s'est arrêté
- Respecte les standards et patterns établis
- Continue dans la même logique architecturale

### ÉTAPE 4 - DOCUMENTATION
Mets à jour le fichier avec tes progrès :

🕐 DERNIÈRE SESSION CURSOR
Date : [JJ/MM/AAAA à HH:MM]
Durée : [Temps de travail]

✅ TRAVAIL RÉALISÉ :
[Tes modifications]

📁 FICHIERS MODIFIÉS :
[Tes changements]

🎯 POINT D'ARRÊT EXACT :
[Où tu t'arrêtes]

▶️ PROCHAINES ÉTAPES POUR CLAUDE :
[Instructions pour Claude]

text

**Ne commence à coder qu'après avoir confirmé ta compréhension complète du contexte !**


############ Sauvegarde & Backup Manuel

 🚀 Utilisation :

  # Sauvegarde complète
  ./backup/backup-system.sh full

  # Restauration
  ./backup/restore-system.sh backup/backup_YYYYMMDD_HHMMSS.tar.gz full

  # Types spécifiques
  ./backup/backup-system.sh db      # Base de données seulement
  ./backup/backup-system.sh code    # Code application seulement