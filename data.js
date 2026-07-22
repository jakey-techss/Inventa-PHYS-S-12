const HUB_URL = "ws://inventa-hub.local/ws";
let socket
setInterval(()=>{
        connectToHub();
    },5000)
function connectToHub() {
    socket = new WebSocket(HUB_URL);

    socket.onerror = () => {
        document.querySelector(".status-dot-hub").style.backgroundColor = "#FF4D4D";
        document.getElementById("hubStatus").innerHTML = `Hub Connection Failed`;
    };

    socket.onopen = () => {
        document.querySelector(".status-dot-hub").style.backgroundColor = "#34D399";
        document.getElementById("hubStatus").innerHTML = `Hub Ready`;
    };
}