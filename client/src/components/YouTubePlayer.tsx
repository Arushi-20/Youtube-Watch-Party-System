import React, { useEffect, useRef, useState } from 'react';
import type { SyncStatePayload, EmojiReaction, UserRole } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  syncState: SyncStatePayload;
  userRole: UserRole;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  reactions: EmojiReaction[];
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  syncState,
  userRole,
  onPlay,
  onPause,
  onSeek: _onSeek,
  onProgress,
  reactions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const isApplyingRemoteRef = useRef(false);
  const lastEmittedStateRef = useRef<number | null>(null);

  const canControl = userRole === 'host' || userRole === 'moderator';

  // Initialize YouTube Player
  useEffect(() => {
    let checkInterval: any = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        return false;
      }

      if (!containerRef.current) return false;

      // Clean up previous instance if any
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }

      const playerDiv = document.createElement('div');
      playerDiv.id = 'yt-player-iframe';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerDiv);

      playerRef.current = new window.YT.Player('yt-player-iframe', {
        height: '100%',
        width: '100%',
        videoId: syncState.videoId,
        playerVars: {
          autoplay: 1,
          controls: canControl ? 1 : 0, // Disable native controls for participants to enforce RBAC
          disablekb: canControl ? 0 : 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            // Apply initial sync state
            const targetTime = syncState.currentTime;
            event.target.seekTo(targetTime, true);
            if (syncState.playState === 'playing') {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
          },
          onStateChange: (event: any) => {
            handlePlayerStateChange(event.data);
          },
        },
      });

      return true;
    };

    if (!initPlayer()) {
      checkInterval = setInterval(() => {
        if (initPlayer()) {
          clearInterval(checkInterval);
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Update controls visibility when userRole changes
  useEffect(() => {
    // When role changes, if player is ready, reload to update controls parameter if needed
  }, [userRole]);

  // Handle local user actions in player (if allowed)
  const handlePlayerStateChange = (state: number) => {
    if (isApplyingRemoteRef.current) {
      return;
    }

    if (!canControl) {
      // Revert any unauthorized action by participants
      if (state === window.YT?.PlayerState?.PLAYING && syncState.playState === 'paused') {
        playerRef.current?.pauseVideo();
      } else if (state === window.YT?.PlayerState?.PAUSED && syncState.playState === 'playing') {
        playerRef.current?.playVideo();
      }
      return;
    }

    if (state === window.YT?.PlayerState?.PLAYING) {
      if (lastEmittedStateRef.current !== window.YT.PlayerState.PLAYING) {
        lastEmittedStateRef.current = window.YT.PlayerState.PLAYING;
        onPlay();
      }
    } else if (state === window.YT?.PlayerState?.PAUSED) {
      if (lastEmittedStateRef.current !== window.YT.PlayerState.PAUSED) {
        lastEmittedStateRef.current = window.YT.PlayerState.PAUSED;
        onPause();
      }
    }
  };

  // Sync video and playback state when syncState props change
  useEffect(() => {
    if (!isReady || !playerRef.current || !playerRef.current.getPlayerState) return;

    try {
      const player = playerRef.current;
      const currentLoadedVideo = player.getVideoData?.()?.video_id;

      isApplyingRemoteRef.current = true;

      // 1. Video ID sync
      if (currentLoadedVideo !== syncState.videoId) {
        player.loadVideoById({
          videoId: syncState.videoId,
          startSeconds: syncState.currentTime,
        });
        if (syncState.playState === 'playing') {
          player.playVideo();
        } else {
          player.pauseVideo();
        }
      } else {
        // 2. Play/Pause state sync
        const ytState = player.getPlayerState();
        if (syncState.playState === 'playing' && ytState !== window.YT.PlayerState.PLAYING) {
          player.playVideo();
        } else if (syncState.playState === 'paused' && ytState !== window.YT.PlayerState.PAUSED) {
          player.pauseVideo();
        }

        // 3. Seek / Drift sync (if drift is greater than 1.5 seconds)
        const localTime = player.getCurrentTime() || 0;
        const drift = Math.abs(localTime - syncState.currentTime);
        if (drift > 1.5) {
          player.seekTo(syncState.currentTime, true);
        }
      }

      // Reset applying remote flag after brief interval
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 500);
    } catch (err) {
      console.warn('Error applying video sync:', err);
      isApplyingRemoteRef.current = false;
    }
  }, [syncState, isReady]);

  // Periodic progress polling for custom UI seekbar
  useEffect(() => {
    const interval = setInterval(() => {
      if (isReady && playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const current = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration() || 0;
          if (onProgress) {
            onProgress(current, duration);
          }
        } catch (e) {
          // ignore
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isReady, onProgress]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group">
      {/* Player container */}
      <div ref={containerRef} className="w-full h-full pointer-events-auto" />

      {/* Role Protection Banner for Participants/Viewers */}
      {!canControl && (
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700/60 flex items-center gap-2 pointer-events-none z-20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-300 font-medium">Syncing with Host</span>
        </div>
      )}

      {/* Floating Emoji Reactions Overlay */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.xPercent}%`, bottom: '20px' }}
            className="absolute flex flex-col items-center animate-float-up"
          >
            <span className="text-4xl drop-shadow-md select-none">{r.emoji}</span>
            <span className="text-[10px] bg-black/70 text-gray-200 px-1.5 py-0.5 rounded-full mt-0.5 backdrop-blur-xs font-mono">
              {r.senderName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
