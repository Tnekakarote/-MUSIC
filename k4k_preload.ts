import { contextBridge, ipcRenderer } from 'electron';

// Interface pour l'API exposée au renderer
export interface ElectronAPI {
  // Audio control
  audio: {
    play: (filePath: string) => Promise<boolean>;
    pause: () => Promise<void>;
    stop: () => Promise<void>;
    seek: (position: number) => Promise<void>;
    setVolume: (volume: number) => Promise<void>;
    getPosition: () => Promise<number>;
    getDuration: () => Promise<number>;
    getBitPerfectStatus: () => Promise<BitPerfectStatus>;
    setWasapiExclusive: (exclusive: boolean) => Promise<void>;
    getAudioDevices: () => Promise<AudioDevice[]>;
    setAudioDevice: (deviceId: string) => Promise<void>;
  };

  // File system
  dialog: {
    selectFolder: () => Promise<string | null>;
    selectFiles: () => Promise<string[]>;
  };

  // Library management
  library: {
    scan: (folderPath: string) => Promise<Track[]>;
    getTracks: () => Promise<Track[]>;
    getTracksByFolder: (folderPath: string) => Promise<Track[]>;
  };

  // Playlist management
  playlist: {
    create: (name: string) => Promise<number>;
    getAll: () => Promise<Playlist[]>;
    addTrack: (playlistId: number, trackId: number) => Promise<void>;
  };

  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Types
interface Track {
  id?: number;
  path: string;
  filename: string;
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

interface Playlist {
  id?: number;
  name: string;
  description?: string;
  dateCreated: Date;
  trackCount: number;
}

// API sécurisée exposée au renderer process
const electronAPI: ElectronAPI = {
  // Audio controls
  audio: {
    play: (filePath: string) => ipcRenderer.invoke('audio:play', filePath),
    pause: () => ipcRenderer.invoke('audio:pause'),
    stop: () => ipcRenderer.invoke('audio:stop'),
    seek: (position: number) => ipcRenderer.invoke('audio:seek', position),
    setVolume: (volume: number) => ipcRenderer.invoke('audio:setVolume', volume),
    getPosition: () => ipcRenderer.invoke('audio:getPosition'),
    getDuration: () => ipcRenderer.invoke('audio:getDuration'),
    getBitPerfectStatus: () => ipcRenderer.invoke('audio:getBitPerfectStatus'),
    setWasapiExclusive: (exclusive: boolean) => ipcRenderer.invoke('audio:setWasapiExclusive', exclusive),
    getAudioDevices: () => ipcRenderer.invoke('audio:getAudioDevices'),
    setAudioDevice: (deviceId: string) => ipcRenderer.invoke('audio:setAudioDevice', deviceId)
  },

  // File dialogs
  dialog: {
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
    selectFiles: () => ipcRenderer.invoke('dialog:selectFiles')
  },

  // Library management
  library: {
    scan: (folderPath: string) => ipcRenderer.invoke('library:scan', folderPath),
    getTracks: () => ipcRenderer.invoke('library:getTracks'),
    getTracksByFolder: (folderPath: string) => ipcRenderer.invoke('library:getTracksByFolder', folderPath)
  },

  // Playlist management
  playlist: {
    create: (name: string) => ipcRenderer.invoke('playlist:create', name),
    getAll: () => ipcRenderer.invoke('playlist:getAll'),
    addTrack: (playlistId: number, trackId: number) => ipcRenderer.invoke('playlist:addTrack', playlistId, trackId)
  },

  // Event handling
  on: (channel: string, callback: (...args: any[]) => void) => {
    // Whitelist des events autorisés pour la sécurité
    const allowedChannels = [
      'audio:started',
      'audio:paused',
      'audio:resumed',
      'audio:stopped',
      'audio:ended',
      'audio:positionChanged',
      'audio:volumeChanged',
      'audio:fileLoaded',
      'audio:error',
      'audio:exclusiveModeChanged',
      'audio:deviceChanged',
      'library:scanProgress',
      'library:scanComplete'
    ];

    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    } else {
      console.warn(`Attempted to listen to unauthorized channel: ${channel}`);
    }
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

// Exposition sécurisée de l'API au contexte de la page
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Version de l'application pour debug
contextBridge.exposeInMainWorld('appInfo', {
  name: 'K4KAKAROTE • MUSIC',
  version: '0.1.0',
  platform: process.platform,
  arch: process.arch,
  electronVersion: process.versions.electron,
  nodeVersion: process.versions.node
});

// Gestionnaire d'erreurs global pour le preload
process.on('uncaughtException', (error) => {
  console.error('Preload uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Preload unhandled rejection at:', promise, 'reason:', reason);
});

// Log de démarrage
console.log('K4KAKAROTE MUSIC preload script loaded successfully');

// Types globaux pour TypeScript (optionnel, pour le renderer)
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    appInfo: {
      name: string;
      version: string;
      platform: string;
      arch: string;
      electronVersion: string;
      nodeVersion: string;
    };
  }
}