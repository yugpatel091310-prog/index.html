const firebaseConfig = {
  apiKey: "AIzaSyCDwmQT8q_gL8TxFW8Atdl9JtRo3ywYj98",
  databaseURL: "https://chat-go12-default-rtdb.firebaseio.com/",
  projectId: "chat-go12",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";

function toggleView() {
    const p = document.getElementById('login-password');
    p.type = p.type === "password" ? "text" : "password";
}

function handleLogin() {
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;

    if(u === "Yug Patel" && p === "yugpatel1309") {
        document.getElementById('admin-gate').style.display = "inline-block";
        loginSuccess("Yug Patel");
        return;
    }

    db.ref('users/' + u).once('value', (snap) => {
        const data = snap.val();
        if(data && data.password === p) {
            loginSuccess(u);
        } else {
            alert("Incorrect login details.");
        }
    });
}

function loginSuccess(name) {
    currentUser = name;
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
    document.getElementById('user-tag').innerText = name;
    loadMessages();
}

function sendMessage() {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    
    db.ref('messages').push({
        sender: currentUser,
        text: input.value,
        type: 'text',
        time: Date.now()
    });
    input.value = "";
}

function sendImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            db.ref('messages').push({
                sender: currentUser,
                text: e.target.result,
                type: 'image',
                time: Date.now()
            });
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function loadMessages() {
    const display = document.getElementById('messages-display');
    db.ref('messages').on('child_added', (snap) => {
        const m = snap.val();
        const isMine = m.sender === currentUser;
        
        let content = m.type === 'image' 
            ? `<img src="${m.text}" />` 
            : `<span>${m.text}</span>`;

        const msgHtml = `
            <div class="msg ${isMine ? 'mine' : 'theirs'}">
                <b>${m.sender}</b>
                ${content}
            </div>
        `;
        
        display.innerHTML += msgHtml;
        display.scrollTop = display.scrollHeight;
    });
}

// Admin Logic
function openAdmin() {
    document.getElementById('chat-screen').style.display = "none";
    document.getElementById('admin-screen').style.display = "block";
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
    if(!u || !p) return;
    db.ref('users/' + u).set({ password: p });
    alert("User Created!");
}

function closeAdmin() {
    document.getElementById('admin-screen').style.display = "none";
    document.getElementById('chat-screen').style.display = "flex";
}
