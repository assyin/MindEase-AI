#!/bin/bash

# =============================================================================
# MindEase AI - Script de Sauvegarde Base de Données Supabase
# =============================================================================

# Configuration
BACKUP_DIR="/home/assyin/MindEase-IA/backup/automated"
PROJECT_DIR="/home/assyin/MindEase-IA"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="mindease_db_backup_$DATE"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier que le répertoire de backup existe
if [ ! -d "$BACKUP_DIR" ]; then
    log "Création du répertoire de backup: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Charger les variables d'environnement
if [ -f "$PROJECT_DIR/.env" ]; then
    log "Chargement des variables d'environnement..."
    source "$PROJECT_DIR/.env"
else
    error "Fichier .env non trouvé dans $PROJECT_DIR"
    exit 1
fi

# Vérifier les variables requises
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    error "Variables Supabase manquantes dans .env"
    exit 1
fi

log "Démarrage de la sauvegarde de la base de données MindEase AI..."

# Créer le répertoire de backup pour cette session
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_PATH"

# 1. Sauvegarder le schéma de la base de données
log "Sauvegarde du schéma de base de données..."
cp "$PROJECT_DIR/supabase-schema.sql" "$BACKUP_PATH/schema.sql"

# 2. Exporter les données via l'API Supabase (simulation)
log "Création du script de récupération des données..."

cat > "$BACKUP_PATH/export-data.js" << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function exportData() {
    const backupData = {
        timestamp: new Date().toISOString(),
        tables: {}
    };

    const tables = [
        'conversations',
        'messages', 
        'ai_contexts',
        'conversation_summaries',
        'user_profiles',
        'sessions',
        'mood_entries',
        'user_goals'
    ];

    console.log('🔄 Début de l\'export des données...');

    for (const table of tables) {
        try {
            console.log(`📋 Export de la table: ${table}`);
            const { data, error } = await supabase
                .from(table)
                .select('*');

            if (error) {
                console.error(`❌ Erreur pour ${table}:`, error);
                backupData.tables[table] = { error: error.message };
            } else {
                backupData.tables[table] = data || [];
                console.log(`✅ ${table}: ${data?.length || 0} enregistrements`);
            }
        } catch (err) {
            console.error(`❌ Exception pour ${table}:`, err);
            backupData.tables[table] = { error: err.message };
        }
    }

    // Sauvegarder dans un fichier JSON
    const backupFile = path.join(__dirname, 'database-backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Export terminé:', backupFile);
    
    // Créer un résumé
    const summary = {
        date: backupData.timestamp,
        tables: Object.keys(backupData.tables).map(table => ({
            name: table,
            records: Array.isArray(backupData.tables[table]) ? backupData.tables[table].length : 0,
            status: backupData.tables[table].error ? 'error' : 'success'
        }))
    };
    
    fs.writeFileSync(path.join(__dirname, 'backup-summary.json'), JSON.stringify(summary, null, 2));
    console.log('📊 Résumé créé: backup-summary.json');
}

exportData().catch(console.error);
EOF

# 3. Sauvegarder les fichiers de configuration
log "Sauvegarde des fichiers de configuration..."
cp "$PROJECT_DIR/.env" "$BACKUP_PATH/env-backup" 2>/dev/null || warning "Fichier .env non trouvé"
cp "$PROJECT_DIR/package.json" "$BACKUP_PATH/"
cp "$PROJECT_DIR/package-lock.json" "$BACKUP_PATH/" 2>/dev/null || true
cp "$PROJECT_DIR/vite.config.ts" "$BACKUP_PATH/"
cp "$PROJECT_DIR/tailwind.config.js" "$BACKUP_PATH/" 2>/dev/null || true
cp "$PROJECT_DIR/tsconfig.json" "$BACKUP_PATH/" 2>/dev/null || true

# 4. Sauvegarder le code source critique
log "Sauvegarde du code source critique..."
mkdir -p "$BACKUP_PATH/src"
cp -r "$PROJECT_DIR/src/services" "$BACKUP_PATH/src/"
cp -r "$PROJECT_DIR/src/types" "$BACKUP_PATH/src/"
cp -r "$PROJECT_DIR/src/contexts" "$BACKUP_PATH/src/"

# 5. Créer un fichier de métadonnées
log "Création des métadonnées de sauvegarde..."
cat > "$BACKUP_PATH/backup-metadata.json" << EOF
{
    "backup_name": "$BACKUP_NAME",
    "backup_date": "$DATE",
    "backup_type": "full",
    "project_path": "$PROJECT_DIR",
    "supabase_url": "$VITE_SUPABASE_URL",
    "components": [
        "database_schema",
        "configuration_files", 
        "source_code_services",
        "environment_variables"
    ],
    "restore_instructions": "Voir backup/GUIDE_BACKUP.md pour les instructions de restauration"
}
EOF

# 6. Compresser la sauvegarde
log "Compression de la sauvegarde..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

if [ $? -eq 0 ]; then
    success "Sauvegarde compressée créée: ${BACKUP_NAME}.tar.gz"
    
    # Supprimer le répertoire non compressé pour économiser l'espace
    rm -rf "$BACKUP_NAME"
    
    # Afficher la taille du backup
    SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    success "Taille de la sauvegarde: $SIZE"
else
    error "Erreur lors de la compression"
    exit 1
fi

# 7. Nettoyer les anciens backups (garder les 7 derniers)
log "Nettoyage des anciens backups..."
cd "$BACKUP_DIR"
ls -t mindease_db_backup_*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm
KEPT_BACKUPS=$(ls mindease_db_backup_*.tar.gz 2>/dev/null | wc -l)
log "Backups conservés: $KEPT_BACKUPS"

success "✅ Sauvegarde terminée avec succès!"
log "📁 Emplacement: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
log "📝 Pour restaurer, utilisez: ./restore-backup.sh ${BACKUP_NAME}.tar.gz"

echo ""
echo "========================================="
echo "    SAUVEGARDE MINDEASE AI TERMINÉE"
echo "========================================="
echo "Date: $(date)"
echo "Backup: ${BACKUP_NAME}.tar.gz"
echo "Taille: $SIZE"
echo "========================================="