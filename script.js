const firebaseConfig = {
    apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
    databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
    projectId: "chat-go12",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let user = { id: "", role: "user" };
let mediaRec, chunks = [];

// AUTH TOGGLE
function toggleAuthMode(isSignup) {
    document.getElementById('auth-title').innerText = isSignup ? "CREATE_IDENTITY" : "VAULT_LOGIN";
    document.getElementById('login-actions').style.display = isSignup ? "none" : "block";
    document.getElementById('signup-actions').style.display = isSignup ? "block" : "none";
}

// SIGNUP LOGIC
function handleSignup() {
    const u = document.getElementById('login-u').value.trim();
    const p = document.getElementById('login-p').value;
    if(!u || !p) return alert("Enter credentials");
    
    db.ref('users/' + u).once('value', s => {
        if(s.exists()) alert("ID already exists");
        else {
            db.ref('users/' + u).set({ password: p, role: 'user' })
            .then(() => { alert("ID Created!"); toggleAuthMode(false); });
        }
    });
}

function handleAuth() {
    const u = document.getElementById('login-u').value.trim();
    const p = document.getElementById('login-p').value;
    if(u === "Yug Patel" && p === "yugpatel1309") return loginOK(u, "admin");
    db.ref('users/'+u).once('value', s => {
        if(s.val() && s.val().password === p) loginOK(u, s.val().role);
        else alert("ACCESS DENIED");
    });
}

function loginOK(u, r) {
    user = { id: u, role: r };
    showPage('page-chat');
    if(r === 'admin') {
        document.getElementById('import-slot').innerHTML = `<input type="file" id="up" onchange="up(this)" style="display:none"><label for="up" class="nav-btn">+ ADD</label>`;
        document.getElementById('admin-only').style.display = 'block';
        loadUsers();
    }
    loadChat();
}

// ADMIN: DELETE USER
function loadUsers() {
    db.ref('users').on('value', s => {
        const list = document.getElementById('user-list'); list.innerHTML = "";
        s.forEach(c => {
            const uid = c.key;
            list.innerHTML += `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #222;">
                <span>${uid}</span>
                <button onclick="delUser('${uid}')" style="background:none; border:none; color:red; font-size:12px;">DELETE</button>
            </div>`;
        });
    });
}

function delUser(uid) {
    if(confirm(`Delete ${uid}?`)) db.ref('users/' + uid).remove();
}

// EFFICIENT MIC ENGINE
async function startRec() {
    try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRec = new MediaRecorder(s); chunks = [];
        document.getElementById('mic-trigger').classList.add('recording');
        
        mediaRec.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };
        mediaRec.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const r = new FileReader();
            r.readAsDataURL(blob);
            r.onloadend = () => {
                db.ref('messages').push({ sender: user.id, type: 'audio', data: r.result, ts: Date.now() });
            };
            document.getElementById('mic-trigger').classList.remove('recording');
        };
        mediaRec.start();
    } catch(err) { alert("Mic Access Error"); }
}

function stopRec() { if(mediaRec && mediaRec.state === "recording") mediaRec.stop(); }

// [REST OF THE CODE - KEEPING SAME AS PREVIOUS]
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'page-files') loadFiles();
}

function sendMsg() {
    const i = document.getElementById('msg-input');
    if(!i.value) return;
    db.ref('messages').push({ sender: user.id, text: i.value, ts: Date.now() });
    i.value = "";
}

function loadChat() {
    db.ref('messages').limitToLast(25).on('value', s => {
        const box = document.getElementById('chat-box'); box.innerHTML = "";
        s.forEach(c => {
            const m = c.val(); const isMe = m.sender === user.id;
            const msg = m.type === 'audio' ? `<audio controls src="${m.data}" style="width:180px"></audio>` : m.text;
            box.innerHTML += `<div style="align-self:${isMe?'flex-end':'flex-start'}; background:${isMe?'#1a3a3a':'#222'}; padding:10px; border-radius:10px; max-width:80%; margin-bottom:5px;">
                <small style="color:cyan; font-size:9px">${m.sender}</small><br>${msg}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

function loadFiles() {
    db.ref('vault').on('value', s => {
        const list = document.getElementById('file-list'); list.innerHTML = "";
        s.forEach(c => {
            const f = c.val(); const id = c.key;
            list.innerHTML += `<div class="admin-card">
                <p style="color:cyan; margin:0 0 10px 0">${f.name}</p>
                <div style="display:flex; gap:5px">
                    <button class="nav-btn" onclick="preview('${f.data}','${f.type}')" style="flex:1">👁️ VIEW</button>
                    <a href="${f.data}" download="${f.name}" class="nav-btn" style="flex:1; text-align:center; text-decoration:none">📥 GET</a>
                    <button class="nav-btn" onclick="delFile('${id}')" style="background:#600">🗑️</button>
                </div>
            </div>`;
        });
    });
}

function delFile(id) { if(confirm("Delete file?")) db.ref('vault/'+id).remove(); }

function preview(data, type) {
    const div = document.createElement('div'); div.id = "preview-overlay"; div.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center;";
    let media = type.includes('image') ? `<img src="${data}" style="max-width:90%">` : `<iframe src="${data}" style="width:90%; height:70%; border:none; background:#fff"></iframe>`;
    div.innerHTML = `<button onclick="this.parentElement.remove()" style="position:absolute; top:20px; right:20px; padding:10px; background:red; border:none; color:#fff">CLOSE</button>${media}`;
    document.body.appendChild(div);
}

function up(el) {
    const f = el.files[0]; const r = new FileReader();
    r.readAsDataURL(f);
    r.onload = () => db.ref('vault').push({ name: f.name, data: r.result, type: f.type });
}

function checkAdmin() {
    if(user.role === 'admin') showPage('page-admin');
    else {
        const k = prompt("Enter Vault Key:");
        db.ref('config/vaultPassword').once('value', s => {
            if(k === s.val()) showPage('page-admin'); else alert("Wrong Key");
        });
    }
}

function changeVaultKey() {
    const n = prompt("New Key:");
    if(n) db.ref('config/vaultPassword').set(n);
}
