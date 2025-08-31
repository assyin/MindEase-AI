#!/bin/bash
# MindEase AI - Système de Restauration Complet
# =============================================
# Usage: ./restore-system.sh <backup_file.tar.gz> [full|db|code|config]

set -e

# Configuration
BACKUP_BASE="/home/jirosak/MindEase-AI/backup"
PROJECT_ROOT="/home/jirosak/MindEase-AI"
TEMP_DIR="/tmp/mindease_restore_$$"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    if [ "$EUID" -eq 0 ]; then
        log_error "Ne pas exécuter en tant que root"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        log_error "Fichier de sauvegarde non trouvé: $1"
        exit 1
    fi
    
    log_success "Prérequis validés"
}

# Extraire la sauvegarde
extract_backup() {
    local backup_file="$1"
    
    log_info "Extraction de la sauvegarde..."
    
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    tar -xzf "$backup_file"
    
    # Trouver le dossier de sauvegarde
    BACKUP_FOLDER=$(ls -d backup_* | head -n 1)
    
    if [ -z "$BACKUP_FOLDER" ]; then
        log_error "Structure de sauvegarde invalide"
        cleanup_temp
        exit 1
    fi
    
    log_success "Sauvegarde extraite: $TEMP_DIR/$BACKUP_FOLDER"
}

# Créer une sauvegarde de sécurité avant restauration
create_safety_backup() {
    log_info "Création d'une sauvegarde de sécurité..."
    
    local safety_backup="$BACKUP_BASE/safety_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    cd "$PROJECT_ROOT/.."
    tar -czf "$safety_backup" \
        --exclude="MindEase-AI/node_modules" \
        --exclude="MindEase-AI/.git" \
        --exclude="MindEase-AI/dist" \
        --exclude="MindEase-AI/backup" \
        "MindEase-AI"
    
    log_success "Sauvegarde de sécurité créée: $safety_backup"
}

# Arrêter les services en cours
stop_services() {
    log_info "Arrêt des services..."
    
    # Tuer les processus Node.js du projet
    pkill -f "vite.*mindease" || true
    pkill -f "npm.*dev" || true
    
    sleep 2
    log_success "Services arrêtés"
}

