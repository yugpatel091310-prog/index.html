const firebaseConfig = {
    apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
    databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
    projectId: "chat-go12",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";
let userRole = localStorage.getItem("user_role") || "user";
let globalVaultPass = "";

window.onload = () => {
    const theme = localStorage.getItem("theme") || "light";
    document.body.className = theme + "-theme";
    
    const savedUser = localStorage.getItem("chat_user");
    if (savedUser) loginSuccess(savedUser, userRole);

    db.ref('config/vaultPassword').on('value', snap => { globalVaultPass = snap.val() || "1234"; });
};

function handleAuth() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    
    db.ref('users/' + u).once('value', snap => {
        const val = snap.val();
        if(val && val.password === p) {
            loginSuccess(u, val.role || "user");
        } else {
            alert("Incorrect Username or Password");
        }
    });
}

function loginSuccess(name, role) {
    currentUser = name;
    userRole = role;
    localStorage.setItem("chat_user", name);
    localStorage.setItem("user_role", role);

    document.getElementById('login-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
    document.getElementById('user-tag').innerText = name;
    
    setupRoleUI();
    loadMessages();
}

function setupRoleUI() {
    const importZone = document.getElementById('admin-import-zone');
    const adminSection = document.getElementById('admin-only-section');
    
    if (userRole === "admin") {
        importZone.innerHTML = `<label for="p-up" style="cursor:pointer; color:var(--blue); font-weight:bold; font-size:13px;">+ Import File</label>
                                <input type="file" id="p-up" style="display:none" onchange="uploadFile(this)">`;
        adminSection.style.display = "block";
    } else {
        importZone.innerHTML = "";
        adminSection.style.display = "none";
    }
}

function uploadFile(input) {
    const file = input.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        db.ref('vault').push({ 
            name: file.name, data: e.target.result, type: file.type,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        alert("Success: File uploaded to Vault.");
    };
    reader.readAsDataURL(file);
}

function promptVaultAccess() {
    if(userRole === "admin") return openAdminPanel();
    document.getElementById('vault-auth-modal').style.display = "flex";
}

function verifyVaultPass() {
    if (document.getElementById('vault-pass-input').value === globalVaultPass) {
        closeVaultModal();
        openAdminPanel();
    } else { alert("Access Denied: Invalid Code"); }
}

function openAdminPanel() {
    document.getElementById('chat-screen').style.display = "none";
    document.getElementById('admin-screen').style.display = "flex";
    loadPrivateVault();
    if(userRole === "admin") loadUsers();
}

function loadPrivateVault() {
    db.ref('vault').on('value', snap => {
        const display = document.getElementById('vault-display');
        display.innerHTML = snap.exists() ? "" : "<p style='text-align:center; opacity:0.5;'>Vault is empty.</p>";
        snap.forEach(child => {
            const d = child.val();
            const isImg = d.type.startsWith('image/');
            display.innerHTML += `
                <div class="drive-item">
                    <div style="display:flex; align-items:center; overflow:hidden;">
                        ${isImg ? `<img src="${d.data}" class="thumb" onclick="openLightbox('${d.data}')">` : `<span style="font-size:24px;">📄</span>`}
                        <a href="${d.data}" download="${d.name}" class="file-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${d.name}</a>
                    </div>
                    <div style="display:flex; gap:12px; margin-left:10px;">
                        <a href="${d.data}" download="${d.name}" style="text-decoration:none;">📥</a>
                        ${userRole === 'admin' ? `<span onclick="delFile('${child.key}')" style="cursor:pointer; color:var(--red);">🗑️</span>` : ''}
                    </div>
                </div>`;
        });
    });
}

function loadMessages() {
    const box = document.getElementById('messages-display');
    db.ref('messages').limitToLast(40).on('value', snap => {
        box.innerHTML = "";
        snap.forEach(child => {
            const v = child.val();
            const isMine = v.sender === currentUser;
            const time = v.time || "";
            box.innerHTML += `<div class="msg ${isMine?'mine':'theirs'}">
                <small>${v.sender}</small>${v.text}
                <span class="time">${time}</span>
            </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

function sendMessage() {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    db.ref('messages').push({ sender: currentUser, text: input.value, time: time });
    input.value = "";
}

function openLightbox(src) {
    const lb = document.getElementById('lightbox');
    document.getElementById('lightbox-img').src = src;
    lb.style.display = 'flex';
}

function toggleTheme() {
    const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    document.body.className = newTheme + '-theme';
    localStorage.setItem("theme", newTheme);
}

function addNewUser() {
    const u = prompt("New Username:");
    const p = prompt("New Password:");
    if(u && p) {
        const r = confirm("Give Admin Privileges?") ? "admin" : "user";
        db.ref('users/' + u).set({ password: p, role: r });
    }
}

function loadUsers() {
    db.ref('users').on('value', snap => {
        const reg = document.getElementById('user-registry');
        reg.innerHTML = snap.exists() ? "" : "<p>No users registered.</p>";
        snap.forEach(c => {
            reg.innerHTML += `
                <div class="drive-item">
                    <span><b>${c.key}</b><br><small style="opacity:0.6;">${c.val().role} | Pass: ${c.val().password}</small></span>
                    <button onclick="delUser('${c.key}')" style="color:var(--red); background:none; border:none; cursor:pointer;">Remove</button>
                </div>`;
        });
    });
}

function changeMyPassword() {
    const p = prompt("Enter your new password:");
    if(p) db.ref('users/' + currentUser + '/password').set(p).then(()=>alert("Password Updated."));
}

function changeVaultPassword() {
    const p = prompt("Enter new Global Vault Access Code:");
    if(p) db.ref('config/vaultPassword').set(p).then(()=>alert("Vault Code Updated."));
}

function logoutUser() { localStorage.clear(); location.reload(); }
function closeAdmin() { document.getElementById('admin-screen').style.display = "none"; document.getElementById('chat-screen').style.display = "flex"; }
function closeVaultModal() { document.getElementById('vault-auth-modal').style.display = "none"; document.getElementById('vault-pass-input').value=""; }
function toggleView() { const p = document.getElementById('login-password'); p.type = p.type === "password" ? "text" : "password"; }
function delFile(id) { if(confirm("Permanently delete this file?")) db.ref('vault/' + id).remove(); }
function delUser(u) { if(u !== "Yug Patel" && confirm("Permanently delete user: " + u + "?")) db.ref('users/' + u).remove(); }
