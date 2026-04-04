const firebaseConfig = {
  apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
  databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
  projectId: "chat-go12",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";
let isLoginMode = true;

// Toggle Login/Signup
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Welcome" : "Create Account";
    document.getElementById('auth-btn').innerText = isLoginMode ? "Login" : "Sign Up";
    document.getElementById('toggle-link').innerText = isLoginMode ? "Sign Up" : "Login";
}

function toggleView() {
    const p = document.getElementById('login-password');
    p.type = p.type === "password" ? "text" : "password";
}

// Auth Handling
function handleAuth() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    if(!u || !p) return alert("Fill all fields");

    if (isLoginMode) {
        if(u === "Yug Patel" && p === "yugpatel1309") {
            document.getElementById('admin-gate').style.display = "block";
            return loginSuccess("Yug Patel");
        }
        db.ref('users/' + u).once('value', snap => {
            const val = snap.val();
            if(val && val.password === p) loginSuccess(u);
            else alert("Wrong credentials");
        });
    } else {
        db.ref('users/' + u).once('value', snap => {
            if(snap.exists()) return alert("User exists");
            db.ref('users/' + u).set({ password: p }).then(() => {
                alert("Account created! Now login.");
                toggleAuthMode();
            });
        });
    }
}

function loginSuccess(name) {
    currentUser = name;
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
    document.getElementById('user-tag').innerText = name;
    loadMessages();
}

// Messages
function sendMessage() {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    db.ref('messages').push({ sender: currentUser, text: input.value, type: 'text' });
    input.value = "";
}

function sendImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => db.ref('messages').push({ sender: currentUser, text: e.target.result, type: 'image' });
        reader.readAsDataURL(input.files[0]);
    }
}

function loadMessages() {
    const box = document.getElementById('messages-display');
    db.ref('messages').on('value', snap => {
        box.innerHTML = "";
        snap.forEach(child => {
            const m = child.val();
            const id = child.key;
            const isMine = m.sender === currentUser;
            const isAdmin = currentUser === "Yug Patel";
            
            const delBtn = isAdmin ? `<div class="del-msg" onclick="deleteMsg('${id}')">×</div>` : "";
            const content = m.type === 'image' ? `<img src="${m.text}">` : `<span>${m.text}</span>`;
            
            box.innerHTML += `<div class="msg ${isMine?'mine':'theirs'}">${delBtn}<b>${m.sender}</b>${content}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

function deleteMsg(id) { if(confirm("Delete message?")) db.ref('messages/' + id).remove(); }

// Admin Panel
function openAdmin() {
    if(currentUser !== "Yug Patel") return;
    document.getElementById('chat-screen').style.display = "none";
    document.getElementById('admin-screen').style.display = "flex";
    
    db.ref('users').on('value', snap => {
        const list = document.getElementById('user-registry');
        list.innerHTML = "";
        snap.forEach(child => {
            const uName = child.key;
            if(uName === "Yug Patel") return;
            list.innerHTML += `
                <div class="admin-user-card">
                    <div><b>${uName}</b><br><input type="text" id="p-${uName}" value="${child.val().password}" style="width:100px; padding:2px; margin:0; font-size:12px;"></div>
                    <div class="admin-actions">
                        <button class="save-p" onclick="savePass('${uName}')">Save</button>
                        <button class="del-u" onclick="deleteUser('${uName}')">Del</button>
                    </div>
                </div>`;
        });
    });
}

function savePass(u) { db.ref('users/' + u).update({ password: document.getElementById('p-'+u).value }); alert("Saved"); }
function deleteUser(u) { if(confirm("Delete user?")) db.ref('users/' + u).remove(); }
function closeAdmin() { document.getElementById('admin-screen').style.display = "none"; document.getElementById('chat-screen').style.display = "flex"; }
