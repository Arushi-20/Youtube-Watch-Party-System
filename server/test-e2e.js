import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting YouTube Watch Party End-to-End Tests...\n');

  // 1. Test Health Endpoint
  console.log('1️⃣ Testing HTTP Health Endpoint...');
  const healthRes = await fetch(`${SERVER_URL}/api/health`);
  const healthData = await healthRes.json();
  if (healthData.status === 'healthy') {
    console.log('   ✅ Health check PASSED:', healthData.status);
  } else {
    throw new Error('Health check failed: ' + JSON.stringify(healthData));
  }

  // Helper to create client
  const createClient = (name) => {
    return io(SERVER_URL, {
      transports: ['websocket'],
      forceNew: true,
    });
  };

  const client1 = createClient('Alice');
  const client2 = createClient('Bob');

  const testRoomId = 'TEST' + Math.floor(Math.random() * 8999 + 1000);
  console.log(`\n2️⃣ Testing Room Creation and Join with Room Code: ${testRoomId}`);

  // Test Alice joining as Host
  const aliceJoined = new Promise((resolve) => {
    client1.on('joined_successfully', (data) => {
      console.log(`   ✅ Alice joined successfully. Assigned Role: [${data.role}]`);
      if (data.role !== 'host') {
        throw new Error(`Expected Alice to be host, got ${data.role}`);
      }
      resolve(data);
    });
  });

  client1.emit('join_room', {
    roomId: testRoomId,
    username: 'Alice',
    userId: 'user_alice_1',
  });

  await aliceJoined;

  // Test Bob joining as Participant
  console.log('\n3️⃣ Testing Participant Join...');
  const bobJoined = new Promise((resolve) => {
    client2.on('joined_successfully', (data) => {
      console.log(`   ✅ Bob joined successfully. Assigned Role: [${data.role}]`);
      if (data.role !== 'participant') {
        throw new Error(`Expected Bob to be participant, got ${data.role}`);
      }
      resolve(data);
    });
  });

  client2.emit('join_room', {
    roomId: testRoomId,
    username: 'Bob',
    userId: 'user_bob_2',
  });

  await bobJoined;

  // 4. Test RBAC: Participant cannot play/change video
  console.log('\n4️⃣ Testing RBAC Validation: Unauthorized action by Participant (Bob)...');
  const bobDenied = new Promise((resolve) => {
    client2.on('permission_denied', (err) => {
      console.log(`   ✅ Server correctly rejected Participant action: "${err.error}"`);
      resolve(err);
    });
  });

  // Bob attempts unauthorized play
  client2.emit('play');
  await bobDenied;

  // Bob attempts unauthorized pause
  const bobPauseDenied = new Promise((resolve) => {
    client2.once('permission_denied', (err) => {
      console.log(`   ✅ Server correctly rejected Participant pause: "${err.error}"`);
      resolve(err);
    });
  });
  client2.emit('pause');
  await bobPauseDenied;

  // 5. Test Host Playback Control & Sync
  console.log('\n5️⃣ Testing Host Playback Control & Synchronization...');
  const syncReceived = new Promise((resolve) => {
    client2.on('sync_state', (state) => {
      if (state.playState === 'playing') {
        console.log(`   ✅ Bob received sync_state from Alice: playState = [${state.playState}]`);
        resolve(state);
      }
    });
  });

  // Alice plays
  client1.emit('play');
  await syncReceived;

  // Test Change Video by Host
  console.log('\n6️⃣ Testing Change Video by Host...');
  const videoChanged = new Promise((resolve) => {
    client2.on('sync_state', (state) => {
      if (state.videoId === 'aqz-KE-bpKQ') {
        console.log(`   ✅ Video synced across all clients to: [${state.videoId}]`);
        resolve(state);
      }
    });
  });

  client1.emit('change_video', { videoId: 'aqz-KE-bpKQ' });
  await videoChanged;

  // 7. Test Role Assignment (Host promotes Bob to Moderator)
  console.log('\n7️⃣ Testing Role Promotion (Host promotes Participant -> Moderator)...');
  const roleAssigned = new Promise((resolve) => {
    client2.on('role_assigned', (data) => {
      if (data.userId === 'user_bob_2' && data.role === 'moderator') {
        console.log(`   ✅ Bob promoted to Moderator: [${data.role}]`);
        resolve(data);
      }
    });
  });

  client1.emit('assign_role', { userId: 'user_bob_2', role: 'moderator' });
  await roleAssigned;

  // 8. Bob (now Moderator) can pause video
  console.log('\n8️⃣ Testing Playback Control by newly promoted Moderator...');
  const modPaused = new Promise((resolve) => {
    client1.on('sync_state', (state) => {
      if (state.playState === 'paused') {
        console.log(`   ✅ Alice received sync_state paused by Moderator Bob!`);
        resolve(state);
      }
    });
  });

  client2.emit('pause');
  await modPaused;

  // 9. Test Chat & Reactions
  console.log('\n9️⃣ Testing Chat Message & Floating Reactions...');
  const chatReceived = new Promise((resolve) => {
    client1.on('chat_message', (msg) => {
      console.log(`   ✅ Alice received chat from ${msg.senderName} (${msg.senderRole}): "${msg.text}"`);
      resolve(msg);
    });
  });

  client2.emit('chat_message', { message: 'Hello from Bob!' });
  await chatReceived;

  const reactionReceived = new Promise((resolve) => {
    client1.on('reaction', (r) => {
      console.log(`   ✅ Alice received reaction: ${r.emoji} from ${r.senderName}`);
      resolve(r);
    });
  });

  client2.emit('send_reaction', { emoji: '🔥' });
  await reactionReceived;

  // 10. Test Kick / Remove Participant
  console.log('\n🔟 Testing Host Kick / Remove Participant...');
  const bobKicked = new Promise((resolve) => {
    client2.on('kicked', (res) => {
      console.log(`   ✅ Bob received kick notification: "${res.reason}"`);
      resolve(res);
    });
  });

  client1.emit('remove_participant', { userId: 'user_bob_2' });
  await bobKicked;

  console.log('\n🎉 ALL 10 TESTS PASSED SUCCESSFULLY! Real-time sync, RBAC, events, and chat fully verified.\n');

  client1.disconnect();
  client2.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
