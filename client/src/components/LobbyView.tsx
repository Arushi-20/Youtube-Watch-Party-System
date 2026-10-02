import React, { useState } from 'react';
import {
  PlusCircle,
  LogIn,
  Users,
  ShieldCheck,
  Zap,
  Sparkles,
  Play,
  Heart,
  MessageSquare,
  Crown,
  Radio,
  Dices,
} from 'lucide-react';
import { PRESET_VIDEOS } from '../utils/youtube';

interface LobbyViewProps {
  initialRoomCode?: string;
  onCreateRoom: (username: string, customCode?: string) => void;
  onJoinRoom: (roomId: string, username: string) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  initialRoomCode,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [username, setUsername] = useState(
    () => localStorage.getItem('watchparty_username') || ''
  );
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [customCreateCode, setCustomCreateCode] = useState('');

  const randomNames = ['CosmicVoyager', 'NovaWatcher', 'EchoVibe', 'PixelPilot', 'AeroSync', 'LunaStream'];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    localStorage.setItem('watchparty_username', username.trim());
    onCreateRoom(username.trim(), customCreateCode.trim() || undefined);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomCode.trim()) return;
    localStorage.setItem('watchparty_username', username.trim());
    onJoinRoom(roomCode.trim().toUpperCase(), username.trim());
  };

  const handleQuickDemo = () => {
    const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
    setUsername(randomName);
    localStorage.setItem('watchparty_username', randomName);
    onCreateRoom(randomName);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden bg-grid-pattern aurora-glow flex flex-col justify-between">
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-rose-500/15 via-purple-500/15 to-indigo-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-600/10 blur-[90px] rounded-full pointer-events-none -z-10" />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16 w-full flex-1 flex flex-col justify-center">
        {/* Top Tagline */}
        <div className="text-center space-y-4 mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Real-time YouTube Synchronization • Sub-100ms Accuracy</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Watch Videos Together, <br />
            <span className="bg-gradient-to-r from-rose-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
              In Perfect Synchronization.
            </span>
          </h1>

          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Create or join private watch rooms. When the host pauses, scrubs, or changes video,
            every participant syncs in real time with interactive chat, emoji reactions, and role controls.
          </p>
        </div>

        {/* 2-Column Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto w-full">
          {/* Left Column: Create / Join Card */}
          <div className="lg:col-span-6 w-full">
            <div className="bg-gray-900/80 border border-gray-800/90 rounded-3xl shadow-2xl backdrop-blur-2xl p-6 sm:p-7 relative overflow-hidden group">
              {/* Card top decorative accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />

              {/* Segmented Switcher */}
              <div className="grid grid-cols-2 p-1 bg-gray-950/70 border border-gray-800/80 rounded-2xl mb-6">
                <button
                  onClick={() => setTab('create')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                    tab === 'create'
                      ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Room</span>
                </button>
                <button
                  onClick={() => setTab('join')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                    tab === 'join'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Join Room</span>
                </button>
              </div>

              {/* Form Content */}
              {tab === 'create' ? (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Your Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full bg-gray-950/60 text-white text-sm px-4 py-3 rounded-xl border border-gray-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-hidden transition placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Custom Room Code <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={customCreateCode}
                      onChange={(e) => setCustomCreateCode(e.target.value.toUpperCase())}
                      placeholder="Leave blank for auto code"
                      className="w-full bg-gray-950/60 text-white text-sm px-4 py-3 rounded-xl border border-gray-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-hidden font-mono tracking-wider transition placeholder:text-gray-600 uppercase"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-gray-950/40 border border-gray-800/80 text-xs text-gray-400 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      You will be the <strong className="text-amber-300">Room Host</strong> with playback controls and member role permissions.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm rounded-xl transition shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Watch Party</span>
                  </button>

                  {/* 1-Click Quick Demo Button */}
                  <div className="pt-2 border-t border-gray-800/60 text-center">
                    <button
                      type="button"
                      onClick={handleQuickDemo}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition font-medium cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Quick Demo Party (Instant 1-Click Host)</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Your Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Jordan"
                      className="w-full bg-gray-950/60 text-white text-sm px-4 py-3 rounded-xl border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden transition placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Room Code
                    </label>
                    <input
                      type="text"
                      required
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="e.g. PARTY1"
                      className="w-full bg-gray-950/60 text-white text-sm px-4 py-3 rounded-xl border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-mono tracking-widest text-center uppercase transition placeholder:text-gray-600"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-gray-950/40 border border-gray-800/80 text-xs text-gray-400 flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>
                      You will join as a <strong className="text-sky-300">Participant</strong>. You can request playback control anytime.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm rounded-xl transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Join Watch Party</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Live Feature Interactive Mockup */}
          <div className="lg:col-span-6 w-full flex flex-col gap-4">
            <div className="bg-gray-900/70 border border-gray-800/80 rounded-3xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              {/* Mock Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-800/70 mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-gray-200">Live Party Preview</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
                  <Zap className="w-3 h-3" />
                  <span>Sync: 0ms</span>
                </div>
              </div>

              {/* Mock Player Screen */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-950 border border-gray-800 group shadow-inner">
                <img
                  src={PRESET_VIDEOS[0].thumbnail}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-black/20 to-transparent" />

                {/* Floating Mock Reactions */}
                <div className="absolute bottom-12 left-10 flex flex-col items-center animate-bounce">
                  <span className="text-3xl">🔥</span>
                  <span className="text-[9px] bg-black/80 px-1.5 py-0.2 rounded-full text-gray-300 font-mono">
                    Alex
                  </span>
                </div>
                <div className="absolute bottom-16 right-16 flex flex-col items-center animate-pulse">
                  <span className="text-3xl">🍿</span>
                  <span className="text-[9px] bg-black/80 px-1.5 py-0.2 rounded-full text-gray-300 font-mono">
                    Jordan
                  </span>
                </div>

                {/* Mock Player Play Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white">
                      <Play className="w-3 h-3 fill-white ml-0.5" />
                    </span>
                    <span className="text-xs font-semibold text-white">Lofi Hip Hop Radio</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-400">03:42 / 12:00</span>
                </div>
              </div>

              {/* Mock Live Chat Snippet */}
              <div className="mt-4 space-y-2 bg-gray-950/40 p-3 rounded-2xl border border-gray-800/60">
                <div className="flex items-center gap-2 text-xs">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span className="font-semibold text-amber-300">Alex (Host):</span>
                  <span className="text-gray-300">Welcome everyone! Video is playing in sync.</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <MessageSquare className="w-3 h-3 text-sky-400" />
                  <span className="font-semibold text-sky-300">Jordan:</span>
                  <span className="text-gray-300">Loving the vibe ❤️</span>
                </div>
              </div>
            </div>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80 text-center">
                <Zap className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-gray-300 block">Sub-100ms Sync</span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80 text-center">
                <ShieldCheck className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-gray-300 block">RBAC Roles</span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80 text-center">
                <Heart className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-gray-300 block">Chat & Emojis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding Bar */}
      <footer className="border-t border-gray-800/60 py-4 px-6 text-center text-xs text-gray-500">
        <span>SyncWave Watch Party • Built with WebSockets, React & Express</span>
      </footer>
    </div>
  );
};
