// --- CONFIGURATION ---
const p1 = { apiKey: "AIzaSyB3lbxW4AH3yY40xxgG0DGanY_6oXa13Zg", databaseURL: "https://sync-2-b5006-default-rtdb.firebaseio.com/", storageBucket: "sync-2-b5006.firebasestorage.app", projectId: "sync-2-b5006" };
const p2 = { apiKey: "AIzaSyDJ1bOtg-UdYs2R4uSgxomzJhBaIJxY6TA", databaseURL: "https://yugchatgo-default-rtdb.firebaseio.com/", storageBucket: "yugchatgo.firebasestorage.app", projectId: "yugchatgo" };
const p3 = { apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98", databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/", storageBucket: "chat-go12.firebasestorage.app", projectId: "chat-go12" };

const app1 = firebase.initializeApp(p1, "app1");
const app2 = firebase.initializeApp(p2, "app2");
const app3 = firebase.initializeApp(p3, "app3");

const db1 = app1.database(); const st1 = app1.storage();
const db2 = app2.database(); const st2 = app2.storage();
const db3 = app3.database(); const st3 = app3.storage();

// --- AUTH & NAVIGATION ---
function handleAuth() {
    const u = document.getElementById('login-u').value.trim();
    const p = document.getElementById('login-p').value;

    db1.ref('admin_config').once('value', s => {
        const data = s.val();
        const storedPass = (data && data.pass) ? data.pass : "yugpatel1309";

        if (u === "Yug Patel" && p === storedPass) {
            showPage('page-files');
            loadAllVaults(); // Start loading files immediately
        } else {
            alert("WRONG_CREDENTIALS");
        }
    });
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function changeAdminPass() {
    const np = document.getElementById('new-admin-p').value;
    if(np.length < 4) return alert("Too short");
    db1.ref('admin_config').update({ pass: np }).then(() => {
        alert("Password Updated!");
        showPage('page-files');
    });
}

// --- FILE ENGINE ---
async function smartUpload(el) {
    const file = el.files[0];
    if (!file) return;
    const status = document.getElementById('status-text');
    
    // Check sizes
    const s1 = await getVaultSize(db1);
    const s2 = await getVaultSize(db2);
    
    let targetDB, targetST, vNum;
    if (s1 < 4500000000) { targetDB = db1; targetST = st1; vNum = 1; }
    else if (s2 < 4500000000) { targetDB = db2; targetST = st2; vNum = 2; }
    else { targetDB = db3; targetST = st3; vNum = 3; }

    status.innerText = `Vault ${vNum}: Uploading...`;

    const fileName = Date.now() + "_" + file.name;
    const ref = targetST.ref('vault/' + fileName);

    ref.put(file).then(async (snap) => {
        const url = await snap.ref.getDownloadURL();
        targetDB.ref('vault_meta').push({
            name: file.name,
            sName: fileName,
            url: url,
            type: file.type,
            size: file.size
        });
        status.innerText = "UPLOAD_SUCCESS";
    }).catch(e => {
        alert("Check your Storage Rules!");
        status.innerText = "ERROR";
    });
}

async function getVaultSize(db) {
    let t = 0;
    const s = await db.ref('vault_meta').once('value');
    s.forEach(c => { t += (c.val().size || 0); });
    return t;
}

function loadAllVaults() {
    const vaults = [
        { d: db1, l: 'list-1', n: 1 },
        { d: db2, l: 'list-2', n: 2 },
        { d: db3, l: 'list-3', n: 3 }
    ];

    vaults.forEach(v => {
        // Use .on() so it updates in real-time
        v.d.ref('vault_meta').on('value', s => {
            const list = document.getElementById(v.l);
            list.innerHTML = "";
            if (!s.exists()) {
                list.innerHTML = "<p style='opacity:0.3; font-size:10px; padding:10px;'>Empty</p>";
            }
            s.forEach(child => {
                const f = child.val();
                list.innerHTML += `
                    <div class="admin-card" style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
                        <span style="font-size:12px; color:cyan; overflow:hidden;">${f.name}</span>
                        <div style="display:flex; gap:5px;">
                            <button class="nav-btn" onclick="preview('${f.url}','${f.type}')">👁️</button>
                            <a href="${f.url}" target="_blank" class="nav-btn" style="text-decoration:none;">📥</a>
                            <button class="nav-btn" style="background:#600" onclick="delFile(${v.n}, '${child.key}', '${f.sName}')">🗑️</button>
                        </div>
                    </div>`;
            });
        });
    });
}

function delFile(vNum, key, sName) {
    if(!confirm("Delete?")) return;
    const dbs = [db1, db2, db3];
    const sts = [st1, st2, st3];
    
    sts[vNum-1].ref('vault/' + sName).delete().catch(e => {});
    dbs[vNum-1].ref('vault_meta/' + key).remove();
}

function preview(url, type) {
    const div = document.createElement('div');
    div.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center;";
    let media = type.includes('image') ? `<img src="${url}" style="max-width:90%; border-radius:10px;">` : `<iframe src="${url}" style="width:90%; height:70%; background:#fff; border-radius:10px;"></iframe>`;
    div.innerHTML = `<button onclick="this.parentElement.remove()" style="margin-bottom:20px; padding:10px 20px; background:red; border:none; color:white; border-radius:5px;">CLOSE</button>${media}`;
    document.body.appendChild(div);
}
