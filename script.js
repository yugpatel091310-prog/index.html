// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
    databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
    projectId: "chat-go12",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentAdminId = "Yug Patel"; // Your Master ID

// --- AUTHENTICATION ---
function handleAuth() {
    const u = document.getElementById('login-u').value.trim();
    const p = document.getElementById('login-p').value;

    // Check against Firebase stored Admin credentials
    db.ref('admin_config').once('value', s => {
        const data = s.val();
        const storedPass = data ? data.pass : "yugpatel1309"; // Default if not set yet

        if (u === currentAdminId && p === storedPass) {
            showPage('page-files');
        } else {
            alert("ACCESS_DENIED");
        }
    });
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'page-files') loadFiles();
}

// --- FILE SYSTEM ---
function loadFiles() {
    db.ref('vault').on('value', s => {
        const list = document.getElementById('file-list');
        list.innerHTML = "";
        if(!s.exists()) list.innerHTML = "<p style='text-align:center; opacity:0.3; margin-top:30px;'>VAULT_EMPTY</p>";
        
        s.forEach(c => {
            const f = c.val(); const id = c.key;
            list.innerHTML += `
                <div class="admin-card">
                    <p style="color:cyan; margin:0 0 10px 0; font-weight:bold;">${f.name}</p>
                    <div style="display:flex; gap:5px">
                        <button class="nav-btn" onclick="preview('${f.data}','${f.type}')" style="flex:1">👁️ VIEW</button>
                        <a href="${f.data}" download="${f.name}" class="nav-btn" style="flex:1; text-align:center; text-decoration:none">📥 GET</a>
                        <button class="nav-btn" onclick="delFile('${id}')" style="background:#600">🗑️</button>
                    </div>
                </div>`;
        });
    });
}

function upFile(el) {
    const f = el.files[0]; if(!f) return;
    const r = new FileReader();
    r.readAsDataURL(f);
    r.onload = () => db.ref('vault').push({ name: f.name, data: r.result, type: f.type });
}

function delFile(id) { if(confirm("Delete file?")) db.ref('vault/'+id).remove(); }

function preview(data, type) {
    const div = document.createElement('div');
    div.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.98); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center;";
    let media = type.includes('image') ? `<img src="${data}" style="max-width:90%; border-radius:10px;">` : `<iframe src="${data}" style="width:90%; height:75%; border:none; background:#fff; border-radius:10px;"></iframe>`;
    div.innerHTML = `<button onclick="this.parentElement.remove()" style="position:absolute; top:30px; right:20px; padding:12px 25px; background:red; border:none; color:#fff; font-weight:bold; border-radius:8px;">CLOSE</button>${media}`;
    document.body.appendChild(div);
}

// --- SETTINGS: CHANGE LOGIN PASSWORD ---
function changeAdminPass() {
    const newPass = document.getElementById('new-admin-p').value;
    if (newPass.length < 4) return alert("Password too short");
    
    db.ref('admin_config').update({ pass: newPass })
        .then(() => {
            alert("Login Password Updated!");
            document.getElementById('new-admin-p').value = "";
        });
}
