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

fetch('/api/config')
    .then(response => response.json())
    .then(data => {
        const apiURL = data.apiUrl;

        // Create the iframe element
        const iframe = document.createElement("iframe");
        iframe.src = apiURL;
        iframe.width = "1300px";
        iframe.height = "600px";
        iframe.frameBorder = "0"; 

        // Append the iframe to the div
        document.getElementById("Stream").innerHTML = "";
        document.getElementById("Stream").appendChild(iframe);
    })
    .catch(error => console.error("Error fetching API URL:", error));

form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload
    const message = input.value;
    if (message) {
        socket.emit('chat message', message); // Send message to server
        input.value = ''; // Clear the input
    }
});

