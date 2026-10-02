import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  UserMinus,
  ArrowUpRight,
  ArrowDownLeft,
  Crown,
  Sparkles,
} from 'lucide-react';

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '👏', '🍿', '🚀', '🎉'];

export const RoomSidebar = ({
  participants,
  messages,
  currentUserId,
  currentUserRole,
  controlRequests,
  onSendMessage,
  onSendReaction,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost,
  onRespondControl,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeMenuUserId, setActiveMenuUserId] = useState(null);
  const messagesEndRef = useRef(null);

  const isHost = currentUserRole === 'host';
  const isModOrHost = currentUserRole === 'host' || currentUserRole === 'moderator';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'host':
        return (
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black tracking-wider shadow-sm">
            HOST
          </span>
        );
      case 'moderator':
        return (
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 text-black tracking-wider shadow-sm">
            MOD
          </span>
        );
      case 'participant':
      case 'viewer':
      default:
        return (
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700/60 tracking-wider">
            MEMBER
          </span>
        );
    }
  };

  const getAvatarBg = (username) => {
    const colors = [
      'bg-orange-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-indigo-600',
      'bg-teal-600',
      'bg-emerald-600',
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden select-none">
      {/* 1. TOP CARD: In this room (N) */}
      <div className="bg-[#111324]/90 border border-white/[0.08] rounded-2xl p-4 shadow-xl flex flex-col shrink-0 max-h-48 backdrop-blur-md">
        <h3 className="font-bold text-sm text-white mb-2.5 flex items-center justify-between">
          <span>In this room ({participants.length})</span>
        </h3>

        {/* Pending Control Requests (Visible to Host/Moderator) */}
        {isModOrHost && controlRequests.length > 0 && (
          <div className="mb-2 p-2 rounded-xl bg-purple-950/70 border border-purple-500/40 flex items-center justify-between gap-2">
            <div className="text-[11px] text-purple-200 truncate">
              <Sparkles className="w-3 h-3 text-amber-400 inline mr-1 animate-pulse" />
              <strong>{controlRequests[0].username}</strong> wants controls
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onRespondControl(controlRequests[0].requestId, true)}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
              >
                Approve
              </button>
              <button
                onClick={() => onRespondControl(controlRequests[0].requestId, false)}
                className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] cursor-pointer"
              >
                Deny
              </button>
            </div>
          </div>
        )}

        {/* Participants scrollable list */}
        <div className="overflow-y-auto space-y-2 pr-1 flex-1">
          {participants.map((p) => {
            const isMe = p.id === currentUserId;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/[0.04] transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full ${getAvatarBg(
                      p.username
                    )} flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-sm`}
                  >
                    {p.username.charAt(0)}
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm font-semibold text-white truncate">
                      {p.username}
                    </span>
                    {isMe && (
                      <span className="text-xs text-gray-400 font-normal">
                        (you)
                      </span>
                    )}
                    <div>{getRoleBadge(p.role)}</div>
                  </div>
                </div>

                {/* Host Actions Menu */}
                {isHost && !isMe && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuUserId(activeMenuUserId === p.id ? null : p.id)
                      }
                      className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-850 transition cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuUserId === p.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-[#1a1d33] border border-white/10 rounded-xl shadow-2xl py-1 z-50 text-xs text-gray-200 backdrop-blur-md">
                        {p.role !== 'moderator' ? (
                          <button
                            onClick={() => {
                              onAssignRole(p.id, 'moderator');
                              setActiveMenuUserId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] flex items-center gap-2 text-sky-400 cursor-pointer"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Make Moderator
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onAssignRole(p.id, 'participant');
                              setActiveMenuUserId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] flex items-center gap-2 text-amber-300 cursor-pointer"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            Demote to Member
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Transfer Host role to ${p.username}?`)) {
                              onTransferHost(p.id);
                              setActiveMenuUserId(null);
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] flex items-center gap-2 text-amber-400 cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          Transfer Host
                        </button>

                        <div className="my-1 border-t border-white/[0.08]" />

                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${p.username} from party?`)) {
                              onRemoveParticipant(p.id);
                              setActiveMenuUserId(null);
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-rose-950/50 flex items-center gap-2 text-rose-400 cursor-pointer"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Remove from Room
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. BOTTOM CARD: Chat */}
      <div className="bg-[#111324]/90 border border-white/[0.08] rounded-2xl p-4 shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden backdrop-blur-md">
        <h3 className="font-bold text-sm text-white mb-2 pb-2 border-b border-white/[0.06]">
          Chat
        </h3>

        {/* Message History Feed */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0 text-xs">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-xs">
              No messages yet
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 text-[10px]">
                    <span
                      className={`font-semibold ${
                        msg.senderRole === 'host'
                          ? 'text-amber-400'
                          : msg.senderRole === 'moderator'
                          ? 'text-sky-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {msg.senderName}
                    </span>
                    <span className="text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-2xl max-w-[88%] break-words text-xs ${
                      isMe
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none shadow-sm'
                        : 'bg-[#1b1e36] text-gray-200 rounded-tl-none border border-white/[0.06]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Quick Reaction Emojis */}
        <div className="py-1.5 flex items-center justify-between border-t border-white/[0.06] mt-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full py-0.5">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSendReaction(emoji)}
                className="text-base hover:scale-130 active:scale-95 transition transform px-1 cursor-pointer"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input & Send Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-[#181a2e] text-gray-100 text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:outline-hidden focus:border-purple-400 transition placeholder:text-gray-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-semibold text-xs rounded-xl transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
