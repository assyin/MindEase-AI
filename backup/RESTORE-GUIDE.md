# 🔄 GUIDE DE RESTAURATION MINDEASE AI

## 📋 Vue d'Ensemble

Ce système de backup/restore permet de sauvegarder et restaurer complètement MindEase AI, incluant :
- 🗄️ **Base de données** (schémas, politiques, données)
- 💻 **Code application** (React/TypeScript)
- ⚙️ **Configuration** (fichiers de config, dépendances)
- 📊 **Logs et métadonnées**

---

## 🚀 UTILISATION RAPIDE

### Créer une Sauvegarde
```bash
# Sauvegarde complète (recommandé)
./backup/backup-system.sh full

# Sauvegardes partielles
./backup/backup-system.sh db      # Base de données seulement
./backup/backup-system.sh code    # Code application seulement
./backup/backup-system.sh config  # Configuration seulement
```

### Restaurer une Sauvegarde
```bash
# Restauration complète
./backup/restore-system.sh backup/backup_20250829_223000.tar.gz full

# Restaurations partielles
./backup/restore-system.sh backup_file.tar.gz db      # Base de données
./backup/restore-system.sh backup_file.tar.gz code    # Code application
./backup/restore-system.sh backup_file.tar.gz config  # Configuration
```

---

## 📁 STRUCTURE DES SAUVEGARDES

```
backup/
├── backup_YYYYMMDD_HHMMSS.tar.gz    # Archive compressée
├── backup_YYYYMMDD_HHMMSS/          # Contenu (temporaire)
│   ├── database/                    # Scripts SQL et données
│   │   ├── schema.sql
│   │   ├── rls-policies.sql
│   │   ├── backup-data.sql          # Export des données
│   │   └── restore-data.sql         # Import des données
│   ├── application/                 # Code source
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── ...
│   ├── config/                      # Configuration
│   │   ├── .env.template           # Sans les secrets
│   │   ├── .gitignore
│   │   └── README.md
│   └── logs/                       # Métadonnées
│       ├── backup-info.txt         # Informations générales
│       └── system-state.txt        # État du système
```

---

## 🛠️ PROCÉDURES DÉTAILLÉES

### 1. SAUVEGARDE COMPLÈTE

```bash
# 1. Naviguer vers le projet
cd /home/jirosak/MindEase-AI

# 2. Rendre les scripts exécutables
chmod +x backup/backup-system.sh
chmod +x backup/restore-system.sh

# 3. Créer la sauvegarde
./backup/backup-system.sh full
```

**Résultat :**
- Archive créée : `backup/backup_YYYYMMDD_HHMMSS.tar.gz`
- Anciennes sauvegardes nettoyées (garde les 10 dernières)
- Log de sauvegarde généré

### 2. RESTAURATION COMPLÈTE

```bash
# 1. Lister les sauvegardes disponibles
ls -la backup/backup_*.tar.gz

# 2. Restaurer (avec confirmation)
./backup/restore-system.sh backup/backup_20250829_223000.tar.gz full

# 3. Actions manuelles post-restauration
# - Configurer les clés API dans .env
# - Exécuter les scripts SQL dans Supabase
# - Tester l'application
```

---

## ⚠️ PROCÉDURES D'URGENCE

### Corruption Totale du Système

1. **Arrêter tous les services**
   ```bash
   pkill -f "vite.*mindease"
   pkill -f "npm.*dev"
   ```

2. **Sauvegarder l'état actuel** (si possible)
   ```bash
   mv /home/jirosak/MindEase-AI /home/jirosak/MindEase-AI-CORRUPTED
   ```

3. **Restaurer depuis la dernière sauvegarde**
   ```bash
   mkdir -p /home/jirosak/MindEase-AI
   cd /home/jirosak/MindEase-AI
   
   # Utiliser la dernière sauvegarde
   LATEST_BACKUP=$(ls -t /home/jirosak/MindEase-AI-CORRUPTED/backup/backup_*.tar.gz | head -n1)
   ./backup/restore-system.sh "$LATEST_BACKUP" full
   ```

### Base de Données Corrompue

1. **Restaurer seulement la DB**
   ```bash
   ./backup/restore-system.sh backup_file.tar.gz db
   ```

2. **Dans Supabase SQL Editor :**
   ```sql
   -- 1. Supprimer toutes les tables
   \i database/schema.sql
   
   -- 2. Recréer les politiques
   \i database/rls-policies.sql
   
   -- 3. Restaurer les données (si disponibles)
   \i database/restore-data.sql
   ```

