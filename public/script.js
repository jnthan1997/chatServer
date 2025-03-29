const socket = io(); // Connect to the server

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('message');


form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload
    const message = input.value;
    if (message) {
        socket.emit('chat message', message); // Send message to server
        input.value = ''; // Clear the input
    }
});



// Listen for incoming messages
socket.on('chat message', (msg) => {
    const li = document.createElement('li');
    li.textContent = msg;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight; // Scroll to the bottom

});
