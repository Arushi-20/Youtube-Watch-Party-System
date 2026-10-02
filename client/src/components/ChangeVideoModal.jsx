import React, { useState } from 'react';
import { X, Film, Play, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { extractYouTubeId } from '../utils/youtube';

export const ChangeVideoModal = ({
  isOpen,
  onClose,
  onSelectVideo,
}) => {
  const [videoInput, setVideoInput] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#121424] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Change Synchronized Video</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Paste YouTube Video URL or Video ID:
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={videoInput}
                  onChange={(e) => {
                    setVideoInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-[#181a2e] text-white text-xs pl-9 pr-3 py-3 rounded-xl border border-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden transition placeholder:text-gray-500"
                />
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Load Video</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
