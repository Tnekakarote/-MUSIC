# 𝐊𝟒𝐊𝐀𝐊𝐀𝐑𝐎𝐓𝐄 • MUSIC

> **Lecteur audio local haute-fidélité bit-perfect pour Windows**  
> Version 0.1.0 • Développé avec Electron + React TypeScript

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-blue.svg)
![Audio](https://img.shields.io/badge/audio-bit--perfect%2032bit%2F192kHz-red.svg)

## 🎵 Caractéristiques Principales

### Audio Haute-Fidélité
- **Lecture bit-perfect** jusqu'à 32-bit / 192 kHz
- **WASAPI Exclusif** avec indicateur temps réel
- **Support ASIO** (optionnel) pour latence ultra-faible
- **Aucun rééchantillonnage** en mode bit-perfect
- **Moteur audio optimisé** avec threading séparé

### Formats Supportés
- **Lossless**: FLAC, ALAC (Apple Lossless), WavPack, WAV
- **Lossy haute qualité**: MP3 320kbps, AAC
- **Décodage natif** via FFmpeg/libavcodec
- **Métadonnées complètes** avec artwork

### Interface Utilisateur
- **Design sombre moderne** avec palette K4KAKAROTE
- **Couleurs**: Noir (`#000000`) + Vert néon (`#00FF84`)
- **Typographie**: Montserrat (UI) + Orbitron (titres)
- **Animations subtiles** avec glow effects
- **Accessibilité** : contraste >4.5, navigation clavier

### Fonctionnalités Avancées
- **Lecture gapless** sans interruption
- **Crossfade configurable** entre pistes
- **Égaliseur** graphique 10 bandes
- **Gestion de playlists** locale
- **Scan automatique** de bibliothèque
- **Base de données SQLite** pour indexation rapide

## 🚀 Installation et Démarrage Rapide

### Prérequis
- **Windows 10/11** (x64)
- **Node.js 18+** et npm
- **Visual Studio Build Tools** (pour modules natifs)
- **Python 3.x** (pour node-gyp)

### Installation
```bash
# Cloner le repository
git clone https://github.com/k4kakarote/music-player.git
cd k4kakarote-music

# Installer les dépendances
npm install

# Générer les fichiers de test audio
npm run generate-test-files

# Démarrer en développement
npm run dev
```

### Construction Production
```bash
# Build complet
npm run build

# Créer l'installateur Windows
npm run dist:win

# Test du package
npm run pack
```

## 🏗️ Architecture du Projet

```
k4kakarote-music/
├── src/
│   ├── main/                 # Processus principal Electron
│   │   ├── main.ts          # Point d'entrée principal
│   │   ├── audio-engine.ts  # Moteur audio bit-perfect
│   │   ├── database.ts      # Gestionnaire SQLite
│   │   └── preload.ts       # Script preload sécurisé
│   ├── renderer/            # Interface React
│   │   ├── components/      # Composants UI
│   │   ├── hooks/          # Hooks React personnalisés
│   │   ├── styles/         # Styles CSS/SCSS
│   │   └── index.tsx       # Point d'entrée renderer
│   └── native/             # Modules natifs (WASAPI/ASIO)
├── assets/
│   ├── test-files/         # Fichiers de test audio
│   ├── icons/              # Icônes application
│   └── fonts/              # Polices personnalisées
├── tests/                  # Tests automatisés
├── scripts/                # Scripts utilitaires
└── docs/                   # Documentation
```

## 🔧 Configuration Audio

### WASAPI Bit-Perfect
```typescript
// Configuration recommandée
const audioConfig = {
  wasapiExclusive: true,
  bufferSize: 64,        // ms (faible latence)
  sampleRate: 'native',  // Pas de rééchantillonnage
  bitDepth: 'native',    // Préservation bit-perfect
  channels: 2            // Stéréo standard
};
```

### Validation Bit-Perfect
L'indicateur **BIT-PERFECT** s'affiche en vert quand :
- ✅ WASAPI Exclusif activé
- ✅ Taux d'échantillonnage identique (fichier = DAC)
- ✅ Profondeur de bits identique (fichier = DAC)
- ✅ Aucun DSP actif (EQ désactivé)

## 🧪 Tests Qualité Audio

### Fichiers de Test Inclus
```bash
# Génération automatique des fichiers de test
npm run generate-test-files
```

**Fichiers générés :**
- `sine_1k_0dB_32bit_192kHz.wav` - Test bit-perfect haute résolution
- `pink_noise_32bit_192kHz.wav` - Test réponse en fréquence  
- `gapless_test_part1.wav` + `part2.wav` - Validation gapless
- `frequency_sweep_20-20k_24bit_96kHz.wav` - Test bande passante

### Procédures de Validation

#### Test Bit-Perfect
1. Charger `sine_1k_0dB_32bit_192kHz.wav`
2. Configurer DAC à 192kHz/32-bit
3. Vérifier indicateur **BIT-PERFECT** vert
4. Confirmer absence de distortion

#### Test Gapless
1. Créer playlist avec `gapless_test_part1.wav` → `part2.wav`
2. Écouter transition 440Hz → 880Hz
3. Validation : aucun silence ni click

## 📊 Optimisations Performance

### Threading Audio
- **Thread Audio** : priorité temps réel pour décodage + sortie
- **Thread I/O** : scan de fichiers, métadonnées
- **Thread UI** : interface utilisateur React
- **Isolation complète** : aucun stutter audio

### Gestion Mémoire
- **Buffer double** avec récupération auto sur underrun
- **Limite mémoire** : <500MB pour 10k+ pistes
- **Cache intelligent** des métadonnées fréquentes
- **Garbage collection** optimisée

### Base de Données
- **SQLite optimisé** avec indexes sur artiste/album
- **Requêtes préparées** pour performance
- **Scan incrémental** des nouveaux fichiers
- **VACUUM automatique** pour maintenance

## 🔒 Sécurité et Confidentialité

### Politique Zero-Tracking
- ❌ **Aucune télémétrie** par défaut
- ❌ **Aucun réseau** sans consentement explicite  
- ✅ **Données 100% locales** (playlists, DB, paramètres)
- ✅ **Export/Import chiffré** disponible

### Sécurité Code
- **Context isolation** Electron activée
- **Node integration** désactivée dans renderer
- **CSP headers** configurés
- **Code signing** pour distribution

## 📋 Roadmap Développement

### Phase 1 : MVP (Semaines 0-2) ✅
- [x] Structure projet Electron + React TS
- [x] Interface de base avec palette couleurs
- [x] Moteur audio prototype (WAV simple)
- [x] Fichiers de test générés automatiquement

### Phase 2 : Cœur Audio (Semaines 3-5)
- [ ] Décodage FLAC/ALAC/WavPack/MP3
- [ ] Intégration WASAPI exclusif natif
- [ ] Indicateur bit-perfect fonctionnel
- [ ] Tests validation avec fichiers de référence

### Phase 3 : Interface Complète (Semaines 6-8)
- [ ] Scan et indexation bibliothèque musicale
- [ ] Gestion playlists avec drag & drop
- [ ] Égaliseur graphique + présets
- [ ] Lecture gapless + crossfade

### Phase 4 : Finition (Semaines 9-12)
- [ ] Packaging et code signing
- [ ] Tests QA complets
- [ ] Optimisations performance finales
- [ ] Documentation utilisateur

## 🛠️ Scripts Disponibles

```bash
# Développement
npm run dev              # Démarrage développement (hot reload)
npm run electron:dev     # Electron seul (après build renderer)

# Build
npm run build           # Build complet (main + renderer)
npm run build:main      # Build processus principal uniquement
npm run build:renderer  # Build interface uniquement

# Tests
npm run test           # Tests Jest
npm run test:audio     # Tests spécifiques moteur audio
npm run lint           # ESLint + corrections auto

# Production
npm run dist           # Créer installateur (NSIS + MSIX)
npm run pack          # Package sans installateur
npm run postinstall   # Reconstruction modules natifs

# Utilitaires
npm run generate-test-files  # Générer fichiers test audio
```

## 📖 Documentation API

### Electron API (Preload)
```typescript
// Audio control
await window.electronAPI.audio.play('/path/to/file.flac');
await window.electronAPI.audio.pause();
const status = await window.electronAPI.audio.getBitPerfectStatus();

// Library management
const tracks = await window.electronAPI.library.getTracks();
await window.electronAPI.library.scan('/music/folder');

// Events
window.electronAPI.on('audio:positionChanged', (position) => {
  console.log(`Position: ${position}s`);
});
```

## 🤝 Contribution

### Standards de Code
- **TypeScript strict** obligatoire
- **ESLint** : règles Airbnb + React
- **Prettier** pour formatting
- **Commit conventionnel** (feat/fix/docs/etc.)

### Tests Requis
- Tests unitaires **Jest** pour moteur audio
- Tests d'intégration **Electron spectron**
- **QA manuelle** avec fichiers de test inclus

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour détails complets.

---

## 🎯 Non-Négociables Techniques

1. **Lecture bit-perfect** 32-bit/192kHz obligatoire
2. **Indication précise** des raisons de non-bit-perfect  
3. **Aucun trafic réseau** sans consentement utilisateur explicite
4. **Interface K4KAKAROTE** : noir + vert néon uniquement
5. **Performance** : <100ms latence, <500MB RAM pour 10k pistes

---

**Développé avec ❤️ pour les audiophiles exigeants**  
*K4KAKAROTE • MUSIC - Where every bit counts*
