# 🔄 SYSTÈME DE BACKUP MINDEASE AI

## 🚀 Utilisation Rapide

### Créer une Sauvegarde Complète
```bash
./backup/backup-system.sh full
```

### Restaurer une Sauvegarde
```bash
./backup/restore-system.sh backup/backup_YYYYMMDD_HHMMSS.tar.gz full
```

---

## 📁 Fichiers du Système

- **`backup-system.sh`** - Script de sauvegarde principal
- **`restore-system.sh`** - Script de restauration principal  
- **`RESTORE-GUIDE.md`** - Guide détaillé complet
- **`README.md`** - Ce fichier (aperçu rapide)

---

## 🛠️ Types de Sauvegarde

| Type | Description | Commande |
|------|-------------|----------|
| **full** | Sauvegarde complète (recommandé) | `./backup-system.sh full` |
| **db** | Base de données seulement | `./backup-system.sh db` |
| **code** | Code application seulement | `./backup-system.sh code` |
| **config** | Configuration seulement | `./backup-system.sh config` |

---

## 📋 Contenu des Sauvegardes

### ✅ Inclus
- 🗄️ **Base de données** - Schémas SQL, politiques RLS, scripts
- 💻 **Code source** - src/, public/, package.json, configs
- ⚙️ **Configuration** - .gitignore, README, templates
- 📊 **Logs et métadonnées** - État du système, informations

### ❌ Exclus (pour sécurité/taille)
- `node_modules/` (réinstallé automatiquement)
- `.git/` (historique git)
- `dist/`, `.vite/` (fichiers générés)
- **Clés API secrètes** (template .env fourni)

---

## ⚠️ Actions Manuelles Post-Restauration

1. **Configurer les clés API**
   ```bash
   # Éditer .env avec vos clés
   nano .env
   ```

2. **Restaurer la base de données**
   ```sql
   -- Dans Supabase SQL Editor :
   \i database/schema.sql
   \i database/rls-policies.sql
   ```

3. **Tester l'application**
   ```
   http://localhost:5173/
   ```

---

## 🔍 Validation

### Vérifier les Sauvegardes
```bash
# Lister les sauvegardes
ls -la backup/backup_*.tar.gz

# Vérifier l'intégrité
tar -tzf backup/backup_YYYYMMDD_HHMMSS.tar.gz | head -10
```

### Test de Restauration
```bash
# Test sur une copie
cp -r MindEase-AI MindEase-AI-TEST
cd MindEase-AI-TEST
./backup/restore-system.sh ../MindEase-AI/backup/backup_file.tar.gz full
```

---

## 📞 Documentation Complète

Pour plus de détails, consultez : **[RESTORE-GUIDE.md](./RESTORE-GUIDE.md)**

- 📋 Procédures détaillées
- 🚨 Dépannage d'urgence  
- 🔧 Configuration avancée
- ✅ Checklists complètes

---

## 🎯 Exemple d'Usage Typique

```bash
# 1. Sauvegarde avant mise à jour importante
./backup/backup-system.sh full

# 2. Développement/modifications...

# 3. En cas de problème, restaurer
./backup/restore-system.sh backup/backup_20250829_223000.tar.gz full

# 4. Actions manuelles (clés API, SQL)

# 5. Test et validation
```

---

**🔄 Système de backup complet et sécurisé pour MindEase AI**