### Code Application Corrompu

```bash
# Restaurer seulement le code
./backup/restore-system.sh backup_file.tar.gz code
```

---

## 🔍 VALIDATION POST-RESTAURATION

### 1. Vérifications Automatiques
Le script de restauration vérifie automatiquement :
- ✅ Présence des fichiers critiques
- ✅ Structure des dossiers
- ✅ Installation des dépendances
- ✅ Démarrage des services

### 2. Vérifications Manuelles

**Application :**
```bash
# Naviguer vers l'application
http://localhost:5173/ ou http://localhost:5174/

# Vérifier dans la console du navigateur (F12)
# Pas d'erreurs 400/406 ?
# Connexion à Supabase OK ?
# Dashboard fonctionnel ?
```

**Base de Données :**
```sql
-- Dans Supabase SQL Editor
SELECT COUNT(*) FROM user_profiles;
SELECT COUNT(*) FROM therapy_programs;
SELECT COUNT(*) FROM therapy_sessions;

-- Test d'intégration
\i database/test-fixes-safe.sql
```

**Services :**
```bash
# Vérifier les processus
ps aux | grep node
ps aux | grep vite

# Vérifier les ports
netstat -tlnp | grep :517
```

---

## 🔧 CONFIGURATION AVANCÉE

### Sauvegarde Automatique (Crontab)

```bash
# Éditer crontab
crontab -e

# Ajouter une sauvegarde quotidienne à 2h00
0 2 * * * /home/jirosak/MindEase-AI/backup/backup-system.sh full >> /var/log/mindease-backup.log 2>&1

# Sauvegarde hebdomadaire complète le dimanche à 1h00
0 1 * * 0 /home/jirosak/MindEase-AI/backup/backup-system.sh full
```

### Variables d'Environnement Personnalisées

```bash
# Dans backup-system.sh, modifier :
BACKUP_BASE="/mon/chemin/personnalise"
RETENTION_DAYS=30  # Garder 30 jours au lieu de 10 sauvegardes
```

### Notification par Email

```bash
# Ajouter à la fin de backup-system.sh :
echo "Sauvegarde MindEase AI terminée" | mail -s "Backup Success" admin@domain.com
```

---

## 🚨 DÉPANNAGE

### Problèmes Courants

**"Permission denied"**
```bash
chmod +x backup/backup-system.sh
chmod +x backup/restore-system.sh
```

**"No space left on device"**
```bash
# Nettoyer les anciennes sauvegardes
rm backup/backup_*.tar.gz

# Vérifier l'espace disque
df -h
```

**"Backup file not found"**
```bash
# Lister les sauvegardes disponibles
ls -la backup/backup_*.tar.gz
```

**Échec de restauration des dépendances**
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Logs de Debug

```bash
# Logs détaillés pendant la sauvegarde
./backup/backup-system.sh full 2>&1 | tee backup.log

# Logs détaillés pendant la restauration  
./backup/restore-system.sh backup_file.tar.gz full 2>&1 | tee restore.log
```

---

## 📞 SUPPORT ET AIDE

### Commandes Utiles

```bash
# État du système
./backup/backup-system.sh --status

# Test de la structure de sauvegarde
tar -tzf backup/backup_YYYYMMDD_HHMMSS.tar.gz | head -20

# Vérification de l'intégrité
tar -tzf backup_file.tar.gz > /dev/null && echo "Archive valide" || echo "Archive corrompue"
```

### Fichiers Importants

- `backup/backup-system.sh` - Script de sauvegarde principal
- `backup/restore-system.sh` - Script de restauration principal  
- `backup/RESTORE-GUIDE.md` - Ce guide (vous êtes ici)
- `database/test-fixes-safe.sql` - Test de validation de la DB

---

## ✅ CHECKLIST DE RESTAURATION

### Avant Restauration
- [ ] Sauvegarder l'état actuel
- [ ] Arrêter tous les services
- [ ] Vérifier l'espace disque disponible
- [ ] Confirmer le fichier de sauvegarde

### Pendant Restauration
- [ ] Surveiller les messages d'erreur
- [ ] Noter les actions manuelles requises
- [ ] Vérifier les permissions des fichiers

### Après Restauration
- [ ] Configurer les clés API dans .env
- [ ] Exécuter les scripts SQL dans Supabase
- [ ] Tester l'application web
- [ ] Vérifier les logs d'erreur
- [ ] Valider les fonctionnalités critiques

**🎉 RESTAURATION RÉUSSIE !**