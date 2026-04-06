const firebaseConfig = {
    apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
    databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
    projectId: "chat-go12",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";
let userRole = "user";
let globalVaultPass = "1234"; // Default

window.onload = () => {
    // Apply saved theme
    const theme = localStorage.getItem("theme") || "light";
    document.body.className = theme + "-theme";
    
    const saved = localStorage.getItem("chat_user");
    if (saved) loginSuccess(saved);

    // Sync Global Vault Password
    db.ref('config/vaultPassword').on('value', snap => {
        if(snap.val()) globalVaultPass = snap.val();
    });
};

function handleAuth() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    
    db.ref('users/' + u).once('value', snap => {
        const val = snap.val();
        if(val && val.password === p) {
            userRole = val.role || "user";
            loginSuccess(u);
        } else {
            alert("Login Failed");
        }
    });
}

function loginSuccess(name) {
    currentUser = name;
    localStorage.setItem("chat_user", name);
    
    // Refresh role data
    db.ref('users/' + name).once('value', snap => {
        userRole = snap.val().role || "user";
        setupAdminUI();
    });

    document.getElementById('login-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
    document.getElementById('user-tag').innerText = name;
    loadMessages();
}

function setupAdminUI() {
    const importZone = document.getElementById('admin-import-zone');
    const adminSection = document.getElementById('admin-only-section');
    
    if (userRole === "admin") {
        importZone.innerHTML = `<label for="p-up" style="cursor:pointer; color:var(--blue); font-weight:bold;">+ Import</label>
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
            date: new Date().toLocaleDateString()
        });
        alert("File Uploaded");
    };
    reader.readAsDataURL(file);
}

function promptVaultAccess() {
    document.getElementById('vault-auth-modal').style.display = "flex";
}

function verifyVaultPass() {
    const input = document.getElementById('vault-pass-input').value;
    if (input === globalVaultPass || userRole === "admin") {
        closeVaultModal();
        openAdminPanel();
    } else {
        alert("Incorrect Code");
    }
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
        display.innerHTML = "";
        snap.forEach(child => {
            const d = child.val();
            const isImg = d.type.startsWith('image/');
            display.innerHTML += `
                <div class="drive-item">
                    <div style="display:flex; align-items:center;">
                        ${isImg ? `<img src="${d.data}" class="thumb">` : `<span>📄</span>`}
                        <a href="${d.data}" download="${d.name}" class="file-name">${d.name}</a>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <a href="${d.data}" download="${d.name}">📥</a>
                        ${userRole === 'admin' ? `<span onclick="delFile('${child.key}')" style="cursor:pointer; color:red;">🗑️</span>` : ''}
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
            reg.innerHTML += `
                <div class="drive-item">
                    <span><b>${c.key}</b><br><small>Pass: ${c.val().password}</small></span>
                    <button onclick="delUser('${c.key}')" style="color:red; background:none; border:none;">Delete</button>
                </div>`;
        });
    });
}

function changeMyPassword() {
    const p = prompt("New Password:");
    if(p) db.ref('users/' + currentUser + '/password').set(p).then(() => alert("Saved"));
}

function changeVaultPassword() {
    const p = prompt("New Global Vault Code:");
    if(p) db.ref('config/vaultPassword').set(p);
}

function addNewUser() {
    const u = prompt("Username:");
    const p = prompt("Password:");
    const r = confirm("Make Admin?") ? "admin" : "user";
    if(u && p) db.ref('users/' + u).set({ password: p, role: r });
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    document.body.className = newTheme + '-theme';
    localStorage.setItem("theme", newTheme);
}

function sendMessage() {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    db.ref('messages').push({ sender: currentUser, text: input.value });
    input.value = "";
}

function loadMessages() {
    const box = document.getElementById('messages-display');
    db.ref('messages').limitToLast(30).on('value', snap => {
        box.innerHTML = "";
        snap.forEach(child => {
            const v = child.val();
            const isMine = v.sender === currentUser;
            box.innerHTML += `<div class="msg ${isMine?'mine':'theirs'}">
                <small style="display:block; font-size:9px; opacity:0.6;">${v.sender}</small>${v.text}
            </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

function logoutUser() { localStorage.removeItem("chat_user"); location.reload(); }
function closeAdmin() { document.getElementById('admin-screen').style.display = "none"; document.getElementById('chat-screen').style.display = "flex"; }
function closeVaultModal() { document.getElementById('vault-auth-modal').style.display = "none"; document.getElementById('vault-pass-input').value=""; }
function toggleView() { const p = document.getElementById('login-password'); p.type = p.type === "password" ? "text" : "password"; }
function delFile(id) { if(confirm("Delete?")) db.ref('vault/' + id).remove(); }
function delUser(u) { if(u !== "Yug Patel" && confirm("Delete?")) db.ref('users/' + u).remove(); }
