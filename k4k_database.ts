import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import { app } from 'electron';

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
  dateAdded: Date;
  lastPlayed?: Date;
  playCount: number;
}

interface Playlist {
  id?: number;
  name: string;
  description?: string;
  dateCreated: Date;
  trackCount: number;
}

interface PlaylistTrack {
  id?: number;
  playlistId: number;
  trackId: number;
  position: number;
  dateAdded: Date;
}

export class DatabaseManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'k4kakarote-music.db');
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        console.log('Connected to SQLite database');
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTablesSQL = [
      // Tracks table
      `CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        filename TEXT NOT NULL,
        title TEXT,
        artist TEXT,
        album TEXT,
        duration REAL NOT NULL,
        sample_rate INTEGER NOT NULL,
        bit_depth INTEGER NOT NULL,
        channels INTEGER NOT NULL,
        format TEXT NOT NULL,
        date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_played DATETIME,
        play_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Playlists table
      `CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
        track_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Playlist tracks junction table
      `CREATE TABLE IF NOT EXISTS playlist_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlist_id INTEGER NOT NULL,
        track_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE,
        UNIQUE (playlist_id, track_id, position)
      )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist)`,
      `CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album)`,
      `CREATE INDEX IF NOT EXISTS idx_tracks_path ON tracks(path)`,
      `CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id)`,
      `CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position)`
    ];

    return new Promise((resolve, reject) => {
      const runNext = (index: number) => {
        if (index >= createTablesSQL.length) {
          resolve();
          return;
        }

        this.db!.run(createTablesSQL[index], (err) => {
          if (err) {
            console.error(`Error creating table/index ${index}:`, err);
            reject(err);
            return;
          }
          runNext(index + 1);
        });
      };

      runNext(0);
    });
  }

  async addTrack(track: Omit<Track, 'id' | 'dateAdded' | 'playCount'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT OR REPLACE INTO tracks 
      (path, filename, title, artist, album, duration, sample_rate, bit_depth, channels, format)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db!.run(
        sql,
        [
          track.path,
          track.filename,
          track.title || null,
          track.artist || null,
          track.album || null,
          track.duration,
          track.sampleRate,
          track.bitDepth,
          track.channels,
          track.format
        ],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });
  }

  async getAllTracks(): Promise<Track[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      SELECT id, path, filename, title, artist, album, duration, 
             sample_rate as sampleRate, bit_depth as bitDepth, channels, format,
             date_added as dateAdded, last_played as lastPlayed, play_count as playCount
      FROM tracks 
      ORDER BY artist, album, title
    `;

    return new Promise((resolve, reject) => {
      this.db!.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows as Track[]);
      });
    });
  }

  async getTracksByFolder(folderPath: string): Promise<Track[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      SELECT id, path, filename, title, artist, album, duration, 
             sample_rate as sampleRate, bit_depth as bitDepth, channels, format,
             date_added as dateAdded, last_played as lastPlayed, play_count as playCount
      FROM tracks 
      WHERE path LIKE ?
      ORDER BY path
    `;

    return new Promise((resolve, reject) => {
      this.db!.all(sql, [`${folderPath}%`], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows as Track[]);
      });
    });
  }

  async searchTracks(query: string): Promise<Track[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      SELECT id, path, filename, title, artist, album, duration, 
             sample_rate as sampleRate, bit_depth as bitDepth, channels, format,
             date_added as dateAdded, last_played as lastPlayed, play_count as playCount
      FROM tracks 
      WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? OR filename LIKE ?
      ORDER BY 
        CASE 
          WHEN title LIKE ? THEN 1
          WHEN artist LIKE ? THEN 2
          WHEN album LIKE ? THEN 3
          ELSE 4
        END,
        artist, album, title
    `;

    const searchParam = `%${query}%`;
    const searchParamStart = `${query}%`;

    return new Promise((resolve, reject) => {
      this.db!.all(
        sql, 
        [searchParam, searchParam, searchParam, searchParam, 
         searchParamStart, searchParamStart, searchParamStart],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows as Track[]);
        }
      );
    });
  }

  async updateTrackPlayCount(trackId: number): Promise