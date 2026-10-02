import React, { useState } from 'react';
import { X, Film, Play, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { PRESET_VIDEOS, extractYouTubeId } from '../utils/youtube';

interface ChangeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (videoId: string) => void;
  currentVideoId: string;
}

export const ChangeVideoModal: React.FC<ChangeVideoModalProps> = ({
  isOpen,
  onClose,
  onSelectVideo,
  currentVideoId,
}) => {
  const [videoInput, setVideoInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const videoId = extractYouTubeId(videoInput);
    if (!videoId) {
      setError('Please enter a valid YouTube video URL or 11-character video ID');
      return;
    }

    onSelectVideo(videoId);
    setVideoInput('');
    onClose();
  };

  const handleSelectPreset = (videoId: string) => {
    onSelectVideo(videoId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" />
            <h3 className="font-semibold text-gray-100">Change Synchronized Video</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Custom URL Input */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-medium text-gray-300">
              Paste YouTube Video URL or Video ID:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={videoInput}
                  onChange={(e) => {
                    setVideoInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-gray-800 text-gray-200 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-700 focus:outline-hidden focus:border-rose-500 transition placeholder:text-gray-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition shadow-md shrink-0 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Load</span>
              </button>
            </div>
            {error && (
              <p className="flex items-center gap-1 text-xs text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </form>

          {/* Quick Select Presets */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Or Pick a Sample Video
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_VIDEOS.map((preset) => {
                const isSelected = preset.videoId === currentVideoId;
                return (
                  <button
                    key={preset.videoId}
                    onClick={() => handleSelectPreset(preset.videoId)}
                    className={`flex items-start gap-2.5 p-2 rounded-xl text-left border transition group ${
                      isSelected
                        ? 'border-rose-500 bg-rose-950/20'
                        : 'border-gray-800 bg-gray-800/40 hover:bg-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <img
                      src={preset.thumbnail}
                      alt={preset.title}
                      className="w-16 h-11 object-cover rounded-md shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-rose-400">
                        {preset.category}
                      </span>
                      <p className="text-xs text-gray-200 font-medium line-clamp-2 leading-snug">
                        {preset.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
