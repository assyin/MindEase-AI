# 🇲🇦 Guide de Test Rapide - Darija Marocaine

## 🚀 **Comment Tester la Fonctionnalité Darija en 3 Étapes**

### **Étape 1: Accéder au Test Darija**
1. **Ouvrir l'application** : `npm run dev`
2. **Se connecter** avec votre compte
3. **Cliquer sur l'onglet** `🇲🇦 Test Darija` dans le header

### **Étape 2: Basculer en Arabe**
**Option A - Boutons Rapides (Header):**
- Cliquer sur `🇲🇦 AR` dans le header pour basculer instantanément

**Option B - Interface de Test:**
- Dans la page Test Darija, cliquer sur `🇲🇦 العربية`
- L'interface devient automatiquement RTL (droite vers gauche)

### **Étape 3: Tester les Voix Marocaines**

#### **🎯 Test avec Phrases Prédéfinies**
1. **Choisir un avatar marocain** :
   - 👩‍⚕️ **Dr. Aicha Benali** (Thérapeute)
   - 💪 **Ahmed Chraibi** (Coach) 
   - 🌙 **Lalla Fatima Zahra** (Méditation)
   - 📈 **Dr. Youssef El-Fassi** (Analyste)

2. **Cliquer ▶️** sur une phrase darija
3. **Écouter** la voix Google Gemini TTS avec accent marocain authentique

#### **✍️ Test avec Votre Propre Texte**
1. **Écrire dans la zone de texte** :
   ```
   كيفاش الصحة؟ واخا نتكلمو؟
   ```
2. **Ou utiliser le micro 🎤** pour enregistrement vocal
3. **Cliquer Send ➤** pour générer l'audio

---

## 🎭 **Phrases Test Recommandées**

### **Salutations & Conversation**
- `السلام عليكم، كيفاش الصحة؟` (Salut, comment ça va ?)
- `أهلان صاحبي، واخا نشوفو؟` (Salut mon ami, on se voit ?)
- `بسلامة، نشوفك غدا إن شاء الله` (Au revoir, à demain si Dieu veut)

### **Expressions Thérapeutiques**
- `ما تخافش، أنا هنا معك` (N'aie pas peur, je suis là)
- `قوليلي أكثر على هاد الموضوع` (Dis-moi en plus sur ce sujet)
- `الله يعطيك الصحة، راك قادر` (Courage, tu es capable)

### **Coaching & Motivation**
- `واخا تبدل أحلامك لواقع؟` (Tu veux réaliser tes rêves ?)
- `غادي نديرو شي حاجة زوينة بجوج` (On va faire quelque chose de bien ensemble)
- `راك قد المسؤولية، بالتوفيق!` (Tu es à la hauteur, bonne chance !)

---

## 🔧 **Vérifications Techniques**

### **✅ Fonctionnalités à Tester**

#### **Interface RTL**
- [x] Texte aligné à droite
- [x] Interface miroir (boutons inversés)
- [x] Polices arabes chargées (Amiri, Noto Sans Arabic)

#### **Voix Gemini TTS**
- [x] 4 voix distinctes par avatar
- [x] Accent marocain authentique
- [x] Qualité audio claire
- [x] Pas de latence excessive

#### **Basculement Linguistique**
- [x] FR ↔ AR instantané
- [x] Persistance préférences
- [x] RTL automatique
- [x] Textes localisés

#### **Avatars Culturels**
- [x] Dr. Aicha - Voix empathique `umbriel`
- [x] Ahmed - Voix énergique `algenib`  
- [x] Lalla Fatima - Voix douce `despina`
- [x] Dr. Youssef - Voix professionnelle `iapetus`

---

## 🚨 **Dépannage**

### **Problème: Pas de Son**
**Solution :**
1. Vérifier que le volume système est activé
2. Cliquer sur la page pour activer l'audio (politique navigateur)
3. Ouvrir Console (F12) pour voir les erreurs TTS

### **Problème: Interface Pas en RTL**
**Solution :**
1. Rafraîchir la page après basculement langue
2. Vider cache navigateur si nécessaire
3. Vérifier que le CSS RTL est chargé

### **Problème: Erreur Google Gemini TTS**
**Solution :**
1. Vérifier clé API dans `.env`
2. Console montrera fallback vers Web Speech API
3. Quota Gemini peut-être atteint (fallback automatique)

### **Problème: Reconnaissance Vocale**
**Solution :**
1. Utiliser Chrome/Edge (meilleur support)
2. Accepter permissions microphone
3. Parler clairement en darija

---

## 🎯 **Résultats Attendus**

### **✅ Test Réussi Si:**
- **Voix différentes** pour chaque avatar
- **Accent marocain** reconnaissable  
- **Interface RTL** parfaite
- **Basculement FR ↔ AR** fluide
- **Audio de qualité** sans coupures

### **🎊 Exemple Parfait:**
1. Basculer vers `🇲🇦 AR`
2. Sélectionner **Ahmed Chraibi** 💪
3. Taper : `أهلان صاحبي! واخا تحقق أحلامك؟`
4. Écouter voix **énergique masculine** avec accent marocain authentique
5. Interface parfaitement RTL avec textes arabes

---

## 📞 **Support**

**Console Browser (F12)** pour logs détaillés :
- `🧪 Testing Darija: "phrase" with avatar: avatarId`  
- `✅ Darija audio played successfully`
- `❌ Error playing Darija phrase: [error]`

**Fallback Automatique :**
- Si Google Gemini TTS échoue → Web Speech API
- Messages console explicites pour debugging

---

## 🇲🇦 **Message Final en Darija**

**"مرحبا بكم في تجربة MindEase AI المغربية الأصيلة! استمتعوا بالأصوات الطبيعية والثقافة المحلية. الله يعطيكم الصحة!"**

*"Bienvenue dans l'expérience authentique MindEase AI marocaine ! Profitez des voix naturelles et de la culture locale. Bonne chance !"*