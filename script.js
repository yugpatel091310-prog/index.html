const firebaseConfig = {
    apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
    databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
    projectId: "chat-go12",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";
let userRole = "user";
let vaultKey = "1234";

// Navigation Controller
function nav(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if(pageId === 'page-files') loadFiles();
    if(pageId === 'page-admin') loadUserList();
}

// Auth Logic
function handleAuth() {
    const u = document.getElementById('login-u').value.trim();
    const p = document.getElementById('login-p').value;
    if(u === "Yug Patel" && p === "yugpatel1309") return loginSuccess(u, "admin");
    db.ref('users/' + u).once('value', s => {
        if(s.val() && s.val().password === p) loginSuccess(u, s.val().role);
        else alert("ACCESS_DENIED");
    });
}

function loginSuccess(name, role) {
    currentUser = name; userRole = role;
    if(role === 'admin') document.getElementById('admin-btn-nav').style.display = 'block';
    db.ref('config/vaultPassword').on('value', s => { if(s.val()) vaultKey = s.val(); });
    nav('page-chat');
    loadMessages();
}

// Chat Engine
function sendMsg() {
    const i = document.getElementById('msg-input');
    if(!i.value.trim()) return;
    db.ref('messages').push({ sender: currentUser, text: i.value, ts: Date.now() });
    i.value = "";
}

function loadMessages() {
    db.ref('messages').on('value', s => {
        const box = document.getElementById('chat-flow');
        box.innerHTML = "";
        s.forEach(c => {
            const v = c.val();
            const isMine = v.sender === currentUser;
            box.innerHTML += `<div class="msg ${isMine?'mine':'theirs'}">${v.text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

// Vault Logic
function checkVaultKey() {
    const input = document.getElementById('v-key-input').value;
    if(input === vaultKey || userRole === 'admin') nav('page-files');
    else alert("WRONG_KEY");
}

function loadFiles() {
    db.ref('vault').on('value', s => {
        const list = document.getElementById('file-list');
        list.innerHTML = "";
        s.forEach(c => {
            list.innerHTML += `<div class="card" style="display:flex; justify-content:space-between">
                <span>${c.val().name}</span>
                <a href="${c.val().data}" download style="color:var(--neon)">📥</a>
            </div>`;
        });
    });
}

// Admin Tools
function handleUpload(el) {
    const f = el.files[0]; const r = new FileReader();
    r.readAsDataURL(f);
    r.onload = () => db.ref('vault').push({ name: f.name, data: r.result, type: f.type });
}

function updateVaultKey() {
    const n = prompt("New Vault Key:");
    if(n) db.ref('config/vaultPassword').set(n);
}

function logout() { location.reload(); }
