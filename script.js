const firebaseConfig = {
    apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
    databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
    projectId: "chat-go12",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let currentUser = "";
const VAULT_KEY = "Secret123";

window.onload = () => {
    const saved = localStorage.getItem("chat_user");
    if (saved) loginSuccess(saved);
};

function handleAuth() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    if(u === "Yug Patel" && p === "yugpatel1309") return loginSuccess("Yug Patel");
    db.ref('users/' + u).once('value', snap => {
        const val = snap.val();
        if(val && val.password === p) loginSuccess(u);
        else alert("Login Failed");
    });
}

function loginSuccess(name) {
    currentUser = name;
    localStorage.setItem("chat_user", name);
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
    document.getElementById('user-tag').innerText = name;
    if (name === "Yug Patel") {
        document.getElementById('admin-gate').style.display = "block";
        document.getElementById('admin-import-zone').innerHTML = `
            <label for="p-up" style="cursor:pointer; background:white; color:black; padding:5px 12px; border-radius:15px; font-weight:bold; font-size:12px;">+ New</label>
            <input type="file" id="p-up" style="display:none" onchange="uploadFile(this)">
        `;
    }
    loadMessages();
}

function uploadFile(input) {
    const file = input.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        db.ref('vault').push({ 
            name: file.name, data: e.target.result, type: file.type,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        });
        alert("Imported!");
    };
    reader.readAsDataURL(file);
}

function promptVaultAccess() {
    if (currentUser === "Yug Patel") return openAdmin();
    document.getElementById('vault-auth-modal').style.display = "flex";
}

function verifyVaultPass() {
    if (document.getElementById('vault-pass-input').value === VAULT_KEY) {
        document.getElementById('vault-auth-modal').style.display = "none";
        openUserVault();
    } else alert("Wrong Password");
}

function openUserVault() {
    document.getElementById('chat-screen').style.display = "none";
    document.getElementById('admin-screen').style.display = "flex";
    document.getElementById('admin-only-section').style.display = "none";
    loadPrivateVault();
}

function openAdmin() {
    document.getElementById('chat-screen').style.display = "none";
    document.getElementById('admin-screen').style.display = "flex";
    document.getElementById('admin-only-section').style.display = "block";
    loadPrivateVault();
    loadUsers();
}

function loadPrivateVault() {
    db.ref('vault').on('value', snap => {
        const display = document.getElementById('vault-display');
        display.innerHTML = "";
        snap.forEach(child => {
            const d = child.val();
            let icon = d.type.startsWith('image/') ? "🖼️" : "📄";
            display.innerHTML += `
                <div class="drive-item">
                    <div class="file-info">
                        <span>${icon}</span>
                        <a href="${d.data}" download="${d.name}" class="file-name">${d.name}</a>
                    </div>
                    <div class="file-date hide-mobile">${d.date || 'Recent'}</div>
                    <div class="drive-actions">
                        <a href="${d.data}" download="${d.name}" style="text-decoration:none;">📥</a>
                        ${currentUser === "Yug Patel" ? `<span onclick="delFile('${child.key}')" style="cursor:pointer; color:red;">🗑️</span>` : ""}
                    </div>
                </div>`;
        });
    });
}

function loadUsers() {
    db.ref('users').on('value', snap => {
        const reg = document.getElementById('user-registry');
        reg.innerHTML = "";
        snap.forEach(c => {
            if(c.key !== "Yug Patel") {
                reg.innerHTML += `
                <div class="admin-user-card">
                    <span><b>${c.key}</b><br><small>${c.val().password}</small></span>
                    <button onclick="delUser('${c.key}')" style="background:red; color:white; border:none; padding:5px; border-radius:5px;">Delete</button>
                </div>`;
            }
        });
    });
}

function sendMessage() {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    db.ref('messages').push({ sender: currentUser, text: input.value });
    input.value = "";
}

function loadMessages() {
    const box = document.getElementById('messages-display');
    db.ref('messages').on('value', snap => {
        box.innerHTML = "";
        snap.forEach(child => {
            const isMine = child.val().sender === currentUser;
            box.innerHTML += `<div class="msg ${isMine?'mine':'theirs'}">
                <b>${child.val().sender}</b><br>${child.val().text}
                ${currentUser === "Yug Patel" ? `<div onclick="delMsg('${child.key}')" style="cursor:pointer; color:red; font-size:10px; margin-top:5px;">Delete</div>` : ""}
            </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

function logoutUser() { localStorage.removeItem("chat_user"); location.reload(); }
function closeAdmin() { document.getElementById('admin-screen').style.display = "none"; document.getElementById('chat-screen').style.display = "flex"; }
function closeVaultModal() { document.getElementById('vault-auth-modal').style.display = "none"; }
function toggleView() { 
    const p = document.getElementById('login-password'); 
    const btn = document.getElementById('eye-btn');
    if (p.type === "password") {
        p.type = "text";
        btn.innerText = "🔒";
    } else {
        p.type = "password";
        btn.innerText = "👁️";
    }
}
function delMsg(id) { db.ref('messages/' + id).remove(); }
function delFile(id) { if(confirm("Delete file?")) db.ref('vault/' + id).remove(); }
function delUser(u) { if(confirm("Delete user?")) db.ref('users/' + u).remove(); }

// Signup Logic
let isLoginMode = true;
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Midnight Chat" : "Create Account";
    document.getElementById('auth-btn').innerText = isLoginMode ? "Login" : "Sign Up";
    document.getElementById('toggle-link').innerText = isLoginMode ? "Sign Up" : "Login";
}
