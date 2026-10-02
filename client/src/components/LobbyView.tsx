import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  Zap,
  Shield,
  MessageSquare,
  PlusCircle,
  LogIn,
  Dices,
} from 'lucide-react';

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

  const randomNames = [
    'Alex',
    'Jordan',
    'Taylor',
    'Morgan',
    'Sam',
    'CosmicVoyager',
    'NovaWatcher',
    'EchoVibe',
  ];

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
    <div className="relative min-h-screen w-full bg-[#090b16] text-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden selection:bg-pink-500 selection:text-white">
      {/* Aurora Ambient Lighting Blobs */}
      <div className="absolute top-0 left-0 w-[550px] h-[550px] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-pink-600/18 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Main 2-Column Hero Grid */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Side: Brand, Headline, & Feature Cards */}
        <div className="lg:col-span-7 flex flex-col items-start gap-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Clapperboard className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-pink-300 tracking-tight">
              Watch Party
            </span>
          </div>

          {/* Subtitle Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Real-time YouTube sync</span>
          </div>

          {/* Large Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-white tracking-tight leading-[1.12]">
            Watch together, <br />
            <span className="bg-gradient-to-r from-purple-300 via-purple-200 to-pink-400 bg-clip-text text-transparent">
              wherever you are.
            </span>
          </h1>

          {/* Description */}
          <p className="text-gray-300/90 text-sm sm:text-base max-w-xl leading-relaxed">
            Create a room, share the link, and everyone's video plays in perfect sync,
            with roles, requests and live chat.
          </p>

          {/* 3 Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2">
            {/* Card 1: Instant sync */}
            <div className="p-4 rounded-2xl bg-[#131525]/80 hover:bg-[#181a30]/90 border border-white/[0.08] hover:border-purple-500/30 transition-all duration-200 flex flex-col gap-1.5 shadow-lg shadow-black/20 group">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition duration-200">
                <Zap className="w-4 h-4 fill-orange-400/20" />
              </div>
              <h4 className="font-bold text-sm text-white mt-1">Instant sync</h4>
              <p className="text-xs text-gray-400 leading-snug">
                Play, pause and seek for all
              </p>
            </div>

            {/* Card 2: Roles */}
            <div className="p-4 rounded-2xl bg-[#131525]/80 hover:bg-[#181a30]/90 border border-white/[0.08] hover:border-purple-500/30 transition-all duration-200 flex flex-col gap-1.5 shadow-lg shadow-black/20 group">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition duration-200">
                <Shield className="w-4 h-4 fill-sky-400/20" />
              </div>
              <h4 className="font-bold text-sm text-white mt-1">Roles</h4>
              <p className="text-xs text-gray-400 leading-snug">
                Host, moderator, participant
              </p>
            </div>

            {/* Card 3: Live chat */}
            <div className="p-4 rounded-2xl bg-[#131525]/80 hover:bg-[#181a30]/90 border border-white/[0.08] hover:border-purple-500/30 transition-all duration-200 flex flex-col gap-1.5 shadow-lg shadow-black/20 group">
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:scale-110 transition duration-200">
                <MessageSquare className="w-4 h-4 fill-pink-400/20" />
              </div>
              <h4 className="font-bold text-sm text-white mt-1">Live chat</h4>
              <p className="text-xs text-gray-400 leading-snug">
                React as you watch
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: The "Get started" Glassmorphic Card */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-[#121424]/90 border border-white/10 rounded-3xl p-7 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 relative overflow-hidden">
            {/* Top decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500" />

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
                Get started
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Pick a name and jump in.
              </p>
            </div>

            {/* Segmented Switcher for Create vs Join */}
            <div className="grid grid-cols-2 p-1 bg-[#1a1d33] border border-white/[0.06] rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setTab('create')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer ${
                  tab === 'create'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Room</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('join')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer ${
                  tab === 'join'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join Room</span>
              </button>
            </div>

            {/* Form */}
            {tab === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    What should everyone call you? <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#171a2e] text-white text-sm px-4 py-3 rounded-xl border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden transition placeholder:text-gray-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Custom Room Code <span className="text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={customCreateCode}
                    onChange={(e) => setCustomCreateCode(e.target.value.toUpperCase())}
                    placeholder="Leave empty for auto code"
                    className="w-full bg-[#171a2e] text-white text-sm px-4 py-3 rounded-xl border border-white/[0.08] focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden font-mono tracking-wider transition placeholder:text-gray-500 uppercase shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 transition active:scale-[0.98] cursor-pointer"
                >
                  Continue
                </button>

                {/* 1-Click Quick Demo */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-pink-300 transition font-medium cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Quick Demo Party (Instant 1-Click Host)</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    What should everyone call you? <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#171a2e] text-white text-sm px-4 py-3 rounded-xl border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden transition placeholder:text-gray-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Room Code <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PARTY1"
                    className="w-full bg-[#171a2e] text-white text-sm px-4 py-3 rounded-xl border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden font-mono tracking-widest text-center uppercase transition placeholder:text-gray-500 shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 transition active:scale-[0.98] cursor-pointer"
                >
                  Continue
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
