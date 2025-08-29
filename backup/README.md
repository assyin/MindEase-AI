# 🛡️ Système de Sauvegarde MindEase AI

## 🚀 Installation Rapide

```bash
# Exécuter la configuration automatique
./backup/scripts/quick-setup.sh
```

## 📁 Structure

```
backup/
├── 📋 GUIDE_BACKUP.md           # Guide complet (LIRE EN PREMIER)
├── 📋 README.md                 # Ce fichier
├── 📁 scripts/                  # Scripts de sauvegarde/restauration
│   ├── 🔄 backup-database.sh    # Sauvegarde complète
│   ├── 🔄 restore-backup.sh     # Restauration
│   ├── ⏰ auto-backup-cron.sh   # Sauvegarde automatique
│   └── ⚙️ quick-setup.sh        # Configuration rapide
├── 📁 automated/                # Sauvegardes automatiques
├── 📁 manual/                   # Sauvegardes manuelles
│   └── 📋 manual-backup-checklist.md
└── 📁 restore/                  # Zone de restauration temporaire
```

## ⚡ Commandes Essentielles

### Sauvegarde Immédiate
```bash
./backup/scripts/backup-database.sh
```

### Restauration
```bash
# Lister les backups disponibles
ls -la backup/automated/*.tar.gz

# Restaurer un backup
./backup/scripts/restore-backup.sh BACKUP_FILE.tar.gz
```

### Sauvegarde Automatique
```bash
# Configuration cron quotidienne (2h00)
echo "0 2 * * * $(pwd)/backup/scripts/auto-backup-cron.sh" | crontab -

# Vérifier la configuration
crontab -l

# Voir les logs
tail -f backup/automated/backup-cron.log
```

## 🔍 Monitoring

### Vérifier les Backups Récents
```bash
# 5 derniers backups
ls -laht backup/automated/*.tar.gz | head -5

# Taille des backups
du -sh backup/automated/*.tar.gz | tail -5
```

### Espace Disque
```bash
# Vérifier l'espace disponible
df -h backup/

# Nettoyer les anciens backups (garde les 7 derniers)
find backup/automated/ -name "*.tar.gz" -mtime +7 -delete
```

## 📊 Ce qui est Sauvegardé

### ✅ Automatiquement Inclus
- 🗄️ **Schéma de base de données** (`supabase-schema.sql`)
- ⚙️ **Configuration** (`.env`, `package.json`, `vite.config.ts`)
- 💻 **Code source critique** (`src/services/`, `src/types/`, `src/contexts/`)
- 📝 **Métadonnées** (date, type, instructions de restauration)

### ⚠️ Non Inclus (Sauvegarde Manuelle Requise)
- 🗄️ **Données Supabase** (doit être exporté depuis le Dashboard)
- 🎨 **Assets complets** (`public/`, `src/components/` complet)
- 📚 **Documentation** (fichiers `.md`)

## 🆘 Support d'Urgence

### Sauvegarde d'Urgence (2 minutes)
```bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backup/emergency/emergency-$DATE
cp .env supabase-schema.sql backup/emergency/emergency-$DATE/
cp -r src/services src/types backup/emergency/emergency-$DATE/
tar -czf backup/emergency/emergency-$DATE.tar.gz backup/emergency/emergency-$DATE
rm -rf backup/emergency/emergency-$DATE
echo "✅ Sauvegarde d'urgence: backup/emergency/emergency-$DATE.tar.gz"
```

### Restauration d'Urgence
```bash
# 1. Arrêter l'application
pkill -f "vite"

# 2. Sauvegarder l'état actuel
cp .env .env.backup-$(date +%Y%m%d)

# 3. Restaurer avec le dernier backup
LATEST=$(ls -t backup/automated/*.tar.gz | head -1)
./backup/scripts/restore-backup.sh "$(basename "$LATEST")" --force

# 4. Relancer
npm run dev
```

## 📚 Documentation Complète

**📖 LIRE LE GUIDE COMPLET :** [GUIDE_BACKUP.md](GUIDE_BACKUP.md)

Le guide contient :
- 🔧 Instructions détaillées de configuration
- 📋 Procédures manuelles step-by-step
- 🔍 Monitoring et maintenance
- 🛠️ Dépannage des problèmes courants
- ⚡ Commandes de référence rapide

---

**🛡️ Votre application MindEase AI est maintenant protégée !**