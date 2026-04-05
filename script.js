const firebaseConfig = {
  apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
  databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
  projectId: "chat-go12",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";
let isLoginMode = true;
const VAULT_KEY = "Secret123"; // UNIQUE PASSWORD FOR FILE VAULT

// Persistence Check: Auto-login if session exists
window.onload = function() {
    const savedUser = localStorage.getItem("chat_user");
    if (savedUser) {
        loginSuccess(savedUser);
    }
};

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Midnight Chat" : "Create Account";
    document.getElementById('auth-btn').innerText = isLoginMode ? "Login" : "Sign Up";
    document.getElementById('toggle-link').innerText = isLoginMode ? "Sign Up" : "Login";
}

function handleAuth() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    if(!u || !p) return alert("Fill all fields");

    if (isLoginMode) {
        if(u === "Yug Patel" && p === "yugpatel1309") {
            return loginSuccess("Yug Patel");
        }
        db.ref('users/' + u).once('value', snap => {
            const val = snap.val();
            if(val && val.password === p) loginSuccess(u);
            else alert("Invalid Credentials");
        });
    } else {
        db.ref('users/' + u).set({ password: p }).then(() => toggleAuthMode());
    }
}

function loginSuccess(name) {
    currentUser = name;
    localStorage.setItem("chat_user", name); // Save Session
    
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
    document.getElementById('user-tag').innerText = name;
    
    if (name === "Yug Patel") {
        document.getElementById('admin-gate').style.display = "block";
        document.getElementById('admin-file-zone').innerHTML = `
            <label for="p-up" style="cursor:pointer; font-size:22px; margin-right:5px;">📁</label>
            <input type="file" id="p-up" style="display:none" onchange="uploadFile(this)">
        `;
    }
    loadMessages();
}

function logoutUser() {
    localStorage.removeItem("chat_user");
    location.reload();
}

// Vault Access
function promptVaultAccess() {
    if (currentUser === "Yug Patel") return openAdmin();
    document.getElementById('vault-auth-modal').style.display = "flex";
}

function verifyVaultPass() {
    if (document.getElementById('vault-pass-input').value === VAULT_KEY) {
        closeVaultModal();
        openUserVault();
    } else alert("Wrong Password");
}

function openUserVault() {
    document.getElementById('chat-screen').style.display = "none";
    document.getElementById('admin-screen').style.display = "flex";
    document.getElementById('admin-only-section').style.display = "none";
    document.getElementById('vault-title').innerText = "Shared Vault";
    loadPrivateVault();
}

function closeVaultModal() { 
    document.getElementById('vault-auth-modal').style.display = "none"; 
    document.getElementById('vault-pass-input').value = "";
}

// Admin & Files
function uploadFile(input) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        db.ref('vault').push({ name: file.name, data: e.target.result, type: file.type });
        alert("File Uploaded to Vault!");
    };
    reader.readAsDataURL(file);
}

function loadPrivateVault() {
    db.ref('vault').on('value', snap => {
        const display = document.getElementById('vault-display');
        display.innerHTML = "";
        snap.forEach(child => {
            const d = child.val();
            const isAdmin = currentUser === "Yug Patel";
            display.innerHTML += `
                <div class="vault-item">
                    ${d.type.startsWith('image/') ? `<img src="${d.data}">` : `📄`}
                    <a href="${d.data}" download="${d.name}" class="file-link">${d.name}</a>
                    ${isAdmin ? `<button onclick="delFile('${child.key}')" style="color:red; background:none; border:none; cursor:pointer; font-size:10px; margin-top:5px;">Del</button>` : ""}
                </div>`;
        });
    });
}

// Messages
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
            const m = child.val();
            const isAdmin = currentUser === "Yug Patel";
            const isMine = m.sender === currentUser;
            box.innerHTML += `<div class="msg ${isMine?'mine':'theirs'}">
                ${isAdmin ? `<div class="del-msg" onclick="delMsg('${child.key}')">×</div>` : ""}
                <b>${m.sender}</b><span>${m.text}</span></div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

function openAdmin() {
    document.getElementById('chat-screen').style.display = "none";
    document.getElementById('admin-screen').style.display = "flex";
    document.getElementById('admin-only-section').style.display = "block";
    document.getElementById('vault-title').innerText = "Private Vault";
    loadPrivateVault();
    loadUsers();
}

function closeAdmin() { 
    document.getElementById('admin-screen').style.display = "none"; 
    document.getElementById('chat-screen').style.display = "flex"; 
}

function delMsg(id) { if(confirm("Delete?")) db.ref('messages/' + id).remove(); }
function delFile(id) { if(confirm("Delete file?")) db.ref('vault/' + id).remove(); }
function toggleView() { const p = document.getElementById('login-password'); p.type = p.type === "password" ? "text" : "password"; }

function loadUsers() {
    db.ref('users').on('value', snap => {
        const reg = document.getElementById('user-registry');
        reg.innerHTML = "";
        snap.forEach(c => {
            if(c.key !== "Yug Patel") reg.innerHTML += `<div class="admin-user-card">${c.key} | ${c.val().password}</div>`;
        });
    });
}
