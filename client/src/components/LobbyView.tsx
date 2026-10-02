import React, { useState } from 'react';
import { PlusCircle, LogIn, Users, ShieldCheck, Zap, Sparkles } from 'lucide-react';

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
      {/* Hero Header */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time YouTube Synchronization</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Watch Videos Together, <br className="hidden md:inline" />
          <span className="bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Perfect in Sync.
          </span>
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
          Host a watch party, share your unique room link, and enjoy synchronized playback,
          role-based permissions, live chat, and reactions.
        </p>
      </div>

      {/* Main Action Card */}
      <div className="max-w-md mx-auto bg-gray-900/90 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-gray-950/60 border-b border-gray-800">
          <button
            onClick={() => setTab('create')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
              tab === 'create'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Party</span>
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
              tab === 'join'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Join Party</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-gray-800 text-gray-100 text-sm px-3.5 py-2.5 rounded-xl border border-gray-700 focus:outline-hidden focus:border-rose-500 transition placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Custom Room Code (Optional)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={customCreateCode}
                  onChange={(e) => setCustomCreateCode(e.target.value.toUpperCase())}
                  placeholder="Leave empty for auto code"
                  className="w-full bg-gray-800 text-gray-100 text-sm px-3.5 py-2.5 rounded-xl border border-gray-700 focus:outline-hidden focus:border-rose-500 font-mono transition placeholder:text-gray-500"
                />
              </div>

              <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-800 text-xs text-gray-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  You will automatically become the <b className="text-amber-300">Room Host</b> with full control over playback, roles, and member management.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Watch Party</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Jordan"
                  className="w-full bg-gray-800 text-gray-100 text-sm px-3.5 py-2.5 rounded-xl border border-gray-700 focus:outline-hidden focus:border-indigo-500 transition placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Room Code
                </label>
                <input
                  type="text"
                  required
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PARTY1"
                  className="w-full bg-gray-800 text-gray-100 text-sm px-3.5 py-2.5 rounded-xl border border-gray-700 focus:outline-hidden focus:border-indigo-500 font-mono tracking-wider transition placeholder:text-gray-500"
                />
              </div>

              <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-800 text-xs text-gray-400 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  You will join as a <b className="text-sky-300">Participant</b>. You can request playback control anytime from the Host.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Join Watch Party</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-sm text-gray-200">Sub-second Sync</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Automatic drift detection keeps all participants locked to the exact same second.
          </p>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-sm text-gray-200">Role-Based Access</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Host, Moderator, and Participant roles with backend validation on every action.
          </p>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-sm text-gray-200">Interactive Chat & Reactions</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Chat with friends in real time and trigger floating emojis over the video screen.
          </p>
        </div>
      </div>
    </div>
  );
};
