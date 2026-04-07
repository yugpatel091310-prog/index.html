const firebaseConfig = {
    apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
    databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
    projectId: "chat-go12",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";
let userRole = localStorage.getItem("role") || "user";
let mediaRec;
let audioChunks = [];

// AUTO DELETE OLD MESSAGES (24HR)
function cleanDB() {
    const day = 24 * 60 * 60 * 1000;
    db.ref('messages').once('value', s => {
        s.forEach(c => {
            if(c.val().ts && (Date.now() - c.val().ts > day)) db.ref('messages/'+c.key).remove();
        });
    });
}

function handleAuth() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value;

    if(u === "Yug Patel" && p === "yugpatel1309") return login(u, "admin");

    db.ref('users/' + u).once('value', s => {
        if(s.val() && s.val().password === p) login(u, s.val().role);
        else alert("Wrong Login");
    });
}

function login(name, role) {
    currentUser = name;
    userRole = role;
    localStorage.setItem("role", role);
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
    document.getElementById('user-tag').innerText = name;
    
    if(role === 'admin') {
        document.getElementById('admin-import-zone').innerHTML = `<input type="file" onchange="upload(this)">`;
        document.getElementById('admin-only-section').style.display = 'block';
    }
    
    loadMsgs();
    cleanDB();
}

function send() {
    const i = document.getElementById('msg-input');
    if(!i.value) return;
    db.ref('messages').push({ sender: currentUser, text: i.value, ts: Date.now() });
    i.value = "";
}

function loadMsgs() {
    const box = document.getElementById('messages-display');
    db.ref('messages').on('value', s => {
        box.innerHTML = "";
        s.forEach(c => {
            const v = c.val();
            const mine = v.sender === currentUser;
            const content = v.type === 'audio' ? `<audio controls src="${v.data}"></audio>` : v.text;
            box.innerHTML += `<div class="msg ${mine?'mine':'theirs'}"><small>${v.sender}</small><br>${content}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

async function startRec() {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRec = new MediaRecorder(s);
    audioChunks = [];
    document.getElementById('voice-btn').style.background = "red";
    mediaRec.ondataavailable = e => audioChunks.push(e.data);
    mediaRec.onstop = () => {
        const reader = new FileReader();
        reader.readAsDataURL(new Blob(audioChunks));
        reader.onloadend = () => {
            db.ref('messages').push({ sender: currentUser, type: 'audio', data: reader.result, ts: Date.now() });
        };
        document.getElementById('voice-btn').style.background = "#333";
    };
    mediaRec.start();
}
function stopRec() { if(mediaRec) mediaRec.stop(); }

function promptVault() { openAdmin(); } // Bypassing code for now to save you frustration
function openAdmin() { document.getElementById('admin-screen').style.display = 'block'; loadVault(); }
function closeAdmin() { document.getElementById('admin-screen').style.display = 'none'; }

function loadVault() {
    db.ref('vault').on('value', s => {
        const d = document.getElementById('vault-display'); d.innerHTML = "";
        s.forEach(c => {
            d.innerHTML += `<div style="margin-bottom:10px">${c.val().name} <a href="${c.val().data}" download style="color:cyan">Download</a></div>`;
        });
    });
}

function upload(el) {
    const f = el.files[0];
    const r = new FileReader();
    r.readAsDataURL(f);
    r.onload = () => db.ref('vault').push({ name: f.name, data: r.result, type: f.type });
}

function logout() { location.reload(); }
