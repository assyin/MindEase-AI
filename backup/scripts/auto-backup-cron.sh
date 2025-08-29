#!/bin/bash

# =============================================================================
# MindEase AI - Script de Sauvegarde Automatique (Cron)
# =============================================================================

# Ce script est conçu pour être exécuté via cron pour des sauvegardes automatiques

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.sh"
LOG_FILE="/home/assyin/MindEase-IA/backup/automated/backup-cron.log"
MAX_LOG_SIZE=10485760  # 10MB

# Fonction de log avec timestamp
log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Rotation du log si trop volumineux
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "${LOG_FILE}.old"
    log_message "Log rotation effectuée"
fi

log_message "🚀 Démarrage de la sauvegarde automatique"

# Vérifier que le script de backup existe
if [ ! -f "$BACKUP_SCRIPT" ]; then
    log_message "❌ ERREUR: Script de backup non trouvé: $BACKUP_SCRIPT"
    exit 1
fi

# Exécuter la sauvegarde et capturer la sortie
log_message "📦 Exécution de la sauvegarde..."
if "$BACKUP_SCRIPT" >> "$LOG_FILE" 2>&1; then
    log_message "✅ Sauvegarde automatique terminée avec succès"
else
    log_message "❌ ERREUR: Échec de la sauvegarde automatique"
    exit 1
fi

# Vérifier l'espace disque disponible
DISK_USAGE=$(df -h /home/assyin/MindEase-IA/backup | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    log_message "⚠️  ATTENTION: Espace disque faible ($DISK_USAGE% utilisé)"
fi

log_message "🏁 Fin de la sauvegarde automatique"
echo "" >> "$LOG_FILE"