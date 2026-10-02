import React, { useState } from 'react';
import { Play, Pause, RotateCcw, FastForward, Lock, Key, Film } from 'lucide-react';
import type { UserRole, PlayState } from '../types';
import { formatTime } from '../utils/youtube';

interface ControlsBarProps {
  playState: PlayState;
  currentTime: number;
  duration: number;
  userRole: UserRole;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onChangeVideoClick: () => void;
  onRequestControl: () => void;
  controlRequested: boolean;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  playState,
  currentTime,
  duration,
  userRole,
  onPlay,
  onPause,
  onSeek,
  onChangeVideoClick,
  onRequestControl,
  controlRequested,
}) => {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const canControl = userRole === 'host' || userRole === 'moderator';
  const isPlaying = playState === 'playing';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl) return;
    const val = parseFloat(e.target.value);
    setScrubValue(val);
  };

  const handleSliderMouseDown = () => {
    if (!canControl) return;
    setIsScrubbing(true);
    setScrubValue(currentTime);
  };

  const handleSliderMouseUp = () => {
    if (!canControl) return;
    setIsScrubbing(false);
    onSeek(scrubValue);
  };

  const displayTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
      {/* Scrubber / Timeline Slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-gray-400 w-12 text-right">
          {formatTime(displayTime)}
        </span>
        <div className="relative flex-1 flex items-center group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={displayTime}
            disabled={!canControl}
            onChange={handleSliderChange}
            onMouseDown={handleSliderMouseDown}
            onTouchStart={handleSliderMouseDown}
            onMouseUp={handleSliderMouseUp}
            onTouchEnd={handleSliderMouseUp}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all duration-150 ${
              canControl
                ? 'bg-gray-700 accent-rose-500 hover:h-2.5'
                : 'bg-gray-800/80 cursor-not-allowed opacity-60'
            }`}
            style={{
              background: `linear-gradient(to right, ${canControl ? '#ef4444' : '#4b5563'} ${progressPercent}%, #374151 ${progressPercent}%)`,
            }}
          />
        </div>
        <span className="text-xs font-mono text-gray-400 w-12">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main Buttons Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {/* Quick jump backwards 10s */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            disabled={!canControl}
            title={canControl ? 'Seek backward 10s' : 'Host/Mod only'}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play/Pause Button */}
          {isPlaying ? (
            <button
              onClick={onPause}
              disabled={!canControl}
              title={canControl ? 'Pause Party' : 'Host/Mod only'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition shadow-lg shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={!canControl}
              title={canControl ? 'Play Party' : 'Host/Mod only'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play</span>
            </button>
          )}

          {/* Quick jump forward 10s */}
          <button
            onClick={() => onSeek(currentTime + 10)}
            disabled={!canControl}
            title={canControl ? 'Seek forward 10s' : 'Host/Mod only'}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Role Request */}
        <div className="flex items-center gap-2">
          {canControl ? (
            <button
              onClick={onChangeVideoClick}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium border border-gray-700 hover:border-gray-600 transition"
            >
              <Film className="w-4 h-4 text-rose-400" />
              <span>Change Video</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-400/10 px-2.5 py-1.5 rounded-lg border border-amber-400/20 font-medium">
                <Lock className="w-3.5 h-3.5" />
                Controls Locked
              </span>
              <button
                onClick={onRequestControl}
                disabled={controlRequested}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{controlRequested ? 'Request Sent...' : 'Request Control'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
