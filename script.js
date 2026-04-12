// --- INITIALIZE THREE PROJECTS ---
// Fill these with the keys from your three Firebase console projects
const p1 = { apiKey: "AIzaSyB3lbxW4AH3yY40xxgG0DGanY_6oXa13Zg", databaseURL: "https://sync-2-b5006-default-rtdb.firebaseio.com/", storageBucket: "sync-2-b5006.firebasestorage.app", projectId: "sync-2-b5006" };
const p2 = { apiKey: "AIzaSyDJ1bOtg-UdYs2R4uSgxomzJhBaIJxY6TA", databaseURL: "https://yugchatgo-default-rtdb.firebaseio.com/", storageBucket: "yugchatgo.firebasestorage.app", projectId: "yugchatgo" };
const p3 = { apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98", databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/", storageBucket: "chat-go12.firebasestorage.app", projectId: "chat-go12" };

const app1 = firebase.initializeApp(p1, "app1");
const app2 = firebase.initializeApp(p2, "app2");
const app3 = firebase.initializeApp(p3, "app3");

const db1 = app1.database(); const st1 = app1.storage();
const db2 = app2.database(); const st2 = app2.storage();
const db3 = app3.database(); const st3 = app3.storage();

// --- SMART UPLOAD LOGIC ---
async function smartUpload(el) {
    const file = el.files[0];
    if (!file) return;
    const status = document.getElementById('status-text');
    status.innerText = "Checking availability...";

    // Check size of each vault (Approx via DB counter)
    const s1 = await getVaultSize(db1);
    const s2 = await getVaultSize(db2);
    
    let targetDB, targetST, vaultNum;

    if (s1 < 4500000000) { targetDB = db1; targetST = st1; vaultNum = 1; }
    else if (s2 < 4500000000) { targetDB = db2; targetST = st2; vaultNum = 2; }
    else { targetDB = db3; targetST = st3; vaultNum = 3; }

    status.innerText = `Uploading to Vault ${vaultNum}...`;

    // Upload to Storage
    const ref = targetST.ref('vault/' + file.name);
    ref.put(file).then(async (snap) => {
        const url = await snap.ref.getDownloadURL();
        // Save metadata to Database
        targetDB.ref('vault_meta').push({
            name: file.name,
            url: url,
            type: file.type,
            size: file.size
        });
        status.innerText = "Upload Complete!";
    }).catch(err => { alert("Upload failed: " + err.message); status.innerText = "Error."; });
}

async function getVaultSize(db) {
    let total = 0;
    const snap = await db.ref('vault_meta').once('value');
    snap.forEach(c => { total += (c.val().size || 0); });
    return total;
}

// --- DISPLAY LOGIC ---
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
                        <span style="font-size:12px;">${f.name}</span>
                        <div style="display:flex; gap:5px;">
                            <button class="nav-btn" onclick="window.open('${f.url}')">👁️</button>
                            <button class="nav-btn" style="background:#600" onclick="delFile(${v.num}, '${c.key}', '${f.name}')">🗑️</button>
                        </div>
                    </div>`;
            });
        });
    });
}

function delFile(vaultNum, dbKey, fileName) {
    if (!confirm("Delete?")) return;
    const dbs = [db1, db2, db3];
    const sts = [st1, st2, st3];
    
    sts[vaultNum-1].ref('vault/' + fileName).delete();
    dbs[vaultNum-1].ref('vault_meta/' + dbKey).remove();
}

// --- LOGIN GATE ---
function handleAuth() {
    const u = document.getElementById('login-u').value;
    const p = document.getElementById('login-p').value;
    
    // Check against project 1 for admin credentials
    db1.ref('admin_config').once('value', s => {
        const stored = s.val() || { pass: "yugpatel1309" };
        if (u === "Yug Patel" && p === (stored.pass || stored)) {
            document.getElementById('page-login').classList.remove('active');
            document.getElementById('page-files').classList.add('active');
            loadAllVaults();
        } else { alert("ACCESS_DENIED"); }
    });
}
