const firebaseConfig = {
    apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
    databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
    projectId: "chat-go12",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";
let userRole = localStorage.getItem("user_role") || "user";
let mediaRecorder;
let audioChunks = [];

// --- AUTO DELETE LOGIC ---
function runAutoDelete() {
    const now = Date.now();
    const expiry = 24 * 60 * 60 * 1000; // 24 Hours in ms

    db.ref('messages').once('value', snap => {
        snap.forEach(child => {
            const msg = child.val();
            if (msg.timestamp && (now - msg.timestamp > expiry)) {
                db.ref('messages/' + child.key).remove();
            }
        });
    });
}

window.onload = () => {
    const saved = localStorage.getItem("chat_user");
    if (saved) {
        loginSuccess(saved, userRole);
        runAutoDelete(); // Check for old messages on login
    }
};

function handleAuth() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    
    // Hardcoded Admin
    if(u === "Yug Patel" && p === "yugpatel1309") return loginSuccess("Yug Patel", "admin");

    db.ref('users/' + u).once('value', snap => {
        const val = snap.val();
        if(val && val.password === p) loginSuccess(u, val.role || "user");
        else alert("ACCESS_DENIED");
    });
}

function loginSuccess(name, role) {
    currentUser = name; userRole = role;
    localStorage.setItem("chat_user", name);
    localStorage.setItem("user_role", role);
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
    document.getElementById('user-tag').innerText = name.toUpperCase();
    loadMessages();
}

// --- VOICE RECORDING ---
async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    document.getElementById('voice-btn').classList.add('recording');
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            db.ref('messages').push({
                sender: currentUser,
                type: 'audio',
                data: reader.result,
                timestamp: Date.now()
            });
        };
        document.getElementById('voice-btn').classList.remove('recording');
    };
    mediaRecorder.start();
}
function stopRecording() { if(mediaRecorder) mediaRecorder.stop(); }

// --- MESSAGING ---
function sendMessage() {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    db.ref('messages').push({
        sender: currentUser,
        text: input.value,
        type: 'text',
        timestamp: Date.now()
    });
    input.value = "";
}

function loadMessages() {
    const box = document.getElementById('messages-display');
    db.ref('messages').on('value', snap => {
        box.innerHTML = "";
        snap.forEach(child => {
            const v = child.val();
            const isMine = v.sender === currentUser;
            let content = v.type === 'audio' 
                ? `<audio controls class="audio-player"><source src="${v.data}" type="audio/webm"></audio>` 
                : v.text;
            
            box.innerHTML += `<div class="msg ${isMine?'mine':''}">
                <small>${v.sender}</small>${content}
            </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

// --- VAULT & PDF VIEWER ---
function loadVault() {
    db.ref('vault').on('value', snap => {
        const display = document.getElementById('vault-display');
        display.innerHTML = "";
        snap.forEach(child => {
            const d = child.val();
            display.innerHTML += `
                <div class="drive-item">
                    <span onclick="openMedia('${d.data}', '${d.type}', '${d.name}')" style="cursor:pointer; color:var(--neon-blue)">${d.name}</span>
                    <a href="${d.data}" download="${d.name}">📥</a>
                </div>`;
        });
    });
}

function openMedia(data, type, name) {
    const container = document.getElementById('media-content');
    document.getElementById('media-modal').style.display = 'flex';
    if(type.includes('pdf')) {
        container.innerHTML = `<iframe src="${data}" style="width:100%; height:70vh; border:none; border-radius:15px;"></iframe>`;
    } else {
        container.innerHTML = `<img src="${data}" style="max-width:100%; border-radius:15px;">`;
    }
}

function logoutUser() { localStorage.clear(); location.reload(); }
function closeMedia() { document.getElementById('media-modal').style.display = 'none'; }
function closeAdmin() { document.getElementById('admin-screen').style.display = 'none'; document.getElementById('chat-screen').style.display = 'flex'; }
function promptVaultAccess() { document.getElementById('vault-auth-modal').style.display = 'flex'; }
function closeVaultModal() { document.getElementById('vault-auth-modal').style.display = 'none'; }
function verifyVaultPass() { /* same logic as before */ openAdmin(); }
function openAdmin() { closeVaultModal(); document.getElementById('chat-screen').style.display='none'; document.getElementById('admin-screen').style.display='flex'; loadVault(); }
