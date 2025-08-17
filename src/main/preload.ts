importateur { contextePont, ipcRenderer } de 'électron';

// Interface pour l'API exposée au rendu
exportateur interface API électronique {
  // Contrôle audio
  audio: {
    jouer: (chemin du fichier : chaise) => Promesse<booléen>;
    pause: () => Promesse<vidéo>;
    arrêt: () => Promesse<vidéo>;
    chercheur: (position: nombre) => Promesse<vidéo>;
    DéfinirVolume: (volume: nombre) => Promesse<vidéo>;
    obtenirPosition: () => Promesse<nombre>;
    obtenirDurée: () => Promesse<nombre>;
    getBitPerfectStatus: () => Promesse<Statut BitPerfect>;
    setWasapiExclusive: (exclusif: booléen) => Promesse<vidéo>;
    obtention des vêtements audio: () => Promesse<Équipement audio[]>;
    DéfinirAudioDevice: (ID de périphérique: chaise) => Promesse<vidéo>;
  };

  // Système de fichers
  dialogue: {
    dossier de sélection: () => Promesse<chaise | nul>;
    sélectionneurFichiers: () => Promesse<chaise[]>;
  };

  // Gestion de bibliothèque
  bibliothèque: {
    balayage: (chemin du dossier: chaise) => Promesse<Piste[]>;
    obtention des pistes: () => Promesse<Piste[]>;
    getTracksByFolder: (chemin du dossier: chaise) => Promesse<Piste[]>;
  };

  // Gestion des listes de conférences
  liste de conférence: {
    créer: (nom: chaise) => Promesse<nombre>;
    obtenirTout: () => Promesse<Liste de conférence[]>;
    Jouteur une piste: (liste de lectureId: nombre, ID de piste: nombre) => Promesse<vidéo>;
  };

  // Auditeurs d'événements
  sur: (canal: chaise, rappel: (...args: n'importe lequel[]) => vidéo) => vidéo;
 supprimerAllListeners : (canal: chaise) => vidéo;
}

// Types
interface Piste {
 id?: nombre;
 chemin : chaîne ;
 nom de fichier : chaîne ;
  titre?: chaise;
 artiste ?: chaise;
 album ?: chaîne;
 durée: nombre;
 exempleTaux : nombre ;
 bitDépendance: nombre;
 canaux : nombre ;
  format: chaise;
}

interface Statut BitPerfect {
  estBitPerfect: booléen;
  raison: chaise;
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
