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
        else alert("Login Failed. Check username/password.");
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
            <label for="p-up" style="cursor:pointer; background:#007bff; color:white; padding:6px 15px; border-radius:20px; font-weight:bold; font-size:12px;">+ Import</label>
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
        alert("File imported successfully!");
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
    } else alert("Incorrect Vault Password");
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
                    <div class="file-info" style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                        <span>${icon}</span>
                        <a href="${d.data}" download="${d.name}" class="file-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${d.name}</a>
                    </div>
                    <div class="file-date hide-mobile" style="color:#888; font-size:12px;">${d.date || 'Today'}</div>
                    <div style="display:flex; justify-content:flex-end; gap:15px;">
                        <a href="${d.data}" download="${d.name}" style="text-decoration:none; font-size:18px;">📥</a>
                        ${currentUser === "Yug Patel" ? `<span onclick="delFile('${child.key}')" style="cursor:pointer; font-size:18px;">🗑️</span>` : ""}
                    </div>
                </div>`;
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
            const val = child.val();
            const isMine = val.sender === currentUser;
            box.innerHTML += `<div class="msg ${isMine?'mine':'theirs'}">
                <b style="font-size:10px; display:block; margin-bottom:2px; opacity:0.7;">${val.sender}</b>
                ${val.text}
                ${currentUser === "Yug Patel" ? `<div onclick="delMsg('${child.key}')" style="cursor:pointer; color:red; font-size:9px; margin-top:5px; text-align:right;">Delete</div>` : ""}
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
    p.type = p.type === "password" ? "text" : "password"; 
}

function loadUsers() {
    db.ref('users').on('value', snap => {
        const reg = document.getElementById('user-registry');
        reg.innerHTML = "";
        snap.forEach(c => {
            if(c.key !== "Yug Patel") {
                reg.innerHTML += `
                <div style="display:flex; justify-content:space-between; background:#f9f9f9; padding:10px; border-radius:10px; margin-bottom:5px; border:1px solid #eee;">
                    <span><b>${c.key}</b><br><small style="color:#888;">Pass: ${c.val().password}</small></span>
                    <button onclick="delUser('${c.key}')" style="background:none; border:none; color:red; cursor:pointer;">Delete User</button>
                </div>`;
            }
        });
    });
}

function delMsg(id) { if(confirm("Delete message?")) db.ref('messages/' + id).remove(); }
function delFile(id) { if(confirm("Delete file?")) db.ref('vault/' + id).remove(); }
function delUser(u) { if(confirm("Permanently delete this user?")) db.ref('users/' + u).remove(); }

let isLoginMode = true;
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Cloud Vault" : "Join Cloud Vault";
    document.getElementById('auth-btn').innerText = isLoginMode ? "Login" : "Sign Up";
    document.getElementById('toggle-link').innerText = isLoginMode ? "Sign Up" : "Login";
}
