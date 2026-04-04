const firebaseConfig = {
  apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
  databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
  projectId: "chat-go12",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";
let isLoginMode = true;

// Toggle between Login and Sign Up
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btn = document.getElementById('auth-btn');
    const link = document.getElementById('toggle-link');
    const text = document.getElementById('toggle-text');

    if (isLoginMode) {
        title.innerText = "Welcome";
        subtitle.innerText = "Login to start chatting";
        btn.innerText = "Login";
        text.innerText = "Don't have an account?";
        link.innerText = "Sign Up";
    } else {
        title.innerText = "Create Account";
        subtitle.innerText = "Join the private chat";
        btn.innerText = "Sign Up";
        text.innerText = "Already have an account?";
        link.innerText = "Login";
    }
}

function handleAuth() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();

    if (!u || !p) {
        alert("Please fill in all fields");
        return;
    }

    if (isLoginMode) {
        // LOGIN LOGIC
        if (u === "Yug Patel" && p === "yugpatel1309") {
            document.getElementById('admin-gate').style.display = "inline-block";
            loginSuccess("Yug Patel");
            return;
        }

        db.ref('users/' + u).once('value', (snap) => {
            const data = snap.val();
            if (data && data.password === p) {
                loginSuccess(u);
            } else {
                alert("Wrong username or password!");
            }
        });
    } else {
        // SIGN UP LOGIC
        db.ref('users/' + u).once('value', (snap) => {
            if (snap.exists()) {
                alert("Username already taken!");
            } else {
                db.ref('users/' + u).set({ password: p }, (err) => {
                    if (!err) {
                        alert("Account created! You can now login.");
                        toggleAuthMode();
                    }
                });
            }
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

// --- Chat & Image Functions (Same as previous) ---

function sendMessage() {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    db.ref('messages').push({ sender: currentUser, text: input.value, type: 'text' });
    input.value = "";
}

function sendImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            db.ref('messages').push({ sender: currentUser, text: e.target.result, type: 'image' });
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function loadMessages() {
    const display = document.getElementById('messages-display');
    db.ref('messages').on('child_added', (snap) => {
        const m = snap.val();
        const isMine = m.sender === currentUser;
        const content = m.type === 'image' ? `<img src="${m.text}" />` : `<span>${m.text}</span>`;
        display.innerHTML += `<div class="msg ${isMine ? 'mine' : 'theirs'}"><b>${m.sender}</b>${content}</div>`;
        display.scrollTop = display.scrollHeight;
    });
}

// --- Admin Security ---

function openAdmin() {
    // Safety check: Even if the button is hacked to show, 
    // only "Yug Patel" identity can trigger the data pull.
    if (currentUser !== "Yug Patel") {
        alert("Unauthorized access!");
        return;
    }

    document.getElementById('chat-screen').style.display = "none";
    document.getElementById('admin-screen').style.display = "block";
    
    db.ref('users').on('value', (snap) => {
        const users = snap.val();
        const list = document.getElementById('user-registry');
        list.innerHTML = "";
        for(let id in users) {
            list.innerHTML += `<div style="padding:8px; border-bottom:1px solid #eee;">
                User: <b>${id}</b> <br> Pass: <code style="color:red;">${users[id].password}</code>
            </div>`;
        }
    });
}

function closeAdmin() {
    document.getElementById('admin-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
}

function toggleView() {
    const p = document.getElementById('login-password');
    p.type = p.type === "password" ? "text" : "password";
}
