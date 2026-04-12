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

// --- AUTH ---
function handleAuth() {
    const u = document.getElementById('login-u').value.trim();
    const p = document.getElementById('login-p').value;
    
    // Check Project 1 for password
    db1.ref('admin_config').once('value', s => {
        const storedPass = (s.val() && s.val().pass) ? s.val().pass : "yugpatel1309";
        if (u === "Yug Patel" && p === storedPass) {
            document.getElementById('page-login').classList.remove('active');
            document.getElementById('page-files').classList.add('active');
            loadAllVaults(); // This starts the folder "See Files" logic
        } else { alert("ACCESS_DENIED"); }
    });
}

// --- SEE FILES LOGIC (DESIGNATED FOLDERS) ---
function loadAllVaults() {
    const configs = [
        { db: db1, listId: 'list-1' },
        { db: db2, listId: 'list-2' },
        { db: db3, listId: 'list-3' }
    ];

    configs.forEach(cfg => {
        // This listener watches for changes in the database and updates the folder instantly
        cfg.db.ref('vault_meta').on('value', snapshot => {
            const listEl = document.getElementById(cfg.listId);
            listEl.innerHTML = ""; // Clear current view
            
            if (!snapshot.exists()) {
                listEl.innerHTML = "<p style='color:gray; font-size:10px;'>Folder is empty</p>";
                return;
            }

            snapshot.forEach(child => {
                const file = child.val();
                listEl.innerHTML += `
                    <div class="admin-card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <span style="font-size:12px; color:cyan;">${file.name}</span>
                        <div style="display:flex; gap:5px;">
                            <button class="nav-btn" onclick="window.open('${file.url}')">👁️</button>
                            <button class="nav-btn" style="background:#600" onclick="deleteFile('${cfg.listId}', '${child.key}', '${file.name}')">🗑️</button>
                        </div>
                    </div>`;
            });
        });
    });
}

// --- UPLOAD LOGIC ---
async function smartUpload(el) {
    const file = el.files[0];
    if (!file) return;
    const status = document.getElementById('status-text');
    status.innerText = "UPLOADING...";

    // For now, it uploads to Project 1. 
    // You can add logic here to check size and switch to st2 or st3 later.
    const storageRef = st1.ref('vault/' + file.name);
    
    try {
        const snapshot = await storageRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        // Save the info to the database so we can "see" it
        await db1.ref('vault_meta').push({
            name: file.name,
            url: downloadURL,
            size: file.size,
            type: file.type
        });
        
        status.innerText = "SUCCESS: FILE ADDED TO FOLDER 1";
    } catch (error) {
        console.error(error);
        status.innerText = "ERROR: CHECK FIREBASE RULES";
    }
}
