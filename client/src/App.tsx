import { useState, useEffect, useRef } from 'react';
import { socketService } from './services/socket';
import type {
  UserRole,
  SyncStatePayload,
  ParticipantData,
  ChatMessage,
  EmojiReaction,
  ControlRequestNotification,
} from './types';
import { Navbar } from './components/Navbar';
import { LobbyView } from './components/LobbyView';
import { YouTubePlayer } from './components/YouTubePlayer';
import { ControlsBar } from './components/ControlsBar';
import { ParticipantList } from './components/ParticipantList';
import { ChatPanel } from './components/ChatPanel';
import { ChangeVideoModal } from './components/ChangeVideoModal';
import { getVideoTitle } from './utils/youtube';
import {
  AlertCircle,
  ShieldAlert,
  MessageSquare,
  Users,
  Maximize2,
  Minimize2,
  Share2,
  Check,
  Sparkles,
  Zap,
} from 'lucide-react';

export function App() {
  // Navigation & User State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [userId] = useState<string>(() => {
    const saved = sessionStorage.getItem('watchparty_userId');
    if (saved) return saved;
    const newId = 'usr_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('watchparty_userId', newId);
    return newId;
  });
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Video & Playback State
  const [syncState, setSyncState] = useState<SyncStatePayload>({
    playState: 'paused',
    currentTime: 0,
    videoId: 'jfKfPfyJRdk', // Default Lofi
  });
  const [duration, setDuration] = useState<number>(0);
  const [localCurrentTime, setLocalCurrentTime] = useState<number>(0);

  // Lag & Drift Diagnostics
  const [driftMs, setDriftMs] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // UI Modes & Tabs
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Room Data
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [controlRequests, setControlRequests] = useState<ControlRequestNotification[]>([]);
  const [controlRequested, setControlRequested] = useState<boolean>(false);

  // Modals & Alerts
  const [isChangeVideoOpen, setIsChangeVideoOpen] = useState<boolean>(false);
  const [kickedModal, setKickedModal] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Check URL query parameters for direct invite link
  const [urlRoomCode] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || undefined;
  });

  const errorTimeoutRef = useRef<any>(null);

  const showErrorToast = (msg: string) => {
    setPermissionError(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setPermissionError(null);
    }, 4000);
  };

  // Setup WebSocket Listeners
  useEffect(() => {
    const socket = socketService.connect();

    socket.on('joined_successfully', (data: any) => {
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

    socket.on('sync_state', (newSyncState: SyncStatePayload) => {
      setSyncState(newSyncState);
    });

    socket.on('user_joined', (data: any) => {
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

    socket.on('user_left', (data: any) => {
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

    socket.on('role_assigned', (data: any) => {
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

    socket.on('participant_removed', (data: any) => {
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

    socket.on('chat_message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('reaction', (data: any) => {
      const newReaction: EmojiReaction = {
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

    socket.on('control_requested', (req: ControlRequestNotification) => {
      setControlRequests((prev) => {
        if (prev.some((p) => p.requestId === req.requestId)) return prev;
        return [...prev, req];
      });
      // Automatically switch to members tab if host/mod to approve easily
      setActiveTab('members');
    });

    socket.on('control_request_sent', () => {
      setControlRequested(true);
    });

    socket.on('permission_denied', (err: any) => {
      showErrorToast(err.error || 'Permission denied for this action.');
    });

    socket.on('error_message', (err: any) => {
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
  const handleCreateRoom = (name: string, customCode?: string) => {
    setUsername(name);
    socketService.joinRoom(customCode || '', name, userId);
  };

  const handleJoinRoom = (targetRoomId: string, name: string) => {
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

  const handlePlay = (time?: number) => {
    socketService.play(time);
  };

  const handlePause = (time?: number) => {
    socketService.pause(time);
  };

  const handleSeek = (time: number) => {
    socketService.seek(time);
  };

  const handleSyncTime = (currentTime: number) => {
    socketService.syncTime(currentTime);
  };

  const handleChangeVideo = (newVideoId: string) => {
    socketService.changeVideo(newVideoId);
  };

  const handleAssignRole = (targetUserId: string, role: UserRole) => {
    socketService.assignRole(targetUserId, role);
  };

  const handleRemoveParticipant = (targetUserId: string) => {
    socketService.removeParticipant(targetUserId);
  };

  const handleTransferHost = (targetUserId: string) => {
    socketService.transferHost(targetUserId);
  };

  const handleSendMessage = (text: string) => {
    socketService.sendChatMessage(text);
  };

  const handleSendReaction = (emoji: string) => {
    socketService.sendReaction(emoji);
  };

  const handleRequestControl = () => {
    socketService.requestControl();
  };

  const handleRespondControl = (requestId: string, approve: boolean) => {
    socketService.respondControl(requestId, approve);
    setControlRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  const handleCopyShareLink = () => {
    if (!roomId) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isModOrHost = userRole === 'host' || userRole === 'moderator';

  return (
    <div className="min-h-screen flex flex-col bg-[#070b13] text-gray-100 selection:bg-rose-500 selection:text-white">
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
      <main className="flex-1 flex flex-col">
        {!roomId ? (
          <LobbyView
            initialRoomCode={urlRoomCode}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        ) : (
          <div className="flex-1 p-3 md:p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-4">
            {/* Video Header Bar */}
            <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-md flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>Now Playing</span>
                </div>
                <h2 className="text-sm md:text-base font-bold text-white truncate max-w-md md:max-w-xl">
                  {getVideoTitle(syncState.videoId)}
                </h2>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2">
                {/* Drift / Sync Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-950/70 border border-gray-800 text-xs font-mono text-gray-300">
                  <Zap className={`w-3.5 h-3.5 ${Math.abs(driftMs) < 200 ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="hidden sm:inline">Drift:</span>
                  <span className="font-bold text-gray-200">{Math.abs(driftMs)}ms</span>
                </div>

                {/* Share Link Shortcut */}
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Invite Friends</span>
                    </>
                  )}
                </button>

                {/* Theater Mode Toggle */}
                <button
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  title={isTheaterMode ? 'Exit Theater Mode' : 'Enter Theater Mode'}
                  className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60 transition active:scale-95 cursor-pointer"
                >
                  {isTheaterMode ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Dashboard Grid Layout */}
            <div
              className={`grid gap-5 flex-1 transition-all ${
                isTheaterMode
                  ? 'grid-cols-1'
                  : 'grid-cols-1 lg:grid-cols-12'
              }`}
            >
              {/* Left Column: Player & Controls Bar */}
              <div
                className={`flex flex-col gap-4 ${
                  isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-8'
                }`}
              >
                <YouTubePlayer
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
                />
              </div>

              {/* Right Column: Unified Right Sidebar (Chat & Members) */}
              <div
                className={`flex flex-col ${
                  isTheaterMode
                    ? 'lg:col-span-12 mt-2 h-[550px]'
                    : 'lg:col-span-4 xl:col-span-4 h-[650px] lg:h-[calc(100vh-160px)] min-h-[500px]'
                }`}
              >
                <div className="bg-gray-900/80 border border-gray-800/90 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col h-full overflow-hidden">
                  {/* Segmented Tab Switcher */}
                  <div className="p-2 border-b border-gray-800/80 bg-gray-950/40 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer ${
                        activeTab === 'chat'
                          ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/30'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Live Chat</span>
                      {chatMessages.length > 0 && (
                        <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">
                          {chatMessages.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('members')}
                      className={`relative flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer ${
                        activeTab === 'members'
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Members</span>
                      <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">
                        {participants.length}
                      </span>
                      {controlRequests.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                      )}
                    </button>
                  </div>

                  {/* Persistent Control Request Alert (if any pending) */}
                  {isModOrHost && controlRequests.length > 0 && (
                    <div className="p-2.5 bg-indigo-950/80 border-b border-indigo-700/50 flex items-center justify-between gap-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-200">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span className="font-semibold">{controlRequests[0].username}</span>
                        <span className="text-gray-300">wants controls</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRespondControl(controlRequests[0].requestId, true)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRespondControl(controlRequests[0].requestId, false)}
                          className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] transition cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active Tab View */}
                  <div className="flex-1 min-h-0">
                    {activeTab === 'chat' ? (
                      <ChatPanel
                        messages={chatMessages}
                        currentUserId={userId}
                        hideHeader={true}
                        onSendMessage={handleSendMessage}
                        onSendReaction={handleSendReaction}
                      />
                    ) : (
                      <ParticipantList
                        participants={participants}
                        currentUserId={userId}
                        currentUserRole={userRole || 'participant'}
                        hideHeader={true}
                        onAssignRole={handleAssignRole}
                        onRemoveParticipant={handleRemoveParticipant}
                        onTransferHost={handleTransferHost}
                        controlRequests={controlRequests}
                        onRespondControl={handleRespondControl}
                      />
                    )}
                  </div>
                </div>
              </div>
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
          <div className="bg-gray-900 border border-rose-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
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
