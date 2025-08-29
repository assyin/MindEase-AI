#!/bin/bash

# =============================================================================
# MindEase AI - Script de Restauration
# =============================================================================

# Configuration
BACKUP_DIR="/home/assyin/MindEase-IA/backup/automated"
PROJECT_DIR="/home/assyin/MindEase-IA"
RESTORE_DIR="/tmp/mindease_restore"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonctions de log
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Vérifier les paramètres
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup-file.tar.gz> [--force]"
    echo ""
    echo "Exemples:"
    echo "  $0 mindease_db_backup_20241228_143022.tar.gz"
    echo "  $0 mindease_db_backup_20241228_143022.tar.gz --force"
    echo ""
    echo "Options:"
    echo "  --force    Forcer la restauration sans confirmation"
    echo ""
    echo "Backups disponibles:"
    ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -5
    exit 1
fi

BACKUP_FILE="$1"
FORCE_MODE="$2"

# Vérifier que le fichier de backup existe
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ] && [ ! -f "$BACKUP_FILE" ]; then
    error "Fichier de backup non trouvé: $BACKUP_FILE"
    error "Vérifiez dans: $BACKUP_DIR/"
    exit 1
fi

# Déterminer le chemin complet du backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    FULL_BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
else
    FULL_BACKUP_PATH="$BACKUP_FILE"
fi

log "Début de la restauration de MindEase AI..."
log "Fichier de backup: $FULL_BACKUP_PATH"

