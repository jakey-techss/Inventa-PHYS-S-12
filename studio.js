document.addEventListener("DOMContentLoaded", () => {
    connectToHub();
    setupSidebarDrag();
});

document.querySelectorAll('.sidebar-group-toggle').forEach(toggle => {
    const group = toggle.closest('.collapsible-group');
    group.classList.toggle('is-collapsed');

    toggle.addEventListener('click', () => {
        group.classList.toggle('is-collapsed');
    });
});

const HUB_URL = "ws://inventa-hub.local/ws";
let socket;

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

function setupSidebarDrag() {
    const sidebarBlocks = document.querySelectorAll(".ai-model-sidebar-block");
    const canvas = document.getElementById("codingCanvas");

    sidebarBlocks.forEach(block => {
        block.addEventListener("mousedown", (e) => {
            

            const clone = block.cloneNode(true);
            clone.classList.add("canvas-block");
            clone.style.position = "absolute";
            clone.style.pointerEvents = "none"; // while dragging
            clone.style.zIndex = "9999";

            document.body.appendChild(clone);

            attachNodeContextMenu(clone)

            const rect = block.getBoundingClientRect();
            const shiftX = e.clientX - rect.left;
            const shiftY = e.clientY - rect.top;

            clone.style.width = rect.width + "px";
            clone.style.left = rect.left + "px";
            clone.style.top = rect.top + "px";

            function moveAt(pageX, pageY) {
                clone.style.left = pageX - shiftX + "px";
                clone.style.top = pageY - shiftY + "px";
            }

            moveAt(e.pageX, e.pageY);

            function onMouseMove(ev) {
                moveAt(ev.pageX, ev.pageY);
            }

            document.addEventListener("mousemove", onMouseMove);

            document.addEventListener("mouseup", function onMouseUp(ev) {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);

                const canvasRect = canvas.getBoundingClientRect();

                const isInsideCanvas =
                    ev.clientX >= canvasRect.left &&
                    ev.clientX <= canvasRect.right &&
                    ev.clientY >= canvasRect.top &&
                    ev.clientY <= canvasRect.bottom;

                if (isInsideCanvas) {
                    // convert from page position to canvas-local position
                    const x = ev.clientX - canvasRect.left - shiftX;
                    const y = ev.clientY - canvasRect.top - shiftY;

                    canvas.appendChild(clone);
                    clone.style.pointerEvents = "auto";
                    clone.style.zIndex = "20";
                    clone.style.left = `${x}px`;
                    clone.style.top = `${y}px`;

                    makeCanvasBlockDraggable(clone, canvas);
                } else {
                    clone.remove();
                }
            });
        });
    });
}

function makeCanvasBlockDraggable(block, canvas) {
    let pos3 = 0, pos4 = 0, pos1 = 0, pos2 = 0;

    block.onmousedown = dragMouseDown;

    function dragMouseDown(e) {

        pos3 = e.clientX;
        pos4 = e.clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {


        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        let newTop = block.offsetTop - pos2;
        let newLeft = block.offsetLeft - pos1;

        // optional: keep inside canvas bounds
        const maxLeft = canvas.clientWidth - block.offsetWidth;
        const maxTop = canvas.clientHeight - block.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        block.style.top = newTop + "px";
        block.style.left = newLeft + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

const contextMenu = document.getElementById("node-context-menu");
let contextTargetNode = null;


function attachNodeContextMenu(node) {
    node.addEventListener("contextmenu", (e) => {
        e.stopPropagation();

        contextTargetNode = node;
        openContextMenu(e.clientX, e.clientY);
    });
}


function openContextMenu(x, y) {
    contextMenu.classList.remove("hidden");

    requestAnimationFrame(() => {
        const menuRect = contextMenu.getBoundingClientRect();

        let posX = x;
        let posY = y;

        if (posX + menuRect.width > window.innerWidth - 10) {
            posX = window.innerWidth - menuRect.width - 10;
        }

        if (posY + menuRect.height > window.innerHeight - 10) {
            posY = window.innerHeight - menuRect.height - 10;
        }

        contextMenu.style.left = `${posX}px`;
        contextMenu.style.top = `${posY}px`;

        contextMenu.classList.add("show");
    });
}

function hideContextMenu() {
    contextMenu.classList.remove("show");

    setTimeout(() => {
        contextMenu.classList.add("hidden");
        contextTargetNode = null;
    }, 140);
}


contextMenu.addEventListener("click", (e) => {
    const button = e.target.closest(".context-menu-item");
    if (!button || !contextTargetNode) return;

    const action = button.dataset.action;

    if (action === "copy") {
        copyNode(contextTargetNode);
    }

    if (action === "delete") {
        deleteNode(contextTargetNode);
    }

    hideContextMenu();
});


function copyNode(node) {
    const clone = node.cloneNode(true);
    const currentLeft = parseInt(node.style.left || 0, 10);
    const currentTop = parseInt(node.style.top || 0, 10);

    clone.style.left = `${currentLeft + 28}px`;
    clone.style.top = `${currentTop + 28}px`;

    node.parentElement.appendChild(clone);

    attachNodeContextMenu(clone)

    let canvas = document.getElementById("codingCanvas")
    makeCanvasBlockDraggable(clone, canvas);

}

function deleteNode(node) {
    node.remove();
}

document.addEventListener("click", (e) => {
    if (!e.target.closest("#node-context-menu")) {
        if (!contextMenu.classList.contains("hidden")) {
            hideContextMenu();
        }
    }
});

window.addEventListener("resize", () => {
    if (!contextMenu.classList.contains("hidden")) {
        hideContextMenu();
    }
});

window.addEventListener("scroll", () => {
    if (!contextMenu.classList.contains("hidden")) {
        hideContextMenu();
    }
});