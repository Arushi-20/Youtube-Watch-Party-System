import React, { useEffect, useRef, useState } from 'react';

export const YouTubePlayer = ({
  playerWrapperRef,
  syncState,
  userRole,
  onPlay,
  onPause,
  onSeek: _onSeek,
  onSyncTime,
  onProgress,
  onDriftReport,
  onUnauthorizedClick,
  reactions,
}) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [dimensions, setDimensions] = useState(null);
  const isApplyingRemoteRef = useRef(false);
  const lastEmittedStateRef = useRef(null);

  const canControl = userRole === 'host' || userRole === 'moderator';

  // Responsive Containment: Dynamically calculate optimal 16:9 dimensions to fit inside parent container without clipping
  useEffect(() => {
    const parent = playerWrapperRef?.current?.parentElement;
    if (!parent) return;

    const updateSize = () => {
      if (document.fullscreenElement) {
        setDimensions(null);
        return;
      }
      const pw = parent.clientWidth;
      const ph = parent.clientHeight;
      const isDesktop = window.innerWidth >= 1024;

      if (isDesktop && pw > 0 && ph > 0) {
        // Desktop full viewport: fit within available parent dimensions preserving 16:9 aspect ratio
        const targetW = Math.min(pw, ph * (16 / 9));
        const targetH = targetW * (9 / 16);
        setDimensions({
          width: Math.floor(targetW),
          height: Math.floor(targetH),
        });
      } else {
        // Split-screen / tablet / mobile: natural full width with aspect-video (16:9)
        setDimensions(null);
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(parent);
    document.addEventListener('fullscreenchange', updateSize);

    return () => {
      observer.disconnect();
      document.removeEventListener('fullscreenchange', updateSize);
    };
  }, [playerWrapperRef]);

  // Initialize YouTube Player
  useEffect(() => {
    let checkInterval = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        return false;
      }

      if (!containerRef.current) return false;

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
          controls: canControl ? 1 : 0,
          disablekb: canControl ? 0 : 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
          enablejsapi: 1,
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            const targetTime = syncState.currentTime;
            event.target.seekTo(targetTime, true);
            if (syncState.playState === 'playing') {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
          },
          onStateChange: (event) => {
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
      }, 150);
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

  // Handle local user actions in player
  const handlePlayerStateChange = (state) => {
    if (isApplyingRemoteRef.current) {
      return;
    }

    const player = playerRef.current;
    const localTime = player?.getCurrentTime ? player.getCurrentTime() : 0;

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
        onPlay(localTime);
      }
    } else if (state === window.YT?.PlayerState?.PAUSED) {
      if (lastEmittedStateRef.current !== window.YT.PlayerState.PAUSED) {
        lastEmittedStateRef.current = window.YT.PlayerState.PAUSED;
        onPause(localTime);
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
        if (syncState.playState === 'playing') {
          if (ytState !== window.YT.PlayerState.PLAYING && ytState !== window.YT.PlayerState.BUFFERING) {
            player.playVideo();
          }
        } else if (syncState.playState === 'paused') {
          if (ytState !== window.YT.PlayerState.PAUSED) {
            player.pauseVideo();
            player.seekTo(syncState.currentTime, true);
          }
        }

        // 3. Natural Drift Compensation
        // Only perform hard seek if drift is truly significant (>2.5s)
        // This eliminates false buffering freezes and prevents the pause icon/overlay from showing
        const localTime = player.getCurrentTime() || 0;
        const diff = syncState.currentTime - localTime;
        const absDrift = Math.abs(diff);

        if (absDrift > 2.5 && syncState.playState === 'playing') {
          player.seekTo(syncState.currentTime, true);
        }

        if (onDriftReport) {
          onDriftReport(Math.round(diff * 1000), 1.0);
        }
      }

      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 350);
    } catch (err) {
      console.warn('Error applying video sync:', err);
      isApplyingRemoteRef.current = false;
    }
  }, [syncState, isReady]);

  // Periodic Host Sync Pulse & Scrubber Progress
  useEffect(() => {
    const interval = setInterval(() => {
      if (isReady && playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const current = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration() || 0;

          if (onProgress) {
            onProgress(current, duration);
          }

          // Authoritative heartbeat pulse from Host/Mod every 3.5s keeps all clients smoothly aligned without spamming seeks
          if (canControl && syncState.playState === 'playing' && onSyncTime) {
            onSyncTime(current);
          }
        } catch (e) {
          // ignore
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isReady, canControl, syncState.playState, onProgress, onSyncTime]);

  return (
    <div
      ref={playerWrapperRef}
      style={{
        width: dimensions ? `${dimensions.width}px` : '100%',
        height: dimensions ? `${dimensions.height}px` : 'auto',
      }}
      className="relative aspect-video w-full max-w-full max-h-full bg-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-gray-800/80 group shrink-0 fullscreen:w-screen fullscreen:h-screen fullscreen:max-w-none fullscreen:max-h-none fullscreen:rounded-none"
    >
      {/* Ambient Glow Backdrop */}
      <div className="absolute -inset-1 bg-gradient-to-r from-rose-600/20 via-purple-600/20 to-indigo-600/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000 pointer-events-none -z-10" />

      {/* Player container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-auto [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:block [&>iframe]:border-0"
      />

      {/* Click-Blocker Shield for Participants & Viewers (Prevents pausing or stopping video) */}
      {!canControl && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onUnauthorizedClick) {
              onUnauthorizedClick();
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute inset-0 z-10 w-full h-full cursor-not-allowed select-none bg-transparent"
          title="Playback controls are locked for participants. Only Host and Moderators can play or pause."
        />
      )}

      {/* Role Protection Banner for Participants/Viewers */}
      {!canControl && (
        <div className="absolute top-4 left-4 bg-gray-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700/60 flex items-center gap-2 pointer-events-none z-20 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-200 font-medium tracking-wide">
            Synced with Host
          </span>
        </div>
      )}

      {/* Floating Emoji Reactions Overlay */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.xPercent}%`, bottom: '24px' }}
            className="absolute flex flex-col items-center animate-float-up pointer-events-none"
          >
            <span className="text-4xl md:text-5xl drop-shadow-lg select-none filter">
              {r.emoji}
            </span>
            <span className="text-[10px] bg-gray-950/80 text-gray-100 px-2 py-0.5 rounded-full mt-1 backdrop-blur-md font-mono border border-gray-700/50 shadow-md">
              {r.senderName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
