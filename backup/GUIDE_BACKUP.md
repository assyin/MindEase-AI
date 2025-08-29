# 🛡️ Guide Complet de Sauvegarde - MindEase AI

## 📑 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Sauvegarde Automatique Quotidienne](#sauvegarde-automatique-quotidienne)
3. [Sauvegarde Manuelle](#sauvegarde-manuelle)
4. [Restauration](#restauration)
5. [Maintenance et Monitoring](#maintenance-et-monitoring)
6. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Ce guide vous explique comment sauvegarder et restaurer complètement votre application MindEase AI, incluant :
- **Base de données Supabase** (schéma + données)
- **Code source critique** (services, types, contextes)
- **Configuration** (variables d'environnement, packages)
- **Assets et styles** (CSS, images)

### 📁 Structure des Backups

```
backup/
├── automated/          # Sauvegardes automatiques
├── manual/             # Sauvegardes manuelles
├── scripts/            # Scripts de sauvegarde/restauration
└── GUIDE_BACKUP.md     # Ce guide
```

---

## 🔄 Sauvegarde Automatique Quotidienne

### 🚀 Configuration Initiale

#### 1. Vérifier les Scripts

```bash
# Vérifier que les scripts sont exécutables
ls -la backup/scripts/
# Doit afficher : -rwxr-xr-x pour les fichiers .sh
```

#### 2. Tester la Sauvegarde Manuelle

```bash
# Exécuter une sauvegarde de test
./backup/scripts/backup-database.sh
```

#### 3. Configurer Cron pour Automatisation

```bash
# Ouvrir la crontab
crontab -e

# Ajouter cette ligne pour une sauvegarde quotidienne à 2h00
0 2 * * * /home/assyin/MindEase-IA/backup/scripts/auto-backup-cron.sh

# Ou pour une sauvegarde toutes les 6 heures
0 */6 * * * /home/assyin/MindEase-IA/backup/scripts/auto-backup-cron.sh

# Ou pour une sauvegarde hebdomadaire (dimanche à 3h00)
0 3 * * 0 /home/assyin/MindEase-IA/backup/scripts/auto-backup-cron.sh
```

#### 4. Vérifier la Configuration Cron

```bash
# Lister les tâches cron actuelles
crontab -l

# Vérifier les logs cron du système
tail -f /var/log/cron
# ou sur Ubuntu/Debian :
tail -f /var/log/syslog | grep CRON
```

### 📊 Monitoring des Sauvegardes Automatiques

#### Vérifier les Logs

```bash
# Voir les logs de sauvegarde automatique
tail -f backup/automated/backup-cron.log

# Voir les 20 dernières lignes
tail -20 backup/automated/backup-cron.log
```

#### Lister les Backups Récents

```bash
# Voir les sauvegardes des 7 derniers jours
find backup/automated/ -name "*.tar.gz" -mtime -7 -ls

# Voir la taille des backups
du -sh backup/automated/*.tar.gz | tail -5
```

---

## 🔧 Sauvegarde Manuelle

### 📋 Méthode 1 : Script Automatisé (Recommandé)

```bash
# Sauvegarde complète en une commande
./backup/scripts/backup-database.sh
```

**Ce script sauvegarde automatiquement :**
- ✅ Schéma de base de données
- ✅ Configuration (.env, package.json, etc.)
- ✅ Code source critique (services, types, contextes)
- ✅ Métadonnées de sauvegarde
- ✅ Compression automatique
- ✅ Nettoyage des anciens backups

### 📝 Méthode 2 : Sauvegarde Manuelle Détaillée

Suivez la checklist complète : [manual-backup-checklist.md](manual/manual-backup-checklist.md)

### 🎯 Sauvegarde Rapide d'Urgence

```bash
# Sauvegarde ultra-rapide des éléments essentiels
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backup/emergency/emergency-$DATE

# Configuration critique
cp .env backup/emergency/emergency-$DATE/
cp supabase-schema.sql backup/emergency/emergency-$DATE/

# Code source essentiel
cp -r src/services backup/emergency/emergency-$DATE/
cp -r src/types backup/emergency/emergency-$DATE/

# Compresser
tar -czf backup/emergency/emergency-$DATE.tar.gz backup/emergency/emergency-$DATE
rm -rf backup/emergency/emergency-$DATE

echo "✅ Sauvegarde d'urgence: backup/emergency/emergency-$DATE.tar.gz"
```

---

## 🔄 Restauration

### 🚀 Restauration Automatique

```bash
# Lister les backups disponibles
ls -la backup/automated/*.tar.gz

# Restaurer un backup spécifique
./backup/scripts/restore-backup.sh mindease_db_backup_20241228_143022.tar.gz

# Restauration forcée (sans confirmation)
./backup/scripts/restore-backup.sh mindease_db_backup_20241228_143022.tar.gz --force
```

### 📝 Étapes de Restauration Manuelle

#### 1. Préparation

```bash
# Arrêter l'application
pkill -f "vite"
pkill -f "npm.*dev"

# Créer un backup de sécurité de l'état actuel
cp .env .env.backup-$(date +%Y%m%d)
cp -r src/services src/services.backup-$(date +%Y%m%d)
```

#### 2. Extraction du Backup

```bash
# Extraire le backup
cd /tmp
tar -xzf /home/assyin/MindEase-IA/backup/automated/BACKUP_FILE.tar.gz
```

#### 3. Restauration des Fichiers

```bash
# Retourner au répertoire du projet
cd /home/assyin/MindEase-IA

# Restaurer la configuration
cp /tmp/EXTRACTED_BACKUP_FOLDER/.env .env

# Restaurer le code source
cp -r /tmp/EXTRACTED_BACKUP_FOLDER/src/services src/
cp -r /tmp/EXTRACTED_BACKUP_FOLDER/src/types src/
cp -r /tmp/EXTRACTED_BACKUP_FOLDER/src/contexts src/

# Restaurer les packages
cp /tmp/EXTRACTED_BACKUP_FOLDER/package.json .
npm install
```

#### 4. Restauration de la Base de Données

```bash
# Le schéma est restauré dans : restored-schema.sql
# Vous devez l'appliquer manuellement dans Supabase :

# 1. Ouvrir Supabase Dashboard
# 2. Aller dans SQL Editor
# 3. Copier le contenu de restored-schema.sql
# 4. Exécuter les requêtes
```

#### 5. Vérification Post-Restauration

```bash
# Vérifier les variables d'environnement
cat .env | grep -E "VITE_SUPABASE|VITE_GOOGLE"

# Réinstaller les dépendances
npm install

# Tester l'application
npm run dev
```

### 🔍 Vérification de la Restauration

#### Tests à Effectuer

1. **Démarrage de l'application**
   ```bash
   npm run dev
   # Vérifier : http://localhost:5173
   ```

2. **Connectivité Supabase**
   - Vérifier les connexions dans les logs de la console
   - Tester la création d'une conversation
   - Tester l'envoi d'un message

3. **Fonctionnalités IA**
   - Tester la reconnaissance vocale
   - Vérifier les réponses Gemini
   - Contrôler les contextes AI

4. **Interface utilisateur**
   - Vérifier les composants principaux
   - Tester le changement de langue
   - Contrôler les styles CSS

---

## 🔧 Maintenance et Monitoring

### 📊 Surveillance des Backups

#### Script de Monitoring

```bash
#!/bin/bash
# backup/scripts/monitor-backups.sh

BACKUP_DIR="/home/assyin/MindEase-IA/backup/automated"
MAX_AGE_DAYS=1  # Alerte si aucun backup depuis 1 jour

# Trouver le backup le plus récent
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ ALERTE: Aucun backup trouvé!"
    exit 1
fi

# Vérifier l'âge du dernier backup
LATEST_TIME=$(stat -c %Y "$LATEST_BACKUP")
CURRENT_TIME=$(date +%s)
AGE_HOURS=$(( (CURRENT_TIME - LATEST_TIME) / 3600 ))

if [ $AGE_HOURS -gt 24 ]; then
    echo "⚠️  ALERTE: Dernier backup datant de $AGE_HOURS heures"
else
    echo "✅ Backup récent trouvé (il y a $AGE_HOURS heures)"
fi

# Vérifier l'espace disque
DISK_USAGE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "⚠️  ALERTE: Espace disque faible ($DISK_USAGE% utilisé)"
fi

# Lister les 5 derniers backups
echo "📁 Derniers backups:"
ls -laht "$BACKUP_DIR"/*.tar.gz | head -5
```

#### Créer une Alerte Email (Optionnel)

```bash
# backup/scripts/backup-alert.sh
#!/bin/bash

EMAIL="votre-email@example.com"
MONITOR_OUTPUT=$(./backup/scripts/monitor-backups.sh)

# Envoyer un email si des alertes sont détectées
if echo "$MONITOR_OUTPUT" | grep -q "ALERTE"; then
    echo "$MONITOR_OUTPUT" | mail -s "🚨 Alerte Backup MindEase AI" "$EMAIL"
fi
```

### 🧹 Nettoyage Automatique

```bash
# backup/scripts/cleanup-old-backups.sh
#!/bin/bash

BACKUP_DIR="/home/assyin/MindEase-IA/backup/automated"
KEEP_DAYS=30  # Garder 30 jours
KEEP_COUNT=10  # Garder au moins 10 backups

echo "🧹 Nettoyage des anciens backups..."

# Supprimer les backups plus anciens que KEEP_DAYS jours
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$KEEP_DAYS -delete

# S'assurer qu'on garde au moins KEEP_COUNT backups
BACKUP_COUNT=$(ls "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -lt "$KEEP_COUNT" ]; then
    echo "✅ Conservation de tous les backups ($BACKUP_COUNT < $KEEP_COUNT)"
else
    # Supprimer les plus anciens au-delà de KEEP_COUNT
    ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +$((KEEP_COUNT + 1)) | xargs -r rm
    echo "✅ Nettoyage terminé, $KEEP_COUNT backups conservés"
fi
```

### 📈 Statistiques de Sauvegarde

```bash
# backup/scripts/backup-stats.sh
#!/bin/bash

BACKUP_DIR="/home/assyin/MindEase-IA/backup/automated"

echo "📊 STATISTIQUES DE SAUVEGARDE"
echo "================================"

# Nombre total de backups
TOTAL_BACKUPS=$(ls "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
echo "Nombre total de backups: $TOTAL_BACKUPS"

# Taille totale
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "Taille totale: $TOTAL_SIZE"

# Taille moyenne
if [ "$TOTAL_BACKUPS" -gt 0 ]; then
    TOTAL_KB=$(du -sk "$BACKUP_DIR"/*.tar.gz | awk '{sum+=$1} END {print sum}')
    AVG_KB=$((TOTAL_KB / TOTAL_BACKUPS))
    echo "Taille moyenne: $((AVG_KB / 1024)) MB"
fi

# Dernier backup
LATEST=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
    LATEST_DATE=$(stat -c %y "$LATEST" | cut -d' ' -f1,2)
    LATEST_SIZE=$(du -sh "$LATEST" | cut -f1)
    echo "Dernier backup: $(basename "$LATEST") ($LATEST_SIZE) - $LATEST_DATE"
fi

echo "================================"
```

---

## 🔧 Dépannage

### ❌ Problèmes Courants

#### 1. Script de Sauvegarde ne Fonctionne Pas

```bash
# Vérifier les permissions
ls -la backup/scripts/backup-database.sh
# Doit afficher: -rwxr-xr-x

# Rendre exécutable si nécessaire
chmod +x backup/scripts/*.sh
```

#### 2. Erreur "Espace Disque Insuffisant"

```bash
# Vérifier l'espace disponible
df -h /home/assyin/MindEase-IA/backup

# Nettoyer les anciens backups
./backup/scripts/cleanup-old-backups.sh

# Ou suppression manuelle
rm backup/automated/mindease_db_backup_OLDEST_*.tar.gz
```

#### 3. Cron ne s'Exécute Pas

```bash
# Vérifier le service cron
sudo service cron status

# Démarrer cron si nécessaire
sudo service cron start

# Vérifier les logs cron
tail -f /var/log/syslog | grep CRON

# Tester la crontab
crontab -l
```

#### 4. Erreur de Restauration

```bash
# Vérifier l'intégrité du backup
tar -tzf backup/automated/BACKUP_FILE.tar.gz > /dev/null
# Si ça échoue, le fichier est corrompu

# Utiliser un backup précédent
ls -laht backup/automated/*.tar.gz
```

#### 5. Variables d'Environnement Manquantes

```bash
# Vérifier le fichier .env restauré
cat .env

# Comparer avec un backup connu
diff .env .env.backup-YYYYMMDD

# Restaurer manuellement les variables manquantes
```

### 🔍 Logs de Débogage

```bash
# Logs de sauvegarde automatique
tail -f backup/automated/backup-cron.log

# Logs de l'application
npm run dev 2>&1 | tee debug.log

# Logs du système
journalctl -f
```

### 📞 Support d'Urgence

En cas de problème critique :

1. **Arrêter immédiatement** toute modification
2. **Créer un backup d'urgence** de l'état actuel
3. **Documenter** le problème rencontré
4. **Utiliser le backup le plus récent** fonctionnel
5. **Tester minutieusement** après restauration

---

## 📚 Ressources Supplémentaires

- **Scripts de sauvegarde** : `/backup/scripts/`
- **Checklist manuelle** : `/backup/manual/manual-backup-checklist.md`
- **Logs automatiques** : `/backup/automated/backup-cron.log`

---

## ⚡ Commandes de Référence Rapide

```bash
# Sauvegarde manuelle immédiate
./backup/scripts/backup-database.sh

# Restauration
./backup/scripts/restore-backup.sh BACKUP_FILE.tar.gz

# Monitoring
./backup/scripts/monitor-backups.sh

# Statistiques
./backup/scripts/backup-stats.sh

# Nettoyage
./backup/scripts/cleanup-old-backups.sh

# Configuration cron quotidienne
echo "0 2 * * * $(pwd)/backup/scripts/auto-backup-cron.sh" | crontab -
```

---

**🛡️ Votre système MindEase AI est maintenant protégé par un système de sauvegarde complet !**