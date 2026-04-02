// REPLACE THIS WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
  databaseURL: "chat-go12.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";

// Toggle Password Eye
function toggleView() {
    const p = document.getElementById('login-password');
    p.type = p.type === "password" ? "text" : "password";
}

// Login
function handleLogin() {
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;

    // Special Check for Admin (Yug Patel)
    if(u === "Yug Patel" && p === "yugpatel1309") {
        document.getElementById('admin-gate').style.display = "block";
        loginSuccess("Yug Patel");
        return;
    }

    // Check Firebase for other users
    db.ref('users/' + u).once('value', (snap) => {
        const data = snap.val();
        if(data && data.password === p) {
            loginSuccess(u);
        } else {
            alert("Wrong username or password!");
        }
    });
}

function loginSuccess(name) {
    currentUser = name;
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "block";
    document.getElementById('user-tag').innerText = name;
    loadMessages();
}

// Chat Functions
function sendMessage() {
    const text = document.getElementById('msg-input').value;
    if(!text) return;
    db.ref('messages').push({ sender: currentUser, text: text });
    document.getElementById('msg-input').value = "";
}

function loadMessages() {
    db.ref('messages').on('child_added', (snap) => {
        const m = snap.val();
        const box = document.getElementById('messages-display');
        box.innerHTML += `<div class="msg"><b>${m.sender}:</b> ${m.text}</div>`;
        box.scrollTop = box.scrollHeight;
    });
}

// Admin Functions
function openAdmin() {
    document.getElementById('chat-screen').style.display = "none";
    document.getElementById('admin-screen').style.display = "block";
    
    // View all passwords
    db.ref('users').on('value', (snap) => {
        const users = snap.val();
        const list = document.getElementById('user-registry');
        list.innerHTML = "";
        for(let id in users) {
            list.innerHTML += `<p>User: ${id} | Pass: <b>${users[id].password}</b></p>`;
        }
    });
}

function createUser() {
    const u = document.getElementById('new-u').value;
    const p = document.getElementById('new-p').value;
    db.ref('users/' + u).set({ password: p });
    alert("User added!");
}

function closeAdmin() {
    document.getElementById('admin-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "block";
      }
