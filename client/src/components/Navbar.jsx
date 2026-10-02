import React, { useState } from 'react';
import { Clapperboard, Copy, Check, LogOut, Crown, Shield, User, Share2 } from 'lucide-react';

export const Navbar = ({
  roomId,
  userRole,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!roomId) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const renderRoleBadge = () => {
    if (!userRole) return null;
    switch (userRole) {
      case 'host':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/25">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Host
          </span>
        );
      case 'moderator':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-300 bg-sky-400/10 px-2.5 py-1 rounded-full border border-sky-400/25">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            Moderator
          </span>
        );
      case 'participant':
      case 'viewer':
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-700/60">
            <User className="w-3.5 h-3.5 text-gray-400" />
            Participant
          </span>
        );
    }
  };

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#0c0e1b]/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-pink-400 bg-clip-text text-transparent">
          Watch Party
        </span>
      </div>

      {/* Room Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Room Code Badge */}
        <button
          onClick={handleCopyCode}
          title="Click to copy room code"
          className="flex items-center gap-1.5 bg-[#16192e] hover:bg-[#1f233d] text-gray-200 text-xs px-3 py-1.5 rounded-xl border border-white/10 font-mono transition cursor-pointer"
        >
          <span className="text-gray-400 hidden sm:inline">Room:</span>
          <span className="font-bold text-pink-400">{roomId}</span>
          {copiedCode ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        {/* Share Link Button */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-purple-200 text-xs px-3 py-1.5 rounded-xl border border-purple-500/30 font-medium transition cursor-pointer"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Copied Link!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share Link</span>
            </>
          )}
        </button>

        {/* User Role */}
        <div className="hidden sm:block">{renderRoleBadge()}</div>

        {/* Leave Button */}
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-600/80 px-3 py-1.5 rounded-xl border border-rose-900/50 transition font-medium cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </header>
  );
};
