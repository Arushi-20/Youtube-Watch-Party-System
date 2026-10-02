import { useState, useEffect, useRef } from 'react';
import { socketService } from './services/socket';
import { Navbar } from './components/Navbar';
import { LobbyView } from './components/LobbyView';
import { YouTubePlayer } from './components/YouTubePlayer';
import { ControlsBar } from './components/ControlsBar';
import { RoomSidebar } from './components/RoomSidebar';
import { ChangeVideoModal } from './components/ChangeVideoModal';
import { getVideoTitle } from './utils/youtube';
import { AlertCircle, ShieldAlert, Zap } from 'lucide-react';

export function App() {
  // Navigation & User State
  const [roomId, setRoomId] = useState(null);
  const [username, setUsername] = useState('');
  const [userId] = useState(() => {
    const saved = sessionStorage.getItem('watchparty_userId');
    if (saved) return saved;
    const newId = 'usr_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('watchparty_userId', newId);
    return newId;
  });
  const [userRole, setUserRole] = useState(null);

  // Video & Playback State
  const [syncState, setSyncState] = useState({
    playState: 'paused',
    currentTime: 0,
    videoId: 'jfKfPfyJRdk', // Default Lofi
  });
  const [duration, setDuration] = useState(0);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);

  // Lag & Drift Diagnostics
  const [driftMs, setDriftMs] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Room Data
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [controlRequests, setControlRequests] = useState([]);
  const [controlRequested, setControlRequested] = useState(false);

  // Modals & Alerts
  const [isChangeVideoOpen, setIsChangeVideoOpen] = useState(false);
  const [kickedModal, setKickedModal] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  // Player Fullscreen ref (fullscreen applies ONLY to the video player container)
  const playerWrapperRef = useRef(null);

  // Check URL query parameters for direct invite link
  const [urlRoomCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || undefined;
  });

  const errorTimeoutRef = useRef(null);

  const showErrorToast = (msg) => {
    setPermissionError(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setPermissionError(null);
    }, 4000);
  };

  // Setup WebSocket Listeners
  useEffect(() => {
    const socket = socketService.connect();

    socket.on('joined_successfully', (data) => {
      setRoomId(data.roomId);
      setUserRole(data.role);
      setUsername(data.username);
      setSyncState(data.syncState);
      setParticipants(data.participants);
      if (data.chatHistory) {
        setChatMessages(data.chatHistory);
      }

      // Update URL query string without reloading
      const url = new URL(window.location.href);
      url.searchParams.set('room', data.roomId);
      window.history.pushState({}, '', url.toString());
    });

    socket.on('sync_state', (newSyncState) => {
      setSyncState(newSyncState);
    });

    socket.on('user_joined', (data) => {
      setParticipants(data.participants);
      if (data.userId !== userId) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}-${Math.random()}`,
            senderId: 'system',
            senderName: 'System',
            senderRole: 'viewer',
            text: `${data.username} joined the party as ${data.role}`,
            timestamp: Date.now(),
          },
        ]);
      }
    });

    socket.on('user_left', (data) => {
      setParticipants(data.participants);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}-${Math.random()}`,
          senderId: 'system',
          senderName: 'System',
          senderRole: 'viewer',
          text: `${data.username} left the party`,
          timestamp: Date.now(),
        },
      ]);
    });

    socket.on('role_assigned', (data) => {
      setParticipants(data.participants);
      if (data.userId === userId) {
        setUserRole(data.role);
        setControlRequested(false);
      }
      setChatMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}-${Math.random()}`,
          senderId: 'system',
          senderName: 'System',
          senderRole: 'viewer',
          text: `${data.username} is now a ${data.role}`,
          timestamp: Date.now(),
        },
      ]);
    });

    socket.on('participant_removed', (data) => {
      setParticipants(data.participants);
    });

    socket.on('kicked', () => {
      setKickedModal(true);
      setRoomId(null);
      setUserRole(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.pushState({}, '', url.toString());
    });

    socket.on('chat_message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('reaction', (data) => {
      const newReaction = {
        id: data.id,
        emoji: data.emoji,
        senderName: data.senderName,
        xPercent: 15 + Math.random() * 70,
      };
      setReactions((prev) => [...prev, newReaction]);

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== data.id));
      }, 2500);
    });

    socket.on('control_requested', (req) => {
      setControlRequests((prev) => {
        if (prev.some((p) => p.requestId === req.requestId)) return prev;
        return [...prev, req];
      });
    });

    socket.on('control_request_sent', () => {
      setControlRequested(true);
    });

    socket.on('permission_denied', (err) => {
      showErrorToast(err.error || 'Permission denied for this action.');
    });

    socket.on('error_message', (err) => {
      showErrorToast(err.message || 'An error occurred.');
    });

    return () => {
      socket.off('joined_successfully');
      socket.off('sync_state');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('role_assigned');
      socket.off('participant_removed');
      socket.off('kicked');
      socket.off('chat_message');
      socket.off('reaction');
      socket.off('control_requested');
      socket.off('control_request_sent');
      socket.off('permission_denied');
      socket.off('error_message');
    };
  }, [userId]);

  // Actions
  const handleCreateRoom = (name, customCode) => {
    setUsername(name);
    socketService.joinRoom(customCode || '', name, userId);
  };

  const handleJoinRoom = (targetRoomId, name) => {
    setUsername(name);
    socketService.joinRoom(targetRoomId, name, userId);
  };

  const handleLeaveRoom = () => {
    if (roomId) {
      socketService.leaveRoom(roomId);
    }
    setRoomId(null);
    setUserRole(null);
    setControlRequests([]);
    setControlRequested(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  };

  const handlePlay = (time) => {
    socketService.play(time);
  };

  const handlePause = (time) => {
    socketService.pause(time);
  };

  const handleSeek = (time) => {
    socketService.seek(time);
  };

  const handleSyncTime = (currentTime) => {
    socketService.syncTime(currentTime);
  };

  const handleChangeVideo = (newVideoId) => {
    socketService.changeVideo(newVideoId);
  };

  const handleAssignRole = (targetUserId, role) => {
    socketService.assignRole(targetUserId, role);
  };

  const handleRemoveParticipant = (targetUserId) => {
    socketService.removeParticipant(targetUserId);
  };

  const handleTransferHost = (targetUserId) => {
    socketService.transferHost(targetUserId);
  };

  const handleSendMessage = (text) => {
    socketService.sendChatMessage(text);
  };

  const handleSendReaction = (emoji) => {
    socketService.sendReaction(emoji);
  };

  const handleRequestControl = () => {
    socketService.requestControl();
  };

  const handleRespondControl = (requestId, approve) => {
    socketService.respondControl(requestId, approve);
    setControlRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  // Fullscreen toggle for video player only
  const handleToggleFullscreen = () => {
    if (!playerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      playerWrapperRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-[#070913] text-gray-100 selection:bg-pink-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        roomId={roomId}
        username={username}
        userRole={userRole}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Permission Denied / Error Toast */}
      {permissionError && (
        <div className="fixed top-20 right-4 z-50 bg-rose-950/90 border border-rose-600/80 text-rose-100 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-xs font-semibold">{permissionError}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {!roomId ? (
          <div className="flex-1 overflow-y-auto">
            <LobbyView
              initialRoomCode={urlRoomCode}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden p-2.5 sm:p-3 md:p-4 max-w-[1700px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
            {/* Left 8 cols: Video + Controls */}
            <div className="lg:col-span-8 flex flex-col justify-between h-full overflow-hidden gap-2.5">
              {/* Compact Video Header Bar */}
              <div className="bg-[#111324]/80 border border-white/[0.08] rounded-xl px-4 py-2 shadow-sm backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-400 text-xs font-semibold shrink-0">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                    <span>Now Playing</span>
                  </div>
                  <h2 className="text-xs md:text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
                    {getVideoTitle(syncState.videoId)}
                  </h2>
                </div>

                {/* Sub-second Sync Drift Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-950/70 border border-white/[0.08] text-[11px] font-mono text-gray-300 shrink-0">
                  <Zap
                    className={`w-3.5 h-3.5 ${
                      Math.abs(driftMs) < 200 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  />
                  <span>
                    Sync:{' '}
                    <strong className="text-gray-100">
                      {Math.abs(driftMs)}ms
                    </strong>
                  </span>
                </div>
              </div>

              {/* Player wrapper (Fits available space without pushing screen or cutting video) */}
              <div className="flex-1 min-h-[220px] w-full flex items-center justify-center overflow-hidden [container-type:size]">
                <YouTubePlayer
                  playerWrapperRef={playerWrapperRef}
                  syncState={syncState}
                  userRole={userRole || 'participant'}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeek={handleSeek}
                  onSyncTime={handleSyncTime}
                  onProgress={(curr, dur) => {
                    setLocalCurrentTime(curr);
                    setDuration(dur);
                  }}
                  onDriftReport={(drift, rate) => {
                    setDriftMs(drift);
                    setPlaybackRate(rate);
                  }}
                  reactions={reactions}
                />
              </div>

              {/* Controls Bar (With Video Fullscreen toggle) */}
              <div className="shrink-0">
                <ControlsBar
                  playState={syncState.playState}
                  currentTime={localCurrentTime}
                  duration={duration}
                  userRole={userRole || 'participant'}
                  driftMs={driftMs}
                  playbackRate={playbackRate}
                  onPlay={() => handlePlay(localCurrentTime)}
                  onPause={() => handlePause(localCurrentTime)}
                  onSeek={handleSeek}
                  onChangeVideoClick={() => setIsChangeVideoOpen(true)}
                  onRequestControl={handleRequestControl}
                  controlRequested={controlRequested}
                  onToggleFullscreen={handleToggleFullscreen}
                />
              </div>
            </div>

            {/* Right 4 cols: Combined Sidebar (In this room + Chat stacked) */}
            <div className="lg:col-span-4 h-full overflow-hidden flex flex-col">
              <RoomSidebar
                participants={participants}
                messages={chatMessages}
                currentUserId={userId}
                currentUserRole={userRole || 'participant'}
                controlRequests={controlRequests}
                onSendMessage={handleSendMessage}
                onSendReaction={handleSendReaction}
                onAssignRole={handleAssignRole}
                onRemoveParticipant={handleRemoveParticipant}
                onTransferHost={handleTransferHost}
                onRespondControl={handleRespondControl}
              />
            </div>
          </div>
        )}
      </main>

      {/* Change Video Modal */}
      <ChangeVideoModal
        isOpen={isChangeVideoOpen}
        onClose={() => setIsChangeVideoOpen(false)}
        onSelectVideo={handleChangeVideo}
        currentVideoId={syncState.videoId}
      />

      {/* Kicked Alert Modal */}
      {kickedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121424] border border-rose-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Removed from Party</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              You have been removed from this room by the host.
            </p>
            <button
              onClick={() => setKickedModal(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
