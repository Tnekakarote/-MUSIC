import React, { useState } from 'react';
import { useAudio } from '../hooks/useAudio';
import Playlist from './Playlist';
import BitPerfectIndicator from './BitPerfectIndicator';

const Player = () => {
  const { playing, bitPerfect, play, pause } = useAudio();
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);

  return (
    <div className="player">
      <BitPerfectIndicator active={bitPerfect} />
      <Playlist onSelect={(track) => { setCurrentTrack(track); play(track); }} />
      <button onClick={() => (playing ? pause() : currentTrack && play(currentTrack))}>
        {playing ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};

export default Player;
