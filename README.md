# 🎬 SyncWave - Real-Time YouTube Watch Party System

A production-grade, synchronized Watch Party platform that enables multiple users across the globe to watch YouTube videos together in real time. Features sub-second playback synchronization, role-based access control (RBAC), room management, live party chat, and floating emoji reactions.

![Watch Party Architecture](https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/React-Dark.svg)

---

## 🌐 Live Deployment & Demo

- **Live Production URL:** [https://youtube-watch-party.onrender.com](https://youtube-watch-party.onrender.com) *(or your deployed Render/Railway/Vercel URL)*
- **Health Check Endpoint:** `GET /api/health`

---

## 🌟 Key Features

1. **Sub-Second Playback Synchronization**
   - Synchronized play, pause, seek, and video changes via WebSockets.
   - Built-in drift detection algorithm: smooth client resync if client time drifts > 1.5 seconds from server authority without choppy stuttering.
   - Anti-echo loop prevention: client ignores local player events triggered by server updates.

2. **Strict Role-Based Access Control (RBAC)**
   - **👑 Host:** Room creator (auto-assigned). Full authority to play, pause, scrub/seek, change video, promote/demote participants, kick users, and transfer host ownership.
   - **🛡️ Moderator:** Granted by Host. Can play, pause, seek, change video, and approve participant control requests.
   - **👤 Participant / Viewer:** Default for joiners. Watch-only; playback controls are locked. Can send a real-time **Request Control** notification to the host.
   - **Backend Enforcement:** The WebSocket server actively validates role permissions before processing any playback or administrative mutation. Unauthorized attempts are rejected with `permission_denied`.

3. **Room-Based Lifecycle**
   - Instant room creation with clean 6-character room codes (e.g. `ABC123`).
   - Shareable direct invite links (`/?room=CODE`) with 1-click clipboard copy.
   - Automatic host handover if current host disconnects.
   - Automatic empty room garbage collection.

4. **Interactive Party Extras**
   - **Real-time Live Chat:** Instant messages with role badges and timestamping.
   - **Floating Emoji Reactions:** Click ❤️, 🔥, 😂, 👏, 🍿, 🚀, 🎉 to trigger floating animations across all connected screens.
   - **Preset Video Library:** 1-click access to curated sample videos (Lofi Beats, 4K Nature, Animations, Synthwave).

---

## 🏗️ System Architecture & Flow

```mermaid
sequenceDiagram
    autonumber
    actor Host as 👑 Host Client
    actor Participant as 👤 Participant Client
    participant Server as ⚡ WebSocket Server (Socket.IO + OOP)
    participant YouTube as 📺 YouTube IFrame Player

    Note over Host,Participant: Room Creation & Join
    Host->>Server: join_room { roomId: "PARTY1", username: "Alice" }
    Server-->>Host: joined_successfully (Role: Host) + sync_state
    Participant->>Server: join_room { roomId: "PARTY1", username: "Bob" }
    Server-->>Participant: joined_successfully (Role: Participant) + sync_state
    Server-->>Host: user_joined { username: "Bob", role: "participant" }

    Note over Host,Participant: Synchronized Playback
    Host->>YouTube: Presses Play / Seeks to 01:45
    Host->>Server: play / seek { time: 105 }
    Server->>Server: Validate Host/Mod Permissions (Passed)
    Server-->>Host: sync_state { playState: "playing", currentTime: 105 }
    Server-->>Participant: sync_state { playState: "playing", currentTime: 105 }
    Participant->>YouTube: player.seekTo(105) & player.playVideo()

    Note over Host,Participant: RBAC Protection
    Participant->>Server: play (Attempted unauthorized action)
    Server->>Server: Validate Role (Participant has no play permission)
    Server-->>Participant: permission_denied { error: "Requires Host or Moderator role" }

    Note over Host,Participant: Role Promotion & Control Request
    Participant->>Server: request_control
    Server-->>Host: control_requested { userId, username }
    Host->>Server: assign_role { userId: "Bob", role: "moderator" }
    Server-->>Host: role_assigned { userId: "Bob", role: "moderator" }
    Server-->>Participant: role_assigned { userId: "Bob", role: "moderator" }
    Note over Participant: Controls unlocked! Bob can now play/pause/seek.
```

---

## 📡 WebSocket Event Matrix

| Event | Direction | Payload | Description & Permissions |
|---|---|---|---|
| `join_room` | Client ➔ Server | `{ roomId, username, userId }` | Joins or creates room. First user is assigned `host`, subsequent users `participant`. |
| `leave_room` | Client ➔ Server | `{ roomId }` | Leaves current room. Triggers automatic host reelection if host exits. |
| `sync_state` | Server ➔ Clients | `{ playState, currentTime, videoId }` | Broadcasts authoritative playback state to all clients in room. |
| `play` | Client ➔ Server | `{}` | Requests video play. **Requires Host or Moderator**. Broadcasts `sync_state`. |
| `pause` | Client ➔ Server | `{}` | Requests video pause. **Requires Host or Moderator**. Broadcasts `sync_state`. |
| `seek` | Client ➔ Server | `{ time }` | Seeks video to specified seconds. **Requires Host or Moderator**. Broadcasts `sync_state`. |
| `change_video` | Client ➔ Server | `{ videoId }` | Loads new YouTube video ID. **Requires Host or Moderator**. Broadcasts `sync_state`. |
| `assign_role` | Client ➔ Server | `{ userId, role }` | Changes participant role. **Host only**. Broadcasts `role_assigned`. |
| `remove_participant`| Client ➔ Server | `{ userId }` | Removes user from party. **Host only**. Sends `kicked` to target & `participant_removed` to room. |
| `transfer_host` | Client ➔ Server | `{ userId }` | Transfers Host ownership to target user. **Host only**. |
| `user_joined` | Server ➔ Clients | `{ username, userId, role, participants }` | Notifies room members of a new connection. |
| `user_left` | Server ➔ Clients | `{ username, userId, participants }` | Notifies room members when someone departs. |
| `role_assigned` | Server ➔ Clients | `{ userId, username, role, participants }` | Broadcasts role changes so UIs update controls instantly. |
| `participant_removed`| Server ➔ Clients | `{ userId, participants }` | Broadcasts updated participant list after removal. |
| `chat_message` | Bidirectional | `{ message }` / `{ id, senderId, senderName, senderRole, text, timestamp }` | Real-time chat messaging. Available to all members. |
| `send_reaction` | Bidirectional | `{ emoji }` / `{ id, emoji, senderName, timestamp }` | Floating emoji reactions on video player. |
| `request_control` | Client ➔ Server | `{}` | Participant asks Host/Mod for control permission. |
| `respond_control` | Client ➔ Server | `{ requestId, approve }` | Host/Mod approves (promotes to Mod) or declines control request. |

---

## 🏛️ Object-Oriented Architecture (OOP)

The backend server is architected using strict Object-Oriented Programming (OOP) principles:

- **`Participant` Class (`src/models/Participant.js`)**:
  - Encapsulates user entity state (`id`, `socketId`, `username`, `role`, `joinedAt`).
  - Implements role-based action validation via `canPerform(action: string): boolean`.
  - Clean serialization (`toJSON()`).

- **`Room` Class (`src/models/Room.js`)**:
  - Manages participants map, socket-to-user mappings, video state, and chat history.
  - State Authority: calculates real-time playback position using server-side elapsed timestamps (`getCurrentPlaybackTime()`).
  - Enforces atomic state transitions: `play()`, `pause()`, `seek()`, `changeVideo()`, `assignRole()`, `transferHost()`, `kickParticipant()`.
  - Automatic host failover: selects next moderator or oldest participant when host disconnects.

- **`RoomManager` Service (`src/services/RoomManager.js`)**:
  - Singleton registry managing all active rooms in memory.
  - Generates unique collision-free room codes.
  - Implements automated periodic TTL garbage collection for idle, empty rooms.

- **`WebSocketHandler` Controller (`src/controllers/WebSocketHandler.js`)**:
  - Decouples Socket.IO networking from business domain logic.
  - Validates payloads, handles error propagation (`permission_denied`), and emits targeted broadcasts.

---

## 🚀 Scalability Design (1,000+ Users & 100+ Rooms)

To scale this system horizontally across multiple server nodes:

1. **Redis Pub/Sub & Socket.IO Redis Adapter (`@socket.io/redis-adapter`)**:
   - Rooms can be distributed across multiple backend server instances.
   - When a Host on Node A pauses or seeks, the event is published to Redis channels (`room:PARTY1`).
   - All server nodes subscribe and broadcast the `sync_state` to local sockets connected to that room.

2. **Stateless Node Layer & Persistent Storage**:
   - Persist room metadata and chat in Redis or PostgreSQL/SQLite.
   - Load balancer (Nginx / AWS ALB / Cloudflare) with sticky sessions (`ip_hash` or cookie affinity for WebSocket handshake fallback).

3. **Client-Side Drift Optimization**:
   - Video sync uses a threshold-based correction mechanism:
     - Minor drift (< 1.5 seconds): Local playback continues uninterrupted to prevent micro-stutters.
     - Major drift (>= 1.5 seconds): Client smoothly seeks to match server time.

---

## 💻 Tech Stack

- **Frontend:** React 19 (JSX), Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Video Integration:** YouTube IFrame Player API
- **Backend:** Node.js (ES Modules), Express 5, Socket.IO
- **Testing:** Automated integration test suite (`test-e2e.js`)

---

## 🛠️ Quick Start & Local Development

### Prerequisites
- Node.js (v18 or higher recommended, tested on Node v24)
- npm (v9 or higher)

### 1. Clone & Install
```bash
git clone <repository-url>
cd youtube-watch-party

# Install all dependencies (server + client)
npm run install:all
```

### 2. Run in Development Mode
You can run the backend and frontend separately:

```bash
# Terminal 1 - Backend (port 5000):
npm run dev:server

# Terminal 2 - Frontend (port 5173):
npm run dev:client
```
Visit `http://localhost:5173` in your browser.

### 3. Run Automated End-to-End Tests
The project includes a comprehensive automated test script that tests all 10 core WebSocket events, RBAC validation, role promotion, chat, and kicking:

```bash
# Ensure server is running on port 5000, then run:
npm test
```

### 4. Build for Production
```bash
# Compiles Vite frontend assets:
npm run build

# Runs production server (serving frontend + WebSockets on port 5000):
npm start
```
Visit `http://localhost:5000`.

---

## ☁️ Deployment Guide

### Option 1: Render (Recommended - Free Web Service)
1. Fork or push this repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Render will auto-detect `render.yaml` or you can configure manually:
   - **Environment:** `Node`
   - **Build Command:** `npm run install:all && npm run build`
   - **Start Command:** `npm start`
5. Click **Deploy Web Service**. Your live app will be accessible at `https://<your-service>.onrender.com`.

### Option 2: Railway
1. Sign in to [Railway](https://railway.app) and create **New Project from GitHub Repo**.
2. Railway will automatically build using the included `Dockerfile` or `package.json`.
3. Set environment variable `PORT=5000` (or Railway's default).

### Option 3: Docker
```bash
docker build -t youtube-watch-party .
docker run -p 5000:5000 youtube-watch-party
```

---

## 🎓 Code Walkthrough & Interview Q&A Readiness

### 1. How does WebSockets enable real-time sync?
> Unlike HTTP polling which introduces high latency and server overhead, WebSockets provide a persistent, full-duplex TCP connection. When a host plays, pauses, or scrubs the seekbar, a tiny JSON packet (~50 bytes) is pushed to the server and instantly fan-out broadcast to all room participants in under 15ms.

### 2. How does the backend prevent participants from controlling playback?
> The backend does not rely on frontend UI hiding. In `Room.js` and `Participant.js`, every state change method (`play`, `pause`, `seek`, `changeVideo`) explicitly checks `participant.canPerform(action)`. If a client bypasses the UI and emits a `play` or `seek` event directly, the server intercepts it, rejects the operation, emits `permission_denied`, and refuses to broadcast `sync_state`.

### 3. How do you prevent video stutter and playback echo loops?
> When a client receives a `sync_state` broadcast from the server and programmatically commands `player.seekTo()` or `player.playVideo()`, the YouTube player fires an internal `onStateChange` event. Without precautions, this would cause the client to think the user initiated the change and re-emit `play` back to the server, creating an infinite feedback loop. We prevent this using an `isApplyingRemoteUpdate` reference flag. Furthermore, timestamp drifts under 1.5s are ignored to eliminate stutter caused by minor network jitter.

---

## 📄 License
ISC License © 2026. Built with ❤️ for the Watch Party Assignment.
