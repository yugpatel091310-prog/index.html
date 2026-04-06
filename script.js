// Firebase configuration (Keep your existing config)
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
        else alert("Unauthorized");
    });
}

function loginSuccess(name) {
    currentUser = name;
    localStorage.setItem("chat_user", name);
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
    document.getElementById('user-tag').innerText = name;
    
    if (name === "Yug Patel") {
        document.getElementById('admin-import-zone').innerHTML = `
            <label for="p-up" style="cursor:pointer; color:var(--blue); font-weight:bold; font-size:13px;">+ Import File</label>
            <input type="file" id="p-up" style="display:none" onchange="uploadFile(this)">
        `;
    }
    loadMessages();
}

function promptVaultAccess() {
    // If Admin, go straight to panel, otherwise ask for password
    if (currentUser === "Yug Patel") return openAdmin();
    document.getElementById('vault-auth-modal').style.display = "flex";
}

function verifyVaultPass() {
    if (document.getElementById('vault-pass-input').value === VAULT_KEY) {
        closeVaultModal();
        openUserVault();
    } else alert("Invalid Code");
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
            display.innerHTML += `
                <div class="drive-item">
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">📄 ${d.name}</span>
                    <div style="display:flex; gap:10px;">
                        <a href="${d.data}" download="${d.name}" style="text-decoration:none;">📥</a>
                        ${currentUser === "Yug Patel" ? `<span onclick="delFile('${child.key}')" style="cursor:pointer; color:red;">🗑️</span>` : ""}
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
            const v = child.val();
            const isMine = v.sender === currentUser;
            box.innerHTML += `<div class="msg ${isMine?'mine':'theirs'}">
                <small style="display:block; font-size:9px; opacity:0.6;">${v.sender}</small>
                ${v.text}
            </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

function logoutUser() { localStorage.removeItem("chat_user"); location.reload(); }
function closeAdmin() { document.getElementById('admin-screen').style.display = "none"; document.getElementById('chat-screen').style.display = "flex"; }
function closeVaultModal() { document.getElementById('vault-auth-modal').style.display = "none"; document.getElementById('vault-pass-input').value=""; }
function toggleView() { 
    const p = document.getElementById('login-password'); 
    p.type = p.type === "password" ? "text" : "password"; 
}
