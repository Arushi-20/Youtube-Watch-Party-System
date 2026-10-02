import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Lock,
  Key,
  Film,
  Zap,
  Maximize,
} from 'lucide-react';
import type { UserRole, PlayState } from '../types';
import { formatTime } from '../utils/youtube';

interface ControlsBarProps {
  playState: PlayState;
  currentTime: number;
  duration: number;
  userRole: UserRole;
  driftMs?: number;
  playbackRate?: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onChangeVideoClick: () => void;
  onRequestControl: () => void;
  controlRequested: boolean;
  onToggleFullscreen?: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  playState,
  currentTime,
  duration,
  userRole,
  driftMs = 0,
  playbackRate = 1.0,
  onPlay,
  onPause,
  onSeek,
  onChangeVideoClick,
  onRequestControl,
  controlRequested,
  onToggleFullscreen,
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
    <div className="bg-gray-900/80 border border-gray-800/90 rounded-2xl p-4 md:p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-3 transition-all">
      {/* High-Precision Interactive Progress Scrubber */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-medium text-gray-300 w-12 text-right">
          {formatTime(displayTime)}
        </span>
        <div className="relative flex-1 flex items-center group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.25}
            value={displayTime}
            disabled={!canControl}
            onChange={handleSliderChange}
            onMouseDown={handleSliderMouseDown}
            onTouchStart={handleSliderMouseDown}
            onMouseUp={handleSliderMouseUp}
            onTouchEnd={handleSliderMouseUp}
            className={`w-full h-2 rounded-full appearance-none cursor-pointer transition-all duration-200 ${
              canControl
                ? 'bg-gray-700/60 accent-rose-500 hover:h-3 group-hover:shadow-md'
                : 'bg-gray-800/60 cursor-not-allowed opacity-50'
            }`}
            style={{
              background: `linear-gradient(to right, ${
                canControl ? '#f43f5e' : '#6b7280'
              } ${progressPercent}%, #374151 ${progressPercent}%)`,
            }}
          />
        </div>
        <span className="text-xs font-mono font-medium text-gray-400 w-12">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick jump backwards 10s */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            disabled={!canControl}
            title={canControl ? 'Jump back 10s' : 'Host/Mod only'}
            className="p-2.5 rounded-xl bg-gray-800/60 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700/40 transition disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Primary Play/Pause Button */}
          {isPlaying ? (
            <button
              onClick={onPause}
              disabled={!canControl}
              title={canControl ? 'Pause Party' : 'Host/Mod only'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm transition shadow-lg shadow-rose-600/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={!canControl}
              title={canControl ? 'Play Party' : 'Host/Mod only'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play</span>
            </button>
          )}

          {/* Quick jump forward 10s */}
          <button
            onClick={() => onSeek(currentTime + 10)}
            disabled={!canControl}
            title={canControl ? 'Jump ahead 10s' : 'Host/Mod only'}
            className="p-2.5 rounded-xl bg-gray-800/60 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700/40 transition disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Real-time Sub-second Sync Diagnostic Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-950/60 border border-gray-800 text-[11px] font-mono text-gray-400">
            <Zap className={`w-3.5 h-3.5 ${Math.abs(driftMs) < 250 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>Sync: <strong className="text-gray-200">{Math.abs(driftMs)}ms</strong></span>
            {playbackRate !== 1.0 && (
              <span className="text-indigo-400 font-bold ml-1">({playbackRate}x catch-up)</span>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {canControl ? (
            <button
              onClick={onChangeVideoClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-800 to-gray-850 hover:from-gray-700 hover:to-gray-800 text-gray-100 text-xs md:text-sm font-semibold border border-gray-700 hover:border-gray-600 shadow-md transition active:scale-95 cursor-pointer"
            >
              <Film className="w-4 h-4 text-rose-400" />
              <span>Change Video</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-amber-300/90 bg-amber-400/10 px-3 py-2 rounded-xl border border-amber-400/20 font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Controls Locked</span>
              </span>
              <button
                onClick={onRequestControl}
                disabled={controlRequested}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{controlRequested ? 'Requested...' : 'Request Control'}</span>
              </button>
            </div>
          )}

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              title="Fullscreen Video"
              className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60 shadow-md transition active:scale-95 cursor-pointer"
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
