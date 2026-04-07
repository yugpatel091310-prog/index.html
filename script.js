const firebaseConfig = {
    apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
    databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
    projectId: "chat-go12",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let user = { id: "", role: "user" };
let mediaRec, chunks = [];

// Page Switcher
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if(pageId === 'page-files') loadFiles();
    if(pageId === 'page-admin') loadUsers();
}

function handleAuth() {
    const u = document.getElementById('login-u').value.trim();
    const p = document.getElementById('login-p').value;
    if(u === "Yug Patel" && p === "yugpatel1309") return loginSuccess(u, "admin");
    
    db.ref('users/' + u).once('value', s => {
        if(s.val() && s.val().password === p) loginSuccess(u, s.val().role);
        else alert("ACCESS_DENIED");
    });
}

function loginSuccess(u, r) {
    user = { id: u, role: r };
    showPage('page-chat');
    if(r === 'admin') {
        document.getElementById('import-slot').innerHTML = `<input type="file" id="up" onchange="upFile(this)" style="display:none"><label for="up" class="nav-btn">+ ADD</label>`;
    }
    loadChat();
}

function sendMsg() {
    const i = document.getElementById('msg-input');
    if(!i.value) return;
    db.ref('messages').push({ sender: user.id, text: i.value, ts: Date.now() });
    i.value = "";
}

function loadChat() {
    db.ref('messages').limitToLast(30).on('value', s => {
        const box = document.getElementById('chat-box');
        box.innerHTML = "";
        s.forEach(c => {
            const m = c.val();
            const isMe = m.sender === user.id;
            const msgHtml = m.type === 'audio' ? `<audio controls src="${m.data}"></audio>` : m.text;
            box.innerHTML += `<div style="align-self:${isMe?'flex-end':'flex-start'}; background:${isMe?'#1a3a3a':'#222'}; padding:10px; border-radius:10px; max-width:80%; font-size:14px;">
                <small style="color:var(--neon); font-size:9px;">${m.sender}</small><br>${msgHtml}
            </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

// VAULT LOGIC
function loadFiles() {
    db.ref('vault').on('value', s => {
        const list = document.getElementById('file-list'); list.innerHTML = "";
        s.forEach(c => {
            list.innerHTML += `<div class="admin-card" style="display:flex; justify-content:space-between; align-items:center;">
                <span>${c.val().name}</span>
                <a href="${c.val().data}" download style="color:var(--neon); text-decoration:none;">DOWNLOAD</a>
            </div>`;
        });
    });
}

function upFile(el) {
    const f = el.files[0]; const r = new FileReader();
    r.readAsDataURL(f);
    r.onload = () => db.ref('vault').push({ name: f.name, data: r.result, type: f.type });
}

// SECURITY
function checkAdminAccess() {
    if(user.role === 'admin') showPage('page-admin');
    else document.getElementById('modal-vault').style.display = 'flex';
}

function verifyVaultAccess() {
    db.ref('config/vaultPassword').once('value', s => {
        if(document.getElementById('vault-key-input').value === s.val()) {
            closeModal(); showPage('page-admin');
        } else alert("INVALID_KEY");
    });
}

function updateVaultKey() {
    const n = prompt("New Vault Key:");
    if(n) db.ref('config/vaultPassword').set(n);
}

function closeModal() { document.getElementById('modal-vault').style.display = 'none'; }
function logout() { location.reload(); }
