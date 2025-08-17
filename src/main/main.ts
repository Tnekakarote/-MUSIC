import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { AudioEngine } from './audio-engine';
import { DatabaseManager } from './database';

class K4KakaroteApp {
  private mainWindow: BrowserWindow | null = null;
  private audioEngine: AudioEngine | null = null;
  private db: DatabaseManager | null = null;

  constructor() {
    this.initApp();
  }

  private async initApp(): Promise<void> {
    await app.whenReady();
    
    // Initialize audio engine
    this.audioEngine = new AudioEngine();
    
    // Initialize database
    this.db = new DatabaseManager();
    await this.db.init();

    this.createWindow();
    this.setupIpcHandlers();

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.cleanup();
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 600,
      show: false,
      backgroundColor: '#000000',
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#000000',
        symbolColor: '#00FF84'
      },
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true
      }
    });

    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIpcHandlers(): void {
    // Audio control handlers
    ipcMain.handle('audio:play', async (_, filePath: string) => {
      return await this.audioEngine?.play(filePath);
    });

    ipcMain.handle('audio:pause', () => {
      this.audioEngine?.pause();
    });

    ipcMain.handle('audio:stop', () => {
      this.audioEngine?.stop();
    });

    ipcMain.handle('audio:seek', (_, position: number) => {
      this.audioEngine?.seek(position);
    });

    ipcMain.handle('audio:setVolume', (_, volume: number) => {
      this.audioEngine?.setVolume(volume);
    });

    ipcMain.handle('audio:getPosition', () => {
      return this.audioEngine?.getPosition() || 0;
    });

    ipcMain.handle('audio:getDuration', () => {
      return this.audioEngine?.getDuration() || 0;
    });

    ipcMain.handle('audio:getBitPerfectStatus', () => {
      return this.audioEngine?.getBitPerfectStatus() || {
        isBitPerfect: false,
        reason: 'Audio engine not initialized'
      };
    });

    // Audio settings
    ipcMain.handle('audio:setWasapiExclusive', (_, exclusive: boolean) => {
      this.audioEngine?.setWasapiExclusive(exclusive);
    });

    ipcMain.handle('audio:getAudioDevices', () => {
      return this.audioEngine?.getAudioDevices() || [];
    });

    ipcMain.handle('audio:setAudioDevice', (_, deviceId: string) => {
      this.audioEngine?.setAudioDevice(deviceId);
    });

    // File/Folder selection
    ipcMain.handle('dialog:selectFolder', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory'],
        title: 'Sélectionner le dossier de musique'
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    });

    ipcMain.handle('dialog:selectFiles', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Audio Files', extensions: ['wav', 'flac', 'alac', 'm4a', 'mp3', 'wv'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        title: 'Sélectionner des fichiers audio'
      });
      
      if (!result.canceled) {
        return result.filePaths;
      }
      return [];
    });

    // Library management
    ipcMain.handle('library:scan', async (_, folderPath: string) => {
      return await this.scanLibrary(folderPath);
    });

    ipcMain.handle('library:getTracks', async () => {
      return await this.db?.getAllTracks() || [];
    });

    ipcMain.handle('library:getTracksByFolder', async (_, folderPath: string) => {
      return await this.db?.getTracksByFolder(folderPath) || [];
    });

    // Playlist management
    ipcMain.handle('playlist:create', async (_, name: string) => {
      return await this.db?.createPlaylist(name);
    });

    ipcMain.handle('playlist:getAll', async () => {
      return await this.db?.getAllPlaylists() || [];
    });

    ipcMain.handle('playlist:addTrack', async (_, playlistId: number, trackId: number) => {
      return await this.db?.addTrackToPlaylist(playlistId, trackId);
    });
  }

  private async scanLibrary(folderPath: string): Promise<any[]> {
    const tracks: any[] = [];
    const supportedExtensions = ['.wav', '.flac', '.m4a', '.mp3', '.wv'];

    const scanDirectory = async (dir: string): Promise<void> => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (supportedExtensions.includes(path.extname(file).toLowerCase())) {
          try {
            const metadata = await this.audioEngine?.getMetadata(fullPath);
            if (metadata) {
              const track = {
                path: fullPath,
                filename: file,
                ...metadata
              };
              tracks.push(track);
              await this.db?.addTrack(track);
            }
          } catch (error) {
            console.error(`Error processing ${fullPath}:`, error);
          }
        }
      }
    };

    await scanDirectory(folderPath);
    return tracks;
  }

  private cleanup(): void {
    this.audioEngine?.cleanup();
    this.db?.close();
  }
}

// Start the application
new K4KakaroteApp();
