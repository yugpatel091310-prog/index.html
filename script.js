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
let globalVaultPass = "1234";

// --- CORE AUTO-PURGE (Deletes messages older than 24h) ---
function autoPurge() {
    const day = 24 * 60 * 60 * 1000;
    db.ref('messages').once('value', snap => {
        snap.forEach(c => {
            if (c.val().timestamp && (Date.now() - c.val().timestamp > day)) {
                db.ref('messages/' + c.key).remove();
            }
        });
    });
}

window.onload = () => {
    const theme = localStorage.getItem("theme") || "dark";
    document.body.className = theme + "-theme";
    const saved = localStorage.getItem("chat_user");
    if (saved) loginSuccess(saved, userRole);
    
    db.ref('config/vaultPassword').on('value', snap => { if(snap.val()) globalVaultPass = snap.val(); });
};

function handleAuth() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    
    // HARDCODED ADMIN BYPASS
    if(u === "Yug Patel" && p === "yugpatel1309") return loginSuccess("Yug Patel", "admin");

    db.ref('users/' + u).once('value', snap => {
        const v = snap.val();
        if(v && v.password === p) loginSuccess(u, v.role || "user");
        else alert("AUTH_ERROR: INVALID_CREDENTIALS");
    });
}

function loginSuccess(name, role) {
    currentUser = name; userRole = role;
    localStorage.setItem("chat_user", name);
    localStorage.setItem("user_role", role);

    const login = document.getElementById('login-screen');
    const chat = document.getElementById('chat-screen');
    
    login.style.opacity = "0";
    setTimeout(() => {
        login.style.display = "none";
        chat.style.display = "flex";
        setTimeout(() => chat.style.opacity = "1", 50);
        document.getElementById('user-tag').innerText = name.toUpperCase();
        setupAdminUI();
        loadMessages();
        autoPurge();
    }, 400);
}

// --- VOICE RECORDER ---
async function startRecording() {
    try {
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
                    sender: currentUser, type: 'audio', data: reader.result, timestamp: Date.now()
                });
            };
            document.getElementById('voice-btn').classList.remove('recording');
        };
        mediaRecorder.start();
    } catch(e) { alert("Mic Access Denied"); }
}
function stopRecording() { if(mediaRecorder) mediaRecorder.stop(); }

// --- CHAT ENGINE ---
function sendMessage() {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    db.ref('messages').push({
        sender: currentUser, text: input.value, type: 'text', timestamp: Date.now()
    });
    input.value = "";
}

function loadMessages() {
    db.ref('messages').on('value', snap => {
        const box = document.getElementById('messages-display');
        box.innerHTML = "";
        snap.forEach(c => {
            const v = c.val();
            const isMine = v.sender === currentUser;
            const content = v.type === 'audio' 
                ? `<audio controls class="audio-player"><source src="${v.data}" type="audio/webm"></audio>` 
                : v.text;
            box.innerHTML += `<div class="msg ${isMine?'mine':''}"><small>${v.sender}</small>${content}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

// --- FLOATING PANEL CONTROLS ---
function promptVaultAccess() {
    if(userRole === 'admin') return openAdmin();
    document.getElementById('vault-auth-modal').style.display = 'flex';
}

function verifyVaultPass() {
    if(document.getElementById('vault-pass-input').value === globalVaultPass) {
        closeVaultModal(); openAdmin();
    } else alert("INVALID_KEY");
}

function openAdmin() {
    document.getElementById('admin-screen').classList.add('active');
    loadVault();
    if(userRole === 'admin') loadUsers();
}

function closeAdmin() { document.getElementById('admin-screen').classList.remove('active'); }

function loadVault() {
    db.ref('vault').on('value', snap => {
        const div = document.getElementById('vault-display');
        div.innerHTML = snap.exists() ? "" : "<p class='empty-vault'>NO_DATA_FOUND</p>";
        snap.forEach(c => {
            const d = c.val();
            div.innerHTML += `<div class="drive-item" style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span onclick="openMedia('${d.data}', '${d.type}')" style="color:var(--neon); cursor:pointer;">${d.name}</span>
                <a href="${d.data}" download="${d.name}">📥</a>
            </div>`;
        });
    });
}

function openMedia(data, type) {
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('media-content');
    modal.style.display = 'flex';
    content.innerHTML = type.includes('pdf') 
        ? `<iframe src="${data}" style="width:100%; height:70vh; border:none;"></iframe>` 
        : `<img src="${data}" style="max-width:100%; border-radius:15px;">`;
}

function setupAdminUI() {
    if(userRole === 'admin') {
        document.getElementById('admin-import-zone').innerHTML = `
            <label for="up" class="btn-neon" style="display:block; text-align:center; margin-bottom:20px;">+ IMPORT_FILE</label>
            <input type="file" id="up" style="display:none" onchange="upload(this)">`;
        document.getElementById('admin-only-section').style.display = 'block';
    }
}

function upload(el) {
    const f = el.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = (e) => {
        db.ref('vault').push({ name: f.name, data: e.target.result, type: f.type });
        alert("UPLOAD_COMPLETE");
    };
    r.readAsDataURL(f);
}

function logoutUser() { localStorage.clear(); location.reload(); }
function closeVaultModal() { document.getElementById('vault-auth-modal').style.display = 'none'; }
function closeMedia() { document.getElementById('media-modal').style.display = 'none'; }
function toggleView() { const p = document.getElementById('login-password'); p.type = p.type==='password'?'text':'password'; }