# Restaurer la base de données
restore_database() {
    log_info "Restauration de la base de données..."
    
    local db_backup_dir="$TEMP_DIR/$BACKUP_FOLDER/database"
    
    if [ ! -d "$db_backup_dir" ]; then
        log_error "Sauvegarde de base de données non trouvée"
        return 1
    fi
    
    # Copier les scripts SQL
    cp -r "$db_backup_dir"/* "$PROJECT_ROOT/database/"
    
    log_warning "MANUEL REQUIS: Exécuter les scripts suivants dans Supabase SQL Editor:"
    echo "1. $PROJECT_ROOT/database/schema.sql"
    echo "2. $PROJECT_ROOT/database/rls-policies.sql"
    echo "3. $PROJECT_ROOT/database/restore-data.sql (si données à restaurer)"
    
    log_success "Scripts de base de données restaurés"
}

# Restaurer le code application
restore_application() {
    log_info "Restauration du code application..."
    
    local app_backup_dir="$TEMP_DIR/$BACKUP_FOLDER/application"
    
    if [ ! -d "$app_backup_dir" ]; then
        log_error "Sauvegarde d'application non trouvée"
        return 1
    fi
    
    # Sauvegarder node_modules s'il existe
    local node_modules_backup=""
    if [ -d "$PROJECT_ROOT/node_modules" ]; then
        node_modules_backup="/tmp/node_modules_backup_$$"
        mv "$PROJECT_ROOT/node_modules" "$node_modules_backup"
    fi
    
    # Restaurer les fichiers
    rsync -av "$app_backup_dir"/ "$PROJECT_ROOT/"
    
    # Restaurer node_modules si existant
    if [ -n "$node_modules_backup" ] && [ -d "$node_modules_backup" ]; then
        mv "$node_modules_backup" "$PROJECT_ROOT/node_modules"
        log_info "node_modules restauré depuis la sauvegarde locale"
    fi
    
    log_success "Code application restauré"
}

# Restaurer la configuration
restore_config() {
    log_info "Restauration de la configuration..."
    
    local config_backup_dir="$TEMP_DIR/$BACKUP_FOLDER/config"
    
    if [ ! -d "$config_backup_dir" ]; then
        log_error "Sauvegarde de configuration non trouvée"
        return 1
    fi
    
    # Restaurer les fichiers de config (sauf .env)
    [ -f "$config_backup_dir/.gitignore" ] && cp "$config_backup_dir/.gitignore" "$PROJECT_ROOT/"
    [ -f "$config_backup_dir/README.md" ] && cp "$config_backup_dir/README.md" "$PROJECT_ROOT/"
    
    # Pour .env, montrer le template
    if [ -f "$config_backup_dir/.env.template" ]; then
        log_warning "Template .env disponible dans $config_backup_dir/.env.template"
        log_warning "MANUEL REQUIS: Reconfigurer les clés API dans $PROJECT_ROOT/.env"
    fi
    
    log_success "Configuration restaurée"
}

# Réinstaller les dépendances
reinstall_dependencies() {
    log_info "Réinstallation des dépendances..."
    
    cd "$PROJECT_ROOT"
    
    if [ -f "package.json" ]; then
        npm install
        log_success "Dépendances NPM installées"
    else
        log_error "package.json non trouvé"
        return 1
    fi
}

# Valider la restauration
validate_restoration() {
    log_info "Validation de la restauration..."
    
    local errors=0
    
    # Vérifier les fichiers critiques
    [ ! -f "$PROJECT_ROOT/package.json" ] && log_error "package.json manquant" && errors=$((errors + 1))
    [ ! -f "$PROJECT_ROOT/index.html" ] && log_error "index.html manquant" && errors=$((errors + 1))
    [ ! -d "$PROJECT_ROOT/src" ] && log_error "Dossier src manquant" && errors=$((errors + 1))
    [ ! -d "$PROJECT_ROOT/database" ] && log_error "Dossier database manquant" && errors=$((errors + 1))
    
    # Vérifier la structure src/
    [ ! -d "$PROJECT_ROOT/src/components" ] && log_error "src/components manquant" && errors=$((errors + 1))
    [ ! -d "$PROJECT_ROOT/src/services" ] && log_error "src/services manquant" && errors=$((errors + 1))
    
    if [ $errors -eq 0 ]; then
        log_success "Validation réussie"
        return 0
    else
        log_error "$errors erreur(s) de validation"
        return 1
    fi
}

# Nettoyer les fichiers temporaires
cleanup_temp() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

# Démarrer les services
start_services() {
    log_info "Démarrage des services..."
    
    cd "$PROJECT_ROOT"
    
    # Démarrer en arrière-plan
    nohup npm run dev > /dev/null 2>&1 &
    
    sleep 3
    
    if pgrep -f "vite.*mindease" > /dev/null; then
        log_success "Serveur de développement démarré"
        log_info "Application disponible sur http://localhost:5173/ ou http://localhost:5174/"
    else
        log_error "Échec du démarrage automatique"
        log_info "Démarrer manuellement avec: npm run dev"
    fi
}

# Afficher le rapport de restauration
show_restoration_report() {
    local backup_info_file="$TEMP_DIR/$BACKUP_FOLDER/logs/backup-info.txt"
    
    echo "======================================="
    echo "📋 RAPPORT DE RESTAURATION"
    echo "======================================="
    
    if [ -f "$backup_info_file" ]; then
        echo "INFORMATIONS DE LA SAUVEGARDE:"
        cat "$backup_info_file"
        echo ""
    fi
    
    echo "ÉTAT POST-RESTAURATION:"
    echo "- Projet: $PROJECT_ROOT"
    echo "- Services: $(pgrep -f "vite.*mindease" > /dev/null && echo "✅ Démarrés" || echo "❌ Arrêtés")"
    echo "- Base de données: ⚠️  Vérification manuelle requise"
    echo ""
    
    echo "ACTIONS MANUELLES REQUISES:"
    echo "1. Configurer les clés API dans .env"
    echo "2. Exécuter les scripts SQL dans Supabase"
    echo "3. Tester l'application sur http://localhost:5173/"
    echo "======================================="
}

# Menu principal
main() {
    local backup_file="$1"
    local restore_type="${2:-full}"
    
    if [ -z "$backup_file" ]; then
        echo "Usage: $0 <backup_file.tar.gz> [full|db|code|config]"
        echo ""
        echo "Sauvegardes disponibles:"
        ls -la "$BACKUP_BASE"/backup_*.tar.gz 2>/dev/null | tail -5 || echo "Aucune sauvegarde trouvée"
        exit 1
    fi
    
    echo "======================================="
    echo "🔄 SYSTÈME DE RESTAURATION MINDEASE AI"
    echo "======================================="
    
    check_prerequisites "$backup_file"
    extract_backup "$backup_file"
    
    # Demander confirmation
    echo ""
    log_warning "ATTENTION: Cette opération va modifier votre système"
    echo "Sauvegarde à restaurer: $backup_file"
    echo "Type de restauration: $restore_type"
    read -p "Continuer? (oui/non): " confirm
    
    if [ "$confirm" != "oui" ] && [ "$confirm" != "o" ]; then
        log_info "Restauration annulée"
        cleanup_temp
        exit 0
    fi
    
    create_safety_backup
    stop_services
    
    case $restore_type in
        "full")
            restore_database
            restore_application
            restore_config
            reinstall_dependencies
            validate_restoration
            start_services
            ;;
        "db")
            restore_database
            ;;
        "code")
            restore_application
            reinstall_dependencies
            validate_restoration
            start_services
            ;;
        "config")
            restore_config
            ;;
        *)
            log_error "Type de restauration invalide: $restore_type"
            cleanup_temp
            exit 1
            ;;
    esac
    
    show_restoration_report
    cleanup_temp
    
    echo "======================================="
    echo "✅ RESTAURATION TERMINÉE"
    echo "======================================="
}

# Gestion des signaux pour cleanup
trap cleanup_temp EXIT INT TERM

# Point d'entrée
main "$@"