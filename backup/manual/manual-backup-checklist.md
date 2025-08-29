# 📋 Checklist de Sauvegarde Manuelle MindEase AI

## ✅ Avant de Commencer

- [ ] Vérifier l'espace disque disponible (min 500MB recommandé)
- [ ] S'assurer que l'application n'est pas en cours d'utilisation intensive
- [ ] Vérifier la connectivité à Supabase
- [ ] Noter la date/heure de début de sauvegarde

## 📁 1. Fichiers de Configuration

### Variables d'environnement
- [ ] Copier le fichier `.env`
```bash
cp .env backup/manual/env-backup-$(date +%Y%m%d)
```

### Fichiers de configuration
- [ ] `package.json`
- [ ] `package-lock.json` 
- [ ] `vite.config.ts`
- [ ] `tailwind.config.js`
- [ ] `tsconfig.json`

```bash
# Commande groupée
mkdir -p backup/manual/config-$(date +%Y%m%d)
cp package.json package-lock.json vite.config.ts tailwind.config.js tsconfig.json backup/manual/config-$(date +%Y%m%d)/
```

## 🗄️ 2. Base de Données

### Schéma de base de données
- [ ] Sauvegarder `supabase-schema.sql`
```bash
cp supabase-schema.sql backup/manual/schema-backup-$(date +%Y%m%d).sql
```

### Export des données Supabase
- [ ] Se connecter à Supabase Dashboard
- [ ] Aller dans SQL Editor
- [ ] Exporter les tables suivantes:

#### Tables principales:
- [ ] `conversations` - Conversations utilisateur
- [ ] `messages` - Messages de chat
- [ ] `ai_contexts` - Contextes AI
- [ ] `conversation_summaries` - Résumés des conversations

#### Tables utilisateur:
- [ ] `user_profiles` - Profils utilisateurs
- [ ] `sessions` - Sessions utilisateur
- [ ] `mood_entries` - Entrées d'humeur
- [ ] `user_goals` - Objectifs utilisateur

```sql
-- Exemple de requête d'export pour chaque table
COPY (SELECT * FROM conversations) TO STDOUT WITH CSV HEADER;
```

## 💻 3. Code Source Critique

### Services principaux
- [ ] `src/services/AIModelManager.ts`
- [ ] `src/services/AIContextManager.ts`
- [ ] `src/services/ConversationManager.ts`
- [ ] `src/services/GoogleGenAIClient.ts`
- [ ] `src/services/AvatarManager.ts`

```bash
mkdir -p backup/manual/services-$(date +%Y%m%d)
cp -r src/services/ backup/manual/services-$(date +%Y%m%d)/
```

### Types et contextes
- [ ] `src/types/index.ts`
- [ ] `src/contexts/ConversationsContext.tsx`
- [ ] `src/contexts/LanguageContext.tsx`
- [ ] `src/contexts/AuthContext.tsx`

```bash
cp -r src/types/ backup/manual/types-$(date +%Y%m%d)/
cp -r src/contexts/ backup/manual/contexts-$(date +%Y%m%d)/
```

### Composants critiques
- [ ] `src/components/MinimalChatInterface.tsx`
- [ ] `src/components/EnhancedVoiceInput.tsx`
- [ ] `src/components/ConversationsProvider.tsx`

```bash
mkdir -p backup/manual/components-$(date +%Y%m%d)
cp src/components/MinimalChatInterface.tsx backup/manual/components-$(date +%Y%m%d)/
cp src/components/EnhancedVoiceInput.tsx backup/manual/components-$(date +%Y%m%d)/
cp src/components/ConversationsProvider.tsx backup/manual/components-$(date +%Y%m%d)/
```

## 🎨 4. Styles et Assets

### Fichiers CSS
- [ ] `src/index.css`
- [ ] `src/styles/rtl.css`

```bash
mkdir -p backup/manual/styles-$(date +%Y%m%d)
cp src/index.css backup/manual/styles-$(date +%Y%m%d)/
cp -r src/styles/ backup/manual/styles-$(date +%Y%m%d)/
```

### Assets statiques (si applicable)
- [ ] `public/` (logos, favicons, etc.)

## 📝 5. Documentation et Scripts

### Scripts de sauvegarde
- [ ] `backup/scripts/` (tous les scripts)

### Documentation
- [ ] `README.md`
- [ ] `CLAUDE.md`
- [ ] Fichiers `.md` importants

```bash
mkdir -p backup/manual/docs-$(date +%Y%m%d)
cp *.md backup/manual/docs-$(date +%Y%m%d)/
```

## 🔍 6. Vérification Post-Sauvegarde

- [ ] Vérifier la taille totale des fichiers sauvegardés
- [ ] Tester l'intégrité des fichiers copiés
- [ ] Documenter les éléments sauvegardés
- [ ] Noter l'heure de fin de sauvegarde

```bash
# Vérifier la taille
du -sh backup/manual/

# Lister les fichiers sauvegardés
find backup/manual/ -name "*$(date +%Y%m%d)*" -type f
```

## 📋 7. Créer un Résumé de Sauvegarde

Créer un fichier `backup-summary-$(date +%Y%m%d).md` avec:
- [ ] Date et heure de sauvegarde
- [ ] Liste des éléments sauvegardés
- [ ] Taille totale
- [ ] Notes particulières
- [ ] Instructions de restauration spécifiques

## ⚠️ Points d'Attention

- **Clés API**: Vérifier que le fichier `.env` contient toutes les clés
- **Permissions**: S'assurer que les fichiers copiés ont les bonnes permissions
- **Espace disque**: Surveiller l'utilisation de l'espace
- **Confidentialité**: Ne pas partager les fichiers contenant des clés API

## 🚀 Commande Rapide (Tout-en-Un)

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup/manual/full-backup-$DATE"
mkdir -p "$BACKUP_DIR"

# Configuration
cp .env "$BACKUP_DIR/env-backup"
cp package.json package-lock.json vite.config.ts "$BACKUP_DIR/"

# Code source
cp -r src/services src/types src/contexts "$BACKUP_DIR/"

# Composants critiques
mkdir -p "$BACKUP_DIR/components"
cp src/components/MinimalChatInterface.tsx "$BACKUP_DIR/components/"
cp src/components/EnhancedVoiceInput.tsx "$BACKUP_DIR/components/"

# Styles
cp -r src/styles "$BACKUP_DIR/"
cp src/index.css "$BACKUP_DIR/"

# Schéma DB
cp supabase-schema.sql "$BACKUP_DIR/"

echo "✅ Sauvegarde manuelle terminée: $BACKUP_DIR"
```