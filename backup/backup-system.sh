#!/bin/bash
# MindEase AI - Système de Sauvegarde Complet
# ==========================================
# Usage: ./backup-system.sh [full|db|code|config]

set -e

# Configuration
BACKUP_BASE="/home/jirosak/MindEase-AI/backup"
PROJECT_ROOT="/home/jirosak/MindEase-AI"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_BASE/backup_$TIMESTAMP"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Créer la structure de sauvegarde
create_backup_structure() {
    log_info "Création de la structure de sauvegarde..."
    mkdir -p "$BACKUP_DIR"/{database,application,config,logs}
    log_success "Structure créée: $BACKUP_DIR"
}

# Sauvegarde de la base de données
backup_database() {
    log_info "Sauvegarde de la base de données..."
    
    # Vérifier les variables d'environnement
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    else
        log_error "Fichier .env introuvable"
        return 1
    fi
    
    # Extraire l'URL Supabase
    if [ -z "$VITE_SUPABASE_URL" ]; then
        log_error "VITE_SUPABASE_URL non défini"
        return 1
    fi
    
    # Copier les scripts SQL
    cp -r "$PROJECT_ROOT/database" "$BACKUP_DIR/database/"
    
    # Créer un script de sauvegarde des données
    cat > "$BACKUP_DIR/database/backup-data.sql" << 'EOF'
-- Sauvegarde des données MindEase AI
-- Généré automatiquement

-- Export des profils utilisateurs
\copy (SELECT * FROM user_profiles) TO 'user_profiles_backup.csv' WITH CSV HEADER;

-- Export des programmes thérapeutiques
\copy (SELECT * FROM therapy_programs) TO 'therapy_programs_backup.csv' WITH CSV HEADER;

-- Export des sessions
\copy (SELECT * FROM therapy_sessions) TO 'therapy_sessions_backup.csv' WITH CSV HEADER;

-- Export des devoirs
\copy (SELECT * FROM homework_assignments) TO 'homework_assignments_backup.csv' WITH CSV HEADER;

-- Export des profils d'experts
\copy (SELECT * FROM expert_profiles) TO 'expert_profiles_backup.csv' WITH CSV HEADER;

-- Export des rapports de progrès
\copy (SELECT * FROM progress_reports) TO 'progress_reports_backup.csv' WITH CSV HEADER;
EOF
    
    # Créer un script de restauration
    cat > "$BACKUP_DIR/database/restore-data.sql" << 'EOF'
-- Restauration des données MindEase AI
-- ATTENTION: Supprime toutes les données existantes

BEGIN;

-- Vider les tables dans l'ordre (respecter les FK)
DELETE FROM progress_reports;
DELETE FROM homework_assignments;
DELETE FROM therapy_sessions;
DELETE FROM therapy_programs;
DELETE FROM expert_profiles;
DELETE FROM user_profiles;

-- Restaurer les données
\copy user_profiles FROM 'user_profiles_backup.csv' WITH CSV HEADER;
\copy expert_profiles FROM 'expert_profiles_backup.csv' WITH CSV HEADER;
\copy therapy_programs FROM 'therapy_programs_backup.csv' WITH CSV HEADER;
\copy therapy_sessions FROM 'therapy_sessions_backup.csv' WITH CSV HEADER;
\copy homework_assignments FROM 'homework_assignments_backup.csv' WITH CSV HEADER;
\copy progress_reports FROM 'progress_reports_backup.csv' WITH CSV HEADER;

COMMIT;
EOF
    
    log_success "Sauvegarde base de données préparée"
}

# Sauvegarde du code application
backup_application() {
    log_info "Sauvegarde du code application..."
    
    # Exclure node_modules et autres dossiers temporaires
    rsync -av \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude '.vite' \
        --exclude 'backup' \
        --exclude '*.log' \
        "$PROJECT_ROOT/src" \
        "$PROJECT_ROOT/public" \
        "$PROJECT_ROOT/index.html" \
        "$PROJECT_ROOT/package.json" \
        "$PROJECT_ROOT/package-lock.json" \
        "$PROJECT_ROOT/tsconfig.json" \
        "$PROJECT_ROOT/vite.config.ts" \
        "$PROJECT_ROOT/tailwind.config.js" \
        "$PROJECT_ROOT/postcss.config.js" \
        "$BACKUP_DIR/application/"
    
    log_success "Code application sauvegardé"
}

