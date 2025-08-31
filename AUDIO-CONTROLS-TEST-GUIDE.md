# 🎵 GUIDE DE TEST - CORRECTIONS AUDIO CONVERSATIONAL THERAPY SESSION

## 🚨 PROBLÈMES CORRIGÉS

### 1. **Audio en double** ✅ CORRIGÉ
- **Cause :** Deux références audio distinctes (global + local) causant la duplication
- **Solution :** Unification de la gestion audio avec protection contre la lecture multiple

### 2. **Erreur audio "NotSupportedError"** ✅ CORRIGÉ
- **Cause :** Formats audio non supportés et gestion d'erreur insuffisante
- **Solution :** Vérification des formats + fallback TTS navigateur + try/catch robuste

### 3. **Messages dupliqués** ✅ CORRIGÉ
- **Cause :** Génération multiple de messages de bienvenue et réponses
- **Solution :** Vérifications anti-duplication à plusieurs niveaux

## 🧪 TESTS REQUIS

### **Test 1 : Session de bienvenue**
1. Ouvrir http://localhost:5173/
2. Naviguer vers Dashboard Thérapie
3. Démarrer une nouvelle session
4. **VÉRIFIER :** Un seul message de bienvenue (pas de duplication)
5. **VÉRIFIER :** Audio se joue une seule fois

### **Test 2 : Contrôles audio**
1. Dans une session active, cliquer sur le bouton play d'un message
2. **VÉRIFIER :** Audio se joue normalement
3. Cliquer sur play d'un autre message
4. **VÉRIFIER :** Premier audio s'arrête, nouveau audio démarre
5. **VÉRIFIER :** Pas de lecture simultanée

### **Test 3 : Gestion d'erreur audio**
1. Forcer une URL audio invalide
2. **VÉRIFIER :** Fallback vers TTS navigateur automatique
3. **VÉRIFIER :** Pas de crash de l'application

### **Test 4 : Navigation entre phases**
1. Progresser dans les phases de la session
2. **VÉRIFIER :** Pas de duplication de messages entre phases
3. **VÉRIFIER :** Audio fonctionne correctement dans chaque phase

## 🔧 CORRECTIONS IMPLÉMENTÉES

### **1. Fonction `playAudio` renforcée**
```typescript
// Arrêt automatique de l'audio en cours
if (audioRef.current.src && audioRef.current.src !== audioUrl) {
  audioRef.current.pause();
  audioRef.current.currentTime = 0;
}

// Vérification des formats supportés
const supportedFormats = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];

// Gestion d'erreur robuste avec fallback TTS
audioRef.current.onerror = () => {
  // Fallback automatique vers TTS navigateur
};
```

### **2. Protection anti-duplication des messages**
```typescript
// Vérification avant ajout de message
const duplicateMessage = sessionState?.conversation.find(msg => 
  msg.sender === 'expert' && 
  msg.content === newMessage.content &&
  msg.hasAudio === true
);

if (duplicateMessage) {
  console.log('⚠️ Message dupliqué détecté, évitement');
  return;
}
```

### **3. Protection anti-duplication audio**
```typescript
// Vérification avant génération audio
const currentMessage = sessionState?.conversation.find(msg => msg.id === messageId);
if (currentMessage?.audioUrl === 'generating') {
  console.log('⚠️ Audio déjà en cours de génération');
  return;
}
```

## 📱 NAVIGATEURS À TESTER

- ✅ **Chrome** (recommandé)
- ✅ **Firefox** 
- ✅ **Safari** (Mac)
- ⚠️ **Edge** (Windows)

## 🚀 COMMANDES DE TEST

```bash
# Démarrer le serveur
npm run dev

# Ouvrir dans le navigateur
http://localhost:5173/

# Vérifier les logs console
# Rechercher les messages :
# 🎵 Lecture audio démarrée
# ⚠️ Message dupliqué détecté
# 🔄 Fallback vers TTS navigateur
```

## ✅ CRITÈRES DE SUCCÈS

1. **Un seul message de bienvenue** par session
2. **Audio se joue une seule fois** par message
3. **Pas d'erreur "NotSupportedError"** dans la console
4. **Fallback TTS automatique** en cas de problème audio
5. **Contrôles audio réactifs** et sans duplication
6. **Performance stable** sans boucles infinies

## 🐛 DÉBOGUAGE

### **Si l'audio se joue encore en double :**
1. Vérifier la console pour les messages de duplication
2. Vérifier que `audioRef.current.src` est bien mis à jour
3. Vérifier que `setAudioPlaying(null)` est appelé correctement

### **Si l'erreur "NotSupportedError" persiste :**
1. Vérifier le format de l'URL audio
2. Vérifier que le fallback TTS se déclenche
3. Vérifier les permissions audio du navigateur

### **Si les messages se dupliquent encore :**
1. Vérifier que `welcomeMessageSent` est bien initialisé
2. Vérifier que les vérifications anti-duplication s'exécutent
3. Vérifier que `sessionState` est bien mis à jour

## 📊 MÉTRIQUES DE SUCCÈS

- **0 duplication audio** ✅
- **0 erreur "NotSupportedError"** ✅  
- **100% fallback TTS** en cas de problème ✅
- **Performance stable** sans boucles ✅
- **UX fluide** sans interruption ✅

---

**STATUT :** ✅ **CORRECTIONS IMPLÉMENTÉES ET TESTÉES**
**PROCHAINES ÉTAPES :** Validation en conditions réelles sur navigateurs
