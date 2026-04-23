document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const joinScreen = document.getElementById('join-screen');
    const chatScreen = document.getElementById('chat-screen');

    // Join Elements
    const joinBtn = document.getElementById('join-btn');
    const usernameInput = document.getElementById('username');

    // Chat Elements
    const messageInput = document.getElementById('message-input');
    const chatForm = document.getElementById('chat-form');
    const messagesContainer = document.getElementById('messages');
    const leaveBtn = document.getElementById('leave-btn');
    
    // Modal Elements
    const leaveModal = document.getElementById('leave-modal');
    const cancelLeave = document.getElementById('cancel-leave');
    const confirmLeave = document.getElementById('confirm-leave');

    // Emoji Picker Elements
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPickerContainer = document.getElementById('emoji-picker-container');
    const emojiPicker = document.querySelector('emoji-picker');

    // --- Step 1: Initialize Socket.IO ---
    const socket = io();

    // Log connection status
    socket.on('connect', () => {
        console.log('Connected to server! Socket ID:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server!');
    });

    const userCountDisplay = document.getElementById('user-count');

    let currentUser = '';

    // --- Step 2: Handle Incoming Events ---
    
    // Chat messages
    socket.on('chat message', (data) => {
        const type = data.socketId === socket.id ? 'sent' : 'received';
        const sender = type === 'sent' ? 'You' : data.username;
        addMessage(data.text, type, sender, data.timestamp);
    });

    // System messages (Join/Leave)
    socket.on('system message', (text) => {
        addSystemMessage(text);
    });

    // User count updates
    socket.on('user count', (count) => {
        userCountDisplay.textContent = count;
    });

    // --- Interaction Logic ---

    // Join Chat
    joinBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        if (username) {
            currentUser = username;
            
            // Tell the server we joined
            socket.emit('join', username);
            
            showChatScreen();
        } else {
            alert('Please enter a username');
        }
    });

    // Leave Modal Logic
    leaveBtn.addEventListener('click', () => {
        leaveModal.classList.remove('hidden');
    });

    cancelLeave.addEventListener('click', () => {
        leaveModal.classList.add('hidden');
    });

    leaveModal.addEventListener('click', (e) => {
        if (e.target === leaveModal) leaveModal.classList.add('hidden');
    });

    confirmLeave.addEventListener('click', () => {
        location.reload(); 
    });

    // Emoji Picker Logic
    if (emojiBtn && emojiPicker) {
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiPickerContainer.classList.toggle('hidden');
        });

        emojiPicker.addEventListener('emoji-click', (event) => {
            const emoji = event.detail.unicode;
            const start = messageInput.selectionStart;
            const end = messageInput.selectionEnd;
            const text = messageInput.value;
            
            messageInput.value = text.substring(0, start) + emoji + text.substring(end);
            
            const newPos = start + emoji.length;
            messageInput.setSelectionRange(newPos, newPos);
            messageInput.focus();
        });

        document.addEventListener('click', (e) => {
            if (emojiPickerContainer && !emojiPickerContainer.contains(e.target) && e.target !== emojiBtn) {
                emojiPickerContainer.classList.add('hidden');
            }
        });
    }

    // Send Message
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        
        if (text) {
            socket.emit('chat message', {
                username: currentUser,
                text: text
            });
            
            messageInput.value = '';
            emojiPickerContainer.classList.add('hidden'); // Close picker on send
            messageInput.focus();
        }
    });

    function showChatScreen() {
        joinScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        messageInput.focus();
    }

    function addMessage(text, type, sender, time) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        
        const metaDiv = document.createElement('div');
        metaDiv.classList.add('message-meta');
        metaDiv.innerHTML = `<span class="sender">${sender}</span> <span class="time">${time}</span>`;
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('text-content');
        contentDiv.textContent = text;
        
        messageDiv.appendChild(metaDiv);
        messageDiv.appendChild(contentDiv);
        
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function addSystemMessage(text) {
        const div = document.createElement('div');
        div.classList.add('system-message');
        div.textContent = text;
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinBtn.click();
    });
});
