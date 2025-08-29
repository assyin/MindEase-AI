#!/bin/bash

# =============================================================================
# MindEase AI - Validation du Système de Sauvegarde
# =============================================================================

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✅${NC} $1"; }
error() { echo -e "${RED}❌${NC} $1"; }
warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
info() { echo -e "${BLUE}ℹ️${NC} $1"; }

echo "🔍 Validation du Système de Sauvegarde MindEase AI"
echo "================================================="

ERRORS=0

# 1. Vérifier la structure des répertoires
info "Vérification de la structure des répertoires..."
REQUIRED_DIRS=("backup/automated" "backup/manual" "backup/scripts" "backup/restore")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        success "Répertoire présent: $dir"
    else
        error "Répertoire manquant: $dir"
        ((ERRORS++))
    fi
done

# 2. Vérifier les scripts principaux
info "Vérification des scripts de sauvegarde..."
REQUIRED_SCRIPTS=("backup-database.sh" "restore-backup.sh" "auto-backup-cron.sh" "quick-setup.sh")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    SCRIPT_PATH="backup/scripts/$script"
    if [ -f "$SCRIPT_PATH" ]; then
        if [ -x "$SCRIPT_PATH" ]; then
            success "Script OK: $script (exécutable)"
        else
            warning "Script présent mais non exécutable: $script"
            chmod +x "$SCRIPT_PATH"
            success "Permissions corrigées pour: $script"
        fi
    else
        error "Script manquant: $script"
        ((ERRORS++))
    fi
done

# 3. Vérifier les fichiers de documentation
info "Vérification de la documentation..."
REQUIRED_DOCS=("backup/GUIDE_BACKUP.md" "backup/README.md" "backup/manual/manual-backup-checklist.md")
for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        success "Documentation présente: $doc"
    else
        error "Documentation manquante: $doc"
        ((ERRORS++))
    fi
done

# 4. Vérifier les variables d'environnement
info "Vérification des variables d'environnement..."
if [ -f ".env" ]; then
    success "Fichier .env présent"
    
    # Vérifier les variables critiques
    if grep -q "VITE_SUPABASE_URL" .env; then
        success "Variable VITE_SUPABASE_URL configurée"
    else
        warning "Variable VITE_SUPABASE_URL manquante"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        success "Variable VITE_SUPABASE_ANON_KEY configurée"
    else
        warning "Variable VITE_SUPABASE_ANON_KEY manquante"
    fi
else
    error "Fichier .env manquant"
    ((ERRORS++))
fi

# 5. Test de la sauvegarde
info "Test d'une sauvegarde rapide..."
if bash backup/scripts/backup-database.sh > /tmp/backup-test.log 2>&1; then
    success "Test de sauvegarde réussi"
    
    # Vérifier que le fichier de sauvegarde a été créé
    LATEST_BACKUP=$(ls -t backup/automated/*.tar.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
        success "Dernier backup: $(basename "$LATEST_BACKUP") ($BACKUP_SIZE)"
    else
        error "Aucun fichier de sauvegarde trouvé"
        ((ERRORS++))
    fi
else
    error "Test de sauvegarde échoué"
    cat /tmp/backup-test.log
    ((ERRORS++))
fi

# 6. Vérifier l'espace disque
info "Vérification de l'espace disque..."
DISK_USAGE=$(df backup/ | tail -1 | awk '{print $5}' | sed 's/%//')
AVAILABLE_SPACE=$(df -h backup/ | tail -1 | awk '{print $4}')
if [ "$DISK_USAGE" -lt 90 ]; then
    success "Espace disque suffisant (${DISK_USAGE}% utilisé, ${AVAILABLE_SPACE} disponible)"
else
    warning "Espace disque faible (${DISK_USAGE}% utilisé)"
fi

# 7. Vérifier la configuration cron (optionnelle)
info "Vérification de la configuration cron..."
if crontab -l 2>/dev/null | grep -q "auto-backup-cron.sh"; then
    success "Tâche cron configurée pour sauvegarde automatique"
    CRON_ENTRY=$(crontab -l 2>/dev/null | grep "auto-backup-cron.sh")
    info "Planification: $CRON_ENTRY"
else
    warning "Sauvegarde automatique non configurée (optionnel)"
    info "Pour configurer: echo '0 2 * * * $(pwd)/backup/scripts/auto-backup-cron.sh' | crontab -"
fi

# 8. Résumé final
echo ""
echo "📊 RÉSUMÉ DE LA VALIDATION"
echo "=========================="

if [ $ERRORS -eq 0 ]; then
    success "🎉 Système de sauvegarde complètement opérationnel!"
else
    error "⚠️  $ERRORS erreur(s) détectée(s) - Correction requise"
fi

echo ""
echo "📈 STATISTIQUES:"
BACKUP_COUNT=$(ls backup/automated/*.tar.gz 2>/dev/null | wc -l)
if [ $BACKUP_COUNT -gt 0 ]; then
    TOTAL_SIZE=$(du -sh backup/automated/ | cut -f1)
    echo "   • Nombre de sauvegardes: $BACKUP_COUNT"
    echo "   • Taille totale: $TOTAL_SIZE"
    echo "   • Dernier backup: $(ls -t backup/automated/*.tar.gz | head -1 | xargs basename)"
else
    echo "   • Aucune sauvegarde trouvée"
fi

echo ""
echo "🔧 COMMANDES DE TEST:"
echo "   • Sauvegarde manuelle: ./backup/scripts/backup-database.sh"
echo "   • Lister les backups:  ls -la backup/automated/"
echo "   • Test de restauration: ./backup/scripts/restore-backup.sh FICHIER.tar.gz"
echo ""

# Nettoyage
rm -f /tmp/backup-test.log

exit $ERRORS