# Sauvegarde des fichiers de configuration
backup_config() {
    log_info "Sauvegarde des configurations..."
    
    # Fichiers de configuration (sans les secrets)
    if [ -f "$PROJECT_ROOT/.env" ]; then
        # Créer une version .env sans les clés secrètes
        grep -v "ANON_KEY\|SERVICE_ROLE\|GEMINI" "$PROJECT_ROOT/.env" > "$BACKUP_DIR/config/.env.template"
        echo "# ATTENTION: Restaurer les clés API manuellement" >> "$BACKUP_DIR/config/.env.template"
    fi
    
    # Copier les autres fichiers de config
    [ -f "$PROJECT_ROOT/.gitignore" ] && cp "$PROJECT_ROOT/.gitignore" "$BACKUP_DIR/config/"
    [ -f "$PROJECT_ROOT/README.md" ] && cp "$PROJECT_ROOT/README.md" "$BACKUP_DIR/config/"
    
    log_success "Configuration sauvegardée"
}

# Créer les logs de sauvegarde
create_backup_logs() {
    log_info "Création des logs de sauvegarde..."
    
    cat > "$BACKUP_DIR/logs/backup-info.txt" << EOF
SAUVEGARDE MINDEASE AI
=====================
Date: $(date)
Type: $1
Utilisateur: $(whoami)
Système: $(uname -a)

CONTENU SAUVEGARDÉ:
- Base de données: Scripts SQL + structure
- Application: Code source complet
- Configuration: Fichiers de config (sans secrets)

POUR RESTAURER:
1. Utiliser restore-system.sh
2. Ou suivre backup/RESTORE-GUIDE.md

TAILLE TOTALE: $(du -sh "$BACKUP_DIR" | cut -f1)
EOF
    
    # État du système
    echo "=== ÉTAT DU SYSTÈME ===" > "$BACKUP_DIR/logs/system-state.txt"
    echo "Processus Node.js:" >> "$BACKUP_DIR/logs/system-state.txt"
    ps aux | grep node >> "$BACKUP_DIR/logs/system-state.txt" 2>/dev/null || echo "Aucun processus Node.js" >> "$BACKUP_DIR/logs/system-state.txt"
    
    echo -e "\nPackages NPM installés:" >> "$BACKUP_DIR/logs/system-state.txt"
    cd "$PROJECT_ROOT" && npm list --depth=0 >> "$BACKUP_DIR/logs/system-state.txt" 2>/dev/null || echo "Erreur npm list" >> "$BACKUP_DIR/logs/system-state.txt"
    
    log_success "Logs créés"
}

# Compresser la sauvegarde
compress_backup() {
    log_info "Compression de la sauvegarde..."
    
    cd "$BACKUP_BASE"
    tar -czf "backup_$TIMESTAMP.tar.gz" "backup_$TIMESTAMP"
    
    if [ $? -eq 0 ]; then
        rm -rf "backup_$TIMESTAMP"
        log_success "Sauvegarde compressée: backup_$TIMESTAMP.tar.gz"
        log_info "Taille: $(du -sh backup_$TIMESTAMP.tar.gz | cut -f1)"
    else
        log_error "Erreur lors de la compression"
        return 1
    fi
}

# Nettoyer les anciennes sauvegardes (garder les 10 dernières)
cleanup_old_backups() {
    log_info "Nettoyage des anciennes sauvegardes..."
    
    cd "$BACKUP_BASE"
    ls -t backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    
    local count=$(ls backup_*.tar.gz 2>/dev/null | wc -l)
    log_success "Sauvegardes conservées: $count"
}

# Menu principal
main() {
    local backup_type="${1:-full}"
    
    echo "======================================="
    echo "🔄 SYSTÈME DE SAUVEGARDE MINDEASE AI"
    echo "======================================="
    
    case $backup_type in
        "full")
            create_backup_structure
            backup_database
            backup_application
            backup_config
            create_backup_logs "full"
            compress_backup
            cleanup_old_backups
            ;;
        "db")
            create_backup_structure
            backup_database
            create_backup_logs "database"
            compress_backup
            ;;
        "code")
            create_backup_structure
            backup_application
            create_backup_logs "application"
            compress_backup
            ;;
        "config")
            create_backup_structure
            backup_config
            create_backup_logs "configuration"
            compress_backup
            ;;
        *)
            echo "Usage: $0 [full|db|code|config]"
            exit 1
            ;;
    esac
    
    echo "======================================="
    echo "✅ SAUVEGARDE TERMINÉE AVEC SUCCÈS"
    echo "📁 Localisation: $BACKUP_BASE/backup_$TIMESTAMP.tar.gz"
    echo "======================================="
}

# Point d'entrée
main "$@"