import * as ffmpeg from 'fluent-ffmpeg';
import * as ffi from 'ffi-napi';
import * as ref from 'ref-napi';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';

interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  format: string;
}

interface BitPerfectStatus {
  isBitPerfect: boolean;
  reason: string;
  deviceSampleRate?: number;
  fileSampleRate?: number;
  deviceBitDepth?: number;
  fileBitDepth?: number;
}

interface AudioDevice {
  id: string;
  name: string;
  isDefault: boolean;
  maxSampleRate: number;
  maxBitDepth: number;
  channels: number;
}

export class AudioEngine extends EventEmitter {
  private isPlaying = false;
  private isPaused = false;
  private currentFile: string | null = null;
  private position = 0;
  private duration = 0;
  private volume = 1.0;
  
  private wasapiExclusive = true;
  private currentDevice: string | null = null;
  private audioBuffer: Float32Array | null = null;
  
  // WASAPI bindings via FFI
  private wasapi: any;
  
  constructor() {
    super();
    this.initializeWasapi();
  }

  private initializeWasapi(): void {
    try {
      // Initialize WASAPI bindings for bit-perfect output
      // This would typically load a native module or use FFI
      console.log('Initializing WASAPI for bit-perfect output...');
      
      // For now, we'll simulate the interface
      this.wasapi = {
        initialize: () => true,
        setExclusiveMode: (exclusive: boolean) => {
          this.wasapiExclusive = exclusive;
          this.emit('exclusiveModeChanged', exclusive);
        },
        getDevices: this.getSystemAudioDevices.bind(this),
        setDevice: (deviceId: string) => {
          this.currentDevice = deviceId;
          this.emit('deviceChanged', deviceId);
        },
        isExclusiveMode: () => this.wasapiExclusive
      };
    } catch (error) {
      console.error('Failed to initialize WASAPI:', error);
    }
  }

  async play(filePath: string): Promise<boolean> {
    try {
      if (this.currentFile !== filePath) {
        await this.loadFile(filePath);
      }
      
      if (this.isPaused) {
        this.resume();
      } else {
        await this.startPlayback();
      }
      
      return true;
    } catch (error) {
      console.error('Error playing file:', error);
      this.emit('error', error);
      return false;
    }
  }

  pause(): void {
    if (this.isPlaying && !this.isPaused) {
      this.isPaused = true;
      this.isPlaying = false;
      this.emit('paused');
      console.log('Playback paused');
    }
  }

  resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.isPlaying = true;
      this.emit('resumed');
      console.log('Playback resumed');
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.position = 0;
    this.emit('stopped');
    console.log('Playback stopped');
  }

  seek(position: number): void {
    if (position >= 0 && position <= this.duration) {
      this.position = position;
      this.emit('positionChanged', position);
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.emit('volumeChanged', this.volume);
  }

  getPosition(): number {
    return this.position;
  }

  getDuration(): number {
    return this.duration;
  }

  setWasapiExclusive(exclusive: boolean): void {
    this.wasapiExclusive = exclusive;
    if (this.wasapi) {
      this.wasapi.setExclusiveMode(exclusive);
    }
    this.emit('exclusiveModeChanged', exclusive);
  }

  setAudioDevice(deviceId: string): void {
    this.currentDevice = deviceId;
    if (this.wasapi) {
      this.wasapi.setDevice(deviceId);
    }
    this.emit('deviceChanged', deviceId);
  }

  getAudioDevices(): AudioDevice[] {
    return this.getSystemAudioDevices();
  }

  getBitPerfectStatus(): BitPerfectStatus {
    if (!this.currentFile) {
      return {
        isBitPerfect: false,
        reason: 'Aucun fichier en cours de lecture'
      };
    }

    // Simulate bit-perfect detection logic
    const fileMetadata = this.getCurrentFileMetadata();
    const device = this.getCurrentDeviceInfo();

    if (!this.wasapiExclusive) {
      return {
        isBitPerfect: false,
        reason: 'Mode WASAPI partagé actif (non exclusif)',
        deviceSampleRate: device?.maxSampleRate,
        fileSampleRate: fileMetadata?.sampleRate,
        deviceBitDepth: device?.maxBitDepth,
        fileBitDepth: fileMetadata?.bitDepth
      };
    }

    if (!device) {
      return {
        isBitPerfect: false,
        reason: 'Périphérique audio non détecté'
      };
    }

    if (fileMetadata && (
      fileMetadata.sampleRate !== device.maxSampleRate ||
      fileMetadata.bitDepth !== device.maxBitDepth
    )) {
      return {
        isBitPerfect: false,
        reason: 'Rééchantillonnage requis',
        deviceSampleRate: device.maxSampleRate,
        fileSampleRate: fileMetadata.sampleRate,
        deviceBitDepth: device.maxBitDepth,
        fileBitDepth: fileMetadata.bitDepth
      };
    }

    return {
      isBitPerfect: true,
      reason: 'Lecture bit-perfect active',
      deviceSampleRate: device.maxSampleRate,
      fileSampleRate: fileMetadata?.sampleRate,
      deviceBitDepth: device.maxBitDepth,
      fileBitDepth: fileMetadata?.bitDepth
    };
  }

  async getMetadata(filePath: string): Promise<AudioMetadata | null> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        if (!audioStream) {
          reject(new Error('No audio stream found'));
          return;
        }

        const result: AudioMetadata = {
          title: metadata.format.tags?.title || path.basename(filePath, path.extname(filePath)),
          artist: metadata.format.tags?.artist || 'Artiste inconnu',
          album: metadata.format.tags?.album || 'Album inconnu',
          duration: parseFloat(metadata.format.duration || '0'),
          sampleRate: parseInt(audioStream.sample_rate || '44100'),
          bitDepth: this.getBitDepthFromCodec(audioStream.codec_name || ''),
          channels: audioStream.channels || 2,
          format: audioStream.codec_name || 'unknown'
        };

        resolve(result);
      });
    });
  }

  private async loadFile(filePath: string): Promise<void> {
    this.currentFile = filePath;
    const metadata = await this.getMetadata(filePath);
    
    if (metadata) {
      this.duration = metadata.duration;
      this.position = 0;
      this.emit('fileLoaded', {
        path: filePath,
        metadata
      });
    }
  }

  private async startPlayback(): Promise<void> {
    if (!this.currentFile) {
      throw new Error('No file loaded');
    }

    this.isPlaying = true;
    this.isPaused = false;
    
    // Simulate playback with position updates
    this.simulatePlayback();
    
    this.emit('started', {
      file: this.currentFile,
      bitPerfect: this.getBitPerfectStatus()
    });
  }

  private simulatePlayback(): void {
    const updateInterval = setInterval(() => {
      if (!this.isPlaying || this.isPaused) {
        clearInterval(updateInterval);
        return;
      }

      this.position += 0.1; // 100ms increments
      
      if (this.position >= this.duration) {
        this.position = this.duration;
        this.stop();
        this.emit('ended');
        clearInterval(updateInterval);
      } else {
        this.emit('positionChanged', this.position);
      }
    }, 100);
  }

  private getSystemAudioDevices(): AudioDevice[] {
    // Simulate available audio devices
    return [
      {
        id: 'default',
        name: 'Périphérique par défaut',
        isDefault: true,
        maxSampleRate: 192000,
        maxBitDepth: 32,
        channels: 2
      },
      {
        id: 'dac1',
        name: 'DAC Audio haute résolution',
        isDefault: false,
        maxSampleRate: 192000,
        maxBitDepth: 32,
        channels: 2
      },
      {
        id: 'speakers',
        name: 'Haut-parleurs (Audio intégré)',
        isDefault: false,
        maxSampleRate: 48000,
        maxBitDepth: 24,
        channels: 2
      }
    ];
  }

  private getCurrentDeviceInfo(): AudioDevice | null {
    const devices = this.getAudioDevices();
    return devices.find(d => d.id === this.currentDevice) || devices.find(d => d.isDefault) || null;
  }

  private getCurrentFileMetadata(): AudioMetadata | null {
    // This would return cached metadata for the current file
    return null; // Simplified for now
  }

  private getBitDepthFromCodec(codecName: string): number {
    const codecBitDepths: { [key: string]: number } = {
      'pcm_f32le': 32,
      'pcm_s32le': 32,
      'pcm_s24le': 24,
      'pcm_s16le': 16,
      'flac': 24, // Common, but can vary
      'alac': 24, // Common, but can vary
      'mp3': 16,  // Effective bit depth
      'aac': 16   // Effective bit depth
    };
    
    return codecBitDepths[codecName] || 16;
  }

  cleanup(): void {
    this.stop();
    this.removeAllListeners();
    console.log('Audio engine cleaned up');
  }
}