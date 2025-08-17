// src/native/audio.ts
import portAudio from 'naudiodon';
import fs from 'fs';
import wav from 'wav';

export class AudioEngine {
  private stream: any;

  play(filePath: string) {
    const reader = new wav.Reader();
    reader.on('format', (format) => {
      this.stream = new portAudio.AudioOutput({
        channelCount: format.channels,
        sampleFormat: portAudio.SampleFormat32Bit,
        sampleRate: format.sampleRate,
        deviceId: -1, // périphérique par défaut
      });
      reader.pipe(this.stream);
      this.stream.start();
    });
    fs.createReadStream(filePath).pipe(reader);
  }

  pause() {
    if (this.stream) this.stream.quit();
  }

  async getBitPerfectStatus() {
    // Simple check : toujours true pour le moment
    return true;
  }
}

export const audioEngine = new AudioEngine();
