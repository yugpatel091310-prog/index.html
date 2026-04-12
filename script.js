// --- 1. INITIALIZE THREE PROJECTS ---
const p1 = { apiKey: "AIzaSyB3lbxW4AH3yY40xxgG0DGanY_6oXa13Zg", databaseURL: "https://sync-2-b5006-default-rtdb.firebaseio.com/", storageBucket: "sync-2-b5006.firebasestorage.app", projectId: "sync-2-b5006" };
const p2 = { apiKey: "AIzaSyDJ1bOtg-UdYs2R4uSgxomzJhBaIJxY6TA", databaseURL: "https://yugchatgo-default-rtdb.firebaseio.com/", storageBucket: "yugchatgo.firebasestorage.app", projectId: "yugchatgo" };
const p3 = { apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98", databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/", storageBucket: "chat-go12.firebasestorage.app", projectId: "chat-go12" };

const app1 = firebase.initializeApp(p1, "app1");
const app2 = firebase.initializeApp(p2, "app2");
const app3 = firebase.initializeApp(p3, "app3");

const db1 = app1.database(); const st1 = app1.storage();
const db2 = app2.database(); const st2 = app2.storage();
const db3 = app3.database(); const st3 = app3.storage();

// --- 2. AUTHENTICATION & SETTINGS ---
function handleAuth() {
    const u = document.getElementById('login-u').value.trim();
    const p = document.getElementById('login-p').value;

    // We use Project 1 (db1) as the master authority for your password
    db1.ref('admin_config').once('value', s => {
        const data = s.val();
        // Fallback to your default if database is empty
        const storedPass = (data && data.pass) ? data.pass : "yugpatel1309";

        if (u === "Yug Patel" && p === storedPass) {
            showPage('page-files');
            loadAllVaults();
        } else {
            alert("ACCESS_DENIED");
        }
    });
}

function changeAdminPass() {
    const newPass = document.getElementById('new-admin-p').value;
    if (newPass.length < 4) return alert("Password too short!");
    
    // Updates the password in Project 1
    db1.ref('admin_config').update({ pass: newPass })
        .then(() => {
            alert("Master Password Updated!");
            document.getElementById('new-admin-p').value = "";
            showPage('page-files');
        })
        .catch(err => alert("Error: " + err.message));
}

// --- 3. NAVIGATION ---
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// --- 4. SMART UPLOAD LOGIC ---
async function smartUpload(el) {
    const file = el.files[0];
    if (!file) return;
    const status = document.getElementById('status-text');
    status.innerText = "Scanning Vaults...";

    const s1 = await getVaultSize(db1);
    const s2 = await getVaultSize(db2);
    
    let targetDB, targetST, vaultNum;

    // Limit set to 4.5GB to leave safety margin
    if (s1 < 4500000000) { targetDB = db1; targetST = st1; vaultNum = 1; }
    else if (s2 < 4500000000) { targetDB = db2; targetST = st2; vaultNum = 2; }
    else { targetDB = db3; targetST = st3; vaultNum = 3; }

    status.innerText = `Uploading to Vault ${vaultNum}...`;

    const ref = targetST.ref('vault/' + Date.now() + "_" + file.name);
    ref.put(file).then(async (snap) => {
        const url = await snap.ref.getDownloadURL();
        targetDB.ref('vault_meta').push({
            name: file.name,
            url: url,
            type: file.type,
            size: file.size
        });
        status.innerText = "Upload Success!";
    }).catch(err => {
        alert("Upload Failed. Check Storage Rules.");
        status.innerText = "Error.";
    });
}

async function getVaultSize(db) {
    let total = 0;
    const snap = await db.ref('vault_meta').once('value');
    snap.forEach(c => { total += (c.val().size || 0); });
    return total;
}

// --- 5. DISPLAY & DELETE ---
function loadAllVaults() {
    const vaults = [
        { db: db1, list: 'list-1', num: 1 },
        { db: db2, list: 'list-2', num: 2 },
        { db: db3, list: 'list-3', num: 3 }
    ];

    vaults.forEach(v => {
        v.db.ref('vault_meta').on('value', s => {
            const el = document.getElementById(v.list);
            el.innerHTML = "";
            s.forEach(c => {
                const f = c.val();
                el.innerHTML += `
                    <div class="admin-card" style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:12px; color:cyan;">${f.name}</span>
                        <div style="display:flex; gap:5px;">
                            <button class="nav-btn" onclick="preview('${f.url}','${f.type}')">👁️</button>
                            <a href="${f.url}" download="${f.name}" class="nav-btn" style="text-decoration:none;">📥</a>
                            <button class="nav-btn" style="background:#600" onclick="delFile(${v.num}, '${c.key}', '${f.name}')">🗑️</button>
                        </div>
                    </div>`;
            });
        });
    });
}

function preview(url, type) {
    const div = document.createElement('div');
    div.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center;";
    let media = type.includes('image') ? `<img src="${url}" style="max-width:90%; border-radius:10px;">` : `<iframe src="${url}" style="width:90%; height:75%; border:none; background:#fff; border-radius:10px;"></iframe>`;
    div.innerHTML = `<button onclick="this.parentElement.remove()" style="position:absolute; top:30px; right:20px; padding:12px 25px; background:red; border:none; color:#fff; font-weight:bold; border-radius:8px;">CLOSE</button>${media}`;
    document.body.appendChild(div);
}

function delFile(vaultNum, dbKey, fileName) {
    if (!confirm("Delete file permanently?")) return;
    const dbs = [db1, db2, db3];
    const sts = [st1, st2, st3];
    
    sts[vaultNum-1].ref('vault/' + fileName).delete().catch(() => {}); // Attempt storage delete
    dbs[vaultNum-1].ref('vault_meta/' + dbKey).remove(); // Remove DB entry
}