# Confirmation si pas en mode force
if [ "$FORCE_MODE" != "--force" ]; then
    echo ""
    warning "⚠️  ATTENTION: Cette opération va écraser la configuration actuelle!"
    warning "⚠️  Assurez-vous d'avoir une sauvegarde récente avant de continuer."
    echo ""
    read -p "Voulez-vous continuer? (oui/non): " -r
    if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]] && [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]] && [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Restauration annulée par l'utilisateur."
        exit 0
    fi
fi

# Créer le répertoire de restauration temporaire
log "Préparation de l'espace de travail..."
rm -rf "$RESTORE_DIR"
mkdir -p "$RESTORE_DIR"

# Extraire le backup
log "Extraction du backup..."
cd "$RESTORE_DIR"
tar -xzf "$FULL_BACKUP_PATH"

if [ $? -ne 0 ]; then
    error "Erreur lors de l'extraction du backup"
    exit 1
fi

# Trouver le répertoire extrait
EXTRACTED_DIR=$(find "$RESTORE_DIR" -maxdepth 1 -type d -name "mindease_db_backup_*" | head -1)

if [ -z "$EXTRACTED_DIR" ]; then
    error "Répertoire de backup non trouvé après extraction"
    exit 1
fi

log "Backup extrait dans: $EXTRACTED_DIR"

# Lire les métadonnées
if [ -f "$EXTRACTED_DIR/backup-metadata.json" ]; then
    log "Lecture des métadonnées du backup..."
    BACKUP_DATE=$(grep '"backup_date"' "$EXTRACTED_DIR/backup-metadata.json" | cut -d'"' -f4)
    BACKUP_TYPE=$(grep '"backup_type"' "$EXTRACTED_DIR/backup-metadata.json" | cut -d'"' -f4)
    log "Date du backup: $BACKUP_DATE"
    log "Type de backup: $BACKUP_TYPE"
else
    warning "Métadonnées du backup non trouvées"
fi

# Créer un backup de sauvegarde de l'état actuel
log "Création d'un backup de sauvegarde de l'état actuel..."
SAFETY_BACKUP="$BACKUP_DIR/safety_backup_$(date +"%Y%m%d_%H%M%S")"
mkdir -p "$SAFETY_BACKUP"
cp "$PROJECT_DIR/.env" "$SAFETY_BACKUP/" 2>/dev/null || true
cp "$PROJECT_DIR/package.json" "$SAFETY_BACKUP/" 2>/dev/null || true
cp "$PROJECT_DIR/vite.config.ts" "$SAFETY_BACKUP/" 2>/dev/null || true

# Arrêter les services en cours (si applicable)
log "Arrêt des services..."
pkill -f "vite" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Restaurer les fichiers de configuration
log "Restauration des fichiers de configuration..."
if [ -f "$EXTRACTED_DIR/env-backup" ]; then
    cp "$EXTRACTED_DIR/env-backup" "$PROJECT_DIR/.env"
    success "Fichier .env restauré"
else
    warning "Fichier .env non trouvé dans le backup"
fi

if [ -f "$EXTRACTED_DIR/package.json" ]; then
    cp "$EXTRACTED_DIR/package.json" "$PROJECT_DIR/"
    success "package.json restauré"
fi

if [ -f "$EXTRACTED_DIR/vite.config.ts" ]; then
    cp "$EXTRACTED_DIR/vite.config.ts" "$PROJECT_DIR/"
    success "vite.config.ts restauré"
fi

# Restaurer le code source
if [ -d "$EXTRACTED_DIR/src" ]; then
    log "Restauration du code source critique..."
    
    # Backup des fichiers actuels
    mkdir -p "$SAFETY_BACKUP/src"
    cp -r "$PROJECT_DIR/src/services" "$SAFETY_BACKUP/src/" 2>/dev/null || true
    cp -r "$PROJECT_DIR/src/types" "$SAFETY_BACKUP/src/" 2>/dev/null || true
    cp -r "$PROJECT_DIR/src/contexts" "$SAFETY_BACKUP/src/" 2>/dev/null || true
    
    # Restaurer
    cp -r "$EXTRACTED_DIR/src/services" "$PROJECT_DIR/src/" 2>/dev/null && success "Services restaurés"
    cp -r "$EXTRACTED_DIR/src/types" "$PROJECT_DIR/src/" 2>/dev/null && success "Types restaurés"
    cp -r "$EXTRACTED_DIR/src/contexts" "$PROJECT_DIR/src/" 2>/dev/null && success "Contexts restaurés"
fi

# Restaurer le schéma de base de données
if [ -f "$EXTRACTED_DIR/schema.sql" ]; then
    log "Schéma de base de données disponible pour restauration manuelle"
    cp "$EXTRACTED_DIR/schema.sql" "$PROJECT_DIR/restored-schema.sql"
    warning "⚠️  Le schéma de base de données a été copié vers: restored-schema.sql"
    warning "⚠️  Vous devez l'appliquer manuellement dans Supabase si nécessaire"
fi

# Restaurer les données (si disponible)
if [ -f "$EXTRACTED_DIR/export-data.js" ]; then
    log "Script d'export de données trouvé"
    cp "$EXTRACTED_DIR/export-data.js" "$PROJECT_DIR/restore-data.js"
    warning "⚠️  Script de données copié vers: restore-data.js"
fi

# Réinstaller les dépendances
log "Réinstallation des dépendances..."
cd "$PROJECT_DIR"
npm install --silent

if [ $? -eq 0 ]; then
    success "Dépendances réinstallées avec succès"
else
    error "Erreur lors de l'installation des dépendances"
fi

# Nettoyer les fichiers temporaires
log "Nettoyage des fichiers temporaires..."
rm -rf "$RESTORE_DIR"

# Résumé de la restauration
echo ""
echo "========================================="
echo "    RESTAURATION MINDEASE AI TERMINÉE"
echo "========================================="
echo "✅ Fichiers de configuration restaurés"
echo "✅ Code source critique restauré"  
echo "✅ Dépendances réinstallées"
echo ""
echo "📁 Backup de sécurité: $SAFETY_BACKUP"
echo "📝 Schéma DB: restored-schema.sql (à appliquer manuellement)"
echo ""
echo "⚠️  ACTIONS MANUELLES REQUISES:"
echo "1. Vérifiez les variables d'environnement dans .env"
echo "2. Appliquez le schéma DB dans Supabase si nécessaire"
echo "3. Testez l'application: npm run dev"
echo ""
echo "🚀 Pour démarrer: cd $PROJECT_DIR && npm run dev"
echo "========================================="

success "Restauration terminée avec succès!"