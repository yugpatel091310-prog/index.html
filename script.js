const firebaseConfig = {
    apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
    databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
    projectId: "chat-go12",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";
let userRole = localStorage.getItem("user_role") || "user";
let globalVaultPass = "1234";

window.onload = () => {
    const theme = localStorage.getItem("theme") || "light";
    document.body.className = theme + "-theme";
    const saved = localStorage.getItem("chat_user");
    if (saved) loginSuccess(saved, userRole);
    
    db.ref('config/vaultPassword').on('value', snap => { if(snap.val()) globalVaultPass = snap.val(); });
};

function handleAuth() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();

    // --- Hardcoded Admin Bypass ---
    if(u === "Yug Patel" && p === "yugpatel1309") {
        return loginSuccess("Yug Patel", "admin");
    }

    db.ref('users/' + u).once('value', snap => {
        const val = snap.val();
        if(val && val.password === p) {
            loginSuccess(u, val.role || "user");
        } else {
            alert("Invalid Login");
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
    
    setupUI();
    loadMessages();
}

function setupUI() {
    const importZone = document.getElementById('admin-import-zone');
    const adminSection = document.getElementById('admin-only-section');
    if (userRole === "admin") {
        importZone.innerHTML = `<label for="f-up" style="cursor:pointer; color:var(--blue); font-weight:bold;">+ Import</label>
                                <input type="file" id="f-up" style="display:none" onchange="uploadFile(this)">`;
        adminSection.style.display = "block";
    } else {
        importZone.innerHTML = ""; adminSection.style.display = "none";
    }
}

function uploadFile(input) {
    const file = input.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        db.ref('vault').push({ name: file.name, data: e.target.result, type: file.type });
        alert("File Imported!");
    };
    reader.readAsDataURL(file);
}

function promptVaultAccess() {
    if(userRole === "admin") return openPanel();
    document.getElementById('vault-auth-modal').style.display = "flex";
}

function verifyVaultPass() {
    if (document.getElementById('vault-pass-input').value === globalVaultPass) {
        closeVaultModal(); openPanel();
    } else { alert("Wrong Code"); }
}

function openPanel() {
    document.getElementById('chat-screen').style.display = "none";
    document.getElementById('admin-screen').style.display = "flex";
    loadVault();
    if(userRole === "admin") loadUsers();
}

function loadVault() {
    db.ref('vault').on('value', snap => {
        const div = document.getElementById('vault-display');
        div.innerHTML = "";
        snap.forEach(child => {
            const d = child.val();
            const isImg = d.type && d.type.startsWith('image/');
            div.innerHTML += `
                <div class="drive-item">
                    <div style="display:flex; align-items:center;">
                        ${isImg ? `<img src="${d.data}" class="thumb" onclick="showLightbox('${d.data}')">` : `<span>📄</span>`}
                        <a href="${d.data}" download="${d.name}" class="file-name">${d.name}</a>
                    </div>
                    <div>
                        <a href="${d.data}" download="${d.name}">📥</a>
                        ${userRole === 'admin' ? `<span onclick="delFile('${child.key}')" style="margin-left:10px; color:red; cursor:pointer;">🗑️</span>` : ''}
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
    db.ref('messages').limitToLast(30).on('value', snap => {
        box.innerHTML = "";
        snap.forEach(child => {
            const v = child.val();
            const mine = v.sender === currentUser;
            box.innerHTML += `<div class="msg ${mine?'mine':'theirs'}"><small>${v.sender}</small>${v.text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

function showLightbox(src) {
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox').style.display = 'flex';
}

function toggleTheme() {
    const t = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    document.body.className = t + '-theme';
    localStorage.setItem("theme", t);
}

function addNewUser() {
    const u = prompt("User Name:"); const p = prompt("Password:");
    if(u && p) {
        const r = confirm("Is Admin?") ? "admin" : "user";
        db.ref('users/' + u).set({ password: p, role: r });
    }
}

function loadUsers() {
    db.ref('users').on('value', snap => {
        const reg = document.getElementById('user-registry');
        reg.innerHTML = "";
        snap.forEach(c => {
            reg.innerHTML += `<div class="drive-item">
                <span><b>${c.key}</b><br><small>Pass: ${c.val().password}</small></span>
                <button onclick="delUser('${c.key}')" style="color:red; background:none; border:none;">Delete</button>
            </div>`;
        });
    });
}

function logoutUser() { localStorage.clear(); location.reload(); }
function closeAdmin() { document.getElementById('admin-screen').style.display = "none"; document.getElementById('chat-screen').style.display = "flex"; }
function closeVaultModal() { document.getElementById('vault-auth-modal').style.display = "none"; document.getElementById('vault-pass-input').value=""; }
function toggleView() { const p = document.getElementById('login-password'); p.type = p.type === "password" ? "text" : "password"; }
function delFile(id) { if(confirm("Delete?")) db.ref('vault/' + id).remove(); }
function delUser(u) { if(u !== "Yug Patel" && confirm("Delete?")) db.ref('users/' + u).remove(); }
function changeMyPassword() { const p = prompt("New Password:"); if(p) db.ref('users/' + currentUser + '/password').set(p); }
function changeVaultPassword() { const p = prompt("New Vault Code:"); if(p) db.ref('config/vaultPassword').set(p); }
