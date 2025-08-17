import { useState } from 'react';

export const useAudio = () => {
  const [playing, setPlaying] = useState(false);
  const [bitPerfect, setBitPerfect] = useState(false);

  const play = async (filePath: string) => {
    await window.electronAPI.audio.play(filePath);
    const status = await window.electronAPI.audio.getBitPerfectStatus();
    setBitPerfect(status);
    setPlaying(true);
  };

  const pause = async () => {
    await window.electronAPI.audio.pause();
    setPlaying(false);
  };

  return { playing, bitPerfect, play, pause };
};
