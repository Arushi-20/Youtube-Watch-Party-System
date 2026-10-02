import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '👏', '🍿', '🚀', '🎉', '🤯'];

export const ChatPanel = ({
  messages,
  currentUserId,
  hideHeader = false,
  onSendMessage,
  onSendReaction,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'host':
        return 'text-amber-400';
      case 'moderator':
        return 'text-sky-400';
      case 'participant':
      case 'viewer':
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`flex flex-col h-full ${hideHeader ? 'p-2' : 'bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl'}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-rose-400" />
            <h3 className="font-semibold text-sm text-gray-200">Live Party Chat</h3>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Real-time</span>
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center p-4">
            <MessageSquare className="w-8 h-8 stroke-1 mb-2 opacity-40" />
            <p>Welcome to the watch party!</p>
            <p>Say hi or react below to start chatting.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 text-[11px]">
                  <span className={`font-semibold ${getRoleColor(msg.senderRole)}`}>
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-2xl max-w-[85%] break-words text-xs ${
                    isMe
                      ? 'bg-rose-600 text-white rounded-tr-none'
                      : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700/60'
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

      {/* Floating Emojis Reaction Row */}
      <div className="py-2 flex items-center justify-between border-t border-gray-800 mt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full py-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSendReaction(emoji)}
              className="text-base hover:scale-125 transition transform px-1 cursor-pointer"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Say something to the party..."
          className="flex-1 bg-gray-800 text-gray-100 text-xs px-3.5 py-2.5 rounded-xl border border-gray-700 focus:outline-hidden focus:border-rose-500 transition placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition shadow-lg shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="text-xs font-semibold px-1">Send</span>
        </button>
      </form>
    </div>
  );
};
