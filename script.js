// Simple front-end login, registration, public and private chat logic
// Demo credentials: username: scholier, password: welkom

// === CONFIGURE THIS ===
const API_URL = 'http://localhost:3000'; // Zet dit op je serveradres als je online host
// =====================

// Login/register AJAX
async function api(endpoint, data) {
    const res = await fetch(API_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

// Login/register logic
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const registerLink = document.getElementById('show-register');

registerForm.style.display = 'none';

registerLink.addEventListener('click', function(e) {
    e.preventDefault();
    registerForm.style.display = 'flex';
    loginForm.style.display = 'none';
    registerLink.style.display = 'none';
    loginError.style.display = 'none';
    registerError.textContent = '';
});

registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;
    if (!username || !password || !password2) {
        registerError.textContent = 'Vul alle velden in.';
        return;
    }
    if (password !== password2) {
        registerError.textContent = 'Wachtwoorden komen niet overeen.';
        return;
    }
    const res = await api('/register', { username, password });
    if (res.error) {
        registerError.textContent = res.error;
        return;
    }
    registerError.style.color = 'green';
    registerError.textContent = 'Registratie gelukt! Je kunt nu inloggen.';
    setTimeout(() => {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        registerLink.style.display = 'block';
        registerError.style.color = '';
        registerError.textContent = '';
    }, 1500);
});

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = await api('/login', { username, password });
    if (res.error) {
        loginError.style.display = 'block';
        loginError.textContent = res.error;
        return;
    }
    loginContainer.style.display = 'none';
    chatContainer.style.display = 'block';
    window.currentUser = username;
    loginError.style.display = 'none';
    startChat();
});

// === PUBLIC CHAT ===
function startChat() {
    const socket = io(API_URL);
    const publicInput = document.getElementById('public-chat-input');
    const publicSendButton = document.getElementById('public-send-button');
    const publicMessageBox = document.getElementById('public-message-box');
    let onlineDiv = document.getElementById('online-count');
    if (!onlineDiv) {
        onlineDiv = document.createElement('div');
        onlineDiv.id = 'online-count';
        onlineDiv.style.textAlign = 'right';
        onlineDiv.style.color = '#4CAF50';
        onlineDiv.style.fontWeight = 'bold';
        publicMessageBox.parentNode.insertBefore(onlineDiv, publicMessageBox);
    }
    publicMessageBox.innerHTML = '';

    socket.on('init', msgs => {
        publicMessageBox.innerHTML = '';
        msgs.forEach(msg => addMsg(msg));
    });
    socket.on('public-message', msg => addMsg(msg));
    socket.on('online-count', count => {
        onlineDiv.textContent = `Online: ${count}`;
    });

    function addMsg(msg) {
        const div = document.createElement('div');
        div.className = 'message';
        div.textContent = `${msg.sender}: ${msg.text}`;
        if (msg.sender === window.currentUser) div.style.background = '#c8f7c5';
        publicMessageBox.appendChild(div);
        publicMessageBox.scrollTop = publicMessageBox.scrollHeight;
    }

    function sendMsg() {
        const text = publicInput.value.trim();
        if (!text) return;
        socket.emit('public-message', { sender: window.currentUser, text });
        publicInput.value = '';
    }
    publicSendButton.onclick = sendMsg;
    publicInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendMsg();
    });
}

// Install required packages
// Run the following command in your terminal:
// npm install express cors bcryptjs socket.io
