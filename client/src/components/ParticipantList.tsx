import React, { useState } from 'react';
import {
  Crown,
  Shield,
  User,
  MoreVertical,
  UserMinus,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  X,
  Radio,
} from 'lucide-react';
import type { ParticipantData, UserRole, ControlRequestNotification } from '../types';

interface ParticipantListProps {
  participants: ParticipantData[];
  currentUserId: string;
  currentUserRole: UserRole;
  onAssignRole: (userId: string, role: UserRole) => void;
  onRemoveParticipant: (userId: string) => void;
  onTransferHost: (userId: string) => void;
  controlRequests: ControlRequestNotification[];
  onRespondControl: (requestId: string, approve: boolean) => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  currentUserId,
  currentUserRole,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost,
  controlRequests,
  onRespondControl,
}) => {
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  const isHost = currentUserRole === 'host';
  const isModOrHost = currentUserRole === 'host' || currentUserRole === 'moderator';

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'host':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
            <Crown className="w-3 h-3 text-amber-400" />
            Host
          </span>
        );
      case 'moderator':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/20">
            <Shield className="w-3 h-3 text-sky-400" />
            Mod
          </span>
        );
      case 'participant':
      case 'viewer':
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">
            <User className="w-3 h-3 text-gray-400" />
            Viewer
          </span>
        );
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h3 className="font-semibold text-sm text-gray-200">Party Members</h3>
        </div>
        <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
          {participants.length} online
        </span>
      </div>

      {/* Pending Control Requests (Visible to Host/Moderator) */}
      {isModOrHost && controlRequests.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Control Requests ({controlRequests.length})
          </p>
          {controlRequests.map((req) => (
            <div
              key={req.requestId}
              className="bg-indigo-950/60 border border-indigo-700/50 p-2.5 rounded-lg flex items-center justify-between gap-2"
            >
              <div className="text-xs">
                <span className="font-semibold text-white">{req.username}</span>
                <span className="text-gray-400"> wants controls</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onRespondControl(req.requestId, true)}
                  title="Approve (Promote to Moderator)"
                  className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRespondControl(req.requestId, false)}
                  title="Decline"
                  className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {participants.map((p) => {
          const isCurrentUser = p.id === currentUserId;
          const isTargetHost = p.role === 'host';
          const isTargetMod = p.role === 'moderator';

          return (
            <div
              key={p.id}
              className="relative flex items-center justify-between p-2 rounded-lg bg-gray-800/40 hover:bg-gray-800/80 border border-transparent hover:border-gray-700 transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-gray-200 uppercase shrink-0">
                  {p.username.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm font-medium text-gray-200 truncate">
                      {p.username}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] text-gray-400 font-mono">(You)</span>
                    )}
                  </div>
                  <div className="mt-0.5">{getRoleBadge(p.role)}</div>
                </div>
              </div>

              {/* Host Actions Menu */}
              {isHost && !isCurrentUser && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveMenuUserId(activeMenuUserId === p.id ? null : p.id)
                    }
                    className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuUserId === p.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-1 z-50 text-xs text-gray-200">
                      {!isTargetMod ? (
                        <button
                          onClick={() => {
                            onAssignRole(p.id, 'moderator');
                            setActiveMenuUserId(null);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center gap-2 text-sky-400"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Promote to Moderator
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onAssignRole(p.id, 'participant');
                            setActiveMenuUserId(null);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center gap-2 text-amber-300"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          Demote to Participant
                        </button>
                      )}

                      {!isTargetHost && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Transfer Host role to ${p.username}? You will become a Moderator.`
                              )
                            ) {
                              onTransferHost(p.id);
                              setActiveMenuUserId(null);
                            }
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center gap-2 text-amber-400"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          Transfer Host
                        </button>
                      )}

                      <div className="my-1 border-t border-gray-700/60" />

                      <button
                        onClick={() => {
                          if (window.confirm(`Kick ${p.username} from this watch party?`)) {
                            onRemoveParticipant(p.id);
                            setActiveMenuUserId(null);
                          }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-950/60 flex items-center gap-2 text-rose-400"
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
  );
};
