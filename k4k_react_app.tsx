

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
  format: string;
}

interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  position: number;
  duration: number;
  volume: number;
  currentTrack: Track | null;
}

interface BitPerfectStatus {
  isBitPerfect: boolean;
  reason: string;
  deviceSampleRate?: number;
  fileSampleRate?: number;
  deviceBitDepth?: number;
  fileBitDepth?: number;
}

const K4KarkaroteMusic: React.FC = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isPaused: false,
    position: 0,
    duration: 0,
    volume: 0.8,
    currentTrack: null
  });

  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [bitPerfectStatus, setBitPerfectStatus] = useState<BitPerfectStatus>({
    isBitPerfect: false,
    reason: 'Aucun fichier chargé'
  });
  const [wasapiExclusive, setWasapiExclusive] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentView, setCurrentView] = useState<'library' | 'nowplaying'>('library');

  // Simulate electron IPC for demo
  const electronAPI = {
    play: (path: string) => Promise.resolve(true),
    pause: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    setVolume: (vol: number) => Promise.resolve(),
    getBitPerfectStatus: () => Promise.resolve(bitPerfectStatus),
    setWasapiExclusive: (exclusive: boolean) => Promise.resolve(),
    selectFolder: () => Promise.resolve('/path/to/music'),
    scanLibrary: (path: string) => Promise.resolve([])
  };

  useEffect(() => {
    // Simulate loading some demo tracks
    const demoTracks: Track[] = [
      {
        id: 1,
        path: '/music/track1.flac',
        filename: 'Symphonie No.9 - Beethoven.flac',
        title: 'Symphonie No.9 en Ré mineur',
        artist: 'Ludwig van Beethoven',
        album: 'Symphonies Complètes',
        duration: 420,
        sampleRate: 192000,
        bitDepth: 32,
        format: 'FLAC'
      },
      {
        id: 2,
        path: '/music/track2.wav',
        filename: 'Pink Noise Test.wav',
        title: 'Pink Noise Test Tone',
        artist: 'Test Audio',
        album: 'Audio Tests',
        duration: 60,
        sampleRate: 192000,
        bitDepth: 32,
        format: 'WAV'
      }
    ];
    setTracks(demoTracks);
  }, []);

  const handlePlay = async (track: Track) => {
    if (audioState.currentTrack?.path === track.path && audioState.isPaused) {
      setAudioState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    } else {
      await electronAPI.play(track.path);
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: true, 
        isPaused: false, 
        currentTrack: track,
        duration: track.duration,
        position: 0
      }));
    }
    
    // Update bit-perfect status
    const status = await electronAPI.getBitPerfectStatus();
    setBitPerfectStatus(status);
    setCurrentView('nowplaying');
  };

  const handlePause = () => {
    electronAPI.pause();
    setAudioState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
  };

  const handleStop = () => {
    electronAPI.stop();
    setAudioState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false, 
      position: 0 
    }));
  };

  const handleVolumeChange = (volume: number) => {
    electronAPI.setVolume(volume);
    setAudioState(prev => ({ ...prev, volume }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileInfo = (track: Track): string => {
    return `${track.format} • ${(track.sampleRate / 1000).toFixed(0)}kHz • ${track.bitDepth}bit`;
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 bg-black border-b border-gray-800 flex items-center px-6 justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-white">𝐊𝟒𝐊𝐀𝐊𝐀𝐑𝐎𝐓𝐄</span>
            <span className="text-[#00FF84] ml-2">• MUSIC</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {bitPerfectStatus.isBitPerfect ? (
            <div className="flex items-center space-x-2 px-3 py-1 bg-[#00FF84] bg-opacity-20 rounded-lg border border-[#00FF84]">
              <div className="w-2 h-2 bg-[#00FF84] rounded-full animate-pulse"></div>
              <span className="text-[#00FF84] text-sm font-medium">BIT-PERFECT</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-500 bg-opacity-20 rounded-lg border border-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-400 text-sm font-medium">NON BIT-PERFECT</span>
            </div>
          )}
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-[#0B0B0B] rounded-lg transition-colors"
          >
            <Settings size={20} className="text-[#B8B8B8] hover:text-[#00FF84]" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0B0B0B] border-r border-gray-800 p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView('library')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'library' 
                  ? 'bg-[#00FF84] bg-opacity-20 text-[#00FF84] border border-[#00FF84]' 
                  : 'hover:bg-[#0F0F0F] text-[#B8B8B8] hover:text-white'
              }`}
            >
              <Music size={20} />
              <span>Bibliothèque</span>
            </button>
            
            <button
              onClick={() => setCurrentView('nowplaying')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'nowplaying' 
                  ? 'bg-[#00FF84] bg-opacity-20 text-[#00FF84] border border-[#00FF84]' 
                  : 'hover:bg-[#0F0F0F] text-[#B8B8B8] hover:text-white'
              }`}
              disabled={!audioState.currentTrack}
            >
              <List size={20} />
              <span>Lecture en cours</span>
            </button>
            
            <hr className="border-gray-700 my-4" />
            
            <div className="space-y-2">
              <h3 className="text-[#B8B8B8] text-sm font-medium px-4">PLAYLISTS</h3>
              <button className="w-full flex items-center space-x-3 px-4 py-2 text-[#B8B8B8] hover:text-white hover:bg-[#0F0F0F] rounded-lg transition-colors">
                <span>+ Créer une playlist</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {currentView === 'library' ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Bibliothèque Musicale</h1>
                <button className="flex items-center space-x-2 px-4 py-2 bg-[#00FF84] bg-opacity-20 hover:bg-opacity-30 border border-[#00FF84] rounded-lg transition-colors">
                  <Folder size={20} className="text-[#00FF84]" />
                  <span className="text-[#00FF84] font-medium">Ajouter un dossier</span>
                </button>
              </div>

              <div className="bg-[#0B0B0B] rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[#B8B8B8] text-sm font-medium border-b border-gray-800">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">TITRE</div>
                  <div className="col-span-3">ALBUM</div>
                  <div className="col-span-2">FORMAT</div>
                  <div className="col-span-1">DURÉE</div>
                </div>
                
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#0F0F0F] transition-colors cursor-pointer group"
                    onClick={() => handlePlay(track)}
                  >
                    <div className="col-span-1 text-[#B8B8B8] group-hover:text-[#00FF84]">
                      {audioState.currentTrack?.path === track.path && audioState.isPlaying ? (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="flex space-x-1">
                            <div className="w-1 bg-[#00FF84] animate-pulse" style={{height: '16px'}}></div>
                            <div className="w-1 bg-[#00FF84] animate-pulse" style={{height: '12px', animationDelay: '0.1s'}}></div>
                            <div className="w-1 bg-[#00FF84] animate-pulse" style={{height: '8px', animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      ) : (
                        <span className="group-hover:opacity-0">{index + 1}</span>
                      )}
                      <Play size={16} className="hidden group-hover:block text-[#00FF84] absolute" />
                    </div>
                    
                    <div className="col-span-5">
                      <div className="text-white font-medium">{track.title}</div>
                      <div className="text-[#B8B8B8] text-sm">{track.artist}</div>
                    </div>
                    
                    <div className="col-span-3 text-[#B8B8B8]">{track.album}</div>
                    
                    <div className="col-span-2">
                      <div className="text-[#00FF84] text-sm font-medium">{formatFileInfo(track)}</div>
                    </div>
                    
                    <div className="col-span-1 text-[#B8B8B8]">{formatTime(track.duration)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-white mb-8">Lecture en cours</h1>
              
              {audioState.currentTrack ? (
                <div className="text-center">
                  {/* Album Art Placeholder */}
                  <div className="w-80 h-80 mx-auto mb-8 bg-[#0B0B0B] rounded-lg flex items-center justify-center border border-gray-800">
                    <Music size={80} className="text-[#B8B8B8]" />
                  </div>
                  
                  {/* Track Info */}
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">{audioState.currentTrack.title}</h2>
                    <p className="text-xl text-[#B8B8B8] mb-2">{audioState.currentTrack.artist}</p>
                    <p className="text-lg text-[#B8B8B8] mb-4">{audioState.currentTrack.album}</p>
                    <p className="text-[#00FF84] font-medium">{formatFileInfo(audioState.currentTrack)}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-[#0B0B0B] rounded-full h-2 mb-2">
                      <div 
                        className="bg-[#00FF84] h-2 rounded-full transition-all duration-100"
                        style={{ width: `${(audioState.position / audioState.duration) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[#B8B8B8] text-sm">
                      <span>{formatTime(audioState.position)}</span>
                      <span>{formatTime(audioState.duration)}</span>
                    </div>
                  </div>

                  {/* Bit-Perfect Status */}
                  <div className="mb-6 p-4 bg-[#0B0B0B] rounded-lg border border-gray-800">
                    <h3 className="font-medium mb-2 text-white">État de la lecture</h3>
                    <p className={`text-sm ${bitPerfectStatus.isBitPerfect ? 'text-[#00FF84]' : 'text-red-400'}`}>
                      {bitPerfectStatus.reason}
                    </p>
                    {bitPerfectStatus.deviceSampleRate && bitPerfectStatus.fileSampleRate && (
                      <div className="mt-2 text-xs text-[#B8B8B8]">
                        Fichier: {(bitPerfectStatus.fileSampleRate / 1000).toFixed(0)}kHz {bitPerfectStatus.fileBitDepth}bit • 
                        Périphérique: {(bitPerfectStatus.deviceSampleRate / 1000).toFixed(0)}kHz {bitPerfectStatus.deviceBitDepth}bit
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-[#B8B8B8]">
                  <Music size={80} className="mx-auto mb-4" />
                  <p>Aucun morceau en cours de lecture</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Player Controls */}
      <div className="h-20 bg-[#0B0B0B] border-t border-gray-800 flex items-center px-6">
        <div className="flex items-center space-x-4 flex-1">
          {audioState.currentTrack && (
            <>
              <div className="w-12 h-12 bg-[#0F0F0F] rounded flex items-center justify-center">
                <Music size={24} className="text-[#B8B8B8]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">{audioState.currentTrack.title}</p>
                <p className="text-[#B8B8B8] text-sm truncate">{audioState.currentTrack.artist}</p>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-[#0F0F0F] rounded-full transition-colors">
            <Shuffle size={20} className="text-[#B8B8B8] hover:text-[#00FF84]" />
          </button>
          
          <button className="p-2 hover:bg-[#0F0F0F] rounded-full transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#B8B8B8] hover:text-[#00FF84]">
              <path d="M7 6L17 12L7 18V6Z" transform="scale(-1,1) translate(-24,0)" />
            </svg>
          </button>

          <button
            onClick={audioState.isPlaying ? handlePause : () => audioState.currentTrack && handlePlay(audioState.currentTrack)}
            className="p-3 bg-[#00FF84] hover:bg-[#00EA6C] rounded-full transition-colors"
            disabled={!audioState.currentTrack}
          >
            {audioState.isPlaying ? (
              <Pause size={24} className="text-black" />
            ) : (
              <Play size={24} className="text-black" />
            )}
          </button>

          <button
            onClick={handleStop}
            className="p-2 hover:bg-[#0F0F0F] rounded-full transition-colors"
            disabled={!audioState.currentTrack}
          >
            <Square size={20} className="text-[#B8B8B8] hover:text-[#00FF84]" />
          </button>

          <button className="p-2 hover:bg-[#0F0F0F] rounded-full transition-colors">
            <Repeat size={20} className="text-[#B8B8B8] hover:text-[#00FF84]" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center space-x-2 flex-1 justify-end">
          <Volume2 size={20} className="text-[#B8B8B8]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audioState.volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1 bg-[#0F0F0F] rounded-lg appearance-none slider"
            style={{
              background: `linear-gradient(to right, #00FF84 0%, #00FF84 ${audioState.volume * 100}%, #0F0F0F ${audioState.volume * 100}%, #0F0F0F 100%)`
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00FF84;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00FF84;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default K4KarkaroteMusic;import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2, Settings, Music, Folder, List, Repeat, Shuffle } from 'lucide-react';