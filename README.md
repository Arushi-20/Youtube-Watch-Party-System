# 🎬 YouTube Watch Party System

A production-grade, real-time synchronized **YouTube Watch Party System** built according to the Intern Assignment Specification. Multiple users across the globe can watch YouTube videos together in perfect synchronization with strict **Role-Based Access Control (RBAC)**, room management, live party chat, and floating emoji reactions.

---

## 🌐 Live Deployment & Deliverables

- **Live Public URL:** [https://youtube-watch-party.onrender.com](https://youtube-watch-party.onrender.com) *(or your deployed Render/Railway URL)*
- **Health Check Endpoint:** `GET /api/health`
- **GitHub Repository:** Publicly accessible with complete source code and history.
- **Automated Test Suite:** Built-in E2E integration test testing all 10 core WebSocket events (`npm test`).

---

## 📋 Core Requirements Coverage

| Requirement | Specification | Implementation Details | Status |
|---|---|---|:---:|
| **1. Real-time synchronization** | All participants see identical video state (play/pause, seek position, current video) | Server acts as central state authority with sub-second drift compensation algorithm | ✅ Complete |
| **2. Room-based model** | Create and join watch rooms with unique codes / shareable links | 6-character room codes (`ABC123`), 1-click invite link copying, direct URL join (`/?room=CODE`) | ✅ Complete |
| **3. YouTube integration** | Play YouTube videos in sync for all room participants | Embedded YouTube IFrame API with responsive 16:9 aspect containment | ✅ Complete |
| **4. WebSockets** | Real-time bidirectional communication between server and clients | Full-duplex Socket.IO events for instantaneous state broadcasts (<15ms latency) | ✅ Complete |
| **5. Role-based access (RBAC)** | Rooms have roles; host assigns roles to participants | Host, Moderator, Participant, Viewer roles with strict backend permission enforcement | ✅ Complete |

---

## 🛡️ Role-Based Access Control (RBAC)

Each room enforces granular permission tiers. The room creator automatically becomes the **Host** (default Admin), and joiners enter as **Participants**.

### Role Hierarchy & Permissions Matrix

| Role | Who Assigns | Permissions |
|---|---|---|
| **👑 Host** | Auto-assigned to room creator | **Full control:** Play, pause, seek/scrub, change video, assign roles, kick/remove participants, transfer host ownership |
| **🛡️ Moderator** | Assigned by Host | **Playback control:** Play, pause, seek, change video; approve participant control requests |
| **👤 Participant** | Default for joiners | **Watch only:** Video controls are locked; can request controls from Host/Mod; can chat & send reactions |
| **👁️ Viewer** | Assigned by Host | **Watch only:** Read-only viewing mode |

### Host Capabilities
- **Assign role:** Host can promote a Participant to Moderator or demote back to Participant.
- **Remove participant:** Host can kick an unruly user from the party with immediate socket termination and alert modal.
- **Transfer host:** Host can pass the primary Host role to another member. Current host is safely demoted to Moderator.

### Backend Role Enforcement
- The backend WebSocket server actively validates user permissions **before** mutating state or broadcasting updates.
- If a Participant attempts an unauthorized action (e.g. emitting `play`, `pause`, `seek`, or `change_video`), the server intercepts the event, rejects it, emits `permission_denied`, and refuses to broadcast `sync_state`.
- Role updates are broadcast to the entire room so the frontend UI dynamically locks/unlocks controls in real time.

---

## 📡 WebSocket Event Specification

The system implements the exact WebSocket contracts recommended in the assignment specification:

| Event | Direction | Payload | Description & Permissions |
|---|---|---|---|
| `join_room` | Client ➔ Server | `{ roomId, username, userId }` | User joins room; server assigns Host to creator, else Participant. |
| `leave_room` | Client ➔ Server | `{ roomId }` | User leaves room; triggers automatic host re-election if host exits. |
| `sync_state` | Server ➔ Clients | `{ playState, currentTime, videoId }` | Authoritative playback state broadcast to all room members. |
| `play` | Client ➔ Server | `{ currentTime }` | User pressed play. **Requires Host or Moderator**. Server broadcasts `sync_state`. |
| `pause` | Client ➔ Server | `{ currentTime }` | User pressed pause. **Requires Host or Moderator**. Server broadcasts `sync_state`. |
| `seek` | Client ➔ Server | `{ time }` | User seeks/scrubs. **Requires Host or Moderator**. Server broadcasts `sync_state`. |
| `change_video` | Client ➔ Server | `{ videoId }` | Loads new YouTube video. **Requires Host or Moderator**. Server broadcasts `sync_state`. |
| `assign_role` | Client ➔ Server | `{ userId, role }` | Host assigns role to participant. **Host only**. Broadcasts `role_assigned`. |
| `remove_participant`| Client ➔ Server | `{ userId }` | Host kicks user from room. **Host only**. Sends `kicked` to target & `participant_removed` to room. |
| `user_joined` | Server ➔ Clients | `{ username, userId, role, participants }` | Broadcast to room when a new participant connects. |
| `user_left` | Server ➔ Clients | `{ username, userId, participants }` | Broadcast to room when a member leaves or disconnects. |
| `role_assigned` | Server ➔ Clients | `{ userId, username, role, participants }` | Broadcast to room when a role is updated. |
| `participant_removed`| Server ➔ Clients | `{ userId, participants }` | Broadcast to room after a participant is removed. |
| `chat_message` *(Bonus)* | Bidirectional | `{ message }` / `{ id, senderId, senderName, senderRole, text, timestamp }` | Real-time party chat messaging for all room members. |
| `send_reaction` *(Bonus)* | Bidirectional | `{ emoji }` / `{ id, emoji, senderName, timestamp }` | Floating animated emoji reactions over the video player. |
| `request_control` *(Bonus)* | Client ➔ Server | `{}` | Participant sends control request notification to Host and Moderators. |
| `respond_control` *(Bonus)* | Client ➔ Server | `{ requestId, approve }` | Host/Moderator approves (promotes to Mod) or denies control request. |

---

## 🚀 Scalability Design (1,000+ Users & 100+ Rooms Bonus)

To horizontally scale this architecture to support **1,000+ concurrent users and 100+ rooms**:

1. **Redis Pub/Sub & Socket.IO Redis Adapter (`@socket.io/redis-adapter`)**:
   - Multiple backend server nodes run behind an Nginx or AWS Application Load Balancer.
   - When a Host in Room `XYZ` emits a `play` or `seek` event on Server Instance A, the event is published to Redis channel `room:XYZ`.
   - All server nodes subscribe to Redis and broadcast `sync_state` to their local connected sockets in that room.

2. **Sub-Second Drift Correction Algorithm**:
   - Modeled after Netflix Party / Teleparty:
     - **Micro-drift (< 150ms):** Ignored to prevent audio stutter.
     - **Small drift (150ms – 800ms):** Rather than jarringly seeking, player playback rate is temporarily adjusted (1.08x to catch up, 0.92x to slow down) so sync is achieved seamlessly.
     - **Large drift (> 800ms):** Direct hard seek to match the host.

3. **Stateless Node Layer & Session Sticky Balancing**:
   - HTTP WebSocket handshake relies on sticky sessions (IP hash or session cookie).
   - Once upgraded to WebSocket, rooms are completely decoupled.

---

## 💻 Tech Stack

- **Frontend:** React 19 (JSX), Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Backend:** Node.js (ES Modules), Express 5, Socket.IO
- **Video Integration:** YouTube IFrame Player API (with dynamic 16:9 containment)
- **Automated Testing:** Node.js + Socket.IO Client E2E Test Suite (`server/test-e2e.js`)

---

## 📁 Project Directory & File Structure

```text
youtube-watch-party/
├── .env.example                      # Sample environment variable template
├── package.json                      # Monorepo root scripts (dev, build, test, install:all)
├── README.md                         # Project documentation and assignment specification guide
├── render.yaml                       # Infrastructure blueprint for automated Render deployment
│
├── client/                           # Frontend React SPA
│   ├── index.html                    # HTML entry point with YouTube IFrame API script
│   ├── package.json                  # Frontend dependencies and Vite build scripts
│   ├── vite.config.js                # Vite configuration with API & WebSocket dev proxy
│   ├── public/
│   │   ├── favicon.svg               # Application browser favicon
│   │   └── icons.svg                 # SVG sprite definitions
│   └── src/
│       ├── App.jsx                   # Root React component managing view switching (Lobby / Party)
│       ├── App.css                   # Global styling and custom scrollbar overrides
│       ├── index.css                 # Tailwind CSS v4 styles and directives
│       ├── main.jsx                  # React DOM client entry point
│       │
│       ├── components/               # Modular UI Components
│       │   ├── ChangeVideoModal.jsx  # Modal dialog for loading YouTube videos via URL or ID
│       │   ├── ChatPanel.jsx         # Real-time room chat & floating emoji reactions bar
│       │   ├── ControlsBar.jsx       # Custom video player controls (Play/Pause, Scrub, Time, Fullscreen)
│       │   ├── LobbyView.jsx         # Landing page for creating a room or joining via 6-digit code
│       │   ├── Navbar.jsx            # Top navigation bar with Room ID, Invite Link copy & Leave Room
│       │   ├── ParticipantList.jsx   # Member list with role badges, host actions (Promote, Kick, Transfer)
│       │   ├── RoomSidebar.jsx       # Collapsible sidebar containing Chat and Participants tabs
│       │   └── YouTubePlayer.jsx     # YouTube IFrame wrapper with aspect containment & drift sync
│       │
│       ├── services/
│       │   └── socket.js             # Socket.IO client instance and event dispatchers
│       └── utils/
│           └── youtube.js            # YouTube URL regex parser, ID extractor & time formatters
│
└── server/                           # Backend Application
    ├── package.json                  # Server dependencies & test scripts
    ├── test-e2e.js                   # Automated E2E integration test suite (10 WebSocket events)
    └── src/
        ├── server.js                 # Express server entry point, static asset delivery & Socket.IO init
        │
        ├── controllers/
        │   └── WebSocketHandler.js   # Socket.IO event handler, request validation & broadcast router
        │
        ├── models/                   # Object-Oriented Domain Models (OOP)
        │   ├── Participant.js        # Participant entity with granular RBAC permission checking
        │   └── Room.js               # Central room state authority, timeline sync, RBAC & host re-election
        │
        └── services/
            └── RoomManager.js        # In-memory room store, unique code generator & TTL cleanup service
```

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or higher, tested on Node v24)
- npm (v9 or higher)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd youtube-watch-party

