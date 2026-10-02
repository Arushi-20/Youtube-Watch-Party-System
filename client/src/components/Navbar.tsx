import React, { useState } from 'react';
import { Tv, Copy, Check, LogOut, Crown, Shield, User, Share2 } from 'lucide-react';
import type { UserRole } from '../types';

interface NavbarProps {
  roomId: string | null;
  username: string;
  userRole: UserRole | null;
  onLeaveRoom: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  userRole,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!roomId) return;
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
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Host
          </span>
        );
      case 'moderator':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 bg-sky-400/10 px-2.5 py-1 rounded-full border border-sky-400/20">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            Moderator
          </span>
        );
      case 'participant':
      case 'viewer':
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700">
            <User className="w-3.5 h-3.5 text-gray-400" />
            Participant
          </span>
        );
    }
  };

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-600/30">
          <Tv className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-none">
            SyncWave
          </h1>
          <span className="text-[10px] text-gray-400 tracking-wider uppercase font-semibold">
            Watch Party
          </span>
        </div>
      </div>

      {/* Room Controls (When in Room) */}
      {roomId && (
        <div className="flex items-center gap-2 md:gap-3">
          {/* Room Code Badge */}
          <button
            onClick={handleCopyCode}
            title="Click to copy room code"
            className="flex items-center gap-1.5 bg-gray-800/80 hover:bg-gray-800 text-gray-200 text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 font-mono transition"
          >
            <span className="text-gray-400 hidden sm:inline">Room:</span>
            <span className="font-bold text-rose-400">{roomId}</span>
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>

          {/* Share Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-500/30 font-medium transition"
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
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-600/80 px-2.5 py-1.5 rounded-lg border border-rose-900/50 transition font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      )}
    </header>
  );
};
