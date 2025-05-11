import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Audio } from "../types/audio";

interface AudioPlayerProps {
  audio: Audio;
}

const AudioPlayer = ({ audio }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const setAudioData = () => {
      setDuration(audioElement.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Set up event listeners
    audioElement.addEventListener("loadeddata", setAudioData);
    audioElement.addEventListener("timeupdate", setAudioTime);
    audioElement.addEventListener("ended", handleEnded);

    // Clean up
    return () => {
      audioElement.removeEventListener("loadeddata", setAudioData);
      audioElement.removeEventListener("timeupdate", setAudioTime);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    audioElement.currentTime = newTime;
  };

  const handleSkipForward = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.currentTime = Math.min(
      audioElement.currentTime + 10,
      duration
    );
  };

  const handleSkipBackward = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.currentTime = Math.max(audioElement.currentTime - 10, 0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <audio ref={audioRef} src={audio.fileUrl} preload="metadata" />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-900">{audio.title}</h3>
          <div className="text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span> /{" "}
            <span>{formatTime(duration || audio.duration)}</span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeekChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />

        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={handleSkipBackward}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-3 rounded-full bg-primary text-white hover:bg-primary/90"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          <button
            onClick={handleSkipForward}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <SkipForward size={20} />
          </button>
        </div>

        <div className="text-xs text-gray-500 flex justify-between">
          <span>Voice: {audio.voiceType}</span>
          <span>{(audio.fileSize / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