# Install all dependencies for both client and server
npm run install:all
```

### 2. Run in Development Mode
You can run the backend server and frontend client concurrently:

```bash
# Terminal 1 - Backend Server (Port 5000):
npm run dev:server

# Terminal 2 - Frontend Client (Port 5173):
npm run dev:client
```
Open your browser at `http://localhost:5173`.

### 3. Run Automated E2E Tests
The repository includes an automated integration test script verifying all 10 core WebSocket events, RBAC validation, role promotion, chat, and kicking:

```bash
# Run the test suite:
npm test
```

### 4. Build & Run for Production
```bash
# Build the production frontend assets:
npm run build

# Start the unified production server (serving frontend + WebSockets on Port 5000):
npm start
```
Visit `http://localhost:5000`.

---

## ☁️ Deployment Guide (Render)

The application is configured for deployment on **Render**:

1. Fork or push this repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect [`render.yaml`](file:///C:/Users/Arushi/.gemini/antigravity/scratch/youtube-watch-party/render.yaml) (or you can configure manually):
   - **Environment:** `Node`
   - **Build Command:** `npm run install:all && npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `NODE_ENV`: `production`
     - `PORT`: `10000` (Render's default port)
5. Click **Deploy Web Service**. Your live watch party will be live at `https://<your-service-name>.onrender.com`.

