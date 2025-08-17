const fs = require('fs');
const path = require('path');

/**
 * Générateur de fichiers de test audio pour K4KAKAROTE MUSIC
 * Crée des fichiers WAV avec différentes caractéristiques pour tester le moteur audio
 */

class AudioTestGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'assets', 'test-files');
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Génère un tone sinusoïdal pur
   * @param {number} frequency - Fréquence en Hz
   * @param {number} duration - Durée en secondes
   * @param {number} sampleRate - Taux d'échantillonnage
   * @param {number} bitDepth - Profondeur de bits (16, 24, 32)
   * @param {number} amplitude - Amplitude (0.0 à 1.0)
   */
  generateSineTone(frequency, duration, sampleRate = 192000, bitDepth = 32, amplitude = 0.5) {
    const numSamples = Math.floor(duration * sampleRate);
    const samples = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      samples[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
    }
    
    return samples;
  }

  /**
   * Génère du bruit rose (1/f noise)
   * @param {number} duration - Durée en secondes
   * @param {number} sampleRate - Taux d'échantillonnage
   * @param {number} bitDepth - Profondeur de bits
   * @param {number} amplitude - Amplitude
   */
  generatePinkNoise(duration, sampleRate = 192000, bitDepth = 32, amplitude = 0.3) {
    const numSamples = Math.floor(duration * sampleRate);
    const samples = new Float32Array(numSamples);
    
    // Générateur de bruit rose simplifié
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < numSamples; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      
      samples[i] = pink * amplitude * 0.11;
    }
    
    return samples;
  }

  /**
   * Génère un sweep de fréquence (chirp)
   * @param {number} startFreq - Fréquence de début
   * @param {number} endFreq - Fréquence de fin
   * @param {number} duration - Durée
   * @param {number} sampleRate - Taux d'échantillonnage
   * @param {number} amplitude - Amplitude
   */
  generateFrequencySweep(startFreq, endFreq, duration, sampleRate = 192000, amplitude = 0.5) {
    const numSamples = Math.floor(duration * sampleRate);
    const samples = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freq = startFreq + (endFreq - startFreq) * progress;
      samples[i] = amplitude * Math.sin(2 * Math.PI * freq * t);
    }
    
    return samples;
  }

  /**
   * Crée un en-tête WAV
   * @param {number} numSamples - Nombre d'échantillons
   * @param {number} sampleRate - Taux d'échantillonnage
   * @param {number} bitDepth - Profondeur de bits
   * @param {number} numChannels - Nombre de canaux
   */
  createWavHeader(numSamples, sampleRate, bitDepth, numChannels = 2) {
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const fileSize = 36 + dataSize;

    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    // RIFF header
    view.setUint32(0, 0x46464952, true);  // "RIFF"
    view.setUint32(4, fileSize, true);
    view.setUint32(8, 0x45564157, true);  // "WAVE"

    // fmt chunk
    view.setUint32(12, 0x20746D66, true); // "fmt "
    view.setUint32(16, 16, true);         // chunk size
    view.setUint16(20, bitDepth === 32 ? 3 : 1, true); // format (3 = IEEE float, 1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data chunk
    view.setUint32(36, 0x61746164, true); // "data"
    view.setUint32(40, dataSize, true);

    return new Uint8Array(header);
  }

  /**
   * Convertit des échantillons Float32 vers le format de bits spécifié
   * @param {Float32Array} samples - Échantillons en float32
   * @param {number} bitDepth - Profondeur de bits de sortie
   */
  convertSamples(samples, bitDepth) {
    switch (bitDepth) {
      case 16:
        const int16Samples = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          int16Samples[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)));
        }
        return new Uint8Array(int16Samples.buffer);

      case 24:
        const int24Samples = new Uint8Array(samples.length * 3);
        for (let i = 0; i < samples.length; i++) {
          const sample = Math.max(-8388608, Math.min(8388607, Math.round(samples[i] * 8388607)));
          int24Samples[i * 3] = sample & 0xFF;
          int24Samples[i * 3 + 1] = (sample >> 8) & 0xFF;
          int24Samples[i * 3 + 2] = (sample >> 16) & 0xFF;
        }
        return int24Samples;

      case 32:
        // IEEE 754 float32
        return new Uint8Array(samples.buffer);

      default:
        throw new Error(`Unsupported bit depth: ${bitDepth}`);
    }
  }

  /**
   * Duplique les échantillons mono vers stéréo
   * @param {Float32Array} monoSamples - Échantillons mono
   */
  monoToStereo(monoSamples) {
    const stereoSamples = new Float32Array(monoSamples.length * 2);
    for (let i = 0; i < monoSamples.length; i++) {
      stereoSamples[i * 2] = monoSamples[i];     // Canal gauche
      stereoSamples[i * 2 + 1] = monoSamples[i]; // Canal droit
    }
    return stereoSamples;
  }

  /**
   * Sauvegarde un fichier WAV
   * @param {string} filename - Nom du fichier
   * @param {Float32Array} samples - Échantillons
   * @param {number} sampleRate - Taux d'échantillonnage
   * @param {number} bitDepth - Profondeur de bits
   */
  saveWavFile(filename, samples, sampleRate, bitDepth) {
    const stereoSamples = this.monoToStereo(samples);
    const header = this.createWavHeader(stereoSamples.length, sampleRate, bitDepth, 2);
    const data = this.convertSamples(stereoSamples, bitDepth);
    
    const fullPath = path.join(this.outputDir, filename);
    const fileBuffer = new Uint8Array(header.length + data.length);
    fileBuffer.set(header, 0);
    fileBuffer.set(data, header.length);
    
    fs.writeFileSync(fullPath, fileBuffer);
    console.log(`✓ Fichier créé: ${filename} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)`);
  }

  /**
   * Génère tous les fichiers de test
   */
  generateAllTestFiles() {
    console.log('🎵 Génération des fichiers de test audio K4KAKAROTE MUSIC...\n');

    // 1. Tone de test 1kHz à 0dB (32-bit/192kHz)
    console.log('Génération du tone de test 1kHz...');
    const tone1k = this.generateSineTone(1000, 10, 192000, 32, 1.0);
    this.saveWavFile('sine_1k_0dB_32bit_192kHz.wav', tone1k, 192000, 32);

    // 2. Bruit rose (32-bit/192kHz) 
    console.log('Génération du bruit rose...');
    const pinkNoise = this.generatePinkNoise(30, 192000, 32);
    this.saveWavFile('pink_noise_32bit_192kHz.wav', pinkNoise, 192000, 32);

    // 3. Test de continuité gapless (partie 1)
    console.log('Génération du test gapless partie 1...');
    const gapless1 = this.generateSineTone(440, 5, 44100, 16, 0.8);
    this.saveWavFile('gapless_test_part1.wav', gapless1, 44100, 16);

    // 4. Test de continuité gapless (partie 2) 
    console.log('Génération du test gapless partie 2...');
    const gapless2 = this.generateSineTone(880, 5, 44100, 16, 0.8);
    this.saveWavFile('gapless_test_part2.wav', gapless2, 44100, 16);

    // 5. Sweep de fréquence pour test de qualité
    console.log('Génération du sweep de fréquence...');
    const sweep = this.generateFrequencySweep(20, 20000, 20, 96000);
    this.saveWavFile('frequency_sweep_20-20k_24bit_96kHz.wav', sweep, 96000, 24);

    // 6. Test de dynamic range
    console.log('Génération du test de dynamic range...');
    const quietTone = this.generateSineTone(1000, 3, 192000, 32, 0.001); // -60dB
    this.saveWavFile('sine_1k_-60dB_32bit_192kHz.wav', quietTone, 192000, 32);

    // 7. Test multi-format pour validation
    console.log('Génération des tests multi-formats...');
    const testTone = this.generateSineTone(1000, 5, 48000, 16, 0.5);
    this.saveWavFile('test_tone_16bit_48kHz.wav', testTone, 48000, 16);

    console.log('\n✅ Tous les fichiers de test ont été générés avec succès!');
    console.log(`📁 Répertoire: ${this.outputDir}`);
    
    // Créer un fichier README pour les tests
    this.createTestReadme();
  }

  /**
   * Crée un fichier README pour les tests
   */
  createTestReadme() {
    const readme = `# Fichiers de Test Audio K4KAKAROTE MUSIC

## Description des fichiers

### Tests Bit-Perfect
- **sine_1k_0dB_32bit_192kHz.wav**: Tone sinusoïdal 1kHz à pleine amplitude (32-bit/192kHz)
  - Usage: Vérification de la lecture bit-perfect haute résolution
  - Validation: Aucune distortion ou altération du signal

- **sine_1k_-60dB_32bit_192kHz.wav**: Tone sinusoïdal 1kHz à -60dB (32-bit/192kHz)  
  - Usage: Test de dynamic range et précision numérique
  - Validation: Le signal doit rester audible et propre

### Tests de Qualité Audio
- **pink_noise_32bit_192kHz.wav**: Bruit rose 30 secondes (32-bit/192kHz)
  - Usage: Test de réponse en fréquence et qualité du DAC
  - Validation: Spectre plat avec pente -3dB/octave

- **frequency_sweep_20-20k_24bit_96kHz.wav**: Sweep 20Hz-20kHz (24-bit/96kHz)
  - Usage: Test de bande passante et aliasing
  - Validation: Transition fluide sans artefacts audibles

### Tests Gapless
- **gapless_test_part1.wav**: Tone 440Hz 5 secondes (16-bit/44.1kHz)
- **gapless_test_part2.wav**: Tone 880Hz 5 secondes (16-bit/44.1kHz)
  - Usage: Test de lecture continue sans gap
  - Validation: Transition instantanée sans silence ni click

### Tests Compatibilité
- **test_tone_16bit_48kHz.wav**: Tone de référence (16-bit/48kHz)
  - Usage: Test de compatibilité format standard
  - Validation: Lecture correcte sur tous les périphériques

## Procédures de Test

### Test Bit-Perfect
1. Configurer WASAPI exclusif
2. Jouer sine_1k_0dB_32bit_192kHz.wav
3. Vérifier l'indicateur "BIT-PERFECT" vert
4. Confirmer l'absence de rééchantillonnage

### Test Gapless
1. Créer une playlist avec gapless_test_part1.wav et part2.wav
2. Activer la lecture gapless
3. Écouter la transition - doit être instantanée
4. Vérifier l'absence de silence ou de click

### Test de Qualité
1. Jouer pink_noise avec analyseur de spectre
2. Vérifier la pente -3dB/octave caractéristique
3. S'assurer de l'absence de pics parasites

## Notes Techniques
- Tous les fichiers sont générés mathématiquement
- Amplitude calibrée pour éviter la saturation
- Formats testés: 16-bit/44.1kHz à 32-bit/192kHz
- Compatible avec les spécifications bit-perfect de K4KAKAROTE MUSIC

---
Générés automatiquement par le script generate-test-audio.js
`;

    fs.writeFileSync(path.join(this.outputDir, 'README.md'), readme, 'utf8');
    console.log('📄 README.md créé avec les instructions de test');
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const generator = new AudioTestGenerator();
  generator.generateAllTestFiles();
}

module.exports = AudioTestGenerator;
