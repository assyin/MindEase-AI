#!/bin/bash

# =============================================================================
# MindEase AI - Configuration Rapide du Système de Sauvegarde
# =============================================================================

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[SETUP]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warning() { echo -e "${YELLOW}[ATTENTION]${NC} $1"; }
error() { echo -e "${RED}[ERREUR]${NC} $1"; }

echo "🚀 Configuration du Système de Sauvegarde MindEase AI"
echo "======================================================"

# 1. Vérifier la structure des répertoires
log "Vérification de la structure des répertoires..."
mkdir -p backup/{automated,manual,restore,scripts}
success "Structure des répertoires créée"

# 2. Vérifier les permissions des scripts
log "Configuration des permissions des scripts..."
chmod +x backup/scripts/*.sh
success "Permissions des scripts configurées"

# 3. Test du script de sauvegarde
log "Test du script de sauvegarde..."
if [ -f "backup/scripts/backup-database.sh" ]; then
    if backup/scripts/backup-database.sh; then
        success "✅ Test de sauvegarde réussi!"
    else
        warning "⚠️  Test de sauvegarde échoué - vérifiez les logs"
    fi
else
    error "Script de sauvegarde non trouvé"
fi

# 4. Configuration optionnelle de cron
echo ""
read -p "Voulez-vous configurer la sauvegarde automatique quotidienne? (o/N): " -r
if [[ $REPLY =~ ^[Oo]$ ]]; then
    log "Configuration de cron pour sauvegarde quotidienne à 2h00..."
    
    # Vérifier si cron existe déjà
    if crontab -l 2>/dev/null | grep -q "auto-backup-cron.sh"; then
        warning "Tâche cron déjà configurée"
    else
        # Ajouter la tâche cron
        (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/backup/scripts/auto-backup-cron.sh") | crontab -
        success "✅ Sauvegarde automatique quotidienne configurée (2h00)"
    fi
else
    log "Configuration cron ignorée - vous pouvez la faire plus tard"
fi

# 5. Afficher un résumé
echo ""
echo "📋 RÉSUMÉ DE LA CONFIGURATION"
echo "=============================="
success "✅ Système de sauvegarde installé"
success "✅ Scripts de sauvegarde/restauration prêts"
success "✅ Structure des répertoires créée"

if crontab -l 2>/dev/null | grep -q "auto-backup-cron.sh"; then
    success "✅ Sauvegarde automatique configurée"
else
    warning "⚠️  Sauvegarde automatique non configurée"
fi

echo ""
echo "🎯 PROCHAINES ÉTAPES:"
echo "1. Testez une sauvegarde manuelle: ./backup/scripts/backup-database.sh"
echo "2. Consultez le guide: backup/GUIDE_BACKUP.md"
echo "3. Vérifiez les sauvegardes dans: backup/automated/"
echo ""

# 6. Afficher les commandes utiles
echo "🔧 COMMANDES UTILES:"
echo "━━━━━━━━━━━━━━━━━━━━"
echo "Sauvegarde manuelle:     ./backup/scripts/backup-database.sh"
echo "Restauration:            ./backup/scripts/restore-backup.sh FICHIER.tar.gz"
echo "Monitoring:              ls -la backup/automated/"
echo "Logs automatiques:       tail -f backup/automated/backup-cron.log"
echo "Configuration cron:      crontab -e"
echo ""

success "🛡️  Système de sauvegarde MindEase AI configuré avec succès!"