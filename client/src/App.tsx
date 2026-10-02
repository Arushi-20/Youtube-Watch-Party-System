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
import { AlertCircle, ShieldAlert } from 'lucide-react';

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
      // If someone else joined, add chat notice
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
      // Remove query param from url
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
        xPercent: 15 + Math.random() * 70, // Random placement between 15% and 85%
      };
      setReactions((prev) => [...prev, newReaction]);

      // Remove after animation completes (2.5s)
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== data.id));
      }, 2500);
    });

    socket.on('control_requested', (req: ControlRequestNotification) => {
      setControlRequests((prev) => {
        if (prev.some((p) => p.requestId === req.requestId)) return prev;
        return [...prev, req];
      });
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

  const handlePlay = () => {
    socketService.play();
  };

  const handlePause = () => {
    socketService.pause();
  };

  const handleSeek = (time: number) => {
    socketService.seek(time);
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      {/* Navbar */}
      <Navbar
        roomId={roomId}
        username={username}
        userRole={userRole}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Permission Denied / Error Toast */}
      {permissionError && (
        <div className="fixed top-20 right-4 z-50 bg-rose-950 border border-rose-600 text-rose-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-xs font-medium">{permissionError}</span>
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
          <div className="flex-1 p-3 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 8 cols: Video Player & Playback Controls */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <YouTubePlayer
                syncState={syncState}
                userRole={userRole || 'participant'}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onProgress={(curr, dur) => {
                  setLocalCurrentTime(curr);
                  setDuration(dur);
                }}
                reactions={reactions}
              />

              <ControlsBar
                playState={syncState.playState}
                currentTime={localCurrentTime}
                duration={duration}
                userRole={userRole || 'participant'}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onChangeVideoClick={() => setIsChangeVideoOpen(true)}
                onRequestControl={handleRequestControl}
                controlRequested={controlRequested}
              />
            </div>

            {/* Right 4 cols: Participants & Live Chat */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-[650px] lg:h-auto">
              <div className="h-64 shrink-0">
                <ParticipantList
                  participants={participants}
                  currentUserId={userId}
                  currentUserRole={userRole || 'participant'}
                  onAssignRole={handleAssignRole}
                  onRemoveParticipant={handleRemoveParticipant}
                  onTransferHost={handleTransferHost}
                  controlRequests={controlRequests}
                  onRespondControl={handleRespondControl}
                />
              </div>

              <div className="flex-1 min-h-0">
                <ChatPanel
                  messages={chatMessages}
                  currentUserId={userId}
                  onSendMessage={handleSendMessage}
                  onSendReaction={handleSendReaction}
                />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-gray-900 border border-rose-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Removed from Party</h3>
            <p className="text-xs text-gray-400">
              You were removed from this room by the host.
